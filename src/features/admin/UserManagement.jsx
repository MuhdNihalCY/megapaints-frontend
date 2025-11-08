import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiServiceFactory from '../../services/ApiServiceFactory.js';
import UserForm from './components/UserForm.jsx';
import { getApiUrl } from '../../config/api.js';
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  ToggleLeft,
  ToggleRight,
  Users,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Activity,
  TestTube,
  ArrowRight,
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(null); // null = all, true = active, false = inactive
  const [filterDesignation, setFilterDesignation] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const { apiRequest, getAdminServices } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, filterActive, filterDesignation]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Debug authentication status
      const adminUser = localStorage.getItem('adminUser');
      const accessToken = localStorage.getItem('accessToken');
      const debugData = {
        adminUser: adminUser ? 'Logged in' : 'Not logged in',
        accessToken: accessToken ? 'Present' : 'Missing',
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'None',
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(JSON.stringify(debugData, null, 2));
      
      if (!adminUser || !accessToken) {
        setError('❌ Not logged in as admin. Please login at /admin/login first.');
        return;
      }
      
      // Use the API service factory
      const adminServices = getAdminServices();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== null && { is_active: filterActive }),
        ...(filterDesignation && { designation: filterDesignation }),
      };

      const response = await adminServices.businessManagement.getUsers(params);
      
      if (response.status === 'success') {
        setUsers(response.data.users || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 0,
        }));
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('❌ Detailed error fetching users:', err);
      
      if (err.message && err.message.includes('Route not found')) {
        setError('❌ Route not found: GET /api/admin/users. Trying alternative route...');
        tryAlternativeRoute();
      } else if (err.message && err.message.includes('401')) {
        setError('❌ Authentication failed (401). Please login again as admin.');
      } else if (err.message && err.message.includes('403')) {
        setError('❌ Access denied (403). Admin permissions required.');
      } else {
        setError(`❌ Unable to fetch users: ${err.message}. Check console for details.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const tryAlternativeRoute = async () => {
    try {
      const response = await apiRequest('/admin/business/users');
      
      if (response.status === 'success') {
        setUsers(response.data.users || []);
        setSuccess('✅ Users loaded via alternative route (/admin/business/users)');
      } else {
        setError('❌ Both routes failed. Check backend implementation.');
      }
    } catch (err) {
      console.error('❌ Alternative route also failed:', err);
      setError('❌ Both /admin/users and /admin/business/users routes failed. Check backend logs.');
    }
  };

  const testDirectAPI = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('❌ No access token found. Please login first.');
        return;
      }

      const response = await fetch(getApiUrl('/admin/users'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.text();

      if (response.ok) {
        const jsonData = JSON.parse(data);
        setUsers(jsonData.data?.users || []);
        setSuccess('✅ Direct API call successful!');
      } else {
        setError(`❌ Direct API failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Direct API test failed:', err);
      setError(`❌ Direct API test failed: ${err.message}`);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleCloseUserForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleUserFormSuccess = () => {
    fetchUsers(); // Refresh the user list
    setShowUserForm(false);
    setEditingUser(null);
  };

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.username}?`)) {
      return;
    }

    try {
      const adminServices = getAdminServices();
      const response = await adminServices.businessManagement.updateUser(user._id, {
        is_active: !user.is_active
      });

      if (response.status === 'success') {
        setSuccess(`✅ User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`Failed to ${user.is_active ? 'deactivate' : 'activate'} user`);
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err);
      setError(`Failed to ${user.is_active ? 'deactivate' : 'activate'} user: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterActive(null);
    setFilterDesignation('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getInitials = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDesignations = () => {
    const designations = new Set();
    users.forEach(user => {
      if (user.designation) {
        designations.add(user.designation);
      }
    });
    return Array.from(designations).sort();
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddUser}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Debug Information Panel (Development Only) */}
      {debugInfo && process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <TestTube className="w-4 h-4 mr-2" />
              Debug Information
            </h3>
            <button
              onClick={() => setDebugInfo('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32 bg-gray-100 dark:bg-gray-900 p-2 rounded">
            {debugInfo}
          </pre>
          <div className="flex gap-2 mt-2">
            <button
              onClick={testDirectAPI}
              className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
            >
              Test Direct API
            </button>
            <button
              onClick={tryAlternativeRoute}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
            >
              Try Alternative Route
            </button>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Designation Filter */}
          <select
            value={filterDesignation}
            onChange={(e) => {
              setFilterDesignation(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Designations</option>
            {getDesignations().map(designation => (
              <option key={designation} value={designation}>{designation}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchTerm || filterActive !== null || filterDesignation) && (
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

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Designation
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Branches
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                      Created
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-3 sm:px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No users found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                      {searchTerm || filterActive !== null || filterDesignation
                        ? 'Try adjusting your filters'
                        : 'Get started by adding a new user'}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(user)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user.username}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{user.username}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                      <span className="truncate block max-w-[200px]">{user.email}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                      <span className="truncate block max-w-[150px]">{user.designation || '-'}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
                      <span className="truncate block max-w-[150px]">
                        {user.branches && Array.isArray(user.branches) && user.branches.length > 0
                          ? user.branches.length === 1
                            ? typeof user.branches[0] === 'object' && user.branches[0].name
                              ? user.branches[0].name
                              : '1 branch'
                            : `${user.branches.length} branches`
                          : '-'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.is_active ? (
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
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                            user.is_active
                              ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
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
                of <span className="font-medium">{pagination.total}</span> users
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

        {/* Total Users Counter */}
        {pagination.total > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 px-3 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <Users className="w-4 h-4 mr-2" />
                <span className="font-medium">{pagination.total}</span> total users
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={handleCloseUserForm}
          onSuccess={handleUserFormSuccess}
        />
      )}
    </div>
  );
};

export default UserManagement;
