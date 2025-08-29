/**
 * Kanban Test Component
 * Simple component to test backend connection and API endpoints
 */

import { useState, useEffect } from 'react';
import { useUserAuth } from '../../../contexts/UserAuthContext';
import { kanbanService } from '../services/kanbanService';
import { logTokenStatus } from '../../../utils/tokenDebug';

const KanbanTest = () => {
  const { user } = useUserAuth();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    // Log token status before running tests
    console.log('=== Token Status Before Tests ===');
    logTokenStatus();

    try {
      // Test 1: Get board data
      console.log('Testing getBoard...');
      try {
        const boardData = await kanbanService.getBoard();
        results.getBoard = { success: true, data: boardData };
        console.log('✅ getBoard success:', boardData);
      } catch (error) {
        results.getBoard = { success: false, error: error.message };
        console.error('❌ getBoard failed:', error);
      }

      // Test 2: Get columns
      console.log('Testing getColumns...');
      try {
        const columns = await kanbanService.getColumns();
        results.getColumns = { success: true, data: columns };
        console.log('✅ getColumns success:', columns);
      } catch (error) {
        results.getColumns = { success: false, error: error.message };
        console.error('❌ getColumns failed:', error);
      }

      // Test 3: Get cards
      console.log('Testing getCards...');
      try {
        const cards = await kanbanService.getCards();
        results.getCards = { success: true, data: cards };
        console.log('✅ getCards success:', cards);
      } catch (error) {
        results.getCards = { success: false, error: error.message };
        console.error('❌ getCards failed:', error);
      }

      // Test 4: Get users
      console.log('Testing getUsers...');
      try {
        const users = await kanbanService.getUsers();
        results.getUsers = { success: true, data: users };
        console.log('✅ getUsers success:', users);
      } catch (error) {
        results.getUsers = { success: false, error: error.message };
        console.error('❌ getUsers failed:', error);
      }

    } catch (error) {
      console.error('Test suite error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runTests();
    }
  }, [user]);

  const getStatusIcon = (success) => success ? '✅' : '❌';

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Authentication Required</h2>
        <p className="text-gray-600">You must be logged in to test the backend connection.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Backend Connection Test</h2>
      
      {loading && (
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Testing backend connection...</p>
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

      <button
        onClick={runTests}
        disabled={loading}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Tests Again'}
      </button>
    </div>
  );
};

export default KanbanTest;
