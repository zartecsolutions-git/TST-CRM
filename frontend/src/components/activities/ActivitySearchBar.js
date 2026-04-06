import React from 'react';

const ActivitySearchBar = ({ searchQuery, setSearchQuery, resultsCount }) => {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="🔍 Search by Serial #, Customer, Assigned To, Invoice #, Work Order #, Title..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {searchQuery && (
        <p className="text-sm text-gray-600 mt-2">
          Found {resultsCount} activit{resultsCount !== 1 ? 'ies' : 'y'}
        </p>
      )}
    </div>
  );
};

export default ActivitySearchBar;
