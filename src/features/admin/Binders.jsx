import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Wrench,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Activity,
  X,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import ProductForm from './components/ProductForm';

const Binders = () => {
  const [binders, setBinders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBinder, setEditingBinder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const { getAdminServices } = useAuth();

  useEffect(() => {
    fetchBinders();
  }, [pagination.page, searchTerm, filterActive]);

  const fetchBinders = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const adminServices = getAdminServices();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        product_type: 'binder', // Filter by binder product type
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== null && { is_active: filterActive }),
      };

      const response = await adminServices.productCatalog.getProducts(params);

      if (response.status === 'success') {
        setBinders(response.data.products || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        }));
      } else {
        setError('Failed to fetch binders');
      }
    } catch (err) {
      console.error('Failed to fetch binders:', err);
      setError(err.message || 'Failed to fetch binders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBinder = () => {
    setEditingBinder(null);
    setShowForm(true);
  };

  const handleEditBinder = (binder) => {
    setEditingBinder(binder);
    setShowForm(true);
  };

  const handleDeleteBinder = async (binder) => {
    if (!window.confirm(`Are you sure you want to delete binder "${binder.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.deleteProduct(binder._id);

      if (response.status === 'success') {
        setSuccess('Binder deleted successfully');
        fetchBinders();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete binder');
      }
    } catch (err) {
      console.error('Failed to delete binder:', err);
      setError(err.message || 'Failed to delete binder');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBinder(null);
  };

  const handleFormSuccess = () => {
    fetchBinders();
    setShowForm(false);
    setEditingBinder(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterActive(null);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" />
      : <ArrowDown className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" />;
  };

  const filteredAndSortedBinders = useMemo(() => {
    let filtered = [...binders];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(binder => 
        (binder.name && binder.name.toLowerCase().includes(searchLower)) ||
        (binder.code && binder.code.toLowerCase().includes(searchLower))
      );
    }
    if (filterActive !== null) {
      filtered = filtered.filter(binder => binder.is_active === filterActive);
    }
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'price':
          aValue = a.base_price || 0;
          bValue = b.base_price || 0;
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [binders, sortField, sortDirection, searchTerm, filterActive]);

  if (loading && binders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading binders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Binders Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage paint binders and components
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddBinder}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Binder
          </button>
          <button
            onClick={fetchBinders}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
              placeholder="Search binders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

      {/* Binders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Binder
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Type
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center">
                        Price
                        {getSortIcon('price')}
                      </div>
                    </th>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedBinders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 sm:px-6 py-12 text-center">
                    <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No binders found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {searchTerm || filterActive !== null
                        ? 'Try adjusting your filters'
                        : 'Get started by adding a new binder'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedBinders.map((binder) => (
                  <tr key={binder._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {binder.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                            ID: {binder._id?.toString().slice(-8) || binder.id}
                          </div>
                          {binder.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs hidden sm:block">
                              {binder.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden mt-1">
                            {binder.type || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                      <div className="truncate block max-w-[150px]">{binder.type || '-'}</div>
                      {binder.compatibility && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {binder.compatibility}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                      <div className="flex items-center">
                        <span className="font-semibold">AED {binder.unit_price?.toFixed(2) || '0.00'}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 whitespace-nowrap">
                          / {binder.unit || 'unit'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        binder.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {binder.is_active ? (
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
                          onClick={() => handleEditBinder(binder)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit binder"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBinder(binder)}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete binder"
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
                of <span className="font-medium">{pagination.total}</span> binders
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

        {/* Total Binders Counter */}
        {pagination.total > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 px-3 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <Wrench className="w-4 h-4 mr-2" />
                <span className="font-medium">{pagination.total}</span> total binders
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Binder Form Modal */}
      {showForm && (
        <ProductForm
          product={editingBinder}
          defaultProductType="binder"
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Binders;

