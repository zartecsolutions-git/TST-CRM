import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import ExcelImport from '../components/ExcelImport';
import SalesPerformanceTable from '../components/sales-invoices/SalesPerformanceTable';
import InvoiceFilters from '../components/sales-invoices/InvoiceFilters';

export default function SalesInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);  // NEW: For sub-category dropdown
  const [brands, setBrands] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [models, setModels] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState({});
  const [showProductDropdown, setShowProductDropdown] = useState({});
  const [partNumberSearchTerm, setPartNumberSearchTerm] = useState({});  // NEW: For part number search
  const [showPartNumberDropdown, setShowPartNumberDropdown] = useState({});  // NEW: For part number dropdown
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [salesPerformance, setSalesPerformance] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    customer_name: '',
    sales_rep_id: user?.id || '',
    sales_rep_name: user?.name || '',
    items: [{ 
      product_name: '', 
      part_number: '',  // NEW
      category: '', 
      sub_category: '',  // NEW
      brand: '', 
      division: '', 
      model: '', 
      quantity: 1, 
      unit_price: 0, 
      total: 0 
    }],
    subtotal: 0,
    vat_percentage: 10,
    vat_amount: 0,
    total_amount: 0,
    payment_status: 'Pending',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    
    // Fetch sales performance for admin, sales, and support users
    if (user?.role === 'admin' || user?.role === 'sales' || user?.role === 'support') {
      fetchSalesPerformance();
    }
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.product-dropdown-container')) {
        setShowProductDropdown({});
      }
      if (!event.target.closest('.part-number-dropdown-container')) {
        setShowPartNumberDropdown({});
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes, usersRes, categoriesRes, subcategoriesRes, brandsRes, divisionsRes, modelsRes, productsRes] = await Promise.all([
        api.get('/sales/invoices'),
        api.get('/customers'),
        api.get('/users'),
        api.get('/master-data/categories'),
        api.get('/master-data/subcategories'),  // NEW
        api.get('/master-data/brands'),
        api.get('/master-data/divisions'),
        api.get('/master-data/models'),
        api.get('/products')
      ]);
      
      setInvoices(invoicesRes.data || []);
      setCustomers(customersRes.data || []);
      setSalesReps(usersRes.data || []);  // Show ALL users (admin, sales, support)
      setCategories(categoriesRes.data || []);
      setSubcategories(subcategoriesRes.data || []);  // NEW
      setBrands(brandsRes.data || []);
      setDivisions(divisionsRes.data || []);
      setModels(modelsRes.data || []);
      setProducts(productsRes.data || []);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesPerformance = async () => {
    try {
      // For sales and support users, filter by their own ID
      const url = (user?.role === 'sales' || user?.role === 'support')
        ? `/sales/reports/salesreps?sales_rep_id=${user.id}`
        : '/sales/reports/salesreps';
      
      const response = await api.get(url);
      setSalesPerformance(response.data || []);
    } catch (error) {
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
      updatedItems[index].sub_category = '';  // Clear sub-category when division changes
      updatedItems[index].brand = '';
      updatedItems[index].model = '';
    } else if (field === 'category') {
      updatedItems[index].sub_category = '';  // Clear sub-category when category changes
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
      part_number: product.part_number || '',  // NEW
      category: product.category || '',
      sub_category: product.sub_category || '',  // NEW
      brand: product.brand || '',
      division: product.division || '',
      model: product.model || '',
      unit_price: product.price || 0,
      total: (product.price || 0) * updatedItems[index].quantity
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
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.part_number && product.part_number.toLowerCase().includes(searchTerm.toLowerCase()))  // NEW: Search by part number
    );
  };

  // NEW: Handler for Part Number search
  const handlePartNumberSearch = (index, value) => {
    setPartNumberSearchTerm(prev => ({ ...prev, [index]: value }));
    handleItemChange(index, 'part_number', value);
    setShowPartNumberDropdown(prev => ({ ...prev, [index]: true }));
  };

  // NEW: Get filtered products by part number
  const getFilteredProductsByPartNumber = (index) => {
    const searchTerm = partNumberSearchTerm[index] || '';
    if (!searchTerm) return products.filter(p => p.part_number); // Only show products with part numbers
    return products.filter(product =>
      product.part_number && product.part_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // NEW: Handler for Part Number selection
  const handlePartNumberSelect = (index, product) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      part_number: product.part_number || '',
      product_name: product.name,
      category: product.category || '',
      sub_category: product.sub_category || '',
      brand: product.brand || '',
      division: product.division || '',
      model: product.model || '',
      unit_price: product.price || 0,
      total: (product.price || 0) * updatedItems[index].quantity
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setShowPartNumberDropdown(prev => ({ ...prev, [index]: false }));
    setPartNumberSearchTerm(prev => ({ ...prev, [index]: product.part_number }));
    setProductSearchTerm(prev => ({ ...prev, [index]: product.name }));  // Also update product name search term
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        product_name: '', 
        part_number: '',
        category: '', 
        sub_category: '',
        brand: '', 
        division: '', 
        model: '', 
        quantity: 1, 
        unit_price: 0, 
        total: 0 
      }]
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
      items: [{ 
        product_name: '', 
        part_number: '',  // NEW
        category: '', 
        sub_category: '',  // NEW
        brand: '', 
        division: '', 
        model: '', 
        quantity: 1, 
        unit_price: 0, 
        total: 0 
      }],
      subtotal: 0,
      vat_percentage: 10,
      vat_amount: 0,
      total_amount: 0,
      payment_status: 'Pending',
      notes: ''
    });
  };

  // Handle Excel Import
  const handleExcelImport = async (importedInvoices) => {
    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Create a local copy of customers array that we'll update during import
      const localCustomers = [...customers];


      for (let index = 0; index < importedInvoices.length; index++) {
        const invoice = importedInvoices[index];
        try {
          
          // Find or create customer (search in localCustomers which gets updated during import)
          let customer = localCustomers.find(c => c.name.toLowerCase() === invoice.customer_name.toLowerCase());
          
          if (!customer) {
            // Create new customer with unique generated email (timestamp + index for uniqueness)
            const timestamp = Date.now();
            const sanitizedName = invoice.customer_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const generatedEmail = `${sanitizedName}_${timestamp}_${index}@imported.example.com`;
            
            try {
              const customerRes = await api.post('/customers', {
                name: invoice.customer_name,
                email: generatedEmail,
                contact_person: invoice.customer_name,
                phone: '',
                address: ''
              });
              customer = customerRes.data;
              // Add newly created customer to local array so subsequent invoices can find it
              localCustomers.push(customer);
            } catch (custErr) {
              console.error('Customer creation failed:', custErr);
              console.error('Customer creation error response:', custErr.response?.data);
              const errorMsg = custErr.response?.data?.detail || 
                              JSON.stringify(custErr.response?.data) || 
                              custErr.message;
              errors.push(`Invoice ${invoice.invoice_number}: Customer creation failed - ${errorMsg}`);
              errorCount++;
              continue;
            }
          } else {
          }

          // Calculate totals
          const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
          const vatAmount = subtotal * 0.1;
          const totalAmount = subtotal + vatAmount;

          // Create invoice
          const invoiceData = {
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            customer_id: customer.id,
            customer_name: customer.name,
            sales_rep_id: user?.id || '',
            sales_rep_name: user?.name || '',
            items: invoice.items,
            subtotal: subtotal,
            vat_percentage: 10,
            vat_amount: vatAmount,
            total_amount: totalAmount,
            payment_status: 'Pending',
            notes: 'Imported from Excel'
          };

          
          await api.post('/sales/invoices', invoiceData);
          successCount++;
        } catch (err) {
          console.error('Error importing invoice:', invoice.invoice_number, err);
          console.error('Error details:', err.response?.data);
          errors.push(`Invoice ${invoice.invoice_number}: ${err.response?.data?.detail || err.message}`);
          errorCount++;
        }
      }

      
      if (errors.length > 0) {
      }

      const message = `Import complete!\nSuccessful: ${successCount}\nFailed: ${errorCount}${errors.length > 0 ? '\n\nFirst few errors:\n' + errors.slice(0, 5).join('\n') : ''}`;
      alert(message);
      
      setShowExcelImport(false);
      if (successCount > 0) {
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error during import: ' + error.message);
    } finally {
      setLoading(false);
    }
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

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    // Role-based filter: Sales and Support users see only their own invoices
    if (user?.role === 'sales' || user?.role === 'support') {
      if (invoice.sales_rep_id !== user.id) {
        return false;
      }
    }
    // Admin sees all invoices (no filter)
    
    // Search filter (invoice number, customer name)
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.sales_rep_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || invoice.payment_status === filterStatus;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter.start && invoice.invoice_date < dateFilter.start) {
      matchesDate = false;
    }
    if (dateFilter.end && invoice.invoice_date > dateFilter.end) {
      matchesDate = false;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    // Sort by invoice_number descending (newest/highest first)
    const numA = parseInt(a.invoice_number) || 0;
    const numB = parseInt(b.invoice_number) || 0;
    return numB - numA;
  });

  // Calculate overdue status for an invoice
  const getOverdueInfo = (invoice) => {
    const invoiceDate = new Date(invoice.invoice_date);
    const today = new Date();
    const daysDiff = Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));
    
    // Consider overdue if more than 30 days and not fully paid
    if (daysDiff > 30 && invoice.payment_status !== 'Paid') {
      return {
        isOverdue: true,
        overdueDays: daysDiff - 30  // Days past the 30-day period
      };
    }
    
    return {
      isOverdue: false,
      overdueDays: 0
    };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateFilter({ start: '', end: '' });
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
          <h1 className="text-2xl font-bold text-gray-900">
            💰 {user?.role === 'admin' ? 'Sales Invoices' : 'My Sales Invoices'}
          </h1>
        </div>
        {user?.role === 'admin' && (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowExcelImport(true)}
              className="bg-green-600 hover:bg-green-700"
              data-testid="import-excel-btn"
            >
              📥 Import from Excel
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setEditingInvoice(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="new-invoice-btn"
            >
              + New Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Sales Performance - Admin and Sales Users Only */}
      {(user?.role === 'admin' || user?.role === 'sales' || user?.role === 'support') && (
        <SalesPerformanceTable salesPerformance={salesPerformance} userRole={user?.role} />
      )}

      {/* Excel Import Modal */}
      {showExcelImport && (
        <ExcelImport
          onImport={handleExcelImport}
          onClose={() => setShowExcelImport(false)}
          data-testid="excel-import-modal"
        />
      )}

      {/* Invoice Form */}
      {showForm && (
        <Card className="mb-6" data-testid="invoice-form-card">
          <CardHeader>
            <CardTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="invoice-form">
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
                      <div className="grid grid-cols-1 md:grid-cols-8 gap-2">
                        {/* Part Number - SEARCHABLE FIELD */}
                        <div className="relative part-number-dropdown-container">
                          <input
                            type="text"
                            placeholder="Part Number"
                            value={partNumberSearchTerm[index] || item.part_number || ''}
                            onChange={(e) => handlePartNumberSearch(index, e.target.value)}
                            onFocus={() => setShowPartNumberDropdown(prev => ({ ...prev, [index]: true }))}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                          {showPartNumberDropdown[index] && getFilteredProductsByPartNumber(index).length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {getFilteredProductsByPartNumber(index).map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => handlePartNumberSelect(index, product)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100"
                                >
                                  <div className="font-medium">{product.part_number}</div>
                                  <div className="text-xs text-gray-500">
                                    {product.name}
                                    {product.category && ` • ${product.category}`}
                                    {product.brand && ` • ${product.brand}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Product Name with Search */}
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
                                  <div className="text-xs text-gray-500">
                                    {product.part_number && `Part #: ${product.part_number}`}
                                    {product.category && ` • ${product.category}`}
                                    {product.brand && ` • ${product.brand}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Division */}
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

                        {/* Category */}
                        <div>
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Category</option>
                            {categories
                              .filter(cat => !item.division || cat.parent_division === item.division)
                              .map(cat => (
                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                              ))}
                          </select>
                        </div>

                        {/* Sub-Category - NEW FIELD */}
                        <div>
                          <select
                            value={item.sub_category || ''}
                            onChange={(e) => handleItemChange(index, 'sub_category', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Sub-Category</option>
                            {subcategories
                              .filter(subcat => !item.category || subcat.parent_category === item.category)
                              .map(subcat => (
                                <option key={subcat.name} value={subcat.name}>{subcat.name}</option>
                              ))}
                          </select>
                        </div>

                        {/* Brand */}
                        <div>
                          <select
                            value={item.brand}
                            onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            disabled={!item.category}
                          >
                            <option value="">Brand</option>
                            {brands
                              .filter(brand => item.category && brand.parent_category === item.category)
                              .map(brand => (
                                <option key={brand.name} value={brand.name}>{brand.name}</option>
                              ))}
                          </select>
                        </div>

                        {/* Model */}
                        <div>
                          <select
                            value={item.model || ''}
                            onChange={(e) => handleItemChange(index, 'model', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            disabled={!item.brand}
                          >
                            <option value="">Model</option>
                            {models
                              .filter(model => item.brand && model.parent_brand === item.brand)
                              .map(model => (
                                <option key={model.name} value={model.name}>{model.name}</option>
                              ))}
                          </select>
                        </div>

                        {/* Quantity */}
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
          <CardTitle>
            {user?.role === 'admin' ? 'All Invoices' : 'My Invoices'} ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <InvoiceFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            onClearFilters={clearFilters}
          />

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {invoices.length === 0 ? 'No Invoices Yet' : 'No Matching Invoices'}
              </p>
              <p className="text-gray-500">
                {invoices.length === 0 
                  ? (user?.role === 'admin' ? 'Create your first invoice to get started.' : 'You haven\'t created any invoices yet.')
                  : 'Try adjusting your search or filters.'
                }
              </p>
              {invoices.length > 0 && (
                <Button onClick={clearFilters} className="mt-4" variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Rep</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <React.Fragment key={invoice.invoice_number}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedInvoice(expandedInvoice === invoice.invoice_number ? null : invoice.invoice_number)}>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="inline-block transform transition-transform" style={{ transform: expandedInvoice === invoice.invoice_number ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            ▶
                          </span>
                        </td>
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
                        <td className="px-4 py-3">
                          {(() => {
                            const overdueInfo = getOverdueInfo(invoice);
                            if (overdueInfo.isOverdue) {
                              return (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold">
                                  ⚠️ {overdueInfo.overdueDays} days overdue
                                </span>
                              );
                            }
                            return <span className="text-xs text-gray-400">-</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            {user?.role === 'admin' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(invoice)}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(invoice.invoice_number)}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                            {(user?.role === 'sales' || user?.role === 'support') && (
                              <span className="text-xs text-gray-500 italic px-2 py-1">View Only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expandable Invoice Details */}
                      {expandedInvoice === invoice.invoice_number && (
                        <tr>
                          <td colSpan="9" className="px-4 py-4 bg-gray-50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-2">Invoice Details</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Customer:</span>
                                      <span className="ml-2 font-medium">{invoice.customer_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Sales Rep:</span>
                                      <span className="ml-2 font-medium">{invoice.sales_rep_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Date:</span>
                                      <span className="ml-2 font-medium">{invoice.invoice_date}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Payment Status:</span>
                                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                        invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                                        invoice.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {invoice.payment_status}
                                      </span>
                                    </div>
                                  </div>
                                  {invoice.notes && (
                                    <div className="mt-2 text-sm">
                                      <span className="text-gray-600">Notes:</span>
                                      <p className="mt-1 text-gray-700">{invoice.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Invoice Items Table */}
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Items</h5>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border border-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Product</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Division</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Category</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Brand</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Model</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Qty</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Unit Price</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {invoice.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="px-3 py-2 text-sm text-gray-900">{item.product_name}</td>
                                          <td className="px-3 py-2 text-sm text-gray-600">{item.division || '-'}</td>
                                          <td className="px-3 py-2 text-sm text-gray-600">{item.category || '-'}</td>
                                          <td className="px-3 py-2 text-sm text-gray-600">{item.brand || '-'}</td>
                                          <td className="px-3 py-2 text-sm text-gray-600">{item.model || '-'}</td>
                                          <td className="px-3 py-2 text-sm text-right text-gray-900">{item.quantity}</td>
                                          <td className="px-3 py-2 text-sm text-right text-gray-900">BHD {item.unit_price.toFixed(2)}</td>
                                          <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">BHD {item.total.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td colSpan="7" className="px-3 py-2 text-sm text-right font-medium text-gray-700">Subtotal:</td>
                                        <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">BHD {invoice.subtotal.toFixed(2)}</td>
                                      </tr>
                                      <tr>
                                        <td colSpan="7" className="px-3 py-2 text-sm text-right font-medium text-gray-700">VAT ({invoice.vat_percentage}%):</td>
                                        <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">BHD {invoice.vat_amount.toFixed(2)}</td>
                                      </tr>
                                      <tr className="border-t-2 border-gray-300">
                                        <td colSpan="7" className="px-3 py-2 text-sm text-right font-bold text-gray-900">Total:</td>
                                        <td className="px-3 py-2 text-sm text-right font-bold text-blue-600">BHD {invoice.total_amount.toFixed(2)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
