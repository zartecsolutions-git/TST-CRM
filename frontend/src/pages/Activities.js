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
  const [completionData, setCompletionData] = useState({
    invoice_number: '',
    work_order_no: '',
    total_amount: ''
  });
  const [progressUpdate, setProgressUpdate] = useState({ update: '', percentage: 0 });
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    assigned_to: '',
    customer_id: '',
    product_ids: [],
    status: 'pending',
    activity_type: 'others',
    support_staff: '',
    due_date: '',
    invoice_number: '',
    work_order_no: '',
    total_amount: ''
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
      // Clean up data - convert empty strings to null for number fields
      const submitData = { ...newActivity };
      if (submitData.total_amount === '' || !submitData.total_amount) {
        delete submitData.total_amount;
      } else {
        submitData.total_amount = parseFloat(submitData.total_amount);
      }
      if (submitData.invoice_number === '') {
        delete submitData.invoice_number;
      }
      if (submitData.work_order_no === '') {
        delete submitData.work_order_no;
      }
      if (submitData.support_staff === '') {
        delete submitData.support_staff;
      }
      
      console.log('Creating activity with data:', submitData);
      
      const response = await api.post('/activities', submitData);
      console.log('Activity created:', response.data);
      
      alert('Activity created successfully!');
      setNewActivity({ 
        title: '', 
        description: '', 
        assigned_to: '', 
        customer_id: '', 
        product_ids: [], 
        status: 'pending',
        activity_type: 'others',
        due_date: '',
        invoice_number: '',
        total_amount: ''
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      
      // Better error message extraction
      let errorMessage = 'Error creating activity';
      if (error.response) {
        // Server responded with error
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // Pydantic validation errors
            errorMessage = error.response.data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
          } else {
            errorMessage = error.response.data.detail;
          }
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Error: ${error.response.status} - ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('Error creating activity: ' + errorMessage);
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
      const updateData = {
        status: selectedActivity.newStatus,
        notes: statusUpdateNote
      };
      
      // Add invoice and amount if completing
      if (selectedActivity.newStatus === 'completed') {
        if (completionData.work_order_no) {
          updateData.work_order_no = completionData.work_order_no;
        }
        if (completionData.invoice_number) {
          updateData.invoice_number = completionData.invoice_number;
        }
        if (completionData.total_amount) {
          updateData.total_amount = parseFloat(completionData.total_amount);
        }
      }
      
      await api.put(`/activities/${selectedActivity.id}`, updateData);
      alert('Activity status updated successfully!');
      setShowStatusModal(false);
      setStatusUpdateNote('');
      setCompletionData({ invoice_number: '', work_order_no: '', total_amount: '' });
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

  // Calculate statistics
  const totalActivitiesByUser = activities.length;
  const totalValue = activities
    .filter(act => act.status === 'completed' && act.total_amount)
    .reduce((sum, act) => sum + (parseFloat(act.total_amount) || 0), 0);

  // Get support users for dropdown
  const supportUsers = users.filter(u => u.role === 'support');

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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Activities</h3>
            <p className="text-3xl font-bold text-blue-600">{totalActivitiesByUser}</p>
            <p className="text-xs text-gray-500 mt-1">All your activities</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">From completed activities</p>
          </div>
        </div>

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
                    <Label>Support Staff</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={newActivity.support_staff}
                      onChange={(e) => setNewActivity({...newActivity, support_staff: e.target.value})}
                    >
                      <option value="">Select Support Staff</option>
                      {supportUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
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
                    <Label>Activity Type</Label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={newActivity.activity_type}
                      onChange={(e) => setNewActivity({...newActivity, activity_type: e.target.value})}
                    >
                      <option value="demo_poc">Demo/POC</option>
                      <option value="warranty">Warranty</option>
                      <option value="service_call">Service Call</option>
                      <option value="periodic_visit">Periodic Visit</option>
                      <option value="others">Others</option>
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
                  {newActivity.status === 'completed' && (
                    <>
                      <div>
                        <Label>Invoice Number</Label>
                        <Input
                          value={newActivity.invoice_number}
                          onChange={(e) => setNewActivity({...newActivity, invoice_number: e.target.value})}
                          placeholder="INV-2024-001"
                        />
                      </div>
                      <div>
                        <Label>Total Amount ($)</Label>
                        <Input
                          type="number"
                          value={newActivity.total_amount}
                          onChange={(e) => setNewActivity({...newActivity, total_amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </>
                  )}
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
                  
                  {/* Show invoice and amount fields when completing */}
                  {selectedActivity?.newStatus === 'completed' && (
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-semibold text-green-700">💰 Completion Details</h4>
                      <div>
                        <Label>Work Order No.</Label>
                        <Input
                          placeholder="WO-2024-001"
                          value={completionData.work_order_no}
                          onChange={(e) => setCompletionData({...completionData, work_order_no: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Invoice Number</Label>
                        <Input
                          placeholder="INV-2024-001"
                          value={completionData.invoice_number}
                          onChange={(e) => setCompletionData({...completionData, invoice_number: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Total Amount ($)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={completionData.total_amount}
                          onChange={(e) => setCompletionData({...completionData, total_amount: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                  
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
                        setCompletionData({ invoice_number: '', work_order_no: '', total_amount: '' });
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
                              <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full border rounded-md p-2"
                        value={progressUpdate.percentage}
                        onChange={(e) => setProgressUpdate({...progressUpdate, percentage: e.target.value})}
                        required
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveProgress} className="bg-gradient-to-r from-orange-500 to-sky-500">
                      Save Progress
                    </Button>
                    <Button variant="outline" onClick={() => setShowProgressModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default Activities;
