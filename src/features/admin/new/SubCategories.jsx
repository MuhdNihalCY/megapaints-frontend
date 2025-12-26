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

  // Helper function to normalize MongoDB ObjectId to string
  const normalizeId = (id) => {
    if (!id) return null;
    
    // If already a string, clean it and return
    if (typeof id === 'string') {
      // Remove any suffix after colon (like :1) that might be added by ObjectId conversion
      const cleaned = id.split(':')[0].trim();
      // Validate it's a valid MongoDB ObjectId format (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(cleaned)) {
        return cleaned;
      }
      return id.trim();
    }
    
    // Handle ObjectId objects
    if (id && typeof id === 'object') {
      // Try toHexString() first (most reliable for ObjectId)
      if (id.toHexString && typeof id.toHexString === 'function') {
        try {
          const hexStr = id.toHexString();
          if (hexStr && typeof hexStr === 'string' && hexStr.length > 0) {
            return hexStr.trim();
          }
        } catch (e) {
          // Continue to other methods
        }
      }
      
      // Try valueOf() method
      if (id.valueOf && typeof id.valueOf === 'function') {
        try {
          const value = id.valueOf();
          if (typeof value === 'string') {
            const cleaned = value.split(':')[0].trim();
            return cleaned;
          }
          if (typeof value === 'object' && value.toHexString) {
            try {
              return value.toHexString().trim();
            } catch (e) {
              // Continue
            }
          }
        } catch (e) {
          // Continue to other methods
        }
      }
      
      // Try toString() method
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          // Remove any suffix after colon
          const cleaned = str.split(':')[0].trim();
          // Check if it's a valid ObjectId format
          if (cleaned && cleaned !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(cleaned)) {
            return cleaned;
          }
        } catch (e) {
          // Continue to other methods
        }
      }
      
      // Try accessing _id property
      if (id._id) {
        const nestedId = normalizeId(id._id);
        if (nestedId) return nestedId;
      }
      
      // Try accessing id property
      if (id.id) {
        const nestedId = normalizeId(id.id);
        if (nestedId) return nestedId;
      }
    }
    
    // Last resort - convert to string and clean
    const str = String(id);
    if (str && str !== '[object Object]' && str !== 'undefined' && str !== 'null') {
      // Remove any suffix after colon
      const cleaned = str.split(':')[0].trim();
      // Validate ObjectId format
      if (/^[0-9a-fA-F]{24}$/.test(cleaned)) {
        return cleaned;
      }
      return cleaned;
    }
    
    return null;
  };

  // Log state changes
  useEffect(() => {
    console.log('[SubCategories] State change - loading:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('[SubCategories] State change - error:', error);
  }, [error]);

  useEffect(() => {
    console.log('[SubCategories] State change - subCategories count:', subCategories.length);
  }, [subCategories.length]);

  useEffect(() => {
    console.log('[SubCategories] State change - categories count:', categories.length);
  }, [categories.length]);

  useEffect(() => {
    console.log('[SubCategories] State change - showForm:', showForm);
  }, [showForm]);

  useEffect(() => {
    console.log('[SubCategories] State change - editingCategory:', editingCategory ? { id: editingCategory._id, name: editingCategory.name } : null);
  }, [editingCategory]);

  useEffect(() => {
    console.log('[SubCategories] State change - sortField:', sortField, 'sortDirection:', sortDirection);
  }, [sortField, sortDirection]);

  useEffect(() => {
    console.log('[SubCategories] State change - searchTerm:', searchTerm, 'filterCategory:', filterCategory, 'filterStatus:', filterStatus);
  }, [searchTerm, filterCategory, filterStatus]);

  useEffect(() => {
    console.log('[SubCategories] State change - showAdvancedSearch:', showAdvancedSearch);
  }, [showAdvancedSearch]);

  useEffect(() => {
    console.log('[SubCategories] Component mounted');
    fetchSubCategories();
    fetchCategories();
    
    return () => {
      console.log('[SubCategories] Component unmounting');
    };
  }, []);

  const fetchSubCategories = async () => {
    console.log('[SubCategories] fetchSubCategories - Starting API call');
    try {
      setLoading(true);
      setError('');
      const adminServices = getAdminServices();
      // Fetch sub-categories (categories with parent_id)
      const requestParams = {
        parent_id: 'not_null', // This will fetch all categories with a parent
        limit: 100
      };
      console.log('[SubCategories] fetchSubCategories - Request params:', requestParams);
      
      const response = await adminServices.productCatalog.getCategories(requestParams);
      console.log('[SubCategories] fetchSubCategories - API Response:', response);
      
      if (response.status === 'success') {
        // Filter to only show sub-categories (those with parent_id)
        const subCats = response.data.categories.filter(cat => cat.parent_id);
        console.log('[SubCategories] fetchSubCategories - Filtered sub-categories:', subCats.length, subCats);
        setSubCategories(subCats);
        console.log('[SubCategories] fetchSubCategories - State updated with', subCats.length, 'sub-categories');
      } else {
        console.error('[SubCategories] fetchSubCategories - API returned error:', response.message);
        setError(response.message || 'Failed to fetch sub-categories');
      }
    } catch (err) {
      console.error('[SubCategories] fetchSubCategories - Exception caught:', err);
      console.error('[SubCategories] fetchSubCategories - Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Failed to fetch sub-categories');
    } finally {
      setLoading(false);
      console.log('[SubCategories] fetchSubCategories - Loading set to false');
    }
  };

  const fetchCategories = async () => {
    console.log('[SubCategories] fetchCategories - Starting API call');
    try {
      const adminServices = getAdminServices();
      // Fetch all root categories (no parent) to use as parent options
      const requestParams = {
        limit: 100
      };
      console.log('[SubCategories] fetchCategories - Request params:', requestParams);
      
      const response = await adminServices.productCatalog.getRootCategories(requestParams);
      console.log('[SubCategories] fetchCategories - API Response:', response);
      
      if (response.status === 'success') {
        const categoriesList = response.data.categories || [];
        console.log('[SubCategories] fetchCategories - Fetched', categoriesList.length, 'categories:', categoriesList);
        setCategories(categoriesList);
        console.log('[SubCategories] fetchCategories - State updated with', categoriesList.length, 'categories');
      } else {
        console.error('[SubCategories] fetchCategories - API returned error:', response.message);
      }
    } catch (err) {
      console.error('[SubCategories] fetchCategories - Exception caught:', err);
      console.error('[SubCategories] fetchCategories - Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    }
  };

  const handleAdd = () => {
    console.log('[SubCategories] handleAdd - User clicked Add Sub-Category button');
    setEditingCategory(null);
    setParentCategory(null);
    setShowForm(true);
    console.log('[SubCategories] handleAdd - Form state updated: showForm=true, editingCategory=null, parentCategory=null');
  };

  const handleEdit = (subCategory) => {
    console.log('[SubCategories] handleEdit - User clicked Edit button for sub-category:', {
      id: subCategory._id,
      name: subCategory.name,
      parent_id: subCategory.parent_id
    });
    setEditingCategory(subCategory);
    setParentCategory(subCategory.parent_id);
    setShowForm(true);
    console.log('[SubCategories] handleEdit - Form state updated: showForm=true, editingCategory set, parentCategory set');
  };

  const handleDelete = async (subCategoryId) => {
    console.log('[SubCategories] handleDelete - User clicked Delete button for sub-category:', subCategoryId);
    console.log('[SubCategories] handleDelete - ID type:', typeof subCategoryId, 'ID value:', subCategoryId);
    
    // Normalize the ID to ensure it's a clean string
    const normalizedId = normalizeId(subCategoryId);
    
    if (!normalizedId) {
      console.error('[SubCategories] handleDelete - Failed to normalize ID:', subCategoryId);
      alert('Invalid sub-category ID. Please try again.');
      return;
    }
    
    // Validate the normalized ID is a valid MongoDB ObjectId format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(normalizedId)) {
      console.error('[SubCategories] handleDelete - Invalid ObjectId format:', normalizedId);
      alert('Invalid sub-category ID format. Please try again.');
      return;
    }
    
    console.log('[SubCategories] handleDelete - Normalized ID:', normalizedId, '(original:', subCategoryId, ')');
    
    if (!window.confirm('Are you sure you want to delete this sub-category?')) {
      console.log('[SubCategories] handleDelete - User cancelled deletion');
      return;
    }

    console.log('[SubCategories] handleDelete - User confirmed deletion, starting API call');
    try {
      const adminServices = getAdminServices();
      console.log('[SubCategories] handleDelete - Calling deleteCategory API with normalized ID:', normalizedId);
      
      const response = await adminServices.productCatalog.deleteCategory(normalizedId);
      console.log('[SubCategories] handleDelete - API Response:', response);
      
      if (response.status === 'success') {
        console.log('[SubCategories] handleDelete - Deletion successful, refreshing sub-categories list');
        await fetchSubCategories();
        console.log('[SubCategories] handleDelete - Sub-categories list refreshed');
      } else {
        console.error('[SubCategories] handleDelete - API returned error:', response.message);
        alert(response.message || 'Failed to delete sub-category');
      }
    } catch (err) {
      console.error('[SubCategories] handleDelete - Exception caught:', err);
      console.error('[SubCategories] handleDelete - Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      alert(err.message || 'Failed to delete sub-category');
    }
  };

  const handleFormSuccess = () => {
    console.log('[SubCategories] handleFormSuccess - Form submission successful');
    setShowForm(false);
    setEditingCategory(null);
    setParentCategory(null);
    console.log('[SubCategories] handleFormSuccess - Form state reset, refreshing data');
    fetchSubCategories();
    fetchCategories();
  };

  const handleFormClose = () => {
    console.log('[SubCategories] handleFormClose - User closed the form');
    setShowForm(false);
    setEditingCategory(null);
    setParentCategory(null);
    console.log('[SubCategories] handleFormClose - Form state reset');
  };

  const getCategoryName = (parentId) => {
    if (!parentId) return 'N/A';
    const category = categories.find(cat => cat._id === parentId || cat._id === parentId._id);
    return category ? category.name : 'Unknown';
  };

  // Filter and search logic
  const filteredAndSortedSubCategories = useMemo(() => {
    console.log('[SubCategories] filteredAndSortedSubCategories - Recomputing filtered/sorted list');
    console.log('[SubCategories] filteredAndSortedSubCategories - Input data:', {
      totalSubCategories: subCategories.length,
      searchTerm,
      filterCategory,
      filterStatus,
      sortField,
      sortDirection
    });
    
    let filtered = [...subCategories];
    const initialCount = filtered.length;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const beforeCount = filtered.length;
      filtered = filtered.filter(subCat => 
        subCat.name?.toLowerCase().includes(searchLower) ||
        getCategoryName(subCat.parent_id)?.toLowerCase().includes(searchLower) ||
        subCat.description?.toLowerCase().includes(searchLower)
      );
      console.log('[SubCategories] filteredAndSortedSubCategories - After search filter:', {
        before: beforeCount,
        after: filtered.length,
        searchTerm: searchLower
      });
    }
    
    // Apply category filter
    if (filterCategory) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(subCat => {
        const parentId = subCat.parent_id?._id || subCat.parent_id;
        return parentId === filterCategory || parentId?.toString() === filterCategory;
      });
      console.log('[SubCategories] filteredAndSortedSubCategories - After category filter:', {
        before: beforeCount,
        after: filtered.length,
        filterCategory
      });
    }
    
    // Apply status filter
    if (filterStatus !== '') {
      const beforeCount = filtered.length;
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(subCat => subCat.is_active === isActive);
      console.log('[SubCategories] filteredAndSortedSubCategories - After status filter:', {
        before: beforeCount,
        after: filtered.length,
        filterStatus,
        isActive
      });
    }
    
    // Apply sorting
    const beforeSort = [...filtered];
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
    console.log('[SubCategories] filteredAndSortedSubCategories - After sorting:', {
      sortField,
      sortDirection,
      resultCount: filtered.length
    });
    
    console.log('[SubCategories] filteredAndSortedSubCategories - Final result:', {
      initial: initialCount,
      final: filtered.length,
      filtered: filtered.length < initialCount
    });
    
    return filtered;
  }, [subCategories, sortField, sortDirection, categories, searchTerm, filterCategory, filterStatus]);

  const handleSort = (field) => {
    console.log('[SubCategories] handleSort - User clicked sort on field:', field);
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      console.log('[SubCategories] handleSort - Toggling sort direction from', sortDirection, 'to', newDirection);
      setSortDirection(newDirection);
    } else {
      console.log('[SubCategories] handleSort - Changing sort field from', sortField, 'to', field, 'with direction: asc');
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

  const handleAddProduct = (subCategory, e) => {
    console.log('[SubCategories] handleAddProduct - User clicked Add Product button for sub-category:', {
      id: subCategory._id,
      name: subCategory.name
    });
    e?.preventDefault();
    e?.stopPropagation();
    // Navigate to products page with sub-category pre-selected
    const navigationState = { 
      subCategoryId: subCategory._id,
      categoryId: subCategory.parent_id?._id || subCategory.parent_id
    };
    console.log('[SubCategories] handleAddProduct - Navigating to /admin/products with state:', navigationState);
    navigate('/admin/products', { state: navigationState });
  };

  const handleViewProducts = (subCategory, e) => {
    console.log('[SubCategories] handleViewProducts - User clicked View Products button for sub-category:', {
      id: subCategory._id,
      name: subCategory.name
    });
    e?.preventDefault();
    e?.stopPropagation();
    // Navigate to products page filtered by sub-category
    const navigationState = { 
      filterSubCategoryId: subCategory._id,
      categoryId: subCategory.parent_id?._id || subCategory.parent_id
    };
    console.log('[SubCategories] handleViewProducts - Navigating to /admin/products with state:', navigationState);
    navigate('/admin/products', { state: navigationState });
  };

  const handleClearFilters = () => {
    console.log('[SubCategories] handleClearFilters - User clicked Clear Filters button');
    console.log('[SubCategories] handleClearFilters - Current filter values:', {
      searchTerm,
      filterCategory,
      filterStatus
    });
    setSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
    console.log('[SubCategories] handleClearFilters - All filters cleared');
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
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('[SubCategories] Search input changed:', {
                  previous: searchTerm,
                  new: newValue,
                  length: newValue.length
                });
                setSearchTerm(newValue);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
            />
          </div>
          <button
            onClick={() => {
              const newValue = !showAdvancedSearch;
              console.log('[SubCategories] Advanced search toggle clicked:', {
                previous: showAdvancedSearch,
                new: newValue
              });
              setShowAdvancedSearch(newValue);
            }}
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
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('[SubCategories] Category filter changed:', {
                      previous: filterCategory,
                      new: newValue,
                      categoryName: categories.find(c => c._id === newValue)?.name || 'N/A'
                    });
                    setFilterCategory(newValue);
                  }}
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
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('[SubCategories] Status filter changed:', {
                      previous: filterStatus,
                      new: newValue
                    });
                    setFilterStatus(newValue);
                  }}
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
                          type="button"
                          onClick={(e) => handleViewProducts(subCategory, e)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="View Products"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleAddProduct(subCategory, e)}
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
          isSubcategoryMode={true}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default SubCategories;
