import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { formatAmount, currencySymbol, companySettings } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto">
      {/* Main Content - Mobile Responsive */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8 max-w-7xl lg:mx-auto overflow-x-hidden">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Here's what's happening with your team today.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 mb-4 sm:mb-6 lg:mb-8">
          {user?.role === 'admin' && (
            <Button
              onClick={() => window.location.href = '/users'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-3 sm:py-4"
              data-testid="users-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-semibold text-sm sm:text-base">Manage Users</span>
              </div>
            </Button>
          )}
          {/* Activities - Admin and Support */}
          {(user?.role === 'admin' || user?.role === 'support') && (
            <Button
              onClick={() => window.location.href = '/activities'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-3 sm:py-4"
              data-testid="activities-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="font-semibold text-sm sm:text-base">{user?.role === 'support' ? 'My Activities' : 'Activities'}</span>
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
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-3 sm:py-4"
              data-testid="products-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-semibold text-sm sm:text-base">Products</span>
              </div>
            </Button>
          )}
          
          {/* Leads - Admin and Sales */}
          {(user?.role === 'admin' || user?.role === 'sales') && (
            <Button
              onClick={() => window.location.href = '/leads'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-3 sm:py-4"
              data-testid="leads-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="font-semibold text-sm sm:text-base">Leads</span>
              </div>
            </Button>
          )}
          {/* Teams - Hidden for Sales Users */}
          {user?.role !== 'sales' && (
            <Button
              onClick={() => window.location.href = '/teams'}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 h-auto py-3 sm:py-4"
              data-testid="teams-button"
            >
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-semibold text-sm sm:text-base">{user?.role === 'admin' ? 'Manage Teams' : 'My Team'}</span>
              </div>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 mb-4 sm:mb-6">
              {/* Total Users - Hidden for Sales Users */}
              {user?.role !== 'sales' && (
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
              )}

              {/* Active Users - Hidden for Sales Users */}
              {user?.role !== 'sales' && (
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
              )}

              {/* Total Activities - Hidden for Sales Users */}
              {user?.role !== 'sales' && (
                <Card className="hover:shadow-lg transition-shadow" data-testid="stat-total-activities">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
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
                  <div className="space-y-2 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">⏳ Pending</span>
                      <span className="text-sm font-bold text-amber-600">{stats?.pending_activities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">🔄 In Progress</span>
                      <span className="text-sm font-bold text-blue-600">{stats?.in_progress_activities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">✅ Completed</span>
                      <span className="text-sm font-bold text-green-600">{stats?.completed_activities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-600">💰 Total Value</span>
                      <span className="text-sm font-bold text-green-600">{formatAmount(stats?.total_activities_value || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Total Leads - Hidden for Support Users */}
              {user?.role !== 'support' && (
                <Card className="hover:shadow-lg transition-shadow" data-testid="stat-total-leads">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
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
                    <div className="space-y-2 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">🎯 Closed Won</span>
                        <span className="text-lg font-bold text-green-600">{stats?.closed_won_leads || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">💰 Project Value</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatAmount(stats?.total_project_value || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Team Overview - Hidden for Sales Users */}
              {user?.role !== 'sales' && (
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
              )}

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
                      <span className="text-gray-600">In Progress</span>
                      <span className="text-2xl font-bold text-blue-600">{stats?.in_progress_activities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed</span>
                      <span className="text-2xl font-bold text-green-600">{stats?.completed_activities || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total</span>
                      <span className="text-2xl font-bold text-purple-600">{stats?.total_activities || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monitoring - Hidden for Support and Sales Users, Only for Admin */}
              {user?.role === 'admin' && (
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
