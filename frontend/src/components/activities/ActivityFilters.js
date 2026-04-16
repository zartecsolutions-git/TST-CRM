import React from 'react';
import { Button } from '@/components/ui/button';

const ActivityFilters = ({ 
  filterStatus, 
  setFilterStatus, 
  searchQuery, 
  setSearchQuery, 
  canCreateActivity, 
  setShowAddForm,
  showAddForm,
  currentUser 
}) => {
  return (
    <>
      {/* Mobile & Desktop Layout */}
      <div className="mb-6 space-y-3">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilterStatus('all')}
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            className={`${filterStatus === 'all' ? 'bg-gradient-to-r from-blue-700 to-green-700' : ''} text-sm`}
          >
            All
          </Button>
          <Button
            onClick={() => setFilterStatus('pending')}
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            className={`${filterStatus === 'pending' ? 'bg-amber-600' : ''} text-sm`}
          >
            Pending
          </Button>
          <Button
            onClick={() => setFilterStatus('in_progress')}
            variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
            className={`${filterStatus === 'in_progress' ? 'bg-blue-600' : ''} text-sm`}
          >
            In Progress
          </Button>
          <Button
            onClick={() => setFilterStatus('completed')}
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            className={`${filterStatus === 'completed' ? 'bg-green-600' : ''} text-sm`}
          >
            Completed
          </Button>
        </div>
        
        {/* Create Activity Button - Full width on mobile, auto on desktop */}
        {canCreateActivity && (
          <div className="w-full lg:w-auto">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-gradient-to-r from-blue-700 to-green-700 w-full lg:w-auto text-base font-semibold py-3"
            >
              + Create Activity
            </Button>
          </div>
        )}
        
        {/* Search Box - for Support Users - Desktop Only */}
        {currentUser?.role === 'support' && (
          <div className="relative hidden lg:block">
            <input
              type="text"
              placeholder="Search by Serial #, Customer, Invoice #, Work Order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ActivityFilters;
