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

  // Bootstrap: check existing httpOnly-cookie session via /auth/me.
  // Falls back to legacy localStorage user/token during the rollout window.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const response = await api.get('/auth/me');
        if (cancelled) return;
        const me = response.data;
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
        // Cookie is httpOnly — no token to feed to location tracking. Tracking
        // runs against same-origin /api which auto-sends the cookie.
        if (me?.role !== 'employee') {
          setTimeout(() => {
            locationTracking.startTracking(null);
            locationTracking.syncOfflineLocations(null);
          }, 2000);
        }
      } catch (_) {
        // No active session — clean up any legacy artifacts
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedInUser } = response.data;

      // Cache user object only (no token — server uses httpOnly cookie)
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);

      if (loggedInUser?.role !== 'employee') {
        setTimeout(() => {
          locationTracking.startTracking(null);
        }, 2000);
      }

      return { success: true, user: loggedInUser };
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
      const { user: newUser } = response.data;

      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const clearCache = useCallback(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const logout = useCallback(
    async (isAutoLogout = false) => {
      // Tell server to clear the cookie (best-effort)
      try {
        await api.post('/auth/logout');
      } catch (_) {
        // Ignore — even if server call fails, we still clear client state
      }

      locationTracking.stopTracking();

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      await clearCache();
      setUser(null);

      if (isAutoLogout) {
        alert('You have been logged out due to inactivity.');
      }
      window.location.replace('/login');
      window.location.reload(true);
    },
    [clearCache]
  );

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      logout(true);
    }, INACTIVITY_TIMEOUT);
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
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
