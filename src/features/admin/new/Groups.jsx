import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Users, CheckCircle, XCircle, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X as XIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import GroupForm from '../components/GroupForm';

const Groups = () => {
  const { getAdminServices } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.getGroups({
        limit: 100
      });
      
      if (response.status === 'success') {
        setGroups(response.data.groups || []);
      } else {
        setError(response.message || 'Failed to fetch groups');
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError(err.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingGroup(null);
    setShowForm(true);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.deleteGroup(groupId);
      
      if (response.status === 'success') {
        await fetchGroups();
      } else {
        alert(response.message || 'Failed to delete group');
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
      alert(err.message || 'Failed to delete group');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingGroup(null);
    fetchGroups();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGroup(null);
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
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      : <ArrowDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };

  // Filter and search logic
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = [...groups];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(group => 
        group.name?.toLowerCase().includes(searchLower) ||
        group.code?.toLowerCase().includes(searchLower) ||
        group.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filterStatus !== '') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(group => group.is_active === isActive);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'code':
          aValue = a.code?.toLowerCase() || '';
          bValue = b.code?.toLowerCase() || '';
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
  }, [groups, sortField, sortDirection, searchTerm, filterStatus]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setShowAdvancedSearch(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
            Product Groups
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage product groups for organizing your products
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Group
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {showAdvancedSearch ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedSearch && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAndSortedGroups.length} of {groups.length} group{groups.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Code</span>
                    {getSortIcon('code')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Product Types
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('sort_order')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Sort Order</span>
                    {getSortIcon('sort_order')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedGroups.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No groups found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {searchTerm || filterStatus ? 'Try adjusting your filters' : 'Get started by adding a new group'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedGroups.map((group) => (
                  <tr key={group._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {group.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {group.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {group.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {group.product_types && Array.isArray(group.product_types) && group.product_types.length > 0 ? (
                          group.product_types.map((type) => {
                            const typeLabels = {
                              tinters: 'Tinters',
                              additive: 'Additive',
                              binder: 'Binder',
                              auxiliary: 'Auxiliary',
                              accessory: 'Accessory',
                              third_party: 'Third Party',
                            };
                            return (
                              <span
                                key={type}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              >
                                {typeLabels[type] || type}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">Tinters (default)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {group.sort_order || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {group.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(group)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(group._id)}
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

      {/* Group Form Modal */}
      {showForm && (
        <GroupForm
          group={editingGroup}
          onSuccess={handleFormSuccess}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Groups;

