import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Package,
  Folder,
  Tag,
  DollarSign,
  Package2,
  CheckCircle,
  XCircle,
  Activity,
  X,
  Filter,
  TrendingDown,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import ProductForm from './components/ProductForm';

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterProductType, setFilterProductType] = useState('');
  const [filterActive, setFilterActive] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const { getAdminServices } = useAuth();
  const processedStateRef = useRef(null);

  // Handle navigation state from SubCategories page
  useEffect(() => {
    const state = location.state;
    
    // Check if we have state and haven't processed it yet
    if (state && (state.subCategoryId || state.filterSubCategoryId || state.categoryId)) {
      // Check if this is the same state we already processed
      const stateKey = `${state.subCategoryId || ''}_${state.filterSubCategoryId || ''}_${state.categoryId || ''}`;
      if (processedStateRef.current === stateKey) {
        return; // Already processed this state
      }
      
      processedStateRef.current = stateKey;
      const { subCategoryId, categoryId, filterSubCategoryId } = state;
      
      if (categoryId) {
        setFilterCategory(categoryId);
      }
      
      if (filterSubCategoryId) {
        setFilterSubCategory(filterSubCategoryId);
      }
      
      if (subCategoryId) {
        // Open form with pre-selected sub-category
        setFilterCategory(categoryId);
        setTimeout(() => {
          setShowForm(true);
          // Store sub-category ID to pre-select in form
          sessionStorage.setItem('preselectedSubCategoryId', subCategoryId);
          sessionStorage.setItem('preselectedCategoryId', categoryId);
        }, 100);
      }
      
      // Clear location state after using it
      navigate(location.pathname, { replace: true, state: null });
    } else if (!state) {
      // Reset ref when state is cleared
      processedStateRef.current = null;
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    fetchCategories();
    if (filterCategory) {
      fetchSubCategories();
    }
    fetchProducts();
  }, [pagination.page, searchTerm, filterCategory, filterSubCategory, filterProductType, filterActive]);

  useEffect(() => {
    if (filterCategory) {
      fetchSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [filterCategory]);

  const fetchCategories = async () => {
    try {
      const adminServices = getAdminServices();
      // Fetch root categories (no parent)
      const response = await adminServices.productCatalog.getRootCategories({ limit: 100 });
      if (response.status === 'success') {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchSubCategories = async () => {
    if (!filterCategory) {
      setSubCategories([]);
      return;
    }
    
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.getSubcategories(filterCategory, { limit: 100 });
      if (response.status === 'success') {
        setSubCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch sub-categories:', err);
      setSubCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const adminServices = getAdminServices();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { category_id: filterCategory }),
        ...(filterSubCategory && { subcategory_id: filterSubCategory }),
        ...(filterProductType && { product_type: filterProductType }),
        ...(filterActive !== null && { is_active: filterActive }),
      };

      const response = await adminServices.productCatalog.getProducts(params);

      if (response.status === 'success') {
        setProducts(response.data.products || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        }));
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    // Clear any preselected values
    sessionStorage.removeItem('preselectedSubCategoryId');
    sessionStorage.removeItem('preselectedCategoryId');
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete product "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.deleteProduct(product._id);

      if (response.status === 'success') {
        setSuccess('Product deleted successfully');
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete product');
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    fetchProducts();
    setShowForm(false);
    setEditingProduct(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterSubCategory('');
    setFilterProductType('');
    setFilterActive(null);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getProductTypeColor = (type) => {
    const colors = {
      paint: 'from-blue-500 to-cyan-600',
      additive: 'from-purple-500 to-pink-600',
      binder: 'from-orange-500 to-red-600',
      auxiliary: 'from-green-500 to-emerald-600',
      accessory: 'from-yellow-500 to-amber-600',
      third_party: 'from-indigo-500 to-purple-600',
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getProductTypeLabel = (type) => {
    const labels = {
      paint: 'Paint',
      additive: 'Additive',
      binder: 'Binder',
      auxiliary: 'Auxiliary',
      accessory: 'Accessory',
      third_party: 'Third Party',
    };
    return labels[type] || type;
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage product catalog and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddProduct}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
          <button
            onClick={fetchProducts}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubCategory(''); // Clear sub-category when category changes
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories
              .filter(cat => !cat.parent_id || !cat.parent_id._id)
              .map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
          </select>

          {/* Sub-Category Filter */}
          <select
            value={filterSubCategory}
            onChange={(e) => {
              setFilterSubCategory(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            disabled={!filterCategory || subCategories.length === 0}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All Sub-Categories</option>
            {subCategories.map(subCategory => (
              <option key={subCategory._id} value={subCategory._id}>
                {subCategory.name}
              </option>
            ))}
          </select>

          {/* Product Type Filter */}
          <select
            value={filterProductType}
            onChange={(e) => {
              setFilterProductType(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="tinters">Tinters</option>
            <option value="additive">Additive</option>
            <option value="binder">Binder</option>
            <option value="auxiliary">Auxiliary</option>
            <option value="accessory">Accessory</option>
            <option value="third_party">Third Party</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value === 'all' ? null : e.target.value === 'active';
              setFilterActive(value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Clear Filters */}
          {(searchTerm || filterCategory || filterSubCategory || filterProductType || filterActive !== null) && (
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

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Category
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Price
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Inventory
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-3 sm:px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No products found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {searchTerm || filterCategory || filterProductType || filterActive !== null
                        ? 'Try adjusting your filters'
                        : 'Get started by adding a new product'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const inventory = product.inventory_summary || {};
                  const hasLowStock = inventory.low_stock_branches > 0;
                  const hasOutOfStock = inventory.out_of_stock_branches > 0;
                  const typeColor = getProductTypeColor(product.product_type);

                  return (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${typeColor} flex items-center justify-center shadow-md`}>
                              <Package className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {product.name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              ID: {product._id?.toString().slice(-8) || product.id}
                            </div>
                            {product.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs hidden sm:block">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                        <div className="flex items-center">
                          <Folder className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate block max-w-[150px]">{product.category?.name || '-'}</span>
                        </div>
                        {product.subcategory?.name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                            <Tag className="w-3 h-3 mr-1" />
                            <span className="truncate">{product.subcategory.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${typeColor} text-white`}>
                          {getProductTypeLabel(product.product_type)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="font-semibold">{product.base_price?.toFixed(2) || '0.00'}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            / {product.unit || 'unit'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Package2 className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">
                              {inventory.total_stock || 0}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              in {inventory.available_branches || 0} branches
                            </span>
                          </div>
                          {(hasLowStock || hasOutOfStock) && (
                            <div className="flex items-center space-x-2 text-xs">
                              {hasLowStock && (
                                <span className="flex items-center text-orange-600 dark:text-orange-400">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Low: {inventory.low_stock_branches}
                                </span>
                              )}
                              {hasOutOfStock && (
                                <span className="flex items-center text-red-600 dark:text-red-400">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Out: {inventory.out_of_stock_branches}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {product.is_active ? (
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
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete product"
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
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 px-3 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Total Products Counter */}
        {pagination.total > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 px-3 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <Package className="w-4 h-4 mr-2" />
                <span className="font-medium">{pagination.total}</span> total products
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Products;


