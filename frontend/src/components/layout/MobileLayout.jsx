import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import PWAInstallPrompt from '../PWAInstallPrompt';
import OfflineIndicator from '../OfflineIndicator';

const MobileLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { companySettings } = useCurrency();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['admin', 'sales', 'support'] },
    { path: '/activities', label: 'Activities', icon: '📋', roles: ['admin', 'sales', 'support'] },
    { path: '/customers', label: 'Customers', icon: '👥', roles: ['admin', 'sales', 'support'] },
    { path: '/products', label: 'Products', icon: '📦', roles: ['admin', 'sales'] },
    { path: '/leads', label: 'Leads', icon: '🎯', roles: ['admin', 'sales'] },
    { path: '/sales-invoices', label: 'Sales Invoices', icon: '💰', roles: ['admin', 'sales'] },
    { path: '/sales-reports', label: 'Sales Reports', icon: '📈', roles: ['admin'] },
  ];

  const adminMenuItems = [
    { path: '/users', label: 'Users', icon: '👤' },
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/location-tracking', label: 'Locations', icon: '📍' },
    { path: '/reports', label: 'Reports', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
    setShowProfileMenu(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      <OfflineIndicator />
      <PWAInstallPrompt />
      
      {/* Top Header - Mobile */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex justify-between items-center px-3 py-2.5">
          {/* Logo - Left Side */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {companySettings?.logo_url ? (
              <img 
                src={companySettings.logo_url} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
          
          {/* User Name and Profile - Right Side */}
          <div className="flex items-center space-x-3">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">{user?.name}</h2>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="p-1.5 rounded-lg hover:bg-gray-100 flex items-center gap-1"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-50">
                <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-green-50">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                
                {/* Admin Menu Items */}
                {user?.role === 'admin' && (
                  <div className="py-1 border-b">
                    <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin Menu</p>
                    {adminMenuItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center gap-2 text-sm transition-colors"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Logout for ALL users */}
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-3 hover:bg-red-50 flex items-center gap-2 text-red-600 text-sm font-semibold transition-colors"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen">
        <aside className="w-64 bg-white shadow-lg border-r flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center justify-center">
              {companySettings?.logo_url ? (
                <img src={companySettings.logo_url} alt="Logo" className="h-16 w-auto" />
              ) : (
                <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            {/* User Welcome - Near Dashboard */}
            <div className="mx-4 mb-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
              <p className="text-xs text-gray-600">Welcome,</p>
              <h3 className="text-base font-bold text-gray-800">{user?.name}</h3>
            </div>
            {filteredNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-600 text-blue-700 font-semibold'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            {user?.role === 'admin' && (
              <>
                <div className="px-6 py-2 mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Admin</p>
                </div>
                {adminMenuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-6 py-3 flex items-center space-x-3 transition-colors ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-blue-600 text-blue-700 font-semibold'
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </>
            )}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Content */}
      <main className="lg:hidden flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default MobileLayout;
