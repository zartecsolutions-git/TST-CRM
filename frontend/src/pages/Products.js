import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [warrantyAlerts, setWarrantyAlerts] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [formData, setFormData] = useState({
    name: '', serial_number: '', description: '', price: '', model: '', category: '', 
    specifications: '', warranty_period: '', purchase_date: '', next_maintenance_date: '', license_code: ''
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { 
    fetchProducts();
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
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Products</h1>
          {user.role === 'admin' && (
            <div className="flex gap-2">
              <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">📥 Export CSV</button>
              <button onClick={() => setShowImport(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">📤 Import CSV</button>
              <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-lg">+ Add Product</button>
            </div>
          )}
        </div>

        {/* Alerts Section */}
        {(warrantyAlerts.length > 0 || maintenanceAlerts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {warrantyAlerts.length > 0 && (
              <div className="bg-orange-100 border-l-4 border-orange-500 p-4 rounded">
                <h3 className="font-bold text-orange-800 mb-2">⚠️ Warranty Expiring Soon ({warrantyAlerts.length})</h3>
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
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded">Create</button>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <h3 className="font-semibold text-orange-800 mb-3 text-lg">⚠️ Warranty Information</h3>
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

              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowDetails(false)} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:shadow-lg">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No products yet</div>
          ) : (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b text-sm text-gray-600">
                💡 Click on any product row to view full details
              </div>
              <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
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
                {products.map((p) => (
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
