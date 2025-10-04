/**
 * ApiStatusNotification Component
 * Shows notification about API status and mock data usage
 */

import React, { useState, useEffect } from 'react';

const ApiStatusNotification = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [apiStatus, setApiStatus] = useState({
    boardManagement: 'mock',
    labelManagement: 'mock',
    users: 'available'
  });

  useEffect(() => {
    // Check API status on component mount
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      // Check if board management APIs are available
      const boardResponse = await fetch('/api/board');
      if (boardResponse.ok) {
        setApiStatus(prev => ({ ...prev, boardManagement: 'available' }));
      }
    } catch (error) {
      console.log('Board management API not available, using mock data');
    }

    try {
      // Check if label management APIs are available
      const labelResponse = await fetch('/api/label');
      if (labelResponse.ok) {
        setApiStatus(prev => ({ ...prev, labelManagement: 'available' }));
      }
    } catch (error) {
      console.log('Label management API not available, using mock data');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const hasMockData = apiStatus.boardManagement === 'mock' || apiStatus.labelManagement === 'mock';

  if (!hasMockData) return null;

  return (
    <div className="api-status-notification bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Development Mode - Mock Data Active
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              The following features are currently using mock data for development:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {apiStatus.boardManagement === 'mock' && (
                <li>Board Management (Kanban boards, columns, cards)</li>
              )}
              {apiStatus.labelManagement === 'mock' && (
                <li>Label Management (labels, categories, colors)</li>
              )}
            </ul>
            <p className="mt-2">
              All data is stored locally and will be lost on page refresh. 
              This is normal behavior for development mode.
            </p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-1.5 text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiStatusNotification;