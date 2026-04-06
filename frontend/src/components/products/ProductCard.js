import React from 'react';

const ProductCard = ({ 
  product, 
  inStockCount, 
  soldCount, 
  formatAmount, 
  onView, 
  onEdit,
  userRole 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mt-1">
            {product.category || 'others'}
          </span>
          {product.sub_category && (
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs ml-1 mt-1">
              {product.sub_category}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatAmount(product.price || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">{inStockCount(product)}</div>
          <div className="text-xs text-gray-600">In Stock</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-gray-600">{soldCount(product)}</div>
          <div className="text-xs text-gray-600">Sold</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">
            {product.serial_numbers?.length || 0}
          </div>
          <div className="text-xs text-gray-600">Serial #s</div>
        </div>
      </div>

      {product.model && (
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Model:</span> {product.model}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={() => onView(product)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          👁️ View Details
        </button>
        {userRole === 'admin' && (
          <button
            onClick={() => onEdit(product)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
          >
            ✏️ Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
