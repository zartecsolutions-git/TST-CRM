import React from 'react';
import { Button } from '@/components/ui/button';

const CustomerProductFilters = ({
  filters,
  setFilters,
  customerData,
  productSearchTerm,
  setProductSearchTerm,
  partNumberSearchTerm,
  setPartNumberSearchTerm,
  showProductDropdown,
  setShowProductDropdown,
  showPartNumberDropdown,
  setShowPartNumberDropdown,
  getFilteredProducts,
  getFilteredProductsByPartNumber,
  handleProductSelect,
  handlePartNumberSelect,
  handleProductSearch,
  handlePartNumberSearch,
  onApply,
  onClear
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Filter Criteria</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Customer Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select
            value={filters.customer_id}
            onChange={(e) => setFilters(prev => ({ ...prev, customer_id: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Customers</option>
            {customerData.map((customer) => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.customer_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Part Number Filter - Searchable Dropdown */}
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
        
        {/* Product Name Filter - Searchable Dropdown */}
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
          onClick={onApply} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          🔍 Apply Filter
        </Button>
        <Button 
          onClick={onClear}
          variant="outline"
          className="border-gray-300"
        >
          ✕ Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default CustomerProductFilters;