import React from 'react';

const ProductTable = ({ 
  products, 
  searchQuery, 
  inStockCount, 
  soldCount, 
  formatAmount, 
  onViewDetails, 
  onEdit,
  userRole 
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          {searchQuery ? 'No products found matching your search' : 'No products yet'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-blue-700 to-green-700 text-white">
          <tr>
            <th className="px-4 py-3 text-left">Product Name</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Sub-Category</th>
            <th className="px-4 py-3 text-center">In Stock</th>
            <th className="px-4 py-3 text-center">Sold</th>
            <th className="px-4 py-3 text-left">Price</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-4 py-3 font-medium">{product.name}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {product.category || 'others'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{product.sub_category || '-'}</td>
              <td className="px-4 py-3 text-center">
                <span className="font-bold text-green-600">{inStockCount(product)}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-bold text-gray-600">{soldCount(product)}</span>
              </td>
              <td className="px-4 py-3">{formatAmount(product.price || 0)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onViewDetails(product)}
                  className="text-blue-600 hover:text-blue-800 mr-3"
                >
                  👁️ View
                </button>
                {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'data_entry') && (
                  <button
                    onClick={() => onEdit(product)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✏️ Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
