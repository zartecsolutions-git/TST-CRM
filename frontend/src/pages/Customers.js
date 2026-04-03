import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
    } catch (error) {
      alert(error.response?.data?.detail || 'Error saving customer');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Customers</h1>
          <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg">+ Add Customer</button>
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

        <div className="bg-white rounded-lg shadow">
          {customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No customers yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Region</th>
                  <th className="px-4 py-3 text-left">Business Vertical</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.phone || '-'}</td>
                    <td className="px-4 py-3">{c.region || '-'}</td>
                    <td className="px-4 py-3">{c.business_vertical || '-'}</td>
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
