import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-100 to-sky-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-sky-500 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-sky-500 bg-clip-text text-transparent">
                  Sales & Service CRM
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <Button
                  onClick={() => window.location.href = '/location-tracking'}
                  className="bg-gradient-to-r from-orange-500 to-sky-500 hover:from-blue-700 hover:to-green-700"
                  data-testid="location-tracking-button"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location Tracking
                </Button>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {user?.role}
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="border-red-200 text-red-600 hover:bg-red-50"
                data-testid="logout-button"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600 mt-1">Here's what's happening with your team today.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {user?.role === 'admin' && (
            <Button
              onClick={() => window.location.href = '/users'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-4"
              data-testid="users-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-semibold">Manage Users</span>
              </div>
            </Button>
          )}
          {/* Activities - Admin and Support */}
          {(user?.role === 'admin' || user?.role === 'support') && (
            <Button
              onClick={() => window.location.href = '/activities'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-4"
              data-testid="activities-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="font-semibold">{user?.role === 'support' ? 'My Activities' : 'Activities'}</span>
              </div>
            </Button>
          )}
          
          {/* Customers - All Users */}
          <Button
            onClick={() => window.location.href = '/customers'}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-4"
            data-testid="customers-button"
          >
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-semibold">Customers</span>
            </div>
          </Button>
          
          {/* Products - Admin Only */}
          {user?.role === 'admin' && (
            <Button
              onClick={() => window.location.href = '/products'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-4"
              data-testid="products-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 mb-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-semibold">Products</span>
              </div>
            </Button>
          )}
          
          {/* Leads - Admin and Sales */}
          {(user?.role === 'admin' || user?.role === 'sales') && (
            <Button
              onClick={() => window.location.href = '/leads'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-4"
              data-testid="leads-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="font-semibold">Leads</span>
              </div>
            </Button>
          )}
          <Button
            onClick={() => window.location.href = '/teams'}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-4"
            data-testid="teams-button"
          >
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold">{user?.role === 'admin' ? 'Manage Teams' : 'My Team'}</span>
            </div>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Users */}
              <Card className="hover:shadow-lg transition-shadow" data-testid="stat-total-users">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <h3 className="text-3xl font-bold mt-2 text-blue-600">{stats?.total_users || 0}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-100">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Users */}
              <Card className="hover:shadow-lg transition-shadow" data-testid="stat-active-users">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <h3 className="text-3xl font-bold mt-2 text-green-600">{stats?.active_users || 0}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-green-100">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Activities */}
              <Card className="hover:shadow-lg transition-shadow" data-testid="stat-total-activities">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Activities</p>
                      <h3 className="text-3xl font-bold mt-2 text-purple-600">{stats?.total_activities || 0}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-100">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Tasks */}
              <Card className="hover:shadow-lg transition-shadow" data-testid="stat-pending-activities">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                      <h3 className="text-3xl font-bold mt-2 text-amber-600">{stats?.pending_activities || 0}</h3>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-100">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Leads - Hidden for Support Users */}
              {user?.role !== 'support' && (
                <Card className="hover:shadow-lg transition-shadow" data-testid="stat-total-leads">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Leads</p>
                        <h3 className="text-3xl font-bold mt-2 text-cyan-600">{stats?.total_leads || 0}</h3>
                      </div>
                      <div className="p-3 rounded-xl bg-cyan-100">
                        <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sales Team</span>
                      <span className="text-2xl font-bold text-blue-600">{stats?.total_sales || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Support Team</span>
                      <span className="text-2xl font-bold text-green-600">{stats?.total_support || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Teams</span>
                      <span className="text-2xl font-bold text-purple-600">{stats?.total_teams || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activities Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending</span>
                      <span className="text-2xl font-bold text-amber-600">{stats?.pending_activities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed</span>
                      <span className="text-2xl font-bold text-green-600">{stats?.completed_activities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total</span>
                      <span className="text-2xl font-bold text-blue-600">{stats?.total_activities || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monitoring - Hidden for Support Users */}
              {user?.role !== 'support' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Geofences</span>
                        <span className="text-2xl font-bold text-purple-600">{stats?.total_geofences || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Today</span>
                        <span className="text-2xl font-bold text-green-600">{stats?.active_users || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
