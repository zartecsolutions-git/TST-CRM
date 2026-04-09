import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function SalesInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [models, setModels] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState({});
  const [showProductDropdown, setShowProductDropdown] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    customer_name: '',
    sales_rep_id: user?.id || '',
    sales_rep_name: user?.name || '',
    items: [{ product_name: '', category: '', brand: '', division: '', model: '', quantity: 1, unit_price: 0, total: 0 }],
    subtotal: 0,
    vat_percentage: 10,
    vat_amount: 0,
    total_amount: 0,
    payment_status: 'Pending',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.product-dropdown-container')) {
        setShowProductDropdown({});
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes, usersRes, categoriesRes, brandsRes, divisionsRes, productsRes] = await Promise.all([
        api.get('/sales/invoices'),
        api.get('/customers'),
        api.get('/users'),
        api.get('/master-data/categories'),
        api.get('/master-data/brands'),
        api.get('/master-data/divisions'),
        api.get('/products')
      ]);
      
      setInvoices(invoicesRes.data || []);
      setCustomers(customersRes.data || []);
      setSalesReps(usersRes.data.filter(u => u.role === 'sales' || u.role === 'admin') || []);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);
      setDivisions(divisionsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const vat_amount = subtotal * (formData.vat_percentage / 100);
    const total_amount = subtotal + vat_amount;
    
    setFormData(prev => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      vat_amount: parseFloat(vat_amount.toFixed(2)),
      total_amount: parseFloat(total_amount.toFixed(2))
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Cascading logic: clear dependent fields when parent changes
    if (field === 'division') {
      updatedItems[index].category = '';
      updatedItems[index].brand = '';
      updatedItems[index].model = '';
    } else if (field === 'category') {
      updatedItems[index].brand = '';
      updatedItems[index].model = '';
    } else if (field === 'brand') {
      updatedItems[index].model = '';
    }
    
    // Calculate line total
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? parseFloat(value) || 0 : updatedItems[index].quantity;
      const price = field === 'unit_price' ? parseFloat(value) || 0 : updatedItems[index].unit_price;
      updatedItems[index].total = parseFloat((qty * price).toFixed(2));
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleProductSelect = (index, product) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      product_name: product.name,
      category: product.category || '',
      brand: product.brand || '',
      division: product.division || '',
      model: product.model || ''
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setShowProductDropdown(prev => ({ ...prev, [index]: false }));
    setProductSearchTerm(prev => ({ ...prev, [index]: product.name }));
  };

  const handleProductSearch = (index, value) => {
    setProductSearchTerm(prev => ({ ...prev, [index]: value }));
    handleItemChange(index, 'product_name', value);
    setShowProductDropdown(prev => ({ ...prev, [index]: true }));
  };

  const getFilteredProducts = (index) => {
    const searchTerm = productSearchTerm[index] || '';
    if (!searchTerm) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: '', category: '', brand: '', division: '', model: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.name || ''
    }));
  };

  const handleSalesRepChange = (salesRepId) => {
    const salesRep = salesReps.find(s => s.id === salesRepId);
    setFormData(prev => ({
      ...prev,
      sales_rep_id: salesRepId,
      sales_rep_name: salesRep?.name || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingInvoice) {
        await api.put(`/sales/invoices/${editingInvoice.invoice_number}`, formData);
      } else {
        await api.post('/sales/invoices', formData);
      }
      
      setShowForm(false);
      setEditingInvoice(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert(error.response?.data?.detail || 'Failed to save invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      customer_id: '',
      customer_name: '',
      sales_rep_id: user?.id || '',
      sales_rep_name: user?.name || '',
      items: [{ product_name: '', category: '', brand: '', division: '', model: '', quantity: 1, unit_price: 0, total: 0 }],
      subtotal: 0,
      vat_percentage: 10,
      vat_amount: 0,
      total_amount: 0,
      payment_status: 'Pending',
      notes: ''
    });
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData(invoice);
    setShowForm(true);
  };

  const handleDelete = async (invoice_number) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await api.delete(`/sales/invoices/${invoice_number}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">💰 Sales Invoices</h1>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingInvoice(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          + New Invoice
        </Button>
      </div>

      {/* Invoice Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                    placeholder="INV-2026-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              {/* Customer & Sales Rep */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Representative *
                  </label>
                  <select
                    value={formData.sales_rep_id}
                    onChange={(e) => handleSalesRepChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  >
                    <option value="">Select Sales Rep</option>
                    {salesReps.map(rep => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Invoice Items *
                  </label>
                  <Button type="button" onClick={addItem} size="sm" className="bg-green-600 hover:bg-green-700">
                    + Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded p-3 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                        <div className="md:col-span-2 relative product-dropdown-container">
                          <input
                            type="text"
                            placeholder="Search Product *"
                            value={productSearchTerm[index] || item.product_name}
                            onChange={(e) => handleProductSearch(index, e.target.value)}
                            onFocus={() => setShowProductDropdown(prev => ({ ...prev, [index]: true }))}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            required
                          />
                          {showProductDropdown[index] && getFilteredProducts(index).length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {getFilteredProducts(index).map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => handleProductSelect(index, product)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100"
                                >
                                  <div className="font-medium">{product.name}</div>
                                  {product.category && (
                                    <div className="text-xs text-gray-500">
                                      {product.category} {product.brand && `• ${product.brand}`}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <select
                            value={item.division}
                            onChange={(e) => handleItemChange(index, 'division', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Division</option>
                            {divisions.map(div => (
                              <option key={div.name} value={div.name}>{div.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            disabled={!item.division}
                          >
                            <option value="">Category</option>
                            {categories
                              .filter(cat => !item.division || cat.parent_division === item.division)
                              .map(cat => (
                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={item.brand}
                            onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            disabled={!item.category}
                          >
                            <option value="">Brand</option>
                            {brands
                              .filter(brand => !item.category || brand.parent_category === item.category)
                              .map(brand => (
                                <option key={brand.name} value={brand.name}>{brand.name}</option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={item.model}
                            onChange={(e) => handleItemChange(index, 'model', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            disabled={!item.brand}
                          >
                            <option value="">Model</option>
                            {models
                              .filter(model => !item.brand || model.parent_brand === item.brand)
                              .map(model => (
                                <option key={model.name} value={model.name}>{model.name}</option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                        <div>
                          <input
                            type="number"
                            placeholder="Unit Price"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={item.total.toFixed(2)}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-100"
                            disabled
                            placeholder="Total"
                          />
                        </div>
                        <div className="md:col-span-2">
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeItem(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Remove Item
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl ml-auto">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal:</span>
                    <span className="text-lg">BHD {formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">VAT (10%):</span>
                    <span className="text-lg">BHD {formData.vat_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                    <span className="font-bold">Total:</span>
                    <span className="text-xl font-bold text-blue-600">BHD {formData.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingInvoice(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No Invoices Yet</p>
              <p className="text-gray-500">Create your first invoice to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Rep</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.invoice_number} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{invoice.invoice_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{invoice.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{invoice.sales_rep_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">BHD {invoice.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                          invoice.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(invoice)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(invoice.invoice_number)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          )}
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
