/**
 * Backend Test Page
 * Comprehensive test page for backend connection and API endpoints
 */

import { useState } from 'react';
import AuthTest from '../components/AuthTest';
import KanbanTest from '../components/KanbanTest';

const BackendTest = () => {
  const [activeTab, setActiveTab] = useState('auth');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Backend Connection Test
          </h1>
          <p className="text-gray-600">
            Test your backend connection and API endpoints
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('auth')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'auth'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Authentication Test
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API Endpoints Test
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'auth' && <AuthTest />}
          {activeTab === 'api' && <KanbanTest />}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>1. Authentication Test:</strong> Test login functionality with your backend.
              Try different credentials to see which ones work.
            </p>
            <p>
              <strong>2. API Endpoints Test:</strong> Test the Kanban board API endpoints.
              This will show you if the backend is properly configured and responding.
            </p>
            <p>
              <strong>Note:</strong> Make sure your backend server is running on{' '}
              <code className="bg-blue-100 px-1 rounded">http://localhost:3000</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendTest;
