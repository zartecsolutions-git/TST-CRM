import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const Activities = () => {
  const { user: currentUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [progressUpdate, setProgressUpdate] = useState({ update: '', percentage: 0 });
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    assigned_to: '',
    customer_id: '',
    product_ids: [],
    status: 'pending',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      const [activitiesRes, usersRes, customersRes, productsRes] = await Promise.all([
        api.get(filterStatus === 'all' ? '/activities' : `/activities?status=${filterStatus}`),
        api.get('/users'),
        api.get('/customers'),
        api.get('/products')
      ]);
      setActivities(activitiesRes.data);
      setUsers(usersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
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
      setNewActivity({ title: '', description: '', assigned_to: '', customer_id: '', product_ids: [], status: 'pending', due_date: '' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      alert('Error creating activity: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateStatus = async (activityId, newStatus) => {
    setSelectedActivity({ id: activityId, newStatus });
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateNote.trim()) {
      alert('Please enter details about this status update');
      return;
    }

    try {
      await api.put(`/activities/${selectedActivity.id}`, { 
        status: selectedActivity.newStatus,
        notes: statusUpdateNote
      });
      alert('Activity status updated successfully!');
      setShowStatusModal(false);
      setStatusUpdateNote('');
      setSelectedActivity(null);
      fetchData();
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddProgressUpdate = (activityId) => {
    setSelectedActivity({ id: activityId });
    setShowProgressModal(true);
  };

  const handleConfirmProgressUpdate = async () => {
    if (!progressUpdate.update.trim()) {
      alert('Please enter progress details');
      return;
    }

    try {
      await api.post(`/activities/${selectedActivity.id}/progress`, progressUpdate);
      alert('Progress update added successfully!');
      setShowProgressModal(false);
      setProgressUpdate({ update: '', percentage: 0 });
      setSelectedActivity(null);
      fetchData();
    } catch (error) {
      alert('Error adding progress: ' + (error.response?.data?.detail || error.message));
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

  const openDetailModal = (activity) => {
    setSelectedActivity(activity);
    setShowDetailModal(true);
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

  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName = getUserName(activity.assigned_to).toLowerCase();
    const customerName = customers.find(c => c.id === activity.customer_id)?.name?.toLowerCase() || '';
    return (
      activity.title?.toLowerCase().includes(query) ||
      activity.description?.toLowerCase().includes(query) ||
      userName.includes(query) ||
      customerName.includes(query)
    );
  });

  const isAdmin = currentUser?.role === 'admin';
  const canCreateActivity = true; // All users can create activities

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-100 to-sky-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-sky-500 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-sky-500 bg-clip-text text-transparent">
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
              className={filterStatus === 'all' ? 'bg-gradient-to-r from-orange-500 to-sky-500' : ''}
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
          {canCreateActivity && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-orange-500 to-sky-500"
            >
              + Create Activity
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search activities by title, description, assigned user, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredActivities.length} activit{filteredActivities.length !== 1 ? 'ies' : 'y'}
            </p>
          )}
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
                  <div>
                    <Label>Customer</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={newActivity.customer_id}
                      onChange={(e) => {
                        setNewActivity({...newActivity, customer_id: e.target.value, product_ids: []});
                      }}
                    >
                      <option value="">Select Customer (Optional)</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.business_vertical || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Products (Multiple Selection)</Label>
                    {newActivity.customer_id ? (
                      <select
                        multiple
                        className="w-full border rounded-md p-2 min-h-[100px]"
                        value={newActivity.product_ids}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setNewActivity({...newActivity, product_ids: selected});
                        }}
                      >
                        {products.filter(p => p.customer_id === newActivity.customer_id).map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} (SN: {product.serial_number}) - {product.category || 'N/A'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full border rounded-md p-2 min-h-[100px] bg-gray-50 flex items-center justify-center text-gray-500">
                        Please select a customer first to see their products
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {newActivity.customer_id 
                        ? `Hold Ctrl/Cmd to select multiple products. ${products.filter(p => p.customer_id === newActivity.customer_id).length} product(s) available for this customer.`
                        : 'Products will be filtered based on selected customer'}
                    </p>
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
                  <Button type="submit" className="bg-gradient-to-r from-orange-500 to-sky-500">
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

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Update Activity Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    You are updating the status to: <strong className="capitalize">{selectedActivity?.newStatus?.replace('_', ' ')}</strong>
                  </p>
                  <div>
                    <Label>Enter details about this status update *</Label>
                    <textarea
                      className="w-full border rounded-md p-2 mt-1"
                      rows="4"
                      placeholder="What work was done? Any blockers? Next steps?"
                      value={statusUpdateNote}
                      onChange={(e) => setStatusUpdateNote(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleConfirmStatusUpdate}
                      className="bg-gradient-to-r from-orange-500 to-sky-500"
                    >
                      Confirm Update
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowStatusModal(false);
                        setStatusUpdateNote('');
                        setSelectedActivity(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Update Modal */}
        {showProgressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Add Progress Update</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Track your progress on this activity
                  </p>
                  <div>
                    <Label>Progress Details *</Label>
                    <textarea
                      className="w-full border rounded-md p-2 mt-1"
                      rows="4"
                      placeholder="What have you completed? What's next?"
                      value={progressUpdate.update}
                      onChange={(e) => setProgressUpdate({...progressUpdate, update: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Completion Percentage</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={progressUpdate.percentage}
                        onChange={(e) => setProgressUpdate({...progressUpdate, percentage: parseInt(e.target.value)})}
                        className="flex-1"
                      />
                      <span className="font-semibold text-blue-600 w-12">{progressUpdate.percentage}%</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleConfirmProgressUpdate}
                      className="bg-gradient-to-r from-orange-500 to-sky-500"
                    >
                      Add Progress
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowProgressModal(false);
                        setProgressUpdate({ update: '', percentage: 0 });
                        setSelectedActivity(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Detail Modal */}
        {showDetailModal && selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-sky-100">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">📋 Activity Details</CardTitle>
                    <h3 className="text-xl font-bold text-gray-900">{selectedActivity.title}</h3>
                  </div>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                  >
                    &times;
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-4">
                  <Badge className={`${getStatusBadge(selectedActivity.status)} text-sm px-4 py-2`}>
                    {selectedActivity.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Priority: <span className="font-semibold text-gray-900">{selectedActivity.priority || 'Medium'}</span>
                  </span>
                </div>

                {/* Description */}
                {selectedActivity.description && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">📝 Description:</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{selectedActivity.description}</p>
                  </div>
                )}

                {/* User Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-600">👤 Created by:</span>
                    <p className="font-semibold text-blue-600">{getUserName(selectedActivity.created_by)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Assigned to:</span>
                    <p className="font-semibold text-gray-900">{getUserName(selectedActivity.assigned_to)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Created at:</span>
                    <p className="font-semibold text-gray-900">{new Date(selectedActivity.created_at).toLocaleString()}</p>
                  </div>
                  {selectedActivity.due_date && (
                    <div>
                      <span className="text-sm text-gray-600">Due date:</span>
                      <p className="font-semibold text-gray-900">{new Date(selectedActivity.due_date).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Customer & Products */}
                {(selectedActivity.customer_id || (selectedActivity.product_ids && selectedActivity.product_ids.length > 0)) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">🏢 Related Information:</h4>
                    {selectedActivity.customer_id && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Customer:</span>
                        <p className="font-semibold text-cyan-600">
                          {customers.find(c => c.id === selectedActivity.customer_id)?.name || 'Unknown'}
                        </p>
                      </div>
                    )}
                    {selectedActivity.product_ids && selectedActivity.product_ids.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Products ({selectedActivity.product_ids.length}):</span>
                        <div className="space-y-2 mt-2">
                          {selectedActivity.product_ids.map(pid => {
                            const product = products.find(p => p.id === pid);
                            return product ? (
                              <div key={pid} className="bg-orange-50 p-2 rounded flex justify-between">
                                <span className="font-semibold">{product.name}</span>
                                <span className="text-gray-600 text-sm">SN: {product.serial_number}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Updates */}
                {selectedActivity.progress_updates && selectedActivity.progress_updates.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">📊 Progress Updates ({selectedActivity.progress_updates.length}):</h4>
                    <div className="space-y-3">
                      {selectedActivity.progress_updates.slice().reverse().map((update, idx) => (
                        <div key={idx} className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-blue-600 text-lg">{update.percentage}% Complete</span>
                            <span className="text-gray-500 text-sm">{new Date(update.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-700">{update.update}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status History */}
                {selectedActivity.status_history && selectedActivity.status_history.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">🕒 Status History ({selectedActivity.status_history.length}):</h4>
                    <div className="space-y-3">
                      {selectedActivity.status_history.slice().reverse().map((hist, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusBadge(hist.status)}>
                                {hist.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm text-gray-600">by {getUserName(hist.updated_by)}</span>
                            </div>
                            <span className="text-gray-500 text-sm">{new Date(hist.timestamp).toLocaleString()}</span>
                          </div>
                          {hist.note && <p className="text-gray-700 text-sm mt-2">Note: {hist.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maintenance Report */}
                {selectedActivity.maintenance_report && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">🔧 Maintenance Report:</h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-line">{selectedActivity.maintenance_report}</p>
                    </div>
                  </div>
                )}

                {/* Completion Info */}
                {selectedActivity.completion_date && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <span className="text-sm text-gray-600">✅ Completed on:</span>
                    <p className="font-semibold text-green-700">{new Date(selectedActivity.completion_date).toLocaleString()}</p>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={() => setShowDetailModal(false)}
                    className="bg-gradient-to-r from-orange-500 to-sky-500"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <Card 
                key={activity.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openDetailModal(activity)}
              >
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
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>👤 Created by: <strong className="text-blue-600">{getUserName(activity.created_by)}</strong></span>
                        <span>Assigned to: <strong>{getUserName(activity.assigned_to)}</strong></span>
                        {activity.due_date && (
                          <span>Due: {new Date(activity.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      {/* Customer and Products Section */}
                      {(activity.customer_id || (activity.product_ids && activity.product_ids.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
                          {activity.customer_id && (
                            <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                              Customer: <strong>{customers.find(c => c.id === activity.customer_id)?.name || 'Unknown'}</strong>
                            </span>
                          )}
                          {activity.product_ids && activity.product_ids.length > 0 && (
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              Products: <strong>{activity.product_ids.length}</strong>
                              {activity.product_ids.map(pid => {
                                const product = products.find(p => p.id === pid);
                                return product ? ` ${product.name} (${product.serial_number})` : '';
                              }).join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Progress Updates Section */}
                      {activity.status === 'in_progress' && activity.progress_updates && activity.progress_updates.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Progress Updates:</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {activity.progress_updates.slice().reverse().map((update, idx) => (
                              <div key={idx} className="bg-blue-50 p-2 rounded text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-blue-600">{update.percentage}% Complete</span>
                                  <span className="text-gray-500">{new Date(update.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-700">{update.update}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2" onClick={(e) => e.stopPropagation()}>
                      {activity.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddProgressUpdate(activity.id)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          + Add Progress
                        </Button>
                      )}
                      {activity.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(activity.id, activity.status === 'pending' ? 'in_progress' : 'completed')}
                          className="bg-blue-600"
                        >
                          {activity.status === 'pending' ? 'Start' : 'Complete'}
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteActivity(activity.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredActivities.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">
                {searchQuery ? 'No activities found matching your search' : 'No activities found'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Activities;
