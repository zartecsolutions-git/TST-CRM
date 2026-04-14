import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Pie } from 'react-chartjs-2';

const AnalysisChart = ({ 
  title, 
  searchValue, 
  onSearchChange, 
  filteredData, 
  totalData,
  pieChartData,
  testId 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={`🔍 Search ${title.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid={testId}
          />
          {searchValue && (
            <p className="text-sm text-gray-600 mt-2">
              Showing {filteredData.length} of {totalData.length} {title.toLowerCase()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div style={{ height: '600px' }}>
            <Pie 
              data={pieChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 15,
                      padding: 10
                    }
                  }
                }
              }} 
            />
          </div>
          
          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                    {title.replace('Sales by ', '')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{row.name}</td>
                    <td className="px-4 py-2 text-sm font-semibold">BHD {row.total_sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-2 text-sm font-bold">Total</td>
                    <td className="px-4 py-2 text-sm font-bold">
                      BHD {filteredData.reduce((sum, row) => sum + row.total_sales, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisChart;