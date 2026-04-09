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

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const year = new Date().getFullYear();
      
      const [monthly, customers, products, salesreps, analysis] = await Promise.all([
        api.get(`/sales/reports/monthly?year=${year}`),
        api.get('/sales/reports/customers', { params: dateRange }),
        api.get('/sales/reports/products', { params: dateRange }),
        api.get('/sales/reports/salesreps', { params: dateRange }),
        api.get('/sales/reports/analysis', { params: dateRange })
      ]);

      setMonthlyData(monthly.data || []);
      setCustomerData(customers.data || []);
      setProductData(products.data || []);
      setSalesRepData(salesreps.data || []);
      setAnalysisData(analysis.data || { by_category: [], by_brand: [], by_division: [] });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    fetchReports();
  };

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
          <h1 className="text-2xl font-bold text-gray-900">📊 Sales Reports</h1>
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
            <Button onClick={() => exportToExcel(customerData, 'customer_sales_report')} size="sm" variant="outline">
              📊 Export Excel
            </Button>
          </CardHeader>
          <CardContent>
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
                  {customerData.map((row, idx) => (
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
            <Button onClick={() => exportToExcel(productData, 'product_sales_report')} size="sm" variant="outline">
              📊 Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Division</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productData.map((row, idx) => (
                    <tr key={idx}>
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

      {/* Sales Rep Performance Report */}
      {activeTab === 'salesreps' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Salesperson Performance Report</CardTitle>
            <Button onClick={() => exportToExcel(salesRepData, 'salesrep_performance_report')} size="sm" variant="outline">
              📊 Export Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Bar data={salesRepChartData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Rep</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission (5%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesRepData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.sales_rep_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">BHD {row.total_sales.toFixed(2)}</td>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
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
                      {analysisData.by_category.map((row, idx) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64">
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
                      {analysisData.by_brand.map((row, idx) => (
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
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Division</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analysisData.by_division.map((row, idx) => (
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
