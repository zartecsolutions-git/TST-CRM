import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'sales',
    monthly_sales_target: 0,
    commission_slabs: [],
    commission_percentage: 5.0
  });

  const fetchUsers = async () => {
    try {
      const endpoint = filterRole === 'all' ? '/users' : `/users?role=${filterRole}`;
      const response = await api.get(endpoint);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Include commission slabs and monthly target in the request
      const userData = {
        ...newUser,
        commission_slabs: newUser.commission_slabs || [],
        monthly_sales_target: newUser.monthly_sales_target || 0
      };
      await api.post('/auth/register', userData);
      alert('User added successfully!');
      setNewUser({ 
        name: '', 
        email: '', 
        password: '', 
        phone: '',
        role: 'sales',
        monthly_sales_target: 0,
        commission_slabs: [],
        commission_percentage: 5.0
      });
      setShowAddForm(false);
      fetchUsers();
    } catch (error) {
      alert('Error adding user: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Only admins can delete users');
      } else {
        alert('Error deleting user: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    try {
      await api.put(`/users/${selectedUser.id}/password`, {
        new_password: newPassword
      });
      alert(`Password updated successfully for ${selectedUser.name}!`);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error) {
      alert('Error changing password: ' + (error.response?.data?.detail || error.message));
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const openEditForm = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status || 'active',
      monthly_sales_target: user.monthly_sales_target || 0,
      commission_slabs: user.commission_slabs || [],
      commission_percentage: user.commission_percentage || 5.0
    });
    setShowEditForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.id}`, {
        name: editingUser.name,
        phone: editingUser.phone,
        role: editingUser.role,
        status: editingUser.status,
        commission_slabs: editingUser.commission_slabs || [],
        monthly_sales_target: editingUser.monthly_sales_target || 0,
        commission_percentage: editingUser.commission_percentage || 5.0
      });
      alert('User updated successfully!');
      setShowEditForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingUser(null);
  };

  const isAdmin = currentUser?.role === 'admin';

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      // Legacy support for old role names
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Commission Slab Management Functions
  const addSlabToNewUser = () => {
    setNewUser({
      ...newUser,
      commission_slabs: [
        ...(newUser.commission_slabs || []),
        { from_value: 0, to_value: 10000, commission_percentage: 2.0 }
      ]
    });
  };

  const removeSlabFromNewUser = (index) => {
    setNewUser({
      ...newUser,
      commission_slabs: newUser.commission_slabs.filter((_, i) => i !== index)
    });
  };

  const updateSlabInNewUser = (index, field, value) => {
    const updatedSlabs = [...newUser.commission_slabs];
    updatedSlabs[index][field] = parseFloat(value) || 0;
    setNewUser({ ...newUser, commission_slabs: updatedSlabs });
  };

  const addSlabToEditUser = () => {
    setEditingUser({
      ...editingUser,
      commission_slabs: [
        ...(editingUser.commission_slabs || []),
        { from_value: 0, to_value: 10000, commission_percentage: 2.0 }
      ]
    });
  };

  const removeSlabFromEditUser = (index) => {
    setEditingUser({
      ...editingUser,
      commission_slabs: editingUser.commission_slabs.filter((_, i) => i !== index)
    });
  };

  const updateSlabInEditUser = (index, field, value) => {
    const updatedSlabs = [...editingUser.commission_slabs];
    updatedSlabs[index][field] = parseFloat(value) || 0;
    setEditingUser({ ...editingUser, commission_slabs: updatedSlabs });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      {/* Header */}
      <PageHeader title="User Management">
        <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
          Back to Dashboard
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <Button
              onClick={() => setFilterRole('all')}
              variant={filterRole === 'all' ? 'default' : 'outline'}
              className={filterRole === 'all' ? 'bg-gradient-to-r from-blue-700 to-green-700' : ''}
            >
              All Users
            </Button>
            <Button
              onClick={() => setFilterRole('admin')}
              variant={filterRole === 'admin' ? 'default' : 'outline'}
              className={filterRole === 'admin' ? 'bg-purple-600' : ''}
            >
              Admins
            </Button>
            <Button
              onClick={() => setFilterRole('sales')}
              variant={filterRole === 'sales' ? 'default' : 'outline'}
              className={filterRole === 'sales' ? 'bg-blue-600' : ''}
            >
              Sales
            </Button>
            <Button
              onClick={() => setFilterRole('support')}
              variant={filterRole === 'support' ? 'default' : 'outline'}
              className={filterRole === 'support' ? 'bg-green-600' : ''}
            >
              Support
            </Button>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-blue-700 to-green-700"
            >
              + Add User
            </Button>
          )}
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <p className="text-sm text-gray-600 mt-2">Create new sales or support team members</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      placeholder="Min 8 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Role *</Label>
                    <select
                      className="w-full border rounded-md p-2 bg-white"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="sales">Sales - Can manage customers and leads</option>
                      <option value="support">Support - Can manage activities and customers</option>
                      <option value="data_entry">Data Entry - Full access except admin menu</option>
                      <option value="employee">Employee - Can only log daily tasks</option>
                      <option value="admin">Admin - Full system access</option>
                    </select>
                  </div>
                  
                  {/* Commission Percentage - Show for sales and support roles */}
                  {(newUser.role === 'sales' || newUser.role === 'support') && (
                    <>
                      <div className="md:col-span-2">
                        <Label>Monthly Sales Target (BHD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 50000"
                          value={newUser.monthly_sales_target || ''}
                          onChange={(e) => setNewUser({...newUser, monthly_sales_target: parseFloat(e.target.value) || 0})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Monthly target for tracking</p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex justify-between mb-2">
                          <Label>Commission Slabs</Label>
                          <button type="button" onClick={addSlabToNewUser} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">+ Add Slab</button>
                        </div>
                        {newUser.commission_slabs?.length > 0 ? (
                          <div className="space-y-2">
                            {newUser.commission_slabs.map((slab, i) => (
                              <div key={i} className="grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded">
                                <Input type="number" value={slab.from_value} onChange={(e) => updateSlabInNewUser(i, 'from_value', e.target.value)} placeholder="From" />
                                <Input type="number" value={slab.to_value} onChange={(e) => updateSlabInNewUser(i, 'to_value', e.target.value)} placeholder="To" />
                                <Input type="number" step="0.1" value={slab.commission_percentage} onChange={(e) => updateSlabInNewUser(i, 'commission_percentage', e.target.value)} placeholder="%" />
                                <button type="button" onClick={() => removeSlabFromNewUser(i)} className="bg-red-500 text-white px-2 rounded text-xs">Remove</button>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-gray-500">No slabs configured</p>}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex space-x-2 pt-4 border-t">
                  <Button type="submit" className="bg-gradient-to-r from-blue-700 to-green-700">
                    ✓ Create User
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit User Form */}
        {showEditForm && editingUser && (
          <Card className="mb-6 border-2 border-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
              <CardTitle>✏️ Edit User: {editingUser.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email (Read-only)</Label>
                    <Input
                      type="email"
                      value={editingUser.email}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Role *</Label>
                    <select
                      className="w-full border rounded-md p-2 bg-white"
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    >
                      <option value="sales">Sales</option>
                      <option value="support">Support</option>
                      <option value="data_entry">Data Entry</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label>Status *</Label>
                    <select
                      className="w-full border rounded-md p-2 bg-white"
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  {/* Commission Slabs - Show for sales and support roles */}
                  {(editingUser.role === 'sales' || editingUser.role === 'support') && (
                    <>
                      <div className="md:col-span-2">
                        <Label>Monthly Sales Target (BHD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 50000"
                          value={editingUser.monthly_sales_target || ''}
                          onChange={(e) => setEditingUser({...editingUser, monthly_sales_target: parseFloat(e.target.value) || 0})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Monthly sales target for performance tracking</p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex justify-between mb-2">
                          <Label>Commission Slabs</Label>
                          <button type="button" onClick={addSlabToEditUser} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">+ Add Slab</button>
                        </div>
                        {editingUser.commission_slabs?.length > 0 ? (
                          <div className="space-y-2">
                            {editingUser.commission_slabs.map((slab, i) => (
                              <div key={i} className="grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded">
                                <Input type="number" value={slab.from_value} onChange={(e) => updateSlabInEditUser(i, 'from_value', e.target.value)} placeholder="From" />
                                <Input type="number" value={slab.to_value} onChange={(e) => updateSlabInEditUser(i, 'to_value', e.target.value)} placeholder="To" />
                                <Input type="number" step="0.1" value={slab.commission_percentage} onChange={(e) => updateSlabInEditUser(i, 'commission_percentage', e.target.value)} placeholder="%" />
                                <button type="button" onClick={() => removeSlabFromEditUser(i)} className="bg-red-500 text-white px-2 rounded text-xs">Remove</button>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-gray-500">No slabs configured</p>}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex space-x-2 pt-4 border-t mt-4">
                  <Button type="submit" className="bg-gradient-to-r from-blue-700 to-green-700">
                    ✓ Update User
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100' :
                        user.role === 'sales' ? 'bg-blue-100' : 'bg-green-100'
                      } flex items-center justify-center`}>
                        <span className={`text-xl font-bold ${
                          user.role === 'admin' ? 'text-purple-600' :
                          user.role === 'sales' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {(user.role === 'sales' || user.role === 'support') && user.commission_slabs && user.commission_slabs.length > 0 && (
                          <p className="text-xs text-green-600 font-medium mt-1">💰 {user.commission_slabs.length} Commission Slab(s)</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role === 'sales' ? 'Sales' : user.role === 'support' ? 'Support' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    {isAdmin && user.id !== currentUser?.id && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(user)}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordModal(user)}
                          className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                          🔑 Password
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                  {user.phone && (
                    <div className="mt-2 text-xs text-gray-600">
                      📞 {user.phone}
                    </div>
                  )}
                  {user.team_id && (
                    <div className="mt-2 text-xs text-gray-500">
                      Team ID: {user.team_id}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>


      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Change Password for {selectedUser.name}
            </h2>
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password will be changed for: {selectedUser.email}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setNewPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Users;
