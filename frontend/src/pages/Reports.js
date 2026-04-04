import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Reports = () => {
  const { user, logout } = useAuth();
  const { formatAmount, companySettings, currencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const [activitiesRes, leadsRes, customersRes, productsRes, usersRes] = await Promise.all([
        api.get('/activities'),
        api.get('/leads'),
        api.get('/customers'),
        api.get('/products'),
        api.get('/users')
      ]);

      const activities = activitiesRes.data;
      const leads = leadsRes.data;
      const customers = customersRes.data;
      const products = productsRes.data;
      const users = usersRes.data;

      // Calculate metrics
      const totalRevenue = activities
        .filter(a => a.status === 'completed' && a.total_amount)
        .reduce((sum, a) => sum + parseFloat(a.total_amount || 0), 0);

      const totalLeadValue = leads
        .filter(l => l.status === 'closed_won' && l.project_value)
        .reduce((sum, l) => sum + parseFloat(l.project_value || 0), 0);

      const activeCustomers = customers.filter(c => c.status === 'active').length;
      const totalProducts = products.length;

      // Activities by status
      const activitiesByStatus = {
        pending: activities.filter(a => a.status === 'pending').length,
        in_progress: activities.filter(a => a.status === 'in_progress').length,
        completed: activities.filter(a => a.status === 'completed').length,
        cancelled: activities.filter(a => a.status === 'cancelled').length,
      };

      // Leads by status
      const leadsByStatus = {
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        proposal_sent: leads.filter(l => l.status === 'proposal_sent').length,
        negotiation: leads.filter(l => l.status === 'negotiation').length,
        closed_won: leads.filter(l => l.status === 'closed_won').length,
        closed_lost: leads.filter(l => l.status === 'closed_lost').length,
      };

      // Users by role
      const usersByRole = {
        admin: users.filter(u => u.role === 'admin').length,
        super_admin: users.filter(u => u.role === 'super_admin').length,
        sales: users.filter(u => u.role === 'sales').length,
        support: users.filter(u => u.role === 'support').length,
      };

      // Monthly revenue trend (last 6 months)
      const monthlyRevenue = calculateMonthlyRevenue(activities);

      setReportData({
        totalRevenue,
        totalLeadValue,
        activeCustomers,
        totalProducts,
        activitiesByStatus,
        leadsByStatus,
        usersByRole,
        monthlyRevenue,
        totalActivities: activities.length,
        totalLeads: leads.length,
        totalCustomers: customers.length,
        totalUsers: users.length,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRevenue = (activities) => {
    const months = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    // Calculate revenue per month
    activities
      .filter(a => a.status === 'completed' && a.total_amount)
      .forEach(a => {
        const date = new Date(a.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (months.hasOwnProperty(key)) {
          months[key] += parseFloat(a.total_amount || 0);
        }
      });

    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-sky-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {companySettings?.logo_url ? (
                <img 
                  src={companySettings.logo_url} 
                  alt={companySettings.name} 
                  className="h-16 w-auto max-w-[200px] rounded-lg object-contain border-2 border-orange-200 bg-white p-1"
                />
              ) : (
                <div className="bg-gradient-to-r from-orange-500 to-sky-500 p-2 rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              )}
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-sky-500 bg-clip-text text-transparent">
                  📊 {companySettings?.name || 'Company'} Reports
                </h1>
                <p className="text-sm text-gray-600">Business Analytics & Insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                Back to Dashboard
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{user?.role}</span>
              </div>
              <Button onClick={logout} variant="destructive">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Company Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-orange-500 to-sky-500 text-white">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-90">Company Name</p>
                <p className="text-2xl font-bold">{companySettings?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Country</p>
                <p className="text-xl font-semibold">{companySettings?.country || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Currency</p>
                <p className="text-xl font-semibold">{companySettings?.currency || 'USD'} ({currencySymbol})</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Tax Rate</p>
                <p className="text-xl font-semibold">{companySettings?.tax_percentage || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{formatAmount(reportData?.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">From completed activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Lead Value (Closed Won)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{formatAmount(reportData?.totalLeadValue || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">{reportData?.leadsByStatus.closed_won || 0} won deals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Active Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{reportData?.activeCustomers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">of {reportData?.totalCustomers || 0} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{reportData?.totalProducts || 0}</p>
              <p className="text-xs text-gray-500 mt-1">In catalog</p>
            </CardContent>
          </Card>
        </div>

        {/* Activities & Leads Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activities by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Activities by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">⏳ Pending</span>
                  <span className="text-lg font-bold text-yellow-600">{reportData?.activitiesByStatus.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">🔄 In Progress</span>
                  <span className="text-lg font-bold text-blue-600">{reportData?.activitiesByStatus.in_progress || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">✅ Completed</span>
                  <span className="text-lg font-bold text-green-600">{reportData?.activitiesByStatus.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">❌ Cancelled</span>
                  <span className="text-lg font-bold text-red-600">{reportData?.activitiesByStatus.cancelled || 0}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Total Activities</span>
                    <span className="text-xl font-bold text-gray-900">{reportData?.totalActivities || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">🆕 New</span>
                  <span className="text-lg font-bold text-gray-600">{reportData?.leadsByStatus.new || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">📞 Contacted</span>
                  <span className="text-lg font-bold text-blue-600">{reportData?.leadsByStatus.contacted || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">✓ Qualified</span>
                  <span className="text-lg font-bold text-purple-600">{reportData?.leadsByStatus.qualified || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">📄 Proposal Sent</span>
                  <span className="text-lg font-bold text-indigo-600">{reportData?.leadsByStatus.proposal_sent || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">🎯 Closed Won</span>
                  <span className="text-lg font-bold text-green-600">{reportData?.leadsByStatus.closed_won || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">❌ Closed Lost</span>
                  <span className="text-lg font-bold text-red-600">{reportData?.leadsByStatus.closed_lost || 0}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Total Leads</span>
                    <span className="text-xl font-bold text-gray-900">{reportData?.totalLeads || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue Trend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.monthlyRevenue.map(({ month, revenue }) => {
                const maxRevenue = Math.max(...reportData.monthlyRevenue.map(m => m.revenue));
                const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={month}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{month}</span>
                      <span className="text-sm font-bold text-green-600">{formatAmount(revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-sky-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Super Admins</p>
                <p className="text-3xl font-bold text-purple-600">{reportData?.usersByRole.super_admin || 0}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Admins</p>
                <p className="text-3xl font-bold text-blue-600">{reportData?.usersByRole.admin || 0}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sales</p>
                <p className="text-3xl font-bold text-green-600">{reportData?.usersByRole.sales || 0}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Support</p>
                <p className="text-3xl font-bold text-orange-600">{reportData?.usersByRole.support || 0}</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Total Team Members: <span className="font-bold text-gray-900">{reportData?.totalUsers || 0}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
