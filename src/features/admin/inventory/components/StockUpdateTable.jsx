import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  Search,
  Building2,
  Filter,
  Package,
  Plus,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calculator,
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const StockUpdateTable = () => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [stockUpdates, setStockUpdates] = useState({}); // { productId: { inputValue, calculatedValue } }

  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedBranch && selectedProductType) {
      fetchInventory();
    } else {
      setInventories([]);
      setStockUpdates({});
    }
  }, [selectedBranch, selectedProductType]);

  const fetchBranches = async () => {
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.businessManagement.getBranches({ limit: 100 });
      if (response.status === 'success') {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.getAllItems({ limit: 1000, page: 1 });
      if (response.status === 'success') {
        setProducts(response.data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const adminServices = getAdminServices();
      
      // Fetch both inventory and all products
      const [inventoryResponse, productsResponse] = await Promise.all([
        adminServices.inventoryManagement.getInventory({
          branch_id: selectedBranch,
          product_type: selectedProductType,
          limit: 1000,
        }),
        adminServices.productCatalog.getAllItems({
          product_type: selectedProductType === 'tinters' ? 'tinters' : selectedProductType,
          limit: 1000,
          page: 1,
          // Don't filter by is_active - show all products for stock management
          // is_active: true, // Only fetch active products
        }),
      ]);

      if (inventoryResponse.status === 'success' && productsResponse.status === 'success') {
        const inventories = inventoryResponse.data.inventories || [];
        const allProducts = productsResponse.data.items || [];
        
        // Debug: Log products for additive type
        if (selectedProductType === 'additive') {
          console.log('Selected Product Type: additive');
          console.log('All Products Count:', allProducts.length);
          console.log('All Products:', allProducts.map(p => ({ 
            name: p.name, 
            code: p.code,
            item_type: p.item_type,
            _id: p._id,
            is_active: p.is_active,
            collection: 'Additive', // This confirms it's from Additive collection
            deleteUrl: `/api/admin/products/additives/${p._id}` // API endpoint to delete this additive
          })));
          console.log('Products by item_type:', allProducts.reduce((acc, p) => {
            const type = p.item_type || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}));
          
          // Warn if test/additive items are found
          const testItems = allProducts.filter(p => 
            p.name?.toLowerCase().includes('test') || 
            p.code?.toLowerCase().includes('test')
          );
          if (testItems.length > 0) {
            console.warn('⚠️ Test items found in Additive collection:', testItems.map(p => ({
              name: p.name,
              code: p.code,
              _id: p._id,
              deleteEndpoint: `DELETE /api/admin/products/additives/${p._id}`
            })));
          }
        }
        
        // Create a map of product IDs to inventory records
        const inventoryMap = new Map();
        inventories.forEach(inv => {
          // Extract product ID - backend returns product._id as string or ObjectId
          if (inv.product && inv.product._id) {
            const productId = inv.product._id;
            const productIdStr = String(productId);
            inventoryMap.set(productIdStr, inv);
          }
        });

        // Create combined list: all products with their inventory (if exists)
        // Filter products by item_type and product_type to match selectedProductType
        const productTypeMap = {
          'tinters': 'product',
          'additive': 'additive',
          'binder': 'binder',
          'auxiliary': 'auxiliary',
          'accessory': 'accessory',
          'third_party': 'third_party',
        };
        const expectedItemType = productTypeMap[selectedProductType] || selectedProductType;
        
        // Debug: Log filtering info
        console.log('Filtering products:', {
          selectedProductType,
          expectedItemType,
          allProductsCount: allProducts.length,
          allProductsItemTypes: allProducts.map(p => ({ name: p.name, item_type: p.item_type, product_type: p.product_type }))
        });
        
        const combinedList = allProducts
          .filter(product => {
            const itemType = product.item_type || 'product';
            
            // For tinters, we need to check both item_type and product_type
            // because the backend returns all products from Product collection with item_type='product'
            if (selectedProductType === 'tinters') {
              // Must have item_type='product' AND product_type='tinters'
              const matches = itemType === 'product' && product.product_type === 'tinters';
              if (!matches) {
                console.log('Tinters filter - product rejected:', product.name, { itemType, product_type: product.product_type });
              }
              return matches;
            }
            
            // For additive, check item_type - must be exactly 'additive'
            // Exclude products from Product collection (they have item_type='product')
            // Only show items from Additive collection (item_type='additive')
            if (selectedProductType === 'additive') {
              const matches = itemType === 'additive';
              if (!matches) {
                console.log('Additive filter - product rejected:', product.name, { itemType });
              }
              return matches;
            }
            
            // For binder, check item_type - must be exactly 'binder'
            // Exclude products from Product collection
            if (selectedProductType === 'binder') {
              const matches = itemType === 'binder';
              if (!matches) {
                console.log('Binder filter - product rejected:', product.name, { itemType });
              }
              return matches;
            }
            
            // For auxiliary, check item_type - must be exactly 'auxiliary'
            // Exclude products from Product collection
            if (selectedProductType === 'auxiliary') {
              const matches = itemType === 'auxiliary';
              if (!matches) {
                console.log('Auxiliary filter - product rejected:', product.name, { itemType });
              }
              return matches;
            }
            
            // For accessory, check item_type - must be exactly 'accessory'
            // Exclude products from Product collection
            if (selectedProductType === 'accessory') {
              const matches = itemType === 'accessory';
              if (!matches) {
                console.log('Accessory filter - product rejected:', product.name, { itemType });
              }
              return matches;
            }
            
            // For third_party, check item_type - must be exactly 'third_party'
            // Exclude products from Product collection
            if (selectedProductType === 'third_party') {
              const matches = itemType === 'third_party';
              if (!matches) {
                console.log('Third_party filter - product rejected:', product.name, { itemType });
              }
              return matches;
            }
            
            // Fallback: check item_type matches expected
            const matches = itemType === expectedItemType;
            if (!matches) {
              console.log('Fallback filter - product rejected:', product.name, { itemType, expectedItemType });
            }
            return matches;
          })
          .map(product => {
            const productId = product._id || product._id?._id;
            const productIdStr = String(productId);
            const inventory = inventoryMap.get(productIdStr);
            
            return {
              product: product,
              inventory: inventory || null,
              hasInventory: !!inventory,
            };
          });

        console.log('Filtered combinedList:', {
          count: combinedList.length,
          items: combinedList.map(item => ({ name: item.product?.name, item_type: item.product?.item_type }))
        });
        
        setInventories(combinedList);
        
        // Initialize stock updates for all products
        const updates = {};
        combinedList.forEach(item => {
          const productId = item.product._id || item.product._id?._id;
          if (productId) {
            updates[String(productId)] = { inputValue: '', calculatedValue: 0 };
          }
        });
        setStockUpdates(updates);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const getProductDetails = (productId) => {
    if (!productId) return null;
    // Handle both string and object IDs
    const productIdStr = typeof productId === 'string' ? productId : (productId.toString?.() || String(productId));
    // First check in the combined list
    const item = inventories.find(item => {
      const pId = item.product?._id || item.product?._id?._id;
      const pIdStr = String(pId);
      return pIdStr === productIdStr;
    });
    if (item) return item.product;
    // Fallback to products list
    return products.find(p => {
      const pId = p._id || p._id?._id;
      const pIdStr = typeof pId === 'string' ? pId : (pId?.toString?.() || String(pId));
      return pIdStr === productIdStr;
    });
  };

  const handleStockInputChange = (productId, value) => {
    const product = getProductDetails(productId);
    // Use standard_quantity from product, default to 1
    const standardQuantity = product?.standard_quantity || 1;
    const inputValue = parseFloat(value) || 0;
    const calculatedValue = inputValue * standardQuantity;

    const productIdStr = String(productId);
    setStockUpdates(prev => ({
      ...prev,
      [productIdStr]: {
        inputValue: value,
        calculatedValue: calculatedValue,
      },
    }));
  };

  const handleUpdateStock = async (item) => {
    // Extract product ID - product._id is already the ID (string or ObjectId)
    const productId = item.product?._id;
    if (!productId) {
      setError('Product ID is missing');
      return;
    }
    const productIdStr = String(productId);
    const update = stockUpdates[productIdStr];
    
    if (!update || !update.inputValue || parseFloat(update.inputValue) <= 0) {
      setError('Please enter a valid stock value');
      return;
    }

    try {
      setUpdating(prev => ({ ...prev, [productIdStr]: true }));
      setError('');
      setSuccess('');

      const adminServices = getAdminServices();
      const calculatedValue = update.calculatedValue;
      const product = item.product;
      const unit = product.unit || 'kg';

      // Add the calculated value to current stock
      // The addStock API will automatically create inventory if it doesn't exist
      const response = await adminServices.inventoryManagement.addStock(
        selectedBranch,
        productId,
        calculatedValue
      );

      if (response.status === 'success') {
        const action = item.hasInventory ? 'Updated' : 'Created';
        setSuccess(`${action} inventory successfully! Added ${calculatedValue.toFixed(3)} ${unit}`);
        
        // Update local state immediately with the updated inventory
        const updatedInventory = response.data.inventory;
        if (updatedInventory) {
          setInventories(prev => prev.map(prevItem => {
            // Extract product ID correctly
            const prevProductId = prevItem.product?._id;
            const prevProductIdStr = prevProductId ? String(prevProductId) : '';
            
            if (prevProductIdStr === productIdStr) {
              // Update the inventory for this product
              // If inventory already exists, merge the updated stock info
              // If it doesn't exist, create a new inventory object
              const newCurrentStock = updatedInventory.stock_info?.current_stock ?? 
                                     (updatedInventory.stock_info && typeof updatedInventory.stock_info === 'object' 
                                       ? updatedInventory.stock_info.current_stock 
                                       : null) ??
                                     0;
              const existingInventory = prevItem.inventory;
              
              // Ensure stock_info structure is preserved
              const updatedStockInfo = existingInventory?.stock_info 
                ? {
                    ...existingInventory.stock_info,
                    current_stock: newCurrentStock,
                  }
                : updatedInventory.stock_info || {
                    current_stock: newCurrentStock,
                    minimum_stock: 0,
                    maximum_stock: 0,
                    reorder_point: 0,
                    unit: product.unit || 'kg',
                  };
              
              return {
                ...prevItem,
                inventory: existingInventory ? {
                  ...existingInventory,
                  stock_info: updatedStockInfo,
                  last_updated: updatedInventory.last_updated || new Date(),
                } : {
                  ...updatedInventory,
                  stock_info: updatedStockInfo,
                  product: {
                    _id: productId,
                    name: product.name,
                    code: product.code,
                    product_type: product.product_type || product.item_type,
                  },
                  branch: {
                    _id: selectedBranch,
                    name: branches.find(b => String(b._id) === String(selectedBranch))?.name || '',
                    code: branches.find(b => String(b._id) === String(selectedBranch))?.code || '',
                  },
                },
                hasInventory: true,
              };
            }
            return prevItem;
          }));
        }
        
        // Clear the input
        setStockUpdates(prev => ({
          ...prev,
          [productIdStr]: { inputValue: '', calculatedValue: 0 },
        }));
        
        // Refresh inventory to ensure we have the latest data from server
        await fetchInventory();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Update stock failed:', err);
      setError(err.message || 'Failed to update stock');
    } finally {
      setUpdating(prev => ({ ...prev, [productIdStr]: false }));
    }
  };

  // No need to filter - we already filtered when fetching
  const displayItems = inventories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Update</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update stock values with Standard Quantity calculation
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableSelect
            label="Branch"
            options={branches}
            value={selectedBranch}
            onChange={setSelectedBranch}
            placeholder="Search and select branch..."
            searchKey="name"
            displayKey="name"
            secondaryKey="code"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-2" />
              Product Type *
            </label>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option key="all" value="">Select Product Type</option>
              <option key="tinters" value="tinters">Tinters</option>
              <option key="additive" value="additive">Additive</option>
              <option key="binder" value="binder">Binder</option>
              <option key="auxiliary" value="auxiliary">Auxiliary</option>
              <option key="accessory" value="accessory">Accessory</option>
              <option key="third_party" value="third_party">Third Party</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 dark:text-red-400 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
          <p className="text-green-700 dark:text-green-400 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </p>
        </div>
      )}

      {/* Products Table */}
      {selectedBranch && selectedProductType ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            </div>
          ) : displayItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Standard Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Add Stock (Units)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Calculated Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayItems.map((item, index) => {
                    const product = item.product;
                    const inventory = item.inventory;
                    const productId = product._id || product._id?._id;
                    // Ensure productIdStr is always a valid string for React key
                    let productIdStr = '';
                    if (productId) {
                      if (typeof productId === 'string') {
                        productIdStr = productId;
                      } else if (typeof productId === 'object' && productId.toString) {
                        productIdStr = productId.toString();
                      } else {
                        productIdStr = String(productId);
                      }
                    }
                    // Fallback to index if productId is still invalid
                    if (!productIdStr || productIdStr === '[object Object]') {
                      productIdStr = `product-${index}-${product.name || 'unknown'}`;
                    }
                    
                    // Use standard_quantity from product, default to 1
                    const standardQuantity = product.standard_quantity || 1;
                    const standardQuantityUnit = product.standard_quantity_unit || product.unit || '';
                    
                    // Get current stock - handle different possible structures
                    let currentStock = 0;
                    if (inventory) {
                      // Try different possible paths for current_stock
                      if (inventory.stock_info && typeof inventory.stock_info === 'object' && inventory.stock_info.current_stock !== undefined) {
                        currentStock = Number(inventory.stock_info.current_stock) || 0;
                      } else if (inventory.current_stock !== undefined) {
                        currentStock = Number(inventory.current_stock) || 0;
                      }
                    }
                    
                    const stockUnit = inventory?.stock_info?.unit || 
                                   inventory?.unit || 
                                   product.unit || 
                                   '';
                    
                    const update = stockUpdates[productIdStr] || { inputValue: '', calculatedValue: 0 };
                    const isUpdating = updating[productIdStr];

                    return (
                      <tr key={productIdStr} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!item.hasInventory ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.code || ''}
                          </div>
                          {!item.hasInventory && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              No inventory yet
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {currentStock.toFixed(3)} {stockUnit}
                          </div>
                          {!item.hasInventory && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Will be created on update
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {standardQuantity.toFixed(3)} {standardQuantityUnit}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            per unit
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={update.inputValue}
                            onChange={(e) => handleStockInputChange(productId, e.target.value)}
                            placeholder="Enter units"
                            step="0.001"
                            min="0"
                            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calculator className="w-4 h-4 text-gray-400" />
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {update.calculatedValue > 0 ? (
                                <>
                                  {update.calculatedValue.toFixed(3)} {stockUnit}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </div>
                          {update.inputValue && update.calculatedValue > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {update.inputValue} × {standardQuantity.toFixed(3)} = {update.calculatedValue.toFixed(3)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleUpdateStock(item)}
                            disabled={isUpdating || !update.inputValue || parseFloat(update.inputValue) <= 0}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center text-sm ${
                              item.hasInventory
                                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
                                : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white'
                            } disabled:cursor-not-allowed`}
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {item.hasInventory ? 'Updating...' : 'Creating...'}
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                {item.hasInventory ? 'Update' : 'Add'}
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No products found for selected branch and product type
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
          Please select a branch and product type to view products
        </div>
      )}
    </div>
  );
};

export default StockUpdateTable;

