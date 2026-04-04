import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [csvFile, setCsvFile] = useState(null);
  const [warrantyAlerts, setWarrantyAlerts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [productActivities, setProductActivities] = useState([]);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '', serial_number: '', description: '', price: '', model: '', category: '', 
    specifications: '', warranty_period: '', purchase_date: '', next_maintenance_date: '', license_code: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { 
    fetchProducts();
    fetchCustomers();
    fetchAlerts();
  }, []);

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

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const [warrantyRes, maintenanceRes] = await Promise.all([
        axios.get(`${API_URL}/api/products/alerts/warranty-expiring?days=30`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/products/alerts/maintenance-due?days=30`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setWarrantyAlerts(warrantyRes.data);
      setMaintenanceAlerts(maintenanceRes.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error exporting products');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }
    
    try {
      const text = await csvFile.text();
      const response = await axios.post(`${API_URL}/api/products/import/csv`, 
        { file_content: text },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      alert(`Import complete! Imported: ${response.data.imported}, Errors: ${response.data.errors.length}`);
      if (response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
      }
      setShowImport(false);
      setCsvFile(null);
      fetchProducts();
      fetchAlerts();
    } catch (error) {
      alert('Error importing products: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/products`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
      fetchAlerts();
      setShowForm(false);
      setFormData({ name: '', serial_number: '', description: '', price: '', model: '', category: '', 
        specifications: '', warranty_period: '', purchase_date: '', next_maintenance_date: '', license_code: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Error saving product');
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowDetails(true);
    setIsEditMode(false);
    fetchProductActivities(product.id);
  };

  const fetchProductActivities = async (productId) => {
    try {
      const response = await axios.get(`${API_URL}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filtered = response.data.filter(act => 
        act.product_ids && act.product_ids.includes(productId)
      );
      setProductActivities(filtered);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setEditFormData({
      name: selectedProduct.name,
      model: selectedProduct.model || '',
      category: selectedProduct.category || '',
      price: selectedProduct.price || '',
      license_code: selectedProduct.license_code || '',
      warranty_period: selectedProduct.warranty_period || '',
      purchase_date: selectedProduct.purchase_date ? selectedProduct.purchase_date.split('T')[0] : '',
      next_maintenance_date: selectedProduct.next_maintenance_date ? selectedProduct.next_maintenance_date.split('T')[0] : '',
      description: selectedProduct.description || '',
      specifications: selectedProduct.specifications || '',
      customer_id: selectedProduct.customer_id || '',
      sale_date: selectedProduct.sale_date ? selectedProduct.sale_date.split('T')[0] : '',
      invoice_number: selectedProduct.invoice_number || '',
      sale_amount: selectedProduct.sale_amount || '',
      sale_notes: selectedProduct.sale_notes || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL}/api/products/${selectedProduct.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Product updated successfully!');
      fetchProducts();
      fetchCustomers();
      fetchAlerts();
      setIsEditMode(false);
      setShowDetails(false);
    } catch (error) {
      alert('Error updating product: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In a real app, upload to server and save URL
    // For now, we'll just show a message
    alert(`File "${file.name}" would be uploaded to the server and linked to this product`);
  };

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.serial_number?.toLowerCase().includes(query) ||
      product.model?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.license_code?.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-sky-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <PageHeader title="Products Master" />
        
        <div className="flex justify-between items-center mb-6 mt-6">
          <div></div>
          <div className="flex gap-2">
            <button onClick={() => window.location.href = '/dashboard'} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
            {user.role === 'admin' && (
              <>
                <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">📥 Export CSV</button>
                <button onClick={() => setShowImport(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">📤 Import CSV</button>
                <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-teal-600 to-green-600 text-white px-6 py-2 rounded-lg">+ Add Product</button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search products by name, serial number, model, category, or license code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Alerts Section */}
        {(warrantyAlerts.length > 0 || maintenanceAlerts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {warrantyAlerts.length > 0 && (
              <div className="bg-green-100 border-l-4 border-green-600 p-4 rounded">
                <h3 className="font-bold text-green-800 mb-2">⚠️ Warranty Expiring Soon ({warrantyAlerts.length})</h3>
                <ul className="text-sm space-y-1">
                  {warrantyAlerts.map(p => (
                    <li key={p.id} className="text-orange-700">
                      {p.name} - {p.days_remaining} days remaining
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {maintenanceAlerts.length > 0 && (
              <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-blue-800 mb-2">🔧 Maintenance Due Soon ({maintenanceAlerts.length})</h3>
                <ul className="text-sm space-y-1">
                  {maintenanceAlerts.map(p => (
                    <li key={p.id} className="text-blue-700">
                      {p.name} - {p.days_until_maintenance >= 0 ? `${p.days_until_maintenance} days` : 'Overdue'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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
                  <div><label className="block text-sm mb-1">License Code</label><input type="text" value={formData.license_code} onChange={(e) => setFormData({...formData, license_code: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="e.g., LIC-2024-XYZ" /></div>
                  <div><label className="block text-sm mb-1">Warranty Period</label><input type="text" value={formData.warranty_period} onChange={(e) => setFormData({...formData, warranty_period: e.target.value})} placeholder="e.g., 12 months, 2 years" className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Purchase Date</label><input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Next Maintenance Date</label><input type="date" value={formData.next_maintenance_date} onChange={(e) => setFormData({...formData, next_maintenance_date: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                </div>
                <div><label className="block text-sm mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" /></div>
                <div><label className="block text-sm mb-1">Specifications</label><textarea value={formData.specifications} onChange={(e) => setFormData({...formData, specifications: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" placeholder="e.g., Power: 5kW, Pressure: 10 bar" /></div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
              <h2 className="text-2xl font-bold mb-4">Import Products from CSV</h2>
              <form onSubmit={handleImport} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Select CSV File</label>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    CSV should include: name, serial_number, model, category, license_code, price, warranty_period, purchase_date, next_maintenance_date, specifications
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Import</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {showDetails && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:relative print:bg-white">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-none">
              <div className="flex justify-between items-start mb-4 print:mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                  <p className="text-sm text-gray-500">Serial: {selectedProduct.serial_number}</p>
                </div>
                <div className="flex gap-2 print:hidden">
                  {user.role === 'admin' && !isEditMode && (
                    <button onClick={handleEditClick} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">✏️ Edit</button>
                  )}
                  <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">🖨️ Print</button>
                  <button onClick={() => { setShowDetails(false); setIsEditMode(false); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
              </div>

              {!isEditMode ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
                {/* Basic Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-3 text-lg">📋 Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Serial Number:</span> <span className="font-mono bg-white px-2 py-1 rounded">{selectedProduct.serial_number}</span></div>
                    <div><span className="font-medium">Model:</span> {selectedProduct.model || '-'}</div>
                    <div><span className="font-medium">Category:</span> {selectedProduct.category || '-'}</div>
                    <div><span className="font-medium">Price:</span> {selectedProduct.price ? `$${selectedProduct.price.toFixed(2)}` : '-'}</div>
                    <div><span className="font-medium">License Code:</span> <span className="font-mono bg-white px-2 py-1 rounded">{selectedProduct.license_code || '-'}</span></div>
                  </div>
                </div>

                {/* Warranty Information */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3 text-lg">⚠️ Warranty Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Warranty Period:</span> {selectedProduct.warranty_period || '-'}</div>
                    <div><span className="font-medium">Purchase Date:</span> {selectedProduct.purchase_date ? new Date(selectedProduct.purchase_date).toLocaleDateString() : '-'}</div>
                    <div><span className="font-medium">Warranty Ends:</span> {selectedProduct.warranty_finished_date ? (
                      <span className={new Date(selectedProduct.warranty_finished_date) > new Date() ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {new Date(selectedProduct.warranty_finished_date).toLocaleDateString()}
                        {new Date(selectedProduct.warranty_finished_date) > new Date() ? ' ✓ Active' : ' ✗ Expired'}
                      </span>
                    ) : '-'}</div>
                    <div><span className="font-medium">Installation Date:</span> {selectedProduct.installation_date ? new Date(selectedProduct.installation_date).toLocaleDateString() : '-'}</div>
                  </div>
                </div>

                {/* Maintenance Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3 text-lg">🔧 Maintenance</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Next Maintenance:</span> {selectedProduct.next_maintenance_date ? (
                      <span className={new Date(selectedProduct.next_maintenance_date) > new Date() ? 'text-green-600' : 'text-red-600'}>
                        {new Date(selectedProduct.next_maintenance_date).toLocaleDateString()}
                        {new Date(selectedProduct.next_maintenance_date) < new Date() && ' (Overdue)'}
                      </span>
                    ) : '-'}</div>
                  </div>
                </div>

                {/* Sales Information */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-pink-800 mb-3 text-lg">💰 Sales Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Customer:</span> {selectedProduct.customer_id ? (
                      <span className="font-semibold text-pink-700">{customers.find(c => c.id === selectedProduct.customer_id)?.name || 'Unknown'}</span>
                    ) : <span className="text-gray-500">Not sold yet</span>}</div>
                    {selectedProduct.sale_date && (
                      <>
                        <div><span className="font-medium">Sale Date:</span> {new Date(selectedProduct.sale_date).toLocaleDateString()}</div>
                        <div><span className="font-medium">Invoice Number:</span> <span className="font-mono bg-white px-2 py-1 rounded">{selectedProduct.invoice_number || '-'}</span></div>
                        <div><span className="font-medium">Sale Amount:</span> {selectedProduct.sale_amount ? `$${selectedProduct.sale_amount.toFixed(2)}` : '-'}</div>
                        {selectedProduct.sale_notes && <div><span className="font-medium">Notes:</span> {selectedProduct.sale_notes}</div>}
                      </>
                    )}
                  </div>
                </div>

                {/* Created/Updated Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 text-lg">ℹ️ System Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Created:</span> {new Date(selectedProduct.created_at).toLocaleString()}</div>
                    <div><span className="font-medium">Last Updated:</span> {new Date(selectedProduct.updated_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="mt-4 bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">📝 Description</h3>
                  <p className="text-sm text-gray-700">{selectedProduct.description}</p>
                </div>
              )}

              {/* Specifications */}
              {selectedProduct.specifications && (
                <div className="mt-4 bg-cyan-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-cyan-800 mb-2">⚙️ Specifications</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProduct.specifications}</p>
                </div>
              )}

              {/* Activity History */}
              {productActivities.length > 0 && (
                <div className="mt-4 bg-indigo-50 p-4 rounded-lg print:break-inside-avoid">
                  <h3 className="font-semibold text-indigo-800 mb-3">📋 Activity History ({productActivities.length})</h3>
                  <div className="space-y-2">
                    {productActivities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="bg-white p-3 rounded border-l-4 border-indigo-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{activity.title}</p>
                            <p className="text-xs text-gray-600">{activity.description || 'No description'}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                            activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {productActivities.length > 5 && (
                      <p className="text-xs text-gray-500">+ {productActivities.length - 5} more activities</p>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="mt-4 bg-yellow-50 p-4 rounded-lg print:hidden">
                <h3 className="font-semibold text-yellow-800 mb-2">📎 Attachments</h3>
                <input 
                  type="file" 
                  onChange={handleAttachmentUpload}
                  className="text-sm"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <p className="text-xs text-gray-500 mt-1">Upload photos, documents, or maintenance reports</p>
              </div>

              <div className="mt-6 flex justify-end print:hidden">
                <button onClick={() => { setShowDetails(false); setIsEditMode(false); }} className="px-6 py-2 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-lg hover:shadow-lg">Close</button>
              </div>
              </>
            ) : (
              /* Edit Mode Form */
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-1">Name *</label><input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Model</label><input type="text" value={editFormData.model} onChange={(e) => setEditFormData({...editFormData, model: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Category</label><input type="text" value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Price</label><input type="number" step="0.01" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">License Code</label><input type="text" value={editFormData.license_code} onChange={(e) => setEditFormData({...editFormData, license_code: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Warranty Period</label><input type="text" value={editFormData.warranty_period} onChange={(e) => setEditFormData({...editFormData, warranty_period: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Purchase Date</label><input type="date" value={editFormData.purchase_date} onChange={(e) => setEditFormData({...editFormData, purchase_date: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Next Maintenance</label><input type="date" value={editFormData.next_maintenance_date} onChange={(e) => setEditFormData({...editFormData, next_maintenance_date: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 mt-4">💰 Sales Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Link to Customer</label>
                    <select value={editFormData.customer_id} onChange={(e) => setEditFormData({...editFormData, customer_id: e.target.value})} className="w-full border rounded px-3 py-2">
                      <option value="">Not sold yet</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm mb-1">Sale Date</label><input type="date" value={editFormData.sale_date} onChange={(e) => setEditFormData({...editFormData, sale_date: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                  <div><label className="block text-sm mb-1">Invoice Number</label><input type="text" value={editFormData.invoice_number} onChange={(e) => setEditFormData({...editFormData, invoice_number: e.target.value})} className="w-full border rounded px-3 py-2" placeholder="INV-2024-001" /></div>
                  <div><label className="block text-sm mb-1">Sale Amount</label><input type="number" step="0.01" value={editFormData.sale_amount} onChange={(e) => setEditFormData({...editFormData, sale_amount: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
                </div>
                <div><label className="block text-sm mb-1">Sale Notes</label><textarea value={editFormData.sale_notes} onChange={(e) => setEditFormData({...editFormData, sale_notes: e.target.value})} className="w-full border rounded px-3 py-2" rows="2" placeholder="Payment terms, delivery details, etc." /></div>
                
                <div><label className="block text-sm mb-1">Description</label><textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="w-full border rounded px-3 py-2" rows="3" /></div>
                <div><label className="block text-sm mb-1">Specifications</label><textarea value={editFormData.specifications} onChange={(e) => setEditFormData({...editFormData, specifications: e.target.value})} className="w-full border rounded px-3 py-2" rows="3" /></div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditMode(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">💾 Save Changes</button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No products found matching your search' : 'No products yet'}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b text-sm text-gray-600">
                💡 Click on any product row to view full details
              </div>
              <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-600 to-green-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Serial Number</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">License Code</th>
                  <th className="px-4 py-3 text-left">Warranty</th>
                  <th className="px-4 py-3 text-left">Warranty End</th>
                  <th className="px-4 py-3 text-left">Next Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => handleProductClick(p)}
                    className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-sm">{p.serial_number}</td>
                    <td className="px-4 py-3">{p.model || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm">{p.license_code || '-'}</td>
                    <td className="px-4 py-3">{p.warranty_period || '-'}</td>
                    <td className="px-4 py-3">
                      {p.warranty_finished_date ? (
                        <span className={new Date(p.warranty_finished_date) > new Date() ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {new Date(p.warranty_finished_date).toLocaleDateString()}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {p.next_maintenance_date ? new Date(p.next_maintenance_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
