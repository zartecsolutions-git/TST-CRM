import React from 'react';

const ProductStats = ({ products, inStockCount, soldCount, formatAmount }) => {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + inStockCount(p), 0);
  const totalSold = products.reduce((sum, p) => sum + soldCount(p), 0);
  const stockValue = products.reduce((sum, p) => sum + ((p.price || 0) * inStockCount(p)), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-6">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Products</h3>
        <p className="text-3xl font-bold text-blue-600">{totalProducts}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Stock</h3>
        <p className="text-3xl font-bold text-green-600">{totalStock}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Total Sold</h3>
        <p className="text-3xl font-bold text-amber-600">{totalSold}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Stock Value</h3>
        <p className="text-3xl font-bold text-purple-600">{formatAmount(stockValue)}</p>
      </div>
    </div>
  );
};

export default ProductStats;
