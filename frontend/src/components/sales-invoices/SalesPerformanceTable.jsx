import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const SalesPerformanceTable = ({ salesPerformance, userRole }) => {
  if (!salesPerformance || salesPerformance.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          <span>{userRole === 'admin' ? 'Sales Performance by User' : 'My Performance'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Rep
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoices
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesPerformance.map((rep, index) => (
                <tr key={rep.sales_rep_id} className={index === 0 && userRole === 'admin' ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && userRole === 'admin' && <span className="mr-2">🏆</span>}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rep.sales_rep_name}</div>
                        {index === 0 && userRole === 'admin' && <div className="text-xs text-yellow-600">Top Performer</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                      BHD {rep.total_sales.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{rep.invoice_count}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-red-600">
                      BHD {(rep.overdue_amount || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-green-600">
                      BHD {rep.commission.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {userRole === 'admin' && salesPerformance.length > 1 && (
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    BHD {salesPerformance.reduce((sum, rep) => sum + rep.total_sales, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    {salesPerformance.reduce((sum, rep) => sum + rep.invoice_count, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                    BHD {salesPerformance.reduce((sum, rep) => sum + (rep.overdue_amount || 0), 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                    BHD {salesPerformance.reduce((sum, rep) => sum + rep.commission, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesPerformanceTable;
