import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import locationTracking from '../services/locationTracking';

const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Auto-start location tracking for all users (silent, no prompt)
      setTimeout(() => {
        locationTracking.startTracking(token);
        locationTracking.syncOfflineLocations(token);
      }, 2000);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Start location tracking after login (automatic, silent)
      setTimeout(() => {
        locationTracking.startTracking(access_token);
      }, 2000);
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, password, name, phone, role = 'agent') => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        phone,
        role,
      });
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const clearCache = useCallback(async () => {
    try {
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const logout = useCallback(async (isAutoLogout = false) => {
    // Stop location tracking
    locationTracking.stopTracking();
    
    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Clear all caches
    await clearCache();
    
    setUser(null);
    
    // Force hard reload to clear any cached content
    if (isAutoLogout) {
      alert('You have been logged out due to inactivity.');
    }
    window.location.replace('/login');
    window.location.reload(true);
  }, [clearCache]);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new timer for auto-logout
    inactivityTimerRef.current = setTimeout(() => {
      logout(true); // Auto-logout
    }, INACTIVITY_TIMEOUT);
  }, [user, logout]);

  // Setup activity listeners
  useEffect(() => {
    if (!user) return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Reset timer on any activity
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });
    
    // Initialize timer
    resetInactivityTimer();
    
    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
