import React from 'react';

const ProductFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  filteredProducts, 
  onExport, 
  onImport, 
  onAddProduct, 
  userRole 
}) => {
  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="🔍 Search products by name, model, category, license code, or serial number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          {searchQuery && (
            <p className="text-sm text-gray-600">
              Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {userRole === 'admin' && (
            <>
              <button 
                onClick={onExport} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                📥 Export CSV
              </button>
              <button 
                onClick={onImport} 
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                📤 Import CSV
              </button>
            </>
          )}
          <button
            onClick={onAddProduct}
            className="bg-gradient-to-r from-blue-700 to-green-700 text-white px-6 py-2 rounded-lg hover:shadow-lg"
          >
            + Add Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
