import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', serial_number: '', description: '', price: '', model: '', category: '', specifications: '', warranty_period: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/products`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
      setShowForm(false);
      setFormData({ name: '', serial_number: '', description: '', price: '', model: '', category: '', specifications: '', warranty_period: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Error saving product');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Products</h1>
          {user.role === 'admin' && (
            <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg">+ Add Product</button>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">Product Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Serial Number *</label><input type="text" required value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Model</label><input type="text" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Category</label><input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Price</label><input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Warranty Period</label><input type="text" value={formData.warranty_period} onChange={(e) => setFormData({...formData, warranty_period: e.target.value})} placeholder="e.g., 12 months" className="w-full border rounded px-3 py-2" /></div>
                </div>
                <div><label className="block text-sm mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" /></div>
                <div><label className="block text-sm mb-1">Specifications</label><textarea value={formData.specifications} onChange={(e) => setFormData({...formData, specifications: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" placeholder="e.g., Power: 5kW, Pressure: 10 bar" /></div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No products yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Serial Number</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Warranty</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-sm">{p.serial_number}</td>
                    <td className="px-4 py-3">{p.model || '-'}</td>
                    <td className="px-4 py-3">{p.category || '-'}</td>
                    <td className="px-4 py-3">{p.price ? `$${p.price.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3">{p.warranty_period || '-'}</td>
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
