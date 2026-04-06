import React from 'react';
import { Badge } from '@/components/ui/badge';

const ActivityCard = ({ 
  activity, 
  onView, 
  onStatusChange, 
  onProgressUpdate, 
  onEditAssignment,
  getUserName, 
  getCustomerName, 
  getProductName,
  currentUser 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const canEdit = currentUser.role === 'admin' || 
                  activity.created_by === currentUser.id || 
                  activity.assigned_to === currentUser.id;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-1">{activity.title}</h3>
          <p className="text-sm text-gray-600">{activity.description}</p>
        </div>
        <Badge className={`${getStatusColor(activity.status)} text-white`}>
          {activity.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">Customer:</span>
          <span className="ml-2 font-medium">{getCustomerName(activity.customer_id)}</span>
        </div>
        <div>
          <span className="text-gray-500">Product:</span>
          <span className="ml-2 font-medium">{getProductName(activity.product_id)}</span>
        </div>
        <div>
          <span className="text-gray-500">Assigned To:</span>
          <span className="ml-2 font-medium">{getUserName(activity.assigned_to)}</span>
        </div>
        <div>
          <span className="text-gray-500">Serial #:</span>
          <span className="ml-2 font-medium">{activity.serial_number || '-'}</span>
        </div>
      </div>

      {activity.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{activity.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${activity.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={() => onView(activity)}
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium"
        >
          👁️ View Details
        </button>
        {canEdit && (
          <>
            <button
              onClick={() => onStatusChange(activity)}
              className="px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm font-medium"
            >
              📝 Status
            </button>
            <button
              onClick={() => onProgressUpdate(activity)}
              className="px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-sm font-medium"
            >
              📊 Progress
            </button>
          </>
        )}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => onEditAssignment(activity)}
            className="px-3 py-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 text-sm font-medium"
          >
            👤 Assign
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
