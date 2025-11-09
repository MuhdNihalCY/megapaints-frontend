import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import apiServiceFactory from '../../../services/ApiServiceFactory.js';
import UserForm from './components/UserForm.jsx';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { apiRequest } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const adminUser = localStorage.getItem('adminUser');
      const accessToken = localStorage.getItem('accessToken');
      
      if (!adminUser || !accessToken) {
        setError('Not logged in as admin. Please login at /admin/login first.');
        return;
      }
      
      // Use the new API service factory
      const adminServices = apiServiceFactory.initializeAdminServices();
      const response = await adminServices.businessManagement.getUsers();
      
      if (response.status === 'success') {
        setUsers(response.data.users || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddUser}
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 w-full sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full sm:w-auto"
          >
            Refresh
          </button>
        </div>
      </div>


      {error && (
        <div className={`px-4 py-3 rounded-lg mb-6 ${
          false 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          {error}
          {error.includes('not implemented') && (
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              💡 Check BACKEND_ROUTES_NEEDED.md for implementation guide
            </div>
          )}
        </div>
      )}

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
                      Company
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
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
                      <td colSpan="6" className="px-3 sm:px-6 py-12 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No users found</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                          Get started by adding a new user
                        </p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white font-medium text-xs">
                                  {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3 sm:ml-4 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.first_name} {user.last_name}
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
                          {user.company || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1 sm:space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              title="Edit user"
                            >
                              <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
                                  // TODO: Implement user activation/deactivation
                                }
                              }}
                              className={`inline-flex items-center px-2 sm:px-3 py-1.5 border rounded-lg transition-colors ${
                                user.is_active 
                                  ? 'border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                  : 'border-green-300 dark:border-green-600 bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                              title={user.is_active ? 'Deactivate user' : 'Activate user'}
                            >
                              <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {user.is_active ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                              <span className="hidden sm:inline">{user.is_active ? 'Deactivate' : 'Activate'}</span>
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
      </div>

      {users.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
          Total users: <span className="font-medium">{users.length}</span>
        </div>
      )}

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
