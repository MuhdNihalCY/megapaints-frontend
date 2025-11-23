import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Package,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  X,
  Filter,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
} from 'lucide-react';
import InventoryForm from './components/InventoryForm';
import BulkInventoryUpdate from './components/BulkInventoryUpdate';

const Inventory = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'stock-update'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // Increased from 20 to 50 for better default visibility
    total: 0,
    pages: 0,
  });
  const { getAdminServices } = useAuth();

  useEffect(() => {
    fetchInventory();
    fetchBranches();
  }, [pagination.page, searchTerm, selectedBranch, selectedProductType]);

  const fetchBranches = async () => {
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.businessManagement.getBranches({ limit: 100 });
      if (response.status === 'success') {
        const branchesData = response.data.branches || [];
        // Debug: Log branch structure
        console.log('Branches fetched:', branchesData.length);
        if (branchesData.length > 0) {
          console.log('Sample branch:', branchesData[0]);
          console.log('Branch _id:', branchesData[0]._id);
          console.log('Branch id:', branchesData[0].id);
        }
        setBranches(branchesData);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const adminServices = getAdminServices();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branch_id: selectedBranch }),
        ...(selectedProductType && { product_type: selectedProductType }),
      };

      const response = await adminServices.inventoryManagement.getInventory(params);

      if (response.status === 'success') {
        const inventories = response.data.inventories || [];
        const paginationData = response.data.pagination || {};
        
        setInventories(inventories);
        console.log('inventories', inventories);
        setPagination({
          ...pagination,
          total: paginationData.total || 0,
          pages: paginationData.pages || 0,
        });

        console.log('Inventory loaded', {
          filters: {
            branch: selectedBranch || 'all',
            type: selectedProductType || 'all',
            search: searchTerm || 'none',
          },
          pagination: {
            page: pagination.page,
            total: paginationData.total || 0,
            returned: inventories.length,
            pages: paginationData.pages || 0,
          },
        });
      } else {
        console.error('Inventory fetch failed:', response);
        setError('Failed to fetch inventory');
      }
    } catch (err) {
      console.error('Inventory fetch error:', err.message);
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = () => {
    setEditingInventory(null);
    setShowForm(true);
  };

  const handleEditInventory = (inventory) => {
    setEditingInventory(inventory);
    setShowForm(true);
  };

  const handleDeleteInventory = async (inventory) => {
    const productName = inventory.product?.name || 'this product';
    if (!window.confirm(`Are you sure you want to delete inventory for "${productName}"?`)) {
      return;
    }

    try {
      const adminServices = getAdminServices();
      // Extract branch and product IDs - they are directly on the objects
      const branchId = inventory.branch?._id;
      const productId = inventory.product?._id;
      
      if (!branchId || !productId) {
        setError('Missing branch or product ID');
        return;
      }
      
      const response = await adminServices.inventoryManagement.deleteInventory(
        String(branchId), 
        String(productId)
      );

      if (response.status === 'success') {
        setSuccess('Inventory deleted successfully');
        fetchInventory();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete inventory');
      }
    } catch (err) {
      console.error('Failed to delete inventory:', err);
      setError(err.message || 'Failed to delete inventory');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInventory(null);
  };

  const handleFormSuccess = () => {
    fetchInventory();
    setShowForm(false);
    setEditingInventory(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBranch('');
    setSelectedProductType('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && inventories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage inventory across all branches
          </p>
        </div>
        {activeTab === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={handleAddInventory}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Inventory
            </button>
            <button
              onClick={fetchInventory}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Inventory List
          </button>
          <button
            onClick={() => setActiveTab('stock-update')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stock-update'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Bulk Stock Update
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'stock-update' ? (
        <BulkInventoryUpdate
          inline={true}
          onSuccess={handleFormSuccess}
        />
      ) : (
        <>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
          <button onClick={() => setSuccess('')} className="text-green-600 dark:text-green-400 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-600 dark:text-red-400 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map((branch, index) => {
              // Ensure branch ID is extracted as string
              // Handle both _id (MongoDB) and id (transformed) formats
              let branchId = null;
              
              if (branch._id) {
                // If _id exists, use it (could be ObjectId or string)
                branchId = typeof branch._id === 'object' && branch._id.toString 
                  ? branch._id.toString() 
                  : String(branch._id);
              } else if (branch.id) {
                // Fallback to id if _id doesn't exist
                branchId = typeof branch.id === 'object' && branch.id.toString 
                  ? branch.id.toString() 
                  : String(branch.id);
              }
              
              // Debug: Log if branch ID is missing
              if (!branchId) {
                console.warn('Branch missing ID:', branch);
              }
              
              return (
                <option key={branchId || `branch-${index}`} value={branchId || ''}>
                  {branch.name} {branch.code ? `(${branch.code})` : ''}
                </option>
              );
            })}
          </select>

          <select
            value={selectedProductType}
            onChange={(e) => {
              const newProductType = e.target.value;
              console.log('[Inventory] Product type filter changed:', {
                oldValue: selectedProductType,
                newValue: newProductType,
                willTriggerFetch: true
              });
              setSelectedProductType(newProductType);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option key="all" value="">All Product Types</option>
            <option key="tinters" value="tinters">Tinters</option>
            <option key="additive" value="additive">Additive</option>
            <option key="binder" value="binder">Binder</option>
            <option key="auxiliary" value="auxiliary">Auxiliary</option>
            <option key="accessory" value="accessory">Accessory</option>
            <option key="third_party" value="third_party">Third Party</option>
          </select>

          {(searchTerm || selectedBranch || selectedProductType) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {inventories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No inventory found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {searchTerm || selectedBranch || selectedProductType
                        ? 'Try adjusting your filters'
                        : 'Get started by adding inventory'}
                    </p>
                  </td>
                </tr>
              ) : (
                inventories.map((inventory, index) => {
                  // Get product and branch objects directly (they contain name, code, _id, etc.)
                  const product = inventory.product;
                  const branch = inventory.branch;
                  const stockInfo = inventory.stock_info || {};
                  const alerts = inventory.alerts || {};

                  // Helper function to extract ID as string from an object
                  const extractId = (obj) => {
                    if (!obj) return '';
                    // If it's already a string, return it
                    if (typeof obj === 'string') return obj;
                    // If it's an object with _id property
                    if (obj._id) {
                      if (typeof obj._id === 'string') return obj._id;
                      if (obj._id.toString && typeof obj._id.toString === 'function') {
                        const str = obj._id.toString();
                        return str !== '[object Object]' ? str : '';
                      }
                    }
                    // Try toString method
                    if (obj.toString && typeof obj.toString === 'function') {
                      const str = obj.toString();
                      return str !== '[object Object]' ? str : '';
                    }
                    // Last resort: try to get valueOf or string conversion
                    try {
                      const str = String(obj);
                      return str !== '[object Object]' ? str : '';
                    } catch {
                      return '';
                    }
                  };

                  // Extract IDs from product and branch objects
                  const branchId = extractId(branch);
                  const productId = extractId(product);

                  // Generate unique key - use index as fallback to ensure uniqueness
                  const uniqueKey = (branchId && productId) 
                    ? `${branchId}-${productId}-${index}` 
                    : `inventory-${index}-${inventory.product?.name || inventory.product?.code || 'unknown'}`;

                  return (
                    <tr key={uniqueKey} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-blue-500 mr-2" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {product?.code || 'N/A'} • {product?.product_type || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {branch?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="font-semibold">
                            {stockInfo.current_stock?.toFixed(3) || '0.000'} {stockInfo.unit || ''}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min: {stockInfo.minimum_stock?.toFixed(3) || '0.000'} | 
                            Max: {stockInfo.maximum_stock?.toFixed(3) || '0.000'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {alerts.out_of_stock && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 w-fit px-4">
                              <XCircle className="w-3 h-3 mr-1" /> 
                              Out of Stock
                            </span>
                          )}
                          {alerts.low_stock && !alerts.out_of_stock && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 w-fit px-4">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Low Stock
                            </span>
                          )}
                          {!alerts.low_stock && !alerts.out_of_stock && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 w-fit px-4">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditInventory(inventory)}
                            className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit inventory"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInventory(inventory)}
                            className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete inventory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> items
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

          {/* Forms */}
          {showForm && (
            <InventoryForm
              inventory={editingInventory}
              onClose={handleCloseForm}
              onSuccess={handleFormSuccess}
            />
          )}

        </>
      )}
    </div>
  );
};

export default Inventory;

