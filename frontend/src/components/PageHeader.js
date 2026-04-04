import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

const PageHeader = ({ title, subtitle, children }) => {
  const { companySettings } = useCurrency();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Company Branding + Page Title */}
          <div className="flex items-center space-x-4">
            {/* Company Logo */}
            {companySettings?.logo_url ? (
              <img 
                src={companySettings.logo_url} 
                alt={companySettings.name || 'Company Logo'} 
                className="h-16 w-auto max-w-[200px] rounded-lg object-contain border-2 border-orange-200 bg-white p-1"
              />
            ) : (
              <div className="bg-gradient-to-r from-orange-500 to-sky-500 p-2 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            
            {/* Company Name + Page Title */}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-sky-500 bg-clip-text text-transparent">
                {title}
              </h1>
              {companySettings?.name && (
                <p className="text-sm text-gray-600">
                  {companySettings.name}
                  {companySettings.country && ` • ${companySettings.country} • ${companySettings.currency}`}
                </p>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side content (buttons, user info, etc.) */}
          {children}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
