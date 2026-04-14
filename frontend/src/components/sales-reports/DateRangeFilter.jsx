import React from 'react';

const DateRangeFilter = ({ startDate, endDate, onStartChange, onEndChange, className = '' }) => {
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-gray-200 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-800 mb-3">📅 Date Range</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;