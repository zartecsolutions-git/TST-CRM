import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });

  // Report data states
  const [monthlyData, setMonthlyData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [salesRepData, setSalesRepData] = useState([]);
  const [analysisData, setAnalysisData] = useState({ by_category: [], by_brand: [], by_division: [] });
  const [customerProductData, setCustomerProductData] = useState([]);  // NEW: Customer-Product Purchase Report
  const [invoices, setInvoices] = useState([]);  // NEW: Store all invoices for filtering
  const [products, setProducts] = useState([]);  // NEW: Store products for dropdowns
  const [customerProductFilters, setCustomerProductFilters] = useState({
    start_date: '',
    end_date: '',
    customer_id: '',
    product_name: '',
    part_number: ''
  });
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [partNumberSearchTerm, setPartNumberSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showPartNumberDropdown, setShowPartNumberDropdown] = useState(false);

  // Search states for each tab
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchSalesRep, setSearchSalesRep] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const [searchDivision, setSearchDivision] = useState('');
  const [searchCustomerProduct, setSearchCustomerProduct] = useState('');  // NEW: Search for customer-product report

  // Remove redirect for sales users - they can now access reports
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'sales') {
      // Only support users are redirected
      window.location.href = '/dashboard';
    }
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.product-search-dropdown')) {
        setShowProductDropdown(false);
      }
      if (!event.target.closest('.part-number-search-dropdown')) {
        setShowPartNumberDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'sales') {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const year = new Date().getFullYear();
      
      // Add sales_rep_id filter for sales users
      const salesRepFilter = user?.role === 'sales' ? { sales_rep_id: user.id } : {};
      
      const [monthly, customers, productsReport, salesreps, analysis, invoicesData, productsList] = await Promise.all([
        api.get(`/sales/reports/monthly?year=${year}`, { params: salesRepFilter }),
        api.get('/sales/reports/customers', { params: { ...dateRange, ...salesRepFilter } }),
        api.get('/sales/reports/products', { params: { ...dateRange, ...salesRepFilter } }),
        api.get('/sales/reports/salesreps', { params: { ...dateRange, ...salesRepFilter } }),
        api.get('/sales/reports/analysis', { params: { ...dateRange, ...salesRepFilter } }),
        api.get('/sales/invoices', { params: { ...dateRange, ...salesRepFilter } }),
        api.get('/products')  // NEW: Fetch products master list for dropdowns
      ]);

      setMonthlyData(monthly.data || []);
      setCustomerData(customers.data || []);
      setProductData(productsReport.data || []);
      setSalesRepData(salesreps.data || []);
      setAnalysisData(analysis.data || { by_category: [], by_brand: [], by_division: [] });
      
      // NEW: Store invoices and products for filtering
      setInvoices(invoicesData.data || []);
      setProducts(productsList.data || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Apply customer-product filters
  const applyCustomerProductFilter = () => {
    const allTransactions = [];
    
    invoices.forEach(invoice => {
      const invoiceDate = invoice.invoice_date;
      
      // Filter by date range
      if (customerProductFilters.start_date && invoiceDate < customerProductFilters.start_date) return;
      if (customerProductFilters.end_date && invoiceDate > customerProductFilters.end_date) return;
      
      // Filter by customer
      if (customerProductFilters.customer_id && invoice.customer_id !== customerProductFilters.customer_id) return;
      
      // Process items
      (invoice.items || []).forEach(item => {
        let matches = true;
        
        // Filter by product name
        if (customerProductFilters.product_name) {
          matches = matches && item.product_name?.toLowerCase().includes(customerProductFilters.product_name.toLowerCase());
        }
        
        // Filter by part number
        if (customerProductFilters.part_number) {
          matches = matches && item.part_number?.toLowerCase().includes(customerProductFilters.part_number.toLowerCase());
        }
        
        if (matches) {
          allTransactions.push({
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            customer_id: invoice.customer_id,
            customer_name: invoice.customer_name,
            product_name: item.product_name,
            part_number: item.part_number,
            category: item.category,
            brand: item.brand,
            division: item.division,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total
          });
        }
      });
    });
    
    setFilteredTransactions(allTransactions);
  };

  // NEW: Product search handlers
  const handleProductSearch = (value) => {
    setProductSearchTerm(value);
    setShowProductDropdown(true);
  };

  const handleProductSelect = (product) => {
    setCustomerProductFilters(prev => ({ ...prev, product_name: product.name }));
    setProductSearchTerm(product.name);
    setShowProductDropdown(false);
  };

  const getFilteredProducts = () => {
    if (!productSearchTerm) return products;
    return products.filter(product =>
      product.name?.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  };

  // NEW: Part number search handlers
  const handlePartNumberSearch = (value) => {
    setPartNumberSearchTerm(value);
    setShowPartNumberDropdown(true);
  };

  const handlePartNumberSelect = (product) => {
    setCustomerProductFilters(prev => ({ ...prev, part_number: product.part_number }));
    setPartNumberSearchTerm(product.part_number);
    setShowPartNumberDropdown(false);
  };

  const getFilteredProductsByPartNumber = () => {
    if (!partNumberSearchTerm) return products.filter(p => p.part_number);
    return products.filter(product =>
      product.part_number?.toLowerCase().includes(partNumberSearchTerm.toLowerCase())
    );
  };

  const applyDateFilter = () => {
    fetchReports();
  };

  // Filter functions for each report
  const filteredCustomerData = customerData.filter(customer =>
    customer.customer_name?.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  const filteredProductData = productData.filter(product =>
    product.product_name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.part_number?.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredSalesRepData = salesRepData.filter(rep =>
    rep.sales_rep_name?.toLowerCase().includes(searchSalesRep.toLowerCase())
  );

  const filteredCategoryData = (analysisData.by_category || []).filter(cat =>
    cat.category?.toLowerCase().includes(searchCategory.toLowerCase()) ||
    cat.name?.toLowerCase().includes(searchCategory.toLowerCase())
  );

  const filteredBrandData = (analysisData.by_brand || []).filter(brand =>
    brand.brand?.toLowerCase().includes(searchBrand.toLowerCase()) ||
    brand.name?.toLowerCase().includes(searchBrand.toLowerCase())
  );

  const filteredDivisionData = (analysisData.by_division || []).filter(div =>
    div.division?.toLowerCase().includes(searchDivision.toLowerCase()) ||
    div.name?.toLowerCase().includes(searchDivision.toLowerCase())
  );

  const exportToExcel = (data, filename) => {
    // Simple CSV export
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    window.print();
  };

  // Chart configurations
  const monthlyChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Sales Value',
        data: monthlyData.map(d => d.sales_value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      },
      {
        label: 'VAT Amount',
        data: monthlyData.map(d => d.vat_amount),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3
      }
    ]
  };

  const customerChartData = {
    labels: customerData.slice(0, 10).map(d => d.customer_name),
    datasets: [{
      label: 'Total Sales',
      data: customerData.slice(0, 10).map(d => d.total_sales),
      backgroundColor: 'rgba(59, 130, 246, 0.6)'
    }]
  };

  const salesRepChartData = {
    labels: salesRepData.map(d => d.sales_rep_name),
    datasets: [{
      label: 'Total Sales',
      data: salesRepData.map(d => d.total_sales),
      backgroundColor: 'rgba(16, 185, 129, 0.6)'
    }]
  };

  const categoryPieData = {
    labels: analysisData.by_category.map(d => d.name),
    datasets: [{
      data: analysisData.by_category.map(d => d.total_sales),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ]
    }]
  };

  const brandPieData = {
    labels: analysisData.by_brand.map(d => d.name),
    datasets: [{
      data: analysisData.by_brand.map(d => d.total_sales),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ]
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
          📊 {user?.role === 'sales' ? 'My Sales Reports' : 'Sales Reports'}
        </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportToPDF()} variant="outline" className="text-red-600 border-red-600">
            📄 Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                className="p-2 border border-gray-300 rounded"
              />
            </div>
            <Button onClick={applyDateFilter} className="bg-blue-600 hover:bg-blue-700">
              Apply Filter
            </Button>
            <Button
              onClick={() => {
                setDateRange({ start_date: '', end_date: '' });
                setTimeout(fetchReports, 100);
              }}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'monthly', label: '📅 Monthly Sales', icon: '📅' },
          { id: 'customers', label: '👥 Customers', icon: '👥' },
          { id: 'products', label: '📦 Products', icon: '📦' },
          { id: 'customer-products', label: '🛒 Customer Products', icon: '🛒' },  // NEW TAB
          { id: 'salesreps', label: '👤 Sales Reps', icon: '👤' },
          { id: 'analysis', label: '🏷️ Analysis', icon: '🏷️' }
        ].map(tab => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Monthly Sales Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Monthly Sales Report ({new Date().getFullYear()})</CardTitle>
              <Button onClick={() => exportToExcel(monthlyData, 'monthly_sales_report')} size="sm" variant="outline">
                📊 Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Line data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT 10%</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Sales</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.month}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">BHD {row.sales_value.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">BHD {row.vat_amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">BHD {row.net_sales.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50 font-bold">
                      <td className="px-4 py-3 text-sm">TOTAL</td>
                      <td className="px-4 py-3 text-sm">BHD {monthlyData.reduce((sum, r) => sum + r.sales_value, 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">BHD {monthlyData.reduce((sum, r) => sum + r.vat_amount, 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">BHD {monthlyData.reduce((sum, r) => sum + r.net_sales, 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Sales Report */}
      {activeTab === 'customers' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Sales Report</CardTitle>
            <Button onClick={() => exportToExcel(filteredCustomerData, 'customer_sales_report')} size="sm" variant="outline">
              📊 Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Search customers..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="customer-report-search"
              />
              {searchCustomer && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing {filteredCustomerData.length} of {customerData.length} customers
                </p>
              )}
            </div>

            <div className="mb-6">
              <Bar data={customerChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number of Invoices</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomerData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.customer_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">BHD {row.total_sales.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.invoice_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Sales Report */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product/Item Sales Report</CardTitle>
            <Button onClick={() => exportToExcel(filteredProductData, 'product_sales_report')} size="sm" variant="outline">
              📊 Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Search products by name or part number..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="product-report-search"
              />
              {searchProduct && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing {filteredProductData.length} of {productData.length} products
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Division</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProductData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{row.part_number || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.category || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.brand || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.division || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.total_qty}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">BHD {row.total_sales.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NEW: Customer Product Purchase Report */}
      {activeTab === 'customer-products' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Product Purchase Report</CardTitle>
            <Button 
              onClick={() => {
                if (filteredTransactions.length === 0) {
                  alert('Please apply filters first to see results');
                  return;
                }
                const exportData = filteredTransactions.map(t => ({
                  'Invoice Date': t.invoice_date,
                  'Invoice Number': t.invoice_number,
                  'Customer': t.customer_name,
                  'Part Number': t.part_number || '-',
                  'Product Name': t.product_name,
                  'Category': t.category || '-',
                  'Brand': t.brand || '-',
                  'Quantity': t.quantity,
                  'Unit Price': t.unit_price.toFixed(2),
                  'Total': t.total.toFixed(2)
                }));
                exportToExcel(exportData, 'customer_product_purchase_report');
              }} 
              size="sm" 
              variant="outline"
            >
              📊 Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filter Panel */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filter Criteria</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={customerProductFilters.start_date}
                    onChange={(e) => setCustomerProductFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={customerProductFilters.end_date}
                    onChange={(e) => setCustomerProductFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Customer Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    value={customerProductFilters.customer_id}
                    onChange={(e) => setCustomerProductFilters(prev => ({ ...prev, customer_id: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Customers</option>
                    {customerData.map((customer, idx) => (
                      <option key={idx} value={customer.customer_id}>
                        {customer.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Part Number Filter - NEW SEARCHABLE DROPDOWN */}
                <div className="relative part-number-search-dropdown">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                  <input
                    type="text"
                    placeholder="Search part number..."
                    value={partNumberSearchTerm}
                    onChange={(e) => handlePartNumberSearch(e.target.value)}
                    onFocus={() => setShowPartNumberDropdown(true)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  {showPartNumberDropdown && getFilteredProductsByPartNumber().length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredProductsByPartNumber().map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handlePartNumberSelect(product)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100"
                        >
                          <div className="font-medium text-blue-600">{product.part_number}</div>
                          <div className="text-xs text-gray-500">{product.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Product Name Filter - NEW SEARCHABLE DROPDOWN */}
                <div className="relative product-search-dropdown">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="Search product name..."
                    value={productSearchTerm}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  {showProductDropdown && getFilteredProducts().length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredProducts().map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100"
                        >
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.part_number && `Part #: ${product.part_number}`}
                            {product.category && ` • ${product.category}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={applyCustomerProductFilter} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🔍 Apply Filter
                </Button>
                <Button 
                  onClick={() => {
                    setCustomerProductFilters({
                      start_date: '',
                      end_date: '',
                      customer_id: '',
                      product_name: '',
                      part_number: ''
                    });
                    setProductSearchTerm('');
                    setPartNumberSearchTerm('');
                    setFilteredTransactions([]);
                  }}
                  variant="outline"
                  className="border-gray-300"
                >
                  🔄 Clear Filters
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            {filteredTransactions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredTransactions.reduce((sum, t) => sum + t.quantity, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    BHD {filteredTransactions.reduce((sum, t) => sum + t.total, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600">Unique Products</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {new Set(filteredTransactions.map(t => t.product_name)).size}
                  </p>
                </div>
              </div>
            )}

            {/* Results Table */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg mb-2">📋 No results to display</p>
                <p className="text-gray-400 text-sm">Please select filters above and click "Apply Filter" to view data</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.invoice_date}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{transaction.customer_name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{transaction.part_number || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{transaction.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.category || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.brand || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{transaction.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">BHD {transaction.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">BHD {transaction.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sales Rep Performance Report */}
      {activeTab === 'salesreps' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Salesperson Performance Report</CardTitle>
            <Button onClick={() => exportToExcel(filteredSalesRepData, 'salesrep_performance_report')} size="sm" variant="outline">
              📊 Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Search sales reps..."
                value={searchSalesRep}
                onChange={(e) => setSearchSalesRep(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="salesrep-report-search"
              />
              {searchSalesRep && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing {filteredSalesRepData.length} of {salesRepData.length} sales reps
                </p>
              )}
            </div>

            <div className="mb-6">
              <Bar data={salesRepChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Rep</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSalesRepData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.sales_rep_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">BHD {row.total_sales.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.monthly_target ? `BHD ${row.monthly_target.toFixed(2)}` : 'Not Set'}
                      </td>
                      <td className="px-4 py-3">
                        {row.achievement_percentage ? (
                          <div>
                            <div className={`text-sm font-semibold ${
                              row.achievement_percentage >= 100 ? 'text-green-600' :
                              row.achievement_percentage >= 75 ? 'text-blue-600' :
                              row.achievement_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {row.achievement_percentage.toFixed(1)}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full ${
                                  row.achievement_percentage >= 100 ? 'bg-green-500' :
                                  row.achievement_percentage >= 75 ? 'bg-blue-500' :
                                  row.achievement_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(row.achievement_percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : <span className="text-gray-400 text-sm">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.invoice_count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">BHD {row.commission.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Report */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Search categories..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="category-analysis-search"
                />
                {searchCategory && (
                  <p className="text-sm text-gray-600 mt-2">
                    Showing {filteredCategoryData.length} of {analysisData.by_category.length} categories
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div style={{ height: '600px' }}>
                  <Pie data={categoryPieData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCategoryData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{row.name}</td>
                          <td className="px-4 py-2 text-sm font-semibold">BHD {row.total_sales.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Brand</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Search brands..."
                  value={searchBrand}
                  onChange={(e) => setSearchBrand(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="brand-analysis-search"
                />
                {searchBrand && (
                  <p className="text-sm text-gray-600 mt-2">
                    Showing {filteredBrandData.length} of {analysisData.by_brand.length} brands
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div style={{ height: '600px' }}>
                  <Pie data={brandPieData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Brand</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBrandData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{row.name}</td>
                          <td className="px-4 py-2 text-sm font-semibold">BHD {row.total_sales.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Division</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Search divisions..."
                  value={searchDivision}
                  onChange={(e) => setSearchDivision(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-testid="division-analysis-search"
                />
                {searchDivision && (
                  <p className="text-sm text-gray-600 mt-2">
                    Showing {filteredDivisionData.length} of {analysisData.by_division.length} divisions
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Division</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDivisionData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{row.name}</td>
                        <td className="px-4 py-2 text-sm font-semibold">BHD {row.total_sales.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
