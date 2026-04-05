import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const Activities = () => {
  const { user: currentUser } = useAuth();
  // Import calculateTotal from useCurrency
  const { formatAmount, getTaxBreakdown, calculateTotal, companySettings } = useCurrency();
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
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [completionData, setCompletionData] = useState({
    invoice_number: '',
    work_order_no: '',
    total_amount: '',
    next_maintenance_date: ''
  });
  const [progressUpdate, setProgressUpdate] = useState({ update: '' });
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    assigned_to: '',
    customer_id: '',
    product_id: '',
    serial_number: '',
    status: 'pending',
    activity_type: 'others',
    support_staff: '',
    due_date: '',
    invoice_number: '',
    work_order_no: '',
    total_amount: '',
    next_maintenance_date: ''
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus, searchQuery]);

  const fetchData = async () => {
    try {
      // Build query parameters
      let activityUrl = '/activities';
      const params = [];
      if (filterStatus !== 'all') params.push(`status=${filterStatus}`);
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (params.length > 0) activityUrl += '?' + params.join('&');
      
      const [activitiesRes, usersRes, customersRes, productsRes] = await Promise.all([
        api.get(activityUrl),
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
      
      // Convert empty strings to null for optional fields
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
      if (submitData.due_date === '') {
        delete submitData.due_date;
      }
      if (submitData.next_maintenance_date === '') {
        delete submitData.next_maintenance_date;
      }
      if (submitData.product_id === '') {
        delete submitData.product_id;
      }
      if (submitData.serial_number === '') {
        delete submitData.serial_number;
      }
      if (submitData.customer_id === '') {
        delete submitData.customer_id;
      }
      
      console.log('Creating activity with data:', submitData);
      
      const response = await api.post('/activities', submitData);
      console.log('Activity created:', response.data);
      
      // Update product's serial number with next_maintenance_date
      if (submitData.product_id && submitData.serial_number && submitData.next_maintenance_date) {
        try {
          const product = products.find(p => p.id === submitData.product_id);
          if (product && product.serial_numbers) {
            const updatedSerials = product.serial_numbers.map(serial => {
              if (serial.serial_number === submitData.serial_number) {
                return {
                  ...serial,
                  next_maintenance_date: submitData.next_maintenance_date
                };
              }
              return serial;
            });
            
            await api.put(`/products/${product.id}`, {
              serial_numbers: updatedSerials
            });
            console.log('Product serial number updated with next maintenance date');
          }
        } catch (updateError) {
          console.error('Error updating product maintenance date:', updateError);
          // Don't fail the activity creation if product update fails
        }
      }
      
      alert('Activity created successfully!');
      setNewActivity({ 
        title: '', 
        description: '', 
        assigned_to: '', 
        customer_id: '', 
        product_id: '',
        serial_number: '',
        status: 'pending',
        activity_type: 'others',
        support_staff: '',
        due_date: '',
        invoice_number: '',
        work_order_no: '',
        total_amount: '',
        next_maintenance_date: ''
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
      
      // Add invoice, amount, and next maintenance date if completing
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
        if (completionData.next_maintenance_date) {
          updateData.next_maintenance_date = completionData.next_maintenance_date;
        }
      }
      
      await api.put(`/activities/${selectedActivity.id}`, updateData);
      
      // Update product's serial number with next_maintenance_date if provided
      if (selectedActivity.newStatus === 'completed' && 
          completionData.next_maintenance_date && 
          selectedActivity.product_id && 
          selectedActivity.serial_number) {
        try {
          const product = products.find(p => p.id === selectedActivity.product_id);
          if (product && product.serial_numbers) {
            const updatedSerials = product.serial_numbers.map(serial => {
              if (serial.serial_number === selectedActivity.serial_number) {
                return {
                  ...serial,
                  next_maintenance_date: completionData.next_maintenance_date
                };
              }
              return serial;
            });
            
            await api.put(`/products/${product.id}`, {
              serial_numbers: updatedSerials
            });
            console.log('Product serial number updated with next maintenance date');
          }
        } catch (updateError) {
          console.error('Error updating product maintenance date:', updateError);
          // Don't fail the activity update if product update fails
        }
      }
      
      alert('Activity status updated successfully!');
      setShowStatusModal(false);
      setStatusUpdateNote('');
      setCompletionData({ invoice_number: '', work_order_no: '', total_amount: '', next_maintenance_date: '' });
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
      await api.post(`/activities/${selectedActivity.id}/progress`, {
        update: progressUpdate.update,
        timestamp: new Date().toISOString()
      });
      alert('Progress update added successfully!');
      setShowProgressModal(false);
      setProgressUpdate({ update: '' });
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

  const handleEditAssignment = (activity) => {
    setSelectedActivity(activity);
    setEditAssignedTo(activity.assigned_to || '');
    setShowEditAssignmentModal(true);
  };

  const handleUpdateAssignment = async () => {
    try {
      const response = await api.put(`/activities/${selectedActivity.id}`, {
        assigned_to: editAssignedTo
      });
      
      // Update local state
      setActivities(activities.map(a => 
        a.id === selectedActivity.id ? { ...a, assigned_to: editAssignedTo } : a
      ));
      
      setShowEditAssignmentModal(false);
      setShowDetailModal(false);
      alert('Activity reassigned successfully!');
      fetchData();
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
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

  const handleStatusChange = (activity, newStatus) => {
    setSelectedActivity({ ...activity, newStatus });
    setShowStatusModal(true);
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

  // Count completed activities
  const completedActivitiesCount = activities.filter(act => act.status === 'completed').length;

  // Get support users for dropdown
  const supportUsers = users.filter(u => u.role === 'support');

  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const assignedUserName = getUserName(activity.assigned_to).toLowerCase();
    const createdByUserName = getUserName(activity.created_by).toLowerCase();
    const customerName = customers.find(c => c.id === activity.customer_id)?.name?.toLowerCase() || '';
    const serialNumber = activity.serial_number?.toLowerCase() || '';
    const invoiceNumber = activity.invoice_number?.toLowerCase() || '';
    const workOrderNumber = activity.work_order_no?.toLowerCase() || '';
    
    return (
      activity.title?.toLowerCase().includes(query) ||
      activity.description?.toLowerCase().includes(query) ||
      assignedUserName.includes(query) ||
      createdByUserName.includes(query) ||
      customerName.includes(query) ||
      serialNumber.includes(query) ||
      invoiceNumber.includes(query) ||
      workOrderNumber.includes(query)
    );
  });

  const isAdmin = currentUser?.role === 'admin';
  const canCreateActivity = true; // All users can create activities

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      <PageHeader title="📋 Activities Management">
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
          Back to Dashboard
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Activities</h3>
            <p className="text-3xl font-bold text-blue-600">{totalActivitiesByUser}</p>
            <p className="text-xs text-gray-500 mt-1">All your activities</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Completed Activities</h3>
            <p className="text-3xl font-bold text-green-600">{completedActivitiesCount}</p>
            <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Value</h3>
            <p className="text-3xl font-bold text-green-600">{formatAmount(totalValue)}</p>
            <p className="text-xs text-gray-500 mt-1">From completed activities</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button
              onClick={() => setFilterStatus('all')}
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              className={filterStatus === 'all' ? 'bg-gradient-to-r from-blue-700 to-green-700' : ''}
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
          
          {/* Search Box - for Support Users */}
          {currentUser?.role === 'support' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Serial #, Customer, Invoice #, Work Order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          
          {canCreateActivity && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-blue-700 to-green-700"
            >
              + Create Activity
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search by Serial #, Customer, Assigned To, Invoice #, Work Order #, Title..."
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

        {/* Performance Chart - Assigned To Performance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">📊 Performance by Assigned User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Activities</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Completed</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">In Progress</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Invoices</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Work Orders</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Calculate performance by assigned user
                    const performanceMap = {};
                    
                    filteredActivities.forEach(activity => {
                      const assignedTo = activity.assigned_to || 'Unassigned';
                      const userName = getUserName(assignedTo);
                      
                      if (!performanceMap[userName]) {
                        performanceMap[userName] = {
                          total: 0,
                          completed: 0,
                          inProgress: 0,
                          invoices: 0,
                          workOrders: 0,
                          totalValue: 0
                        };
                      }
                      
                      performanceMap[userName].total++;
                      
                      if (activity.status === 'completed') {
                        performanceMap[userName].completed++;
                        if (activity.invoice_number) performanceMap[userName].invoices++;
                        if (activity.work_order_no) performanceMap[userName].workOrders++;
                        if (activity.total_amount) {
                          performanceMap[userName].totalValue += parseFloat(activity.total_amount);
                        }
                      }
                      
                      if (activity.status === 'in_progress') {
                        performanceMap[userName].inProgress++;
                      }
                    });
                    
                    // Convert to array and sort by total activities
                    const performanceData = Object.entries(performanceMap)
                      .map(([name, stats]) => ({ name, ...stats }))
                      .sort((a, b) => b.total - a.total);
                    
                    return performanceData.length > 0 ? (
                      performanceData.map((perf, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-700 to-green-700 flex items-center justify-center text-white font-bold mr-3">
                                {perf.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{perf.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                              {perf.total}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                              {perf.completed}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                              {perf.inProgress}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-gray-700 font-medium">
                              {perf.invoices > 0 ? `📄 ${perf.invoices}` : '-'}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-gray-700 font-medium">
                              {perf.workOrders > 0 ? `🔧 ${perf.workOrders}` : '-'}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className="font-bold text-green-700">
                              {perf.totalValue > 0 ? formatAmount(perf.totalValue) : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No activities found
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search' : 'Get started by creating a new activity'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>👤 Created by: <strong className="text-blue-600">{getUserName(activity.created_by)}</strong></span>
                        <span>📋 Assigned to: <strong className="text-purple-600">{getUserName(activity.assigned_to)}</strong></span>
                        {activity.due_date && (
                          <span>📅 Due: {new Date(activity.due_date).toLocaleDateString()}</span>
                        )}
                        {activity.activity_type && (
                          <span>🏷️ Type: <strong>{activity.activity_type}</strong></span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-gray-600 text-sm mt-2">{activity.description}</p>
                      )}
                      {activity.customer_id && (
                        <p className="text-sm text-gray-600 mt-2">
                          🏢 Customer: <strong className="text-cyan-600">{customers.find(c => c.id === activity.customer_id)?.name}</strong>
                        </p>
                      )}
                      
                      {/* Financial Details - Show for completed activities */}
                      {activity.status === 'completed' && (activity.invoice_number || activity.work_order_no || activity.total_amount) && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {activity.invoice_number && (
                              <div>
                                <span className="text-gray-600">📄 Invoice #:</span>
                                <span className="ml-2 font-semibold text-green-700">{activity.invoice_number}</span>
                              </div>
                            )}
                            {activity.work_order_no && (
                              <div>
                                <span className="text-gray-600">🔧 Work Order #:</span>
                                <span className="ml-2 font-semibold text-green-700">{activity.work_order_no}</span>
                              </div>
                            )}
                            {activity.total_amount && (
                              <div className="bg-green-50 px-3 py-2 rounded-lg">
                                <div className="text-sm space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Base Amount:</span>
                                    <span className="font-semibold text-gray-900">{formatAmount(parseFloat(activity.total_amount))}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Tax ({companySettings?.tax_percentage || 0}%):</span>
                                    <span className="font-semibold text-green-600">
                                      {formatAmount(getTaxBreakdown(parseFloat(activity.total_amount)).taxAmount)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-green-200">
                                    <span className="text-gray-700 font-bold">Total Value:</span>
                                    <span className="font-bold text-green-700">
                                      {formatAmount(getTaxBreakdown(parseFloat(activity.total_amount)).total)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Badge className={getStatusBadge(activity.status)}>
                        {activity.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowDetailModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-700 to-green-700 hover:from-orange-600 hover:to-sky-600"
                    >
                      👁️ View Details
                    </Button>
                    {/* Only creator, assignee, or admin can modify activity */}
                    {(currentUser?.role === 'admin' || activity.created_by === currentUser?.id || activity.assigned_to === currentUser?.id) && (
                      <>
                        {activity.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(activity, 'in_progress')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Start
                          </Button>
                        )}
                        {activity.status === 'in_progress' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAddProgressUpdate(activity.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Add Progress
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(activity, 'completed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Complete
                            </Button>
                          </>
                        )}
                      </>
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
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Activity Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-3xl my-4 max-h-[90vh] overflow-y-auto">
              <CardHeader className="sticky top-0 bg-white z-10 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Create New Activity</CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                    type="button"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
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
                          setNewActivity({...newActivity, customer_id: e.target.value, product_id: '', serial_number: ''});
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
                    
                    {/* Product Selection */}
                    <div>
                      <Label>Product</Label>
                      {newActivity.customer_id ? (
                        <select
                          className="w-full border rounded-md p-2"
                          value={newActivity.product_id}
                          onChange={(e) => {
                            setNewActivity({...newActivity, product_id: e.target.value, serial_number: ''});
                          }}
                        >
                          <option value="">Select Product</option>
                          {products
                            .filter(p => p.serial_numbers?.some(s => s.customer_id === newActivity.customer_id && s.status === 'sold'))
                            .map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {product.model || product.category}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="w-full border rounded-md p-2 bg-gray-50 flex items-center justify-center text-gray-500">
                          Please select a customer first
                        </div>
                      )}
                    </div>
                    
                    {/* Serial Number Selection */}
                    <div>
                      <Label>Product Serial Number</Label>
                      {newActivity.product_id && newActivity.customer_id ? (
                        <select
                          className="w-full border rounded-md p-2"
                          value={newActivity.serial_number}
                          onChange={(e) => setNewActivity({...newActivity, serial_number: e.target.value})}
                        >
                          <option value="">Select Serial Number</option>
                          {(() => {
                            const product = products.find(p => p.id === newActivity.product_id);
                            return product?.serial_numbers
                              ?.filter(s => s.customer_id === newActivity.customer_id && s.status === 'sold')
                              .map((serial, index) => (
                                <option key={index} value={serial.serial_number}>
                                  {serial.serial_number} (Sold: {serial.sale_date ? new Date(serial.sale_date).toLocaleDateString() : 'N/A'})
                                </option>
                              )) || [];
                          })()}
                        </select>
                      ) : (
                        <div className="w-full border rounded-md p-2 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                          {!newActivity.customer_id ? 'Select customer and product first' : 'Select a product first'}
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Only serial numbers assigned to the selected customer are shown
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
                        <option value="new_installation">New Installation</option>
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
                          <Label>Work Order Number</Label>
                          <Input
                            value={newActivity.work_order_no}
                            onChange={(e) => setNewActivity({...newActivity, work_order_no: e.target.value})}
                            placeholder="WO-2024-001"
                          />
                        </div>
                        <div>
                          <Label>Total Amount ({companySettings?.currency || 'USD'})</Label>
                          <Input
                            type="number"
                            value={newActivity.total_amount}
                            onChange={(e) => setNewActivity({...newActivity, total_amount: e.target.value})}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Next Maintenance Due Date</Label>
                          <Input
                            type="date"
                            value={newActivity.next_maintenance_date}
                            onChange={(e) => setNewActivity({...newActivity, next_maintenance_date: e.target.value})}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This will be synced to the product's serial number record
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-blue-700 to-green-700">
                      Create Activity
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
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
                        <Label>Next Maintenance Date</Label>
                        <Input
                          type="date"
                          value={completionData.next_maintenance_date}
                          onChange={(e) => setCompletionData({...completionData, next_maintenance_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Total Amount ({companySettings?.currency || 'USD'})</Label>
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
                      className="bg-gradient-to-r from-blue-700 to-green-700"
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
                  <div className="flex space-x-2">
                    <Button onClick={handleConfirmProgressUpdate} className="bg-gradient-to-r from-blue-700 to-green-700">
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

        {/* Activity Details Modal */}
        {showDetailModal && selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="sticky top-0 bg-white z-10 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{selectedActivity.title}</CardTitle>
                    <Badge className={`${getStatusBadge(selectedActivity.status)} mt-2`}>
                      {selectedActivity.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Description */}
                {selectedActivity.description && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedActivity.description}</p>
                  </div>
                )}

                {/* Activity Information */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">📋 Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 font-medium">{selectedActivity.activity_type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <span className="ml-2 font-medium">{selectedActivity.priority || 'N/A'}</span>
                    </div>
                    {selectedActivity.serial_number && (
                      <div className="col-span-2">
                        <span className="text-gray-500">🔢 Product Serial Number:</span>
                        <span className="ml-2 font-semibold text-blue-600">{selectedActivity.serial_number}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-500">📦 Products:</span>
                      <div className="ml-2 mt-1">
                        {selectedActivity.product_ids && selectedActivity.product_ids.length > 0
                          ? selectedActivity.product_ids.map((pid, index) => {
                              const product = products.find(p => p.id === pid);
                              return (
                                <div key={index} className="mb-1">
                                  <span className="font-medium">{product?.name || pid}</span>
                                  {product?.serial_number && (
                                    <span className="ml-2 text-sm text-blue-600">
                                      (Serial: {product.serial_number})
                                    </span>
                                  )}
                                </div>
                              );
                            })
                          : <span className="text-gray-400">No products selected</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Created by:</span>
                      <span className="ml-2 font-medium text-blue-600">{getUserName(selectedActivity.created_by)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned to:</span>
                      <span className="ml-2 font-medium">{getUserName(selectedActivity.assigned_to)}</span>
                    </div>
                    {selectedActivity.support_staff && (
                      <div>
                        <span className="text-gray-500">Support Staff:</span>
                        <span className="ml-2 font-medium">{getUserName(selectedActivity.support_staff)}</span>
                      </div>
                    )}
                    {selectedActivity.customer_id && (
                      <div>
                        <span className="text-gray-500">Customer:</span>
                        <span className="ml-2 font-medium text-cyan-600">
                          {customers.find(c => c.id === selectedActivity.customer_id)?.name || 'Unknown'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedActivity.created_at).toLocaleString()}
                      </span>
                    </div>
                    {selectedActivity.due_date && (
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedActivity.due_date).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedActivity.completion_date && (
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {new Date(selectedActivity.completion_date).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedActivity.next_maintenance_date && (
                      <div className="col-span-2">
                        <span className="text-gray-500">🔧 Next Maintenance Due:</span>
                        <span className="ml-2 font-bold text-orange-600">
                          {new Date(selectedActivity.next_maintenance_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Details */}
                {selectedActivity.status === 'completed' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-3">💰 Completion Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedActivity.work_order_no && (
                        <div>
                          <span className="text-gray-600">Work Order:</span>
                          <span className="ml-2 font-medium">{selectedActivity.work_order_no}</span>
                        </div>
                      )}
                      {selectedActivity.invoice_number && (
                        <div>
                          <span className="text-gray-600">Invoice:</span>
                          <span className="ml-2 font-medium">{selectedActivity.invoice_number}</span>
                        </div>
                      )}
                      {selectedActivity.total_amount && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="ml-2 font-bold text-green-700">
                            {formatAmount(selectedActivity.total_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Details */}
                {selectedActivity.status === 'completed' && (selectedActivity.invoice_number || selectedActivity.work_order_no || selectedActivity.total_amount) && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">💰 Financial Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedActivity.invoice_number && (
                        <div>
                          <span className="text-gray-500">Invoice #:</span>
                          <span className="ml-2 font-medium">{selectedActivity.invoice_number}</span>
                        </div>
                      )}
                      {selectedActivity.work_order_no && (
                        <div>
                          <span className="text-gray-500">Work Order #:</span>
                          <span className="ml-2 font-medium">{selectedActivity.work_order_no}</span>
                        </div>
                      )}
                      {selectedActivity.total_amount && (
                        <div>
                          <span className="text-gray-500">Total Amount:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {formatAmount(parseFloat(selectedActivity.total_amount))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress History */}
                {selectedActivity.progress_updates && selectedActivity.progress_updates.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">
                        📊 Progress History ({selectedActivity.progress_updates.length} updates)
                      </h4>
                      {/* Only creator or assignee can add progress */}
                      {selectedActivity.status === 'in_progress' && 
                       (selectedActivity.created_by === currentUser.id || selectedActivity.assigned_to === currentUser.id) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowDetailModal(false);
                            handleAddProgressUpdate(selectedActivity.id);
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          + Add Progress
                        </Button>
                      )}
                    </div>
                    
                    {/* Info message for support users who can't add progress */}
                    {selectedActivity.status === 'in_progress' && 
                     selectedActivity.created_by !== currentUser.id && 
                     selectedActivity.assigned_to !== currentUser.id && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-yellow-800">
                        ℹ️ Only the creator or assignee can add progress
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {selectedActivity.progress_updates.slice().reverse().map((update, idx) => (
                        <div key={idx} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{update.update}</p>
                            </div>
                            <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                              {new Date(update.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show "No Progress" for in_progress activities */}
                {selectedActivity.status === 'in_progress' && (!selectedActivity.progress_updates || selectedActivity.progress_updates.length === 0) && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-700">📊 Progress History</h4>
                      {/* Only creator or assignee can add first progress */}
                      {(selectedActivity.created_by === currentUser.id || selectedActivity.assigned_to === currentUser.id) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowDetailModal(false);
                            handleAddProgressUpdate(selectedActivity.id);
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          + Add First Progress
                        </Button>
                      )}
                    </div>
                    
                    {/* Message for creator/assignee with no progress yet */}
                    {(selectedActivity.created_by === currentUser.id || selectedActivity.assigned_to === currentUser.id) ? (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <p className="text-gray-500">No progress updates yet</p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        ℹ️ Only the activity creator or assignee can add progress updates
                      </div>
                    )}
                  </div>
                )}

                {/* Status History */}
                {selectedActivity.status_history && selectedActivity.status_history.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">
                      🔄 Status History ({selectedActivity.status_history.length} changes)
                    </h4>
                    <div className="space-y-2">
                      {selectedActivity.status_history.slice().reverse().map((history, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <Badge className={getStatusBadge(history.status)}>
                                {history.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {history.notes && (
                                <p className="text-sm text-gray-600 mt-2">{history.notes}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                              {new Date(history.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {/* Only show edit/update buttons if user is admin, creator, or assignee */}
                  {(currentUser?.role === 'admin' || selectedActivity.created_by === currentUser?.id || selectedActivity.assigned_to === currentUser?.id) && (
                    <>
                      {selectedActivity.status === 'pending' && (
                        <Button
                          onClick={() => {
                            setShowDetailModal(false);
                            handleStatusChange(selectedActivity, 'in_progress');
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Activity
                        </Button>
                      )}
                      {selectedActivity.status === 'in_progress' && (
                        <>
                          <Button
                            onClick={() => {
                              setShowDetailModal(false);
                              handleAddProgressUpdate(selectedActivity.id);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Add Progress
                          </Button>
                          <Button
                            onClick={() => {
                              setShowDetailModal(false);
                              handleStatusChange(selectedActivity, 'completed');
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Complete
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Show message if user cannot edit */}
                  {currentUser?.role !== 'admin' && selectedActivity.created_by !== currentUser?.id && selectedActivity.assigned_to !== currentUser?.id && (
                    <p className="text-sm text-gray-500 italic">
                      ℹ️ Only the creator, assignee, or admin can edit this activity
                    </p>
                  )}
                  
                  {/* Admin can reassign activity */}
                  {currentUser?.role === 'admin' && (
                    <Button
                      variant="outline"
                      onClick={() => handleEditAssignment(selectedActivity)}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      ✏️ Edit Assignment
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Edit Assignment Modal (Admin Only) */}
      {showEditAssignmentModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>✏️ Edit Activity Assignment</span>
                <button
                  onClick={() => setShowEditAssignmentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Activity:</strong> {selectedActivity.title}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Current Assignment:</strong> {getUserName(selectedActivity.assigned_to)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="reassign-to">Reassign To</Label>
                <select
                  id="reassign-to"
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Unassigned --</option>
                  {users
                    .filter(u => u.role === 'support')
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUpdateAssignment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={editAssignedTo === selectedActivity.assigned_to}
                >
                  Update Assignment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditAssignmentModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Activities;
