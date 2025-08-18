/**
 * Authentication Test Component
 * Simple component to test authentication with the backend
 */

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';

const AuthTest = () => {
  const { user } = useAuth();
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const testLogin = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test user login
      console.log('Testing user login...');
      try {
        const response = await api.post('/auth/login', loginData);
        results.userLogin = { success: true, data: response.data };
        console.log('✅ User login success:', response.data);
      } catch (error) {
        results.userLogin = { 
          success: false, 
          error: error.response?.data?.message || error.message 
        };
        console.error('❌ User login failed:', error.response?.data || error);
      }

      // Test admin login
      console.log('Testing admin login...');
      try {
        const response = await api.post('/admin/auth/login', loginData);
        results.adminLogin = { success: true, data: response.data };
        console.log('✅ Admin login success:', response.data);
      } catch (error) {
        results.adminLogin = { 
          success: false, 
          error: error.response?.data?.message || error.message 
        };
        console.error('❌ Admin login failed:', error.response?.data || error);
      }

      // Test auth/me endpoint
      console.log('Testing auth/me...');
      try {
        const response = await api.get('/auth/me');
        results.authMe = { success: true, data: response.data };
        console.log('✅ auth/me success:', response.data);
      } catch (error) {
        results.authMe = { 
          success: false, 
          error: error.response?.data?.message || error.message 
        };
        console.error('❌ auth/me failed:', error.response?.data || error);
      }

    } catch (error) {
      console.error('Auth test error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusIcon = (success) => success ? '✅' : '❌';

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Authentication Required</h2>
        <p className="text-gray-600">You must be logged in to test authentication endpoints.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Authentication Test</h2>
      
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={loginData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>
        </div>
        
        <button
          onClick={testLogin}
          disabled={loading || !loginData.username || !loginData.password}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Authentication'}
        </button>
      </div>

      {loading && (
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-600">Testing authentication...</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(testResults).map(([testName, result]) => (
          <div key={testName} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{testName}</h3>
              <span className="text-2xl">{getStatusIcon(result.success)}</span>
            </div>
            
            {result.success ? (
              <div className="text-green-600">
                <p>✅ Success</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                <p>❌ Failed</p>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Test Credentials</h3>
        <p className="text-sm text-blue-700 mb-2">
          Try these common test credentials:
        </p>
        <div className="space-y-1 text-sm">
          <button
            onClick={() => setLoginData({ username: 'admin', password: 'admin' })}
            className="block text-blue-600 hover:text-blue-800"
          >
            admin / admin
          </button>
          <button
            onClick={() => setLoginData({ username: 'user', password: 'user' })}
            className="block text-blue-600 hover:text-blue-800"
          >
            user / user
          </button>
          <button
            onClick={() => setLoginData({ username: 'test', password: 'test' })}
            className="block text-blue-600 hover:text-blue-800"
          >
            test / test
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
