import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Truck,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Activity,
  X,
  Filter,
} from 'lucide-react';
import ThirdPartyProductForm from './components/ThirdPartyProductForm';

const ThirdPartyProducts = () => {
  const [thirdPartyProducts, setThirdPartyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingThirdPartyProduct, setEditingThirdPartyProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const { getAdminServices } = useAuth();

  useEffect(() => {
    fetchThirdPartyProducts();
  }, [pagination.page, searchTerm, filterActive]);

  const fetchThirdPartyProducts = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const adminServices = getAdminServices();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== null && { is_active: filterActive }),
      };

      const response = await adminServices.productCatalog.getThirdPartyProducts(params);

      if (response.status === 'success') {
        setThirdPartyProducts(response.data.third_party_products || response.data.thirdPartyProducts || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        }));
      } else {
        setError('Failed to fetch third party products');
      }
    } catch (err) {
      console.error('Failed to fetch third party products:', err);
      setError(err.message || 'Failed to fetch third party products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddThirdPartyProduct = () => {
    setEditingThirdPartyProduct(null);
    setShowForm(true);
  };

  const handleEditThirdPartyProduct = (thirdPartyProduct) => {
    setEditingThirdPartyProduct(thirdPartyProduct);
    setShowForm(true);
  };

  const handleDeleteThirdPartyProduct = async (thirdPartyProduct) => {
    if (!window.confirm(`Are you sure you want to delete third party product "${thirdPartyProduct.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.deleteThirdPartyProduct(thirdPartyProduct._id);

      if (response.status === 'success') {
        setSuccess('Third party product deleted successfully');
        fetchThirdPartyProducts();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete third party product');
      }
    } catch (err) {
      console.error('Failed to delete third party product:', err);
      setError(err.message || 'Failed to delete third party product');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingThirdPartyProduct(null);
  };

  const handleFormSuccess = () => {
    fetchThirdPartyProducts();
    setShowForm(false);
    setEditingThirdPartyProduct(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterActive(null);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && thirdPartyProducts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading third party products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Third Party Products Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage third party products and suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddThirdPartyProduct}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
          <button
            onClick={fetchThirdPartyProducts}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
          <button onClick={() => setSuccess('')} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
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
          <button onClick={() => setError('')} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search third party products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value === 'all' ? null : e.target.value === 'active';
              setFilterActive(value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Clear Filters */}
          {(searchTerm || filterActive !== null) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ThirdPartyProducts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Price
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
              {thirdPartyProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No third party products found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {searchTerm || filterActive !== null
                        ? 'Try adjusting your filters'
                        : 'Get started by adding a new third party product'}
                    </p>
                  </td>
                </tr>
              ) : (
                thirdPartyProducts.map((thirdPartyProduct) => (
                  <tr key={thirdPartyProduct._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <Truck className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {thirdPartyProduct.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Code: {thirdPartyProduct.code}
                          </div>
                          {thirdPartyProduct.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs">
                              {thirdPartyProduct.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {thirdPartyProduct.supplier?.name || thirdPartyProduct.supplier_name || '-'}
                      </div>
                      {thirdPartyProduct.supplier_code && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Code: {thirdPartyProduct.supplier_code}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="font-semibold">{thirdPartyProduct.unit_price?.toFixed(2) || '0.00'}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          / {thirdPartyProduct.unit || 'unit'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        thirdPartyProduct.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {thirdPartyProduct.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditThirdPartyProduct(thirdPartyProduct)}
                          className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit thirdPartyProduct"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteThirdPartyProduct(thirdPartyProduct)}
                          className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete thirdPartyProduct"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> third party products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Total ThirdPartyProducts Counter */}
        {pagination.total > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <Truck className="w-4 h-4 mr-2" />
                <span className="font-medium">{pagination.total}</span> total third party products
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ThirdPartyProduct Form Modal */}
      {showForm && (
        <ThirdPartyProductForm
          thirdPartyProduct={editingThirdPartyProduct}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default ThirdPartyProducts;

