import React from 'react';
import { Button } from '@/components/ui/button';

export default function ActivityFilters({ 
  filterStatus, 
  setFilterStatus, 
  searchQuery, 
  setSearchQuery, 
  canCreateActivity, 
  setShowAddForm,
  currentUser 
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            onClick={() => setFilterStatus('all')}
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            className={filterStatus === 'all' ? 'bg-gradient-to-r from-blue-700 to-green-700' : ''}
          >
            All
          </Button>
          <Button
            onClick={() => setFilterStatus('pending')}
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            className={filterStatus === 'pending' ? 'bg-amber-600' : ''}
          >
            Pending
          </Button>
          <Button
            onClick={() => setFilterStatus('in_progress')}
            variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
            className={filterStatus === 'in_progress' ? 'bg-blue-600' : ''}
          >
            In Progress
          </Button>
          <Button
            onClick={() => setFilterStatus('completed')}
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            className={filterStatus === 'completed' ? 'bg-green-600' : ''}
          >
            Completed
          </Button>
        </div>
        
        {/* Search Box - for Support Users */}
        {currentUser?.role === 'support' && (
          <div className="relative">
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
        
        {canCreateActivity && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-700 to-green-700"
          >
            + Create Activity
          </Button>
        )}
      </div>

      {/* Search Bar */}
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
            Found {/* Will be passed as prop */} activities
          </p>
        )}
      </div>
    </>
  );
}
