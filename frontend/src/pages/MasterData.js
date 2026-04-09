import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function MasterData() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', parent_category: '', parent_division: '' });
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [activeTab, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/master-data/${activeTab}`);
      
      if (activeTab === 'categories') {
        setCategories(res.data || []);
        // Fetch divisions for parent selection
        const divRes = await api.get('/master-data/divisions');
        setDivisions(divRes.data || []);
      } else if (activeTab === 'subcategories') {
        setSubcategories(res.data || []);
        // Also fetch categories for parent selection
        const catRes = await api.get('/master-data/categories');
        setCategories(catRes.data || []);
      } else if (activeTab === 'brands') {
        setBrands(res.data || []);
      } else if (activeTab === 'divisions') {
        setDivisions(res.data || []);
      } else if (activeTab === 'models') {
        setModels(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/master-data/${activeTab}/${editingItem.name}`, formData);
      } else {
        await api.post(`/master-data/${activeTab}`, formData);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: '', description: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      parent_category: item.parent_category || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete ${activeTab.slice(0, -1)}?`)) return;
    try {
      await api.delete(`/master-data/${activeTab}/${name}`);
      fetchData();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const getCurrentData = () => {
    if (activeTab === 'categories') return categories;
    if (activeTab === 'subcategories') return subcategories;
    if (activeTab === 'brands') return brands;
    if (activeTab === 'divisions') return divisions;
    return models;
  };

  const tabLabel = activeTab === 'subcategories' ? 'Sub-Category' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Master Data Settings</h1>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', description: '' });
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + Add {tabLabel}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['categories', 'subcategories', 'brands', 'divisions'].map(tab => (
          <Button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowForm(false);
              setFormData({ name: '', description: '', parent_category: '' });
            }}
            className={activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}
          >
            {tab === 'subcategories' ? 'Sub-Categories' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit' : 'Add'} {tabLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'categories' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Division</label>
                  <select
                    value={formData.parent_division}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_division: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select Division (Optional)</option>
                    {divisions.map(div => (
                      <option key={div.name} value={div.name}>{div.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {activeTab === 'subcategories' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category *</label>
                  <select
                    value={formData.parent_category}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  >
                    <option value="">Select Parent Category</option>
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  placeholder={`Enter ${tabLabel.toLowerCase()} name`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="2"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setFormData({ name: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} ({getCurrentData().length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : getCurrentData().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-xl font-semibold text-gray-700">No {activeTab} yet</p>
              <p className="text-gray-500">Add your first {tabLabel.toLowerCase()} to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    {activeTab === 'categories' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Division</th>
                    )}
                    {activeTab === 'subcategories' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Category</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentData().map((item) => (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      {activeTab === 'categories' && (
                        <td className="px-4 py-3 text-sm text-purple-600">{item.parent_division || '-'}</td>
                      )}
                      {activeTab === 'subcategories' && (
                        <td className="px-4 py-3 text-sm text-blue-600">{item.parent_category}</td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.name)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
