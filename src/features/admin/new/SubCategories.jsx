import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Layers, CheckCircle, XCircle, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Package, PlusCircle, Search, Filter, X as XIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CategoryForm from '../components/CategoryForm';

const SubCategories = () => {
  const { getAdminServices } = useAuth();
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    fetchSubCategories();
    fetchCategories();
  }, []);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const adminServices = getAdminServices();
      // Fetch sub-categories (categories with parent_id)
      const response = await adminServices.productCatalog.getCategories({
        parent_id: 'not_null', // This will fetch all categories with a parent
        limit: 100
      });
      
      if (response.status === 'success') {
        // Filter to only show sub-categories (those with parent_id)
        const subCats = response.data.categories.filter(cat => cat.parent_id);
        setSubCategories(subCats);
      } else {
        setError(response.message || 'Failed to fetch sub-categories');
      }
    } catch (err) {
      console.error('Failed to fetch sub-categories:', err);
      setError(err.message || 'Failed to fetch sub-categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const adminServices = getAdminServices();
      // Fetch all root categories (no parent) to use as parent options
      const response = await adminServices.productCatalog.getRootCategories({
        limit: 100
      });
      
      if (response.status === 'success') {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setParentCategory(null);
    setShowForm(true);
  };

  const handleEdit = (subCategory) => {
    setEditingCategory(subCategory);
    setParentCategory(subCategory.parent_id);
    setShowForm(true);
  };

  const handleDelete = async (subCategoryId) => {
    if (!window.confirm('Are you sure you want to delete this sub-category?')) {
      return;
    }

    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.deleteCategory(subCategoryId);
      
      if (response.status === 'success') {
        await fetchSubCategories();
      } else {
        alert(response.message || 'Failed to delete sub-category');
      }
    } catch (err) {
      console.error('Failed to delete sub-category:', err);
      alert(err.message || 'Failed to delete sub-category');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCategory(null);
    setParentCategory(null);
    fetchSubCategories();
    fetchCategories();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    setParentCategory(null);
  };

  const getCategoryName = (parentId) => {
    if (!parentId) return 'N/A';
    const category = categories.find(cat => cat._id === parentId || cat._id === parentId._id);
    return category ? category.name : 'Unknown';
  };

  // Filter and search logic
  const filteredAndSortedSubCategories = useMemo(() => {
    let filtered = [...subCategories];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(subCat => 
        subCat.name?.toLowerCase().includes(searchLower) ||
        getCategoryName(subCat.parent_id)?.toLowerCase().includes(searchLower) ||
        subCat.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter(subCat => {
        const parentId = subCat.parent_id?._id || subCat.parent_id;
        return parentId === filterCategory || parentId?.toString() === filterCategory;
      });
    }
    
    // Apply status filter
    if (filterStatus !== '') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(subCat => subCat.is_active === isActive);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'category':
          aValue = getCategoryName(a.parent_id)?.toLowerCase() || '';
          bValue = getCategoryName(b.parent_id)?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'sort_order':
          aValue = a.sort_order || 0;
          bValue = b.sort_order || 0;
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [subCategories, sortField, sortDirection, categories, searchTerm, filterCategory, filterStatus]);

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

  const handleAddProduct = (subCategory) => {
    // Navigate to products page with sub-category pre-selected
    navigate('/admin/products', { 
      state: { 
        subCategoryId: subCategory._id,
        categoryId: subCategory.parent_id?._id || subCategory.parent_id
      } 
    });
  };

  const handleViewProducts = (subCategory) => {
    // Navigate to products page filtered by sub-category
    navigate('/admin/products', { 
      state: { 
        filterSubCategoryId: subCategory._id,
        categoryId: subCategory.parent_id?._id || subCategory.parent_id
      } 
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
  };

  const hasActiveFilters = searchTerm || filterCategory || filterStatus !== '';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sub-Categories</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Sub-Category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Basic Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sub-categories by name, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
            />
          </div>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className={`inline-flex items-center px-4 py-2.5 border rounded-lg transition-colors ${
              showAdvancedSearch
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced
            {showAdvancedSearch ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredAndSortedSubCategories.length} of {subCategories.length} sub-categories
            {hasActiveFilters && ' (filtered)'}
          </span>
        </div>
      </div>

      {/* Sub-Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('sort_order')}
                >
                  <div className="flex items-center">
                    Sort Order
                    {getSortIcon('sort_order')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Loading sub-categories...</p>
                  </td>
                </tr>
              ) : filteredAndSortedSubCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      {hasActiveFilters ? 'No sub-categories match your filters' : 'No sub-categories found'}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {hasActiveFilters 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Get started by adding a new sub-category'
                      }
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        <XIcon className="w-4 h-4 mr-2" />
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedSubCategories.map((subCategory) => (
                  <tr key={subCategory._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {subCategory._id?.toString().slice(-8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {subCategory.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {getCategoryName(subCategory.parent_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subCategory.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {subCategory.is_active ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {subCategory.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {subCategory.sort_order || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <button
                          onClick={() => handleViewProducts(subCategory)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="View Products"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAddProduct(subCategory)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          title="Add Product"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(subCategory)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subCategory._id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
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

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          parentCategory={parentCategory}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default SubCategories;
