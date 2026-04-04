import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Geofences = () => {
  const { user: currentUser } = useAuth();
  const [geofences, setGeofences] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    center_lat: 37.7749,
    center_lng: -122.4194,
    radius: 1000,
    alert_on_enter: true,
    alert_on_exit: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [geofencesRes, alertsRes] = await Promise.all([
        api.get('/geofences'),
        api.get('/geofences/alerts/list')
      ]);
      setGeofences(geofencesRes.data);
      setAlerts(alertsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAddGeofence = async (e) => {
    e.preventDefault();
    try {
      await api.post('/geofences', newGeofence);
      alert('Geofence created successfully!');
      setNewGeofence({
        name: '',
        center_lat: 37.7749,
        center_lng: -122.4194,
        radius: 1000,
        alert_on_enter: true,
        alert_on_exit: true
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert('Error creating geofence: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteGeofence = async (geofenceId) => {
    if (!window.confirm('Are you sure you want to delete this geofence?')) return;
    
    try {
      await api.delete(`/geofences/${geofenceId}`);
      alert('Geofence deleted successfully!');
      fetchData();
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Only admins can delete geofences');
      } else {
        alert('Error deleting geofence: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-100 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-teal-600 to-green-600 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                Geofences Management
              </h1>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geofences Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Geofences ({geofences.length})</h2>
              {isAdmin && (
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-gradient-to-r from-teal-600 to-green-600"
                >
                  + Create Geofence
                </Button>
              )}
            </div>

            {showAddForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Geofence</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddGeofence} className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newGeofence.name}
                        onChange={(e) => setNewGeofence({...newGeofence, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Latitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={newGeofence.center_lat}
                          onChange={(e) => setNewGeofence({...newGeofence, center_lat: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                      <div>
                        <Label>Longitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={newGeofence.center_lng}
                          onChange={(e) => setNewGeofence({...newGeofence, center_lng: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Radius (meters)</Label>
                      <Input
                        type="number"
                        value={newGeofence.radius}
                        onChange={(e) => setNewGeofence({...newGeofence, radius: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newGeofence.alert_on_enter}
                          onChange={(e) => setNewGeofence({...newGeofence, alert_on_enter: e.target.checked})}
                        />
                        <span className="text-sm">Alert on Enter</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newGeofence.alert_on_exit}
                          onChange={(e) => setNewGeofence({...newGeofence, alert_on_exit: e.target.checked})}
                        />
                        <span className="text-sm">Alert on Exit</span>
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="bg-gradient-to-r from-teal-600 to-green-600">
                        Create Geofence
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {geofences.map((geofence) => (
                  <Card key={geofence.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{geofence.name}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>📍 Center: {geofence.center_lat.toFixed(4)}, {geofence.center_lng.toFixed(4)}</p>
                            <p>📏 Radius: {geofence.radius} meters</p>
                            <div className="flex items-center space-x-3 mt-2">
                              {geofence.alert_on_enter && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Enter Alert</span>
                              )}
                              {geofence.alert_on_exit && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Exit Alert</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteGeofence(geofence.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {geofences.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-gray-500">No geofences found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Alerts Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Recent Alerts ({alerts.length})</h2>
            <div className="space-y-4">
              {alerts.slice(0, 10).map((alert, idx) => (
                <Card key={idx} className={`border-l-4 ${
                  alert.alert_type === 'enter' ? 'border-l-blue-500' : 'border-l-amber-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            alert.alert_type === 'enter' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {alert.alert_type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          📍 {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {alerts.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No alerts yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> View your geofences on the Location Tracking map! They appear as colored circles around their center coordinates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Geofences;
