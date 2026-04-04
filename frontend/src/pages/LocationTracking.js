import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color, role) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">${role === 'agent' ? 'A' : role === 'client' ? 'C' : 'U'}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Component to auto-fit map bounds
const AutoFitBounds = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = locations
        .filter(loc => loc.location)
        .map(loc => [loc.location.latitude, loc.location.longitude]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [locations, map]);

  return null;
};

const LocationTracking = () => {
  const { user } = useAuth();
  const { locations, loading, updateMyLocation, startTracking } = useLocation();
  const [tracking, setTracking] = useState(false);
  const [geofences, setGeofences] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoute, setUserRoute] = useState([]);

  // Default center (San Francisco)
  const defaultCenter = [37.7749, -122.4194];

  const fetchGeofences = async () => {
    try {
      const response = await api.get('/geofences');
      setGeofences(response.data);
    } catch (error) {
      console.error('Error fetching geofences:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchGeofences();
    }
  }, [user]);

  // Check if user is admin - show access denied early
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-green-100 to-green-50">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              Location Tracking is only available for Admin users.
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gradient-to-r from-teal-600 to-green-600"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartTracking = () => {
    const cleanup = startTracking();
    setTracking(true);
    return cleanup;
  };

  const handleStopTracking = () => {
    setTracking(false);
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateMyLocation(latitude, longitude);
          alert('Location shared successfully!');
        },
        (error) => {
          alert('Unable to get your location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleViewRoute = async (userId) => {
    try {
      const response = await api.get(`/locations/user/${userId}/route`);
      setUserRoute(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'agent':
        return '#3B82F6'; // blue
      case 'client':
        return '#10B981'; // green
      case 'admin':
        return '#8B5CF6'; // purple
      default:
        return '#6B7280'; // gray
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-green-100 to-green-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-100 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-teal-600 to-green-600 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                  Real-Time Location Tracking
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleShareLocation}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Share Location
              </Button>
              {!tracking ? (
                <Button
                  onClick={handleStartTracking}
                  className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  Start Tracking
                </Button>
              ) : (
                <Button
                  onClick={handleStopTracking}
                  variant="destructive"
                >
                  Stop Tracking
                </Button>
              )}
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - User List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Users ({locations.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {locations.map((item) => (
                  <div
                    key={item.user.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => handleViewRoute(item.user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getRoleColor(item.user.role) }}
                        />
                        <div>
                          <p className="font-medium text-sm">{item.user.name}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.user.role}
                          </Badge>
                        </div>
                      </div>
                      {item.location && (
                        <div className="text-xs text-gray-500">
                          {new Date(item.location.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    {item.location && (
                      <div className="mt-2 text-xs text-gray-600">
                        📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                ))}
                {locations.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No active locations</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
                  <MapContainer
                    center={locations.length > 0 && locations[0].location 
                      ? [locations[0].location.latitude, locations[0].location.longitude]
                      : defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    data-testid="location-map"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <AutoFitBounds locations={locations} />
                    
                    {/* User Markers */}
                    {locations.map((item) => {
                      if (!item.location) return null;
                      
                      return (
                        <Marker
                          key={item.user.id}
                          position={[item.location.latitude, item.location.longitude]}
                          icon={createCustomIcon(getRoleColor(item.user.role), item.user.role)}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-bold text-sm">{item.user.name}</h3>
                              <Badge variant="secondary" className="text-xs mb-2">
                                {item.user.role}
                              </Badge>
                              <p className="text-xs text-gray-600">
                                Last updated: {new Date(item.location.timestamp).toLocaleString()}
                              </p>
                              <Button
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => handleViewRoute(item.user.id)}
                              >
                                View Route
                              </Button>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Geofences */}
                    {geofences.map((geofence) => (
                      <Circle
                        key={geofence.id}
                        center={[geofence.center_lat, geofence.center_lng]}
                        radius={geofence.radius}
                        pathOptions={{
                          color: '#F59E0B',
                          fillColor: '#FCD34D',
                          fillOpacity: 0.2,
                          weight: 2
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-bold text-sm">{geofence.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">
                              Radius: {geofence.radius}m
                            </p>
                          </div>
                        </Popup>
                      </Circle>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTracking;
