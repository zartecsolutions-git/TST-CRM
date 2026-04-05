import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../utils/api';

export default function ProductsEnhanced() {
  const { formatAmount } = useCurrency();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'others',
    sub_category: '',
    description: '',
    price: '',
    model: '',
    specifications: '',
    supplier_warranty_period: '',
    purchase_date: '',
    installation_date: '',
    license_code: '',
    serial_numbers: []
  });
  
  const [newSerial, setNewSerial] = useState('');
  const [assignData, setAssignData] = useState({
    customer_id: '',
    sale_date: '',
    customer_warranty_period: '',
    next_maintenance_date: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers')
      ]);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const addSerialNumber = () => {
    if (newSerial.trim()) {
      setFormData({
        ...formData,
        serial_numbers: [
          ...formData.serial_numbers,
          {
            serial_number: newSerial,
            status: 'in_stock',
            customer_id: null,
            customer_name: null,
            sale_date: null,
            customer_warranty_period: null,
            customer_warranty_end_date: null,
            next_maintenance_date: null
          }
        ]
      });
      setNewSerial('');
    }
  };

  const removeSerialNumber = (index) => {
    const updated = [...formData.serial_numbers];
    updated.splice(index, 1);
    setFormData({ ...formData, serial_numbers: updated });
  };

  const openAssignModal = (product, serialIndex) => {
    setSelectedProduct(product);
    setSelectedSerial(serialIndex);
    setShowAssignModal(true);
  };

  const assignToCustomer = async () => {
    if (!assignData.customer_id || !assignData.sale_date) {
      alert('Please select customer and sale date');
      return;
    }

    try {
      const customer = customers.find(c => c.id === assignData.customer_id);
      const saleDate = new Date(assignData.sale_date);
      const warrantyMonths = parseInt(assignData.customer_warranty_period) || 0;
      const warrantyEndDate = new Date(saleDate);
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyMonths);

      const updatedSerials = [...selectedProduct.serial_numbers];
      updatedSerials[selectedSerial] = {
        ...updatedSerials[selectedSerial],
        status: 'sold',
        customer_id: assignData.customer_id,
        customer_name: customer?.name || '',
        sale_date: assignData.sale_date,
        customer_warranty_period: warrantyMonths,
        customer_warranty_end_date: warrantyEndDate.toISOString(),
        next_maintenance_date: assignData.next_maintenance_date || null
      };

      await api.put(`/products/${selectedProduct.id}`, {
        serial_numbers: updatedSerials
      });

      alert('Serial number assigned to customer successfully!');
      setShowAssignModal(false);
      setAssignData({
        customer_id: '',
        sale_date: '',
        customer_warranty_period: '',
        next_maintenance_date: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to assign serial number');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up formData - convert empty strings to null for optional fields
      const cleanedData = {
        name: formData.name,
        category: formData.category || 'others',
        sub_category: formData.sub_category || null,
        description: formData.description || null,
        model: formData.model || null,
        specifications: formData.specifications || null,
        supplier_warranty_period: formData.supplier_warranty_period || null,
        license_code: formData.license_code || null,
        price: formData.price ? parseFloat(formData.price) : null,
        purchase_date: formData.purchase_date || null,
        installation_date: formData.installation_date || null,
        serial_numbers: formData.serial_numbers,
      };
      
      if (isEditMode && selectedProduct) {
        // Update existing product
        await api.put(`/products/${selectedProduct.id}`, cleanedData);
        alert('Product updated successfully!');
      } else {
        // Create new product
        await api.post('/products', cleanedData);
        alert('Product created successfully!');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      alert(isEditMode ? `Failed to update product: ${errorMsg}` : `Failed to create product: ${errorMsg}`);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditMode(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      category: 'others',
      sub_category: '',
      description: '',
      price: '',
      model: '',
      specifications: '',
      supplier_warranty_period: '',
      purchase_date: '',
      installation_date: '',
      license_code: '',
      serial_numbers: []
    });
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setIsEditMode(true);
    setFormData({
      name: product.name || '',
      category: product.category || 'others',
      sub_category: product.sub_category || '',
      description: product.description || '',
      price: product.price || '',
      model: product.model || '',
      specifications: product.specifications || '',
      supplier_warranty_period: product.supplier_warranty_period || '',
      purchase_date: product.purchase_date ? product.purchase_date.split('T')[0] : '',
      installation_date: product.installation_date ? product.installation_date.split('T')[0] : '',
      license_code: product.license_code || '',
      serial_numbers: product.serial_numbers || []
    });
    setShowForm(true);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowDetails(true);
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/products/export/csv', {
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
      console.error('Export error:', error);
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
      const response = await api.post('/products/import/csv', { file_content: text });
      alert(`Import complete! Imported: ${response.data.imported}, Errors: ${response.data.errors.length}`);
      if (response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
      }
      setShowImport(false);
      setCsvFile(null);
      fetchData();
    } catch (error) {
      alert('Error importing products: ' + (error.response?.data?.detail || error.message));
    }
  };

  const inStockCount = (product) => {
    return product.serial_numbers?.filter(s => s.status === 'in_stock').length || 0;
  };

  const soldCount = (product) => {
    return product.serial_numbers?.filter(s => s.status === 'sold').length || 0;
  };

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.model?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.sub_category?.toLowerCase().includes(query) ||
      product.license_code?.toLowerCase().includes(query) ||
      product.serial_numbers?.some(s => s.serial_number?.toLowerCase().includes(query))
    );
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 p-8">
      <PageHeader title="Products Master" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-blue-600">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Stock</h3>
          <p className="text-3xl font-bold text-green-600">
            {products.reduce((sum, p) => sum + inStockCount(p), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Sold</h3>
          <p className="text-3xl font-bold text-amber-600">
            {products.reduce((sum, p) => sum + soldCount(p), 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Stock Value</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatAmount(products.reduce((sum, p) => sum + ((p.price || 0) * inStockCount(p)), 0))}
          </p>
        </div>
      </div>

      {/* Search and Action Buttons */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="🔍 Search products by name, model, category, license code, or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            {searchQuery && (
              <p className="text-sm text-gray-600">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {user.role === 'admin' && (
              <>
                <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  📥 Export CSV
                </button>
                <button onClick={() => setShowImport(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                  📤 Import CSV
                </button>
              </>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-700 to-green-700 text-white px-6 py-2 rounded-lg hover:shadow-lg"
            >
              + Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No products found matching your search' : 'No products yet'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-700 to-green-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Product Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Sub-Category</th>
                <th className="px-4 py-3 text-center">In Stock</th>
                <th className="px-4 py-3 text-center">Sold</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {product.category || 'others'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{product.sub_category || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-green-600">{inStockCount(product)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-gray-600">{soldCount(product)}</span>
                  </td>
                  <td className="px-4 py-3">{formatAmount(product.price || 0)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetails(product)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      View
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="industrial">Industrial</option>
                      <option value="retails">Retails</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Sub-Category</label>
                    <input
                      type="text"
                      value={formData.sub_category}
                      onChange={(e) => setFormData({...formData, sub_category: e.target.value})}
                      placeholder="e.g., Office Equipment, Heavy Machinery"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">License Code</label>
                    <input
                      type="text"
                      value={formData.license_code}
                      onChange={(e) => setFormData({...formData, license_code: e.target.value})}
                      placeholder="e.g., LIC-2024-XYZ"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Specifications</label>
                    <textarea
                      value={formData.specifications}
                      onChange={(e) => setFormData({...formData, specifications: e.target.value})}
                      placeholder="e.g., Power: 5kW, Pressure: 10 bar, Weight: 200kg"
                      className="w-full border rounded px-3 py-2"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Warranty & Dates */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Warranty & Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier Warranty Period</label>
                    <input
                      type="text"
                      value={formData.supplier_warranty_period}
                      onChange={(e) => setFormData({...formData, supplier_warranty_period: e.target.value})}
                      placeholder="e.g., 12 months, 2 years"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Installation Date</label>
                    <input
                      type="date"
                      value={formData.installation_date}
                      onChange={(e) => setFormData({...formData, installation_date: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Serial Numbers Management */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">
                  Serial Numbers & Stock ({formData.serial_numbers.length} units)
                </h3>
                
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    placeholder="Enter serial number"
                    className="flex-1 border rounded px-3 py-2"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSerialNumber())}
                  />
                  <button
                    type="button"
                    onClick={addSerialNumber}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Add Serial #
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto border rounded p-2">
                  {formData.serial_numbers.map((serial, index) => (
                    <div key={index} className="flex justify-between items-center p-2 mb-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <span className="font-medium">{serial.serial_number}</span>
                        <span className={`ml-3 px-2 py-1 text-xs rounded ${
                          serial.status === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {serial.status === 'in_stock' ? 'In Stock' : 'Sold'}
                        </span>
                        {serial.customer_name && (
                          <span className="ml-2 text-sm text-gray-600">
                            → {serial.customer_name}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {isEditMode && serial.status === 'in_stock' && (
                          <button
                            type="button"
                            onClick={() => {
                              const product = { ...selectedProduct, serial_numbers: formData.serial_numbers };
                              openAssignModal(product, index);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Assign
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSerialNumber(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.serial_numbers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No serial numbers added yet</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded hover:shadow-lg"
                >
                  {isEditMode ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedProduct.category} {selectedProduct.sub_category && `- ${selectedProduct.sub_category}`}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3 text-lg">📋 Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Model:</span> {selectedProduct.model || '-'}</div>
                  <div><span className="font-medium">Price:</span> {formatAmount(selectedProduct.price || 0)}</div>
                  <div><span className="font-medium">License Code:</span> <span className="font-mono bg-white px-2 py-1 rounded">{selectedProduct.license_code || '-'}</span></div>
                </div>
              </div>

              {/* Warranty Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3 text-lg">⚠️ Warranty</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Supplier Warranty:</span> {selectedProduct.supplier_warranty_period || '-'}</div>
                  <div><span className="font-medium">Purchase Date:</span> {selectedProduct.purchase_date ? new Date(selectedProduct.purchase_date).toLocaleDateString() : '-'}</div>
                  <div><span className="font-medium">Installation Date:</span> {selectedProduct.installation_date ? new Date(selectedProduct.installation_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="bg-purple-50 p-4 rounded-lg col-span-2">
                <h3 className="font-semibold text-purple-800 mb-3 text-lg">📦 Serial Numbers & Stock</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-green-100 p-2 rounded text-center">
                    <p className="text-sm text-gray-600">In Stock</p>
                    <p className="text-2xl font-bold text-green-700">{inStockCount(selectedProduct)}</p>
                  </div>
                  <div className="bg-gray-100 p-2 rounded text-center">
                    <p className="text-sm text-gray-600">Sold</p>
                    <p className="text-2xl font-bold text-gray-700">{soldCount(selectedProduct)}</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedProduct.serial_numbers?.map((serial, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono font-medium">{serial.serial_number}</p>
                          {serial.customer_name && (
                            <div className="text-sm text-gray-600 mt-1">
                              <p>Customer: {serial.customer_name}</p>
                              {serial.sale_date && <p>Sale Date: {new Date(serial.sale_date).toLocaleDateString()}</p>}
                              {serial.customer_warranty_period && (
                                <p>Warranty: {serial.customer_warranty_period} months (ends {new Date(serial.customer_warranty_end_date).toLocaleDateString()})</p>
                              )}
                              {serial.next_maintenance_date && (
                                <p>Next Maintenance: {new Date(serial.next_maintenance_date).toLocaleDateString()}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          serial.status === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {serial.status === 'in_stock' ? 'In Stock' : 'Sold'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!selectedProduct.serial_numbers || selectedProduct.serial_numbers.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No serial numbers</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedProduct.description && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">📝 Description</h3>
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
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded-lg hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Customer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full m-4">
            <h2 className="text-2xl font-bold mb-6">Assign to Customer</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Serial Number: <span className="font-bold">{selectedProduct?.serial_numbers[selectedSerial]?.serial_number}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer *</label>
                <select
                  value={assignData.customer_id}
                  onChange={(e) => setAssignData({...assignData, customer_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sale Date *</label>
                <input
                  type="date"
                  value={assignData.sale_date}
                  onChange={(e) => setAssignData({...assignData, sale_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Customer Warranty Period (months)</label>
                <input
                  type="number"
                  value={assignData.customer_warranty_period}
                  onChange={(e) => setAssignData({...assignData, customer_warranty_period: e.target.value})}
                  placeholder="e.g., 12"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              {assignData.sale_date && assignData.customer_warranty_period && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Warranty End Date:</strong> {
                      new Date(new Date(assignData.sale_date).setMonth(
                        new Date(assignData.sale_date).getMonth() + parseInt(assignData.customer_warranty_period)
                      )).toLocaleDateString()
                    }
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Next Maintenance Date</label>
                <input
                  type="date"
                  value={assignData.next_maintenance_date}
                  onChange={(e) => setAssignData({...assignData, next_maintenance_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignData({
                    customer_id: '',
                    sale_date: '',
                    customer_warranty_period: '',
                    next_maintenance_date: ''
                  });
                }}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={assignToCustomer}
                className="px-6 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded hover:shadow-lg"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
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
                  CSV should include: name, model, category, sub_category, license_code, price, supplier_warranty_period, purchase_date, installation_date, specifications
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
    </div>
  );
}
