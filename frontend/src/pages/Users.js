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
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'sales'
  });

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      const endpoint = filterRole === 'all' ? '/users' : `/users?role=${filterRole}`;
      const response = await api.get(endpoint);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      alert('User added successfully!');
      setNewUser({ name: '', email: '', password: '', role: 'agent' });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-100 to-sky-50">
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
              className={filterRole === 'all' ? 'bg-gradient-to-r from-orange-500 to-sky-500' : ''}
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
              className="bg-gradient-to-r from-orange-500 to-sky-500"
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
                      <option value="admin">Admin - Full system access</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2 pt-4 border-t">
                  <Button type="submit" className="bg-gradient-to-r from-orange-500 to-sky-500">
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
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role === 'sales' ? 'Sales' : user.role === 'support' ? 'Support' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    {isAdmin && user.id !== currentUser?.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
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
    </div>
  );
};

export default Users;
