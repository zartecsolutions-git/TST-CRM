import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../utils/api';

// Import product components
import ProductStats from '../components/products/ProductStats';
import ProductFilters from '../components/products/ProductFilters';
import ProductTable from '../components/products/ProductTable';

export default function ProductsEnhanced() {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSerialIndexes, setSelectedSerialIndexes] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sub_category: '',
    brand: '',
    division: '',
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
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialFormData, setSerialFormData] = useState({
    serial_number: '',
    purchase_date: '',
    supplier_warranty_period: ''
  });
  const [bulkAssignData, setBulkAssignData] = useState({
    customer_id: '',
    sale_date: '',
    customer_warranty_period: '12',
    next_maintenance_date: '',
    license_code: ''
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

  const openSerialModal = () => {
    setSerialFormData({
      serial_number: '',
      purchase_date: '',
      supplier_warranty_period: ''
    });
    setShowSerialModal(true);
  };

  const addSerialNumber = () => {
    if (!serialFormData.serial_number.trim()) {
      alert('Please enter serial number');
      return;
    }
    if (!serialFormData.purchase_date) {
      alert('Please enter purchase date');
      return;
    }
    if (!serialFormData.supplier_warranty_period) {
      alert('Please enter supplier warranty period');
      return;
    }

    // Calculate supplier warranty expiry date
    const purchaseDate = new Date(serialFormData.purchase_date);
    const warrantyMonths = parseInt(serialFormData.supplier_warranty_period) || 0;
    const warrantyExpiry = new Date(purchaseDate);
    warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);

    setFormData({
      ...formData,
      serial_numbers: [
        ...formData.serial_numbers,
        {
          serial_number: serialFormData.serial_number,
          status: 'in_stock',
          purchase_date: serialFormData.purchase_date,
          supplier_warranty_period: warrantyMonths,
          supplier_warranty_expiry: warrantyExpiry.toISOString(),
          customer_id: null,
          customer_name: null,
          sale_date: null,
          customer_warranty_period: null,
          customer_warranty_end_date: null,
          next_maintenance_date: null
        }
      ]
    });
    
    setShowSerialModal(false);
    setSerialFormData({
      serial_number: '',
      purchase_date: '',
      supplier_warranty_period: ''
    });
  };

  const removeSerialNumber = (index) => {
    const updated = [...formData.serial_numbers];
    updated.splice(index, 1);
    setFormData({ ...formData, serial_numbers: updated });
  };

  const openBulkAssignModal = (product) => {
    setSelectedProduct(product);
    setSelectedSerialIndexes([]);
    
    // Fetch next maintenance date from activities for this product
    fetchNextMaintenanceFromActivities(product.id);
    
    setShowBulkAssignModal(true);
  };

  const fetchNextMaintenanceFromActivities = async (productId) => {
    try {
      const response = await api.get('/activities');
      const productActivities = response.data.filter(act => act.product_id === productId);
      
      // Get the most recent activity with next_maintenance_date
      const latestActivity = productActivities
        .filter(act => act.next_maintenance_date)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      
      if (latestActivity && latestActivity.next_maintenance_date) {
        setBulkAssignData(prev => ({
          ...prev,
          next_maintenance_date: latestActivity.next_maintenance_date.split('T')[0]
        }));
      }
    } catch (error) {
      console.error('Error fetching maintenance date from activities:', error);
    }
  };

  const toggleSerialSelection = (index) => {
    setSelectedSerialIndexes(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const bulkAssignToCustomer = async () => {
    if (!bulkAssignData.customer_id || !bulkAssignData.sale_date) {
      alert('Please select customer and sale date');
      return;
    }

    if (selectedSerialIndexes.length === 0) {
      alert('Please select at least one serial number');
      return;
    }

    try {
      const customer = customers.find(c => c.id === bulkAssignData.customer_id);
      const saleDate = new Date(bulkAssignData.sale_date);
      const warrantyMonths = parseInt(bulkAssignData.customer_warranty_period) || 0;
      const warrantyEndDate = new Date(saleDate);
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyMonths);

      const updatedSerials = [...selectedProduct.serial_numbers];
      
      // Update all selected serial numbers
      selectedSerialIndexes.forEach(index => {
        updatedSerials[index] = {
          ...updatedSerials[index],
          status: 'sold',
          customer_id: bulkAssignData.customer_id,
          customer_name: customer?.name || '',
          sale_date: bulkAssignData.sale_date,
          customer_warranty_period: warrantyMonths,
          customer_warranty_end_date: warrantyEndDate.toISOString(),
          next_maintenance_date: bulkAssignData.next_maintenance_date || null,
          license_code: bulkAssignData.license_code || null
        };
      });

      await api.put(`/products/${selectedProduct.id}`, {
        serial_numbers: updatedSerials
      });

      alert(`Successfully assigned ${selectedSerialIndexes.length} serial number(s) to ${customer?.name}!`);
      setShowBulkAssignModal(false);
      setBulkAssignData({
        customer_id: '',
        sale_date: '',
        customer_warranty_period: '12',
        next_maintenance_date: '',
        license_code: ''
      });
      setSelectedSerialIndexes([]);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to assign serial numbers');
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
    <div className="w-screen max-w-full overflow-x-hidden overflow-y-auto p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Desktop only header */}
        {/* Desktop Header - Heading and Back Button on Same Line */}
        <div className="hidden lg:flex lg:items-center lg:justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            📦 Products Master
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Stats Cards */}
        <ProductStats 
        products={products}
        inStockCount={inStockCount}
        soldCount={soldCount}
        formatAmount={formatAmount}
      />

      {/* Search and Action Buttons */}
      <ProductFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredProducts={filteredProducts}
        onExport={handleExport}
        onImport={() => setShowImport(true)}
        onAddProduct={() => setShowForm(true)}
        userRole={user.role}
      />

      {/* Products Table */}
      <ProductTable
        products={filteredProducts}
        searchQuery={searchQuery}
        inStockCount={inStockCount}
        soldCount={soldCount}
        formatAmount={formatAmount}
        onViewDetails={handleViewDetails}
        onEdit={handleEditClick}
        userRole={user.role}
      />

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
                
                <button
                  type="button"
                  onClick={openSerialModal}
                  className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  + Add Serial Number
                </button>
                
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
                        {serial.purchase_date && (
                          <span className="ml-2 text-sm text-gray-600">
                            Purchased: {new Date(serial.purchase_date).toLocaleDateString()}
                          </span>
                        )}
                        {serial.supplier_warranty_expiry && (
                          <span className="ml-2 text-sm text-orange-600">
                            Warranty Expires: {new Date(serial.supplier_warranty_expiry).toLocaleDateString()}
                          </span>
                        )}
                        {serial.customer_name && (
                          <span className="ml-2 text-sm text-gray-600">
                            → {serial.customer_name}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSerialNumber(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
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
                          {serial.license_code && (
                            <p className="text-sm text-purple-600 mt-1">
                              License: <span className="font-mono">{serial.license_code}</span>
                            </p>
                          )}
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

            <div className="mt-6 flex justify-between">
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowDetails(false);
                    openBulkAssignModal(selectedProduct);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Assign Serials to Customer
                </button>
              )}
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

      {/* Add Serial Number Modal */}
      {showSerialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full m-4">
            <h2 className="text-2xl font-bold mb-6">Add Serial Number</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Serial Number *</label>
                <input
                  type="text"
                  value={serialFormData.serial_number}
                  onChange={(e) => setSerialFormData({...serialFormData, serial_number: e.target.value})}
                  placeholder="SN-12345"
                  className="w-full border rounded px-3 py-2"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date *</label>
                <input
                  type="date"
                  value={serialFormData.purchase_date}
                  onChange={(e) => setSerialFormData({...serialFormData, purchase_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Warranty Period (months) *</label>
                <input
                  type="number"
                  value={serialFormData.supplier_warranty_period}
                  onChange={(e) => setSerialFormData({...serialFormData, supplier_warranty_period: e.target.value})}
                  placeholder="e.g., 12"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              {serialFormData.purchase_date && serialFormData.supplier_warranty_period && (
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-sm text-orange-800">
                    <strong>Supplier Warranty Expires:</strong> {
                      new Date(new Date(serialFormData.purchase_date).setMonth(
                        new Date(serialFormData.purchase_date).getMonth() + parseInt(serialFormData.supplier_warranty_period)
                      )).toLocaleDateString()
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSerialModal(false)}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addSerialNumber}
                className="px-6 py-2 bg-gradient-to-r from-blue-700 to-green-700 text-white rounded hover:shadow-lg"
              >
                Add Serial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign to Customer Modal */}
      {showBulkAssignModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Assign Serial Numbers to Customer</h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Product: <span className="font-bold">{selectedProduct.name}</span>
              </p>
              
              {/* Serial Numbers Selection */}
              <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Select Serial Numbers (In Stock Only)</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedProduct.serial_numbers?.map((serial, index) => (
                    serial.status === 'in_stock' && (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                        <input
                          type="checkbox"
                          checked={selectedSerialIndexes.includes(index)}
                          onChange={() => toggleSerialSelection(index)}
                          className="w-5 h-5"
                        />
                        <span className="font-mono font-medium flex-1">{serial.serial_number}</span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">In Stock</span>
                      </div>
                    )
                  ))}
                  {selectedProduct.serial_numbers?.filter(s => s.status === 'in_stock').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No serial numbers available for assignment</p>
                  )}
                </div>
                {selectedSerialIndexes.length > 0 && (
                  <p className="mt-3 text-sm text-blue-600 font-medium">
                    {selectedSerialIndexes.length} serial number(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Customer Assignment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer *</label>
                <select
                  value={bulkAssignData.customer_id}
                  onChange={(e) => setBulkAssignData({...bulkAssignData, customer_id: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sales Date *</label>
                <input
                  type="date"
                  value={bulkAssignData.sale_date}
                  onChange={(e) => setBulkAssignData({...bulkAssignData, sale_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Customer Warranty Period (months) *</label>
                <input
                  type="number"
                  value={bulkAssignData.customer_warranty_period}
                  onChange={(e) => setBulkAssignData({...bulkAssignData, customer_warranty_period: e.target.value})}
                  placeholder="Default: 12 months"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              {bulkAssignData.sale_date && bulkAssignData.customer_warranty_period && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Customer Warranty End Date (Auto-calculated)</label>
                  <input
                    type="text"
                    value={new Date(new Date(bulkAssignData.sale_date).setMonth(
                      new Date(bulkAssignData.sale_date).getMonth() + parseInt(bulkAssignData.customer_warranty_period || 0)
                    )).toLocaleDateString()}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-blue-50 font-semibold text-blue-800"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Formula: Sales Date ({new Date(bulkAssignData.sale_date).toLocaleDateString()}) + Warranty Period ({bulkAssignData.customer_warranty_period} months)
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Next Maintenance Due Date
                  {bulkAssignData.next_maintenance_date && (
                    <span className="ml-2 text-xs text-green-600">(Fetched from Activities)</span>
                  )}
                </label>
                <input
                  type="date"
                  value={bulkAssignData.next_maintenance_date}
                  onChange={(e) => setBulkAssignData({...bulkAssignData, next_maintenance_date: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This date is automatically fetched from the latest activity record for this product
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">License Code</label>
                <input
                  type="text"
                  value={bulkAssignData.license_code}
                  onChange={(e) => setBulkAssignData({...bulkAssignData, license_code: e.target.value})}
                  placeholder="e.g., LIC-2024-XYZ"
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional license or activation code for this serial number
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkAssignModal(false);
                  setSelectedSerialIndexes([]);
                  setBulkAssignData({
                    customer_id: '',
                    sale_date: '',
                    customer_warranty_period: '12',
                    next_maintenance_date: ''
                  });
                }}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={bulkAssignToCustomer}
                disabled={selectedSerialIndexes.length === 0}
                className={`px-6 py-2 rounded ${
                  selectedSerialIndexes.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-700 to-green-700 text-white hover:shadow-lg'
                }`}
              >
                Assign {selectedSerialIndexes.length > 0 ? `${selectedSerialIndexes.length} Serial(s)` : 'Serial Numbers'}
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
    </div>
  );
}
ple-600 text-white rounded hover:bg-purple-700">Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
