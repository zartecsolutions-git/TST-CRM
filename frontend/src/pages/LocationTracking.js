import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function LocationTracking() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationNames, setLocationNames] = useState({});
  const nonAdminUsers = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
      // Refresh every 30 seconds for "all users" view only
      if (selectedUser === 'all') {
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedUser, user]);

  // Only admins can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">This page is only accessible to administrators.</p>
          <Button onClick={() => window.location.href = '/dashboard'} className="bg-blue-600">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, locationsResponse] = await Promise.all([
        api.get('/users'),
        selectedUser === 'all'
          ? api.get('/locations/current')
          : api.get(`/locations/history/${selectedUser}`, {
              params: {
                start_date: startDate || undefined,
                end_date: endDate || undefined
              }
            })
      ]);
      // Extract data from axios response objects
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      
      // Handle different response formats
      const locData = locationsResponse.data;
      if (Array.isArray(locData)) {
        // For /locations/current, data is [{user: {...}, location: {...}}, ...]
        // For history, data is [{latitude, longitude, ...}, ...]
        if (selectedUser === 'all' && locData.length > 0 && locData[0].location) {
          // Transform current locations format to flat format
          const flatLocations = locData.map(item => ({
            ...item.location,
            user_id: item.user?.id || item.location?.user_id,
            user_name: item.user?.name
          }));
          setLocations(flatLocations);
          // Fetch location names for the first 10 locations
          fetchLocationNames(flatLocations.slice(0, 10));
        } else {
          setLocations(locData);
          // Fetch location names for the first 10 locations
          fetchLocationNames(locData.slice(0, 10));
        }
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch location data:', error);
      // Ensure arrays are set even on error
      setUsers([]);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationNames = async (locationsList) => {
    const names = {};
    for (const location of locationsList) {
      if (location.latitude && location.longitude) {
        const key = `${location.latitude}-${location.longitude}`;
        // Add a small delay to respect Nominatim rate limits (1 request per second)
        await new Promise(resolve => setTimeout(resolve, 1100));
        const name = await getLocationName(location.latitude, location.longitude);
        names[key] = name;
        // Update state incrementally so user sees names appearing
        setLocationNames(prev => ({ ...prev, [key]: name }));
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMinutes = Math.floor((now - past) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getLocationName = async (latitude, longitude) => {
    try {
      // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
      // zoom=18 provides most precise location details
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`
      );
      const data = await response.json();
      
      // Return formatted address with maximum precision
      if (data.address) {
        const parts = [];
        
        // Add house number + street/road for precision
        if (data.address.house_number && data.address.road) {
          parts.push(`${data.address.house_number} ${data.address.road}`);
        } else if (data.address.road) {
          parts.push(data.address.road);
        } else if (data.address.street) {
          parts.push(data.address.street);
        } else if (data.address.pedestrian) {
          parts.push(data.address.pedestrian);
        }
        
        // Add neighborhood/suburb for more precision (helps distinguish Tubli from Manama)
        if (data.address.neighbourhood) {
          parts.push(data.address.neighbourhood);
        } else if (data.address.suburb) {
          parts.push(data.address.suburb);
        } else if (data.address.quarter) {
          parts.push(data.address.quarter);
        } else if (data.address.district) {
          parts.push(data.address.district);
        }
        
        // Add city/town (important for context)
        if (data.address.city) {
          parts.push(data.address.city);
        } else if (data.address.town) {
          parts.push(data.address.town);
        } else if (data.address.village) {
          parts.push(data.address.village);
        } else if (data.address.municipality) {
          parts.push(data.address.municipality);
        }
        
        // If we only got city level, try to use the full display name for more context
        if (parts.length === 1 && (data.address.city || data.address.town)) {
          // Extract first 3 meaningful parts from display name
          const displayParts = data.display_name.split(',').slice(0, 3).map(s => s.trim());
          return displayParts.join(', ');
        }
        
        return parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(', ');
      }
      
      // Fallback to shortened display name
      return data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : 'Location';
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading location data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📍 Location Tracking</h1>
        <p className="text-gray-600">Real-time location monitoring and history</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              // Reset dates when changing user
              if (e.target.value === 'all') {
                setStartDate('');
                setEndDate('');
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Users (Current Location)</option>
            {nonAdminUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {selectedUser !== 'all' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => fetchData()} 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
              >
                📅 Filter
              </Button>
            </div>
          </>
        )}

        <div className="flex items-end">
          <Button 
            onClick={() => fetchData()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {locations.filter(l => {
                    const diff = new Date() - new Date(l.timestamp);
                    return diff < 30 * 60 * 1000; // Active in last 30 mins
                  }).length}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Locations</p>
                <p className="text-2xl font-bold text-green-600">{locations.length}</p>
              </div>
              <div className="text-4xl">📍</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Update</p>
                <p className="text-lg font-semibold text-purple-600">
                  {locations.length > 0
                    ? getTimeAgo(locations[0].timestamp)
                    : 'No data'}
                </p>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedUser === 'all'
              ? '📌 Current Locations (All Users)'
              : `🗺️ Location History - ${getUserName(selectedUser)}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No Location Data</p>
              <p className="text-gray-500">No location updates have been received yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location, index) => {
                const locationKey = `${location.latitude}-${location.longitude}`;
                const locationName = locationNames[locationKey];
                
                return (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📍</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedUser === 'all' ? getUserName(location.user_id) : 'Location Update'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {locationName || (
                            <span className="text-gray-400 italic">Loading address...</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(location.timestamp)} ({getTimeAgo(location.timestamp)})
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => location.latitude && location.longitude && window.open(
                        `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
                        '_blank'
                      )}
                      disabled={!location.latitude || !location.longitude}
                    >
                      🗺️ View on Map
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
