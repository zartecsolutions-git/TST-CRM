import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', region: '', business_vertical: '', contact_person: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '', email: '', phone: '', address: '', region: '', business_vertical: '', contact_person: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/customers`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCustomers();
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', address: '', region: '', business_vertical: '', contact_person: '' });
      alert('Customer created successfully!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error saving customer');
    }
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      region: customer.region || '',
      business_vertical: customer.business_vertical || '',
      contact_person: customer.contact_person || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/customers/${selectedCustomer.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Customer updated successfully!');
      fetchCustomers();
      setShowEditModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error updating customer');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.region?.toLowerCase().includes(query) ||
      customer.business_vertical?.toLowerCase().includes(query) ||
      customer.contact_person?.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Customers</h1>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = '/dashboard'} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg">+ Add Customer</button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search customers by name, email, phone, region, or business vertical..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4">
              <h2 className="text-2xl font-bold mb-4">Add New Customer</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Email *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Contact Person</label><input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Region</label><input type="text" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Business Vertical</label><input type="text" value={formData.business_vertical} onChange={(e) => setFormData({...formData, business_vertical: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                </div>
                <div><label className="block text-sm mb-1">Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" /></div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Edit Customer Details</h2>
              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">Name *</label><input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Email *</label><input type="email" required value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Phone</label><input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Contact Person</label><input type="text" value={editFormData.contact_person} onChange={(e) => setEditFormData({...editFormData, contact_person: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Region</label><input type="text" value={editFormData.region} onChange={(e) => setEditFormData({...editFormData, region: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Business Vertical</label><input type="text" value={editFormData.business_vertical} onChange={(e) => setEditFormData({...editFormData, business_vertical: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                </div>
                <div><label className="block text-sm mb-1">Address</label><textarea value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" /></div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">💾 Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Region</th>
                  <th className="px-4 py-3 text-left">Business Vertical</th>
                  {user.role === 'admin' && <th className="px-4 py-3 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.phone || '-'}</td>
                    <td className="px-4 py-3">{c.region || '-'}</td>
                    <td className="px-4 py-3">{c.business_vertical || '-'}</td>
                    {user.role === 'admin' && (
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleEditClick(c)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
