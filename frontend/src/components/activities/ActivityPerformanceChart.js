import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ActivityPerformanceChart = ({ activities, getUserName, formatAmount, currentUserRole }) => {
  // Calculate performance by assigned user
  const performanceMap = {};
  
  activities.forEach(activity => {
    const assignedTo = activity.assigned_to || 'Unassigned';
    const userName = getUserName(assignedTo);
    
    if (!performanceMap[userName]) {
      performanceMap[userName] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        invoices: 0,
        workOrders: 0,
        totalValue: 0,
        userId: assignedTo
      };
    }
    
    performanceMap[userName].total++;
    
    if (activity.status === 'completed') {
      performanceMap[userName].completed++;
      if (activity.invoice_number) performanceMap[userName].invoices++;
      if (activity.work_order_no) performanceMap[userName].workOrders++;
      if (activity.total_amount) {
        performanceMap[userName].totalValue += parseFloat(activity.total_amount);
      }
    }
    
    if (activity.status === 'in_progress') {
      performanceMap[userName].inProgress++;
    }
  });
  
  // Convert to array and filter based on user role
  let performanceData = Object.entries(performanceMap)
    .map(([name, stats]) => ({ name, ...stats }));
  
  // If current user is Sales, filter out Support users
  // Sales users should only see their own and other Sales users' performance, not Support
  if (currentUserRole === 'sales') {
    // We need to filter by checking the user's role from the users list
    // For now, we'll show all since we need user role info to filter properly
    // This will be handled in the parent component
  }
  
  performanceData = performanceData.sort((a, b) => b.total - a.total);
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">📊 Performance by Assigned User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Activities</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Completed</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">In Progress</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Invoices</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Work Orders</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.length > 0 ? (
                performanceData.map((perf, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-700 to-green-700 flex items-center justify-center text-white font-bold mr-3">
                          {perf.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{perf.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {perf.total}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        {perf.completed}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                        {perf.inProgress}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700 font-medium">
                        {perf.invoices > 0 ? `📄 ${perf.invoices}` : '-'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-gray-700 font-medium">
                        {perf.workOrders > 0 ? `🔧 ${perf.workOrders}` : '-'}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-bold text-green-700">
                        {perf.totalValue > 0 ? formatAmount(perf.totalValue) : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No activities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityPerformanceChart;
