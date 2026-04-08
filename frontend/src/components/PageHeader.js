import React from 'react';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <header className="hidden lg:block bg-white shadow-sm border-b">
      {/* COMPLETELY HIDDEN ON MOBILE - MobileLayout provides the header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Page Title Only - Logo Removed */}
          <div className="flex items-center space-x-4">
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
