import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

const PageHeader = ({ title, subtitle, children }) => {
  const { companySettings } = useCurrency();

  return (
    <header className="bg-white shadow-sm border-b lg:block hidden">
      {/* Desktop Only - Hidden on Mobile (MobileLayout provides header) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Company Branding + Page Title */}
          <div className="flex items-center space-x-4">
            {/* Company Logo */}
            {companySettings?.logo_url ? (
              <img 
                src={companySettings.logo_url} 
                alt={companySettings.name || 'Company Logo'} 
                className="h-12 w-auto max-w-[150px] rounded-lg object-contain"
              />
            ) : (
              <div className="bg-gradient-to-r from-blue-700 to-green-700 p-2 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            
            {/* Page Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side content (buttons, etc.) */}
          <div className="flex gap-2">
            {children}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
