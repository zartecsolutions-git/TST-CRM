import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  // Fetch current locations for all users
  const fetchCurrentLocations = useCallback(async () => {
    try {
      const response = await api.get('/locations/current');
      setLocations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLoading(false);
    }
  }, []);

  // Update my location
  const updateMyLocation = useCallback(async (latitude, longitude) => {
    try {
      await api.post('/locations', {
        latitude,
        longitude
      });
      setMyLocation({ latitude, longitude, timestamp: new Date().toISOString() });
      return { success: true };
    } catch (error) {
      console.error('Error updating location:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Start tracking my location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMyLocation(latitude, longitude);
      },
      (error) => {
        // Permission denied / position unavailable / timeout — degrade silently
        console.warn('Geolocation unavailable:', error?.message || error?.code);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateMyLocation]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Skip location polling/WS for employee role (no permission, would spam 403s)
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser?.role === 'employee') {
      setLoading(false);
      return;
    }

    fetchCurrentLocations();

    // Get backend URL from env
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    // K8s ingress only routes /api/* to backend, so WS endpoint must live under /api/
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/api/ws/locations';

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'location_update') {
        // Update the location for the specific user
        setLocations((prev) => {
          const userIndex = prev.findIndex((loc) => loc.user?.id === data.user_id);
          
          if (userIndex !== -1) {
            // Update existing user location
            const updated = [...prev];
            updated[userIndex] = {
              ...updated[userIndex],
              location: {
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: data.timestamp
              }
            };
            return updated;
          }
          
          // If user not found, fetch all locations again
          fetchCurrentLocations();
          return prev;
        });
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [fetchCurrentLocations]);

  const value = {
    locations,
    loading,
    myLocation,
    updateMyLocation,
    startTracking,
    refetchLocations: fetchCurrentLocations
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
