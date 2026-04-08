import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

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
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Location tracking is completely optional - don't crash if it fails
        startLocationTrackingOptional();
      }
    } catch (error) {
      console.log('Auth check error:', error);
      // Don't crash - just continue without auth
    } finally {
      setLoading(false);
    }
  };

  const startLocationTrackingOptional = async () => {
    // Import location service only when needed to avoid crashes
    try {
      const locationService = require('../services/locationService');
      
      setTimeout(async () => {
        try {
          await locationService.requestLocationPermissions();
          await locationService.startLocationTracking();
          console.log('Location tracking started successfully');
        } catch (error) {
          console.log('Location tracking not available:', error.message);
          // Continue without location tracking - not critical
        }
      }, 2000);
    } catch (error) {
      console.log('Location service not available:', error.message);
      // Continue without location service - not critical
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      // Start location tracking after login (optional)
      startLocationTrackingOptional();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
      // Force logout anyway
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
