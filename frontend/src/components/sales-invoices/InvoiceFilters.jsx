import React from 'react';
import { Button } from '@/components/ui/button';

const InvoiceFilters = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  dateFilter,
  setDateFilter,
  onClearFilters
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Bar */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🔍 Search
          </label>
          <input
            type="text"
            placeholder="Search by invoice #, customer, or sales rep..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="invoice-search-input"
          />
        </div>
        
        {/* Payment Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            data-testid="invoice-status-filter"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="w-full"
            data-testid="clear-filters-btn"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {(searchTerm || filterStatus !== 'all' || dateFilter.start || dateFilter.end) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
          <span className="font-medium">Active Filters:</span>
          {searchTerm && <span className="px-2 py-1 bg-blue-100 rounded">Search: "{searchTerm}"</span>}
          {filterStatus !== 'all' && <span className="px-2 py-1 bg-blue-100 rounded">Status: {filterStatus}</span>}
          {dateFilter.start && <span className="px-2 py-1 bg-blue-100 rounded">From: {dateFilter.start}</span>}
          {dateFilter.end && <span className="px-2 py-1 bg-blue-100 rounded">To: {dateFilter.end}</span>}
        </div>
      )}
    </div>
  );
};

export default InvoiceFilters;
