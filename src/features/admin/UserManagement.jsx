import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiServiceFactory from '../../services/ApiServiceFactory.js';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const { apiRequest } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Debug authentication status
      const adminUser = localStorage.getItem('adminUser');
      const accessToken = localStorage.getItem('accessToken');
      const debugData = {
        adminUser: adminUser ? 'Logged in' : 'Not logged in',
        accessToken: accessToken ? 'Present' : 'Missing',
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'None',
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 Debug Info:', debugData);
      setDebugInfo(JSON.stringify(debugData, null, 2));
      
      if (!adminUser || !accessToken) {
        setError('❌ Not logged in as admin. Please login at /admin/login first.');
        return;
      }
      
      console.log('🚀 Attempting to fetch users using new API service');
      
      // Use the new API service factory
      const adminServices = apiServiceFactory.initializeAdminServices();
      const response = await adminServices.businessManagement.getUsers();
      
      if (response.status === 'success') {
        console.log('✅ Successfully fetched users:', response.data.users?.length || 0);
        setUsers(response.data.users || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('❌ Detailed error fetching users:', err);
      
      if (err.message && err.message.includes('Route not found')) {
        setError('❌ Route not found: GET /api/admin/users. Trying alternative route...');
        // Try alternative route
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
      console.log('🔄 Trying alternative route: /admin/business/users');
      const response = await apiRequest('/admin/business/users');
      
      if (response.status === 'success') {
        console.log('✅ Alternative route worked! Users:', response.data.users?.length || 0);
        setUsers(response.data.users || []);
        setError('✅ Users loaded via alternative route (/admin/business/users)');
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

      console.log('🧪 Testing direct API call to /api/admin/users');
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('📊 Direct API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.text();
      console.log('📄 Response Data:', data);

      if (response.ok) {
        const jsonData = JSON.parse(data);
        setUsers(jsonData.data?.users || []);
        setError('✅ Direct API call successful!');
      } else {
        setError(`❌ Direct API failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Direct API test failed:', err);
      setError(`❌ Direct API test failed: ${err.message}`);
    }
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={testDirectAPI}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test Direct API
          </button>
          <button
            onClick={tryAlternativeRoute}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Alternative Route
          </button>
        </div>
      </div>

      {/* Debug Information Panel */}
      {debugInfo && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🔍 Debug Information</h3>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32">
            {debugInfo}
          </pre>
        </div>
      )}

      {error && (
        <div className={`px-4 py-3 rounded-lg mb-6 ${
          error.includes('✅') 
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Total users: {users.length}
      </div>
    </div>
  );
};

export default UserManagement;
