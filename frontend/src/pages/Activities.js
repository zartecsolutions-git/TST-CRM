import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    assigned_to: '',
    status: 'pending',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      const [activitiesRes, usersRes] = await Promise.all([
        api.get(filterStatus === 'all' ? '/activities' : `/activities?status=${filterStatus}`),
        api.get('/users')
      ]);
      setActivities(activitiesRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await api.post('/activities', newActivity);
      alert('Activity created successfully!');
      setNewActivity({ title: '', description: '', assigned_to: '', status: 'pending', due_date: '' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert('Error creating activity: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateStatus = async (activityId, newStatus) => {
    try {
      await api.put(`/activities/${activityId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    
    try {
      await api.delete(`/activities/${activityId}`);
      alert('Activity deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Error deleting activity: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unassigned';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Activities Management
              </h1>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button
              onClick={() => setFilterStatus('all')}
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              className={filterStatus === 'all' ? 'bg-gradient-to-r from-blue-600 to-green-600' : ''}
            >
              All
            </Button>
            <Button
              onClick={() => setFilterStatus('pending')}
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              className={filterStatus === 'pending' ? 'bg-amber-600' : ''}
            >
              Pending
            </Button>
            <Button
              onClick={() => setFilterStatus('in_progress')}
              variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
              className={filterStatus === 'in_progress' ? 'bg-blue-600' : ''}
            >
              In Progress
            </Button>
            <Button
              onClick={() => setFilterStatus('completed')}
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              className={filterStatus === 'completed' ? 'bg-green-600' : ''}
            >
              Completed
            </Button>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-blue-600 to-green-600"
          >
            + Create Activity
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newActivity.title}
                      onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Assign To</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={newActivity.assigned_to}
                      onChange={(e) => setNewActivity({...newActivity, assigned_to: e.target.value})}
                    >
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <textarea
                      className="w-full border rounded-md p-2"
                      rows="3"
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={newActivity.status}
                      onChange={(e) => setNewActivity({...newActivity, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <Label>Due Date (Optional)</Label>
                    <Input
                      type="date"
                      value={newActivity.due_date}
                      onChange={(e) => setNewActivity({...newActivity, due_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-green-600">
                    Create Activity
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
            {activities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{activity.title}</h3>
                        <Badge className={getStatusBadge(activity.status)}>
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-gray-600 mb-3">{activity.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Assigned to: <strong>{getUserName(activity.assigned_to)}</strong></span>
                        {activity.due_date && (
                          <span>Due: {new Date(activity.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {activity.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(activity.id, activity.status === 'pending' ? 'in_progress' : 'completed')}
                          className="bg-blue-600"
                        >
                          {activity.status === 'pending' ? 'Start' : 'Complete'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteActivity(activity.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && activities.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No activities found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Activities;
