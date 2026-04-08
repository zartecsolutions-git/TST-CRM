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
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['admin', 'sales', 'support'] },
    { path: '/activities', label: 'Activities', icon: '📋', roles: ['admin', 'sales', 'support'] },
    { path: '/customers', label: 'Customers', icon: '👥', roles: ['admin', 'sales', 'support'] },
    { path: '/products', label: 'Products', icon: '📦', roles: ['admin', 'sales'] },
    { path: '/leads', label: 'Leads', icon: '🎯', roles: ['admin', 'sales'] },
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      <OfflineIndicator />
      <PWAInstallPrompt />
      {/* Top Header - Mobile */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center space-x-3">
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
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {companySettings?.name || 'CRM'}
              </h1>
              <p className="text-xs text-gray-500">{user?.name}</p>
            </div>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Admin Menu Dropdown */}
        {showMenu && user?.role === 'admin' && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border mr-4 z-50">
            {adminMenuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 border-b last:border-b-0"
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center space-x-2 text-red-600"
            >
              <span>🚪</span>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen">
        <aside className="w-64 bg-white shadow-lg border-r flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              {companySettings?.logo_url ? (
                <img src={companySettings.logo_url} alt="Logo" className="h-12 w-auto" />
              ) : (
                <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-800">{companySettings?.name || 'CRM'}</h1>
                <p className="text-sm text-gray-500">{user?.name}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
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

          {user?.role === 'admin' && (
            <div className="p-4 border-t">
              <button
                onClick={logout}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Content */}
      <main className="lg:hidden flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          {filteredNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive(item.path)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
