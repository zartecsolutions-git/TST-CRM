import React from 'react';

const ActivityStats = ({ totalActivities, completedActivities, totalValue, formatAmount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Activities</h3>
        <p className="text-3xl font-bold text-blue-600">{totalActivities}</p>
        <p className="text-xs text-gray-500 mt-1">All your activities</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Completed Activities</h3>
        <p className="text-3xl font-bold text-green-600">{completedActivities}</p>
        <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Value</h3>
        <p className="text-3xl font-bold text-green-600">{formatAmount(totalValue)}</p>
        <p className="text-xs text-gray-500 mt-1">From completed activities</p>
      </div>
    </div>
  );
};

export default ActivityStats;
