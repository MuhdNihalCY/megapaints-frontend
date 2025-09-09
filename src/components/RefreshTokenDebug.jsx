import { useState, useEffect } from 'react';
import tokenManager from '../utils/tokenManager';
import Cookies from 'js-cookie';

const RefreshTokenDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const updateDebugInfo = () => {
      const refreshToken = tokenManager.getRefreshToken();
      const accessToken = tokenManager.getAccessToken();
      const userRole = tokenManager.getUserRole();
      const hasValidSession = tokenManager.hasValidSession();

      let refreshTokenInfo = null;
      let accessTokenInfo = null;

      if (refreshToken) {
        try {
          const payload = JSON.parse(atob(refreshToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          refreshTokenInfo = {
            payload,
            expiresAt: new Date(payload.exp * 1000),
            isExpired: payload.exp < currentTime,
            timeLeft: Math.max(0, payload.exp - currentTime)
          };
        } catch (error) {
          refreshTokenInfo = { error: error.message };
        }
      }

      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          accessTokenInfo = {
            payload,
            expiresAt: new Date(payload.exp * 1000),
            isExpired: payload.exp < currentTime,
            timeLeft: Math.max(0, payload.exp - currentTime)
          };
        } catch (error) {
          accessTokenInfo = { error: error.message };
        }
      }

      setDebugInfo({
        refreshToken: refreshTokenInfo,
        accessToken: accessTokenInfo,
        userRole,
        hasValidSession,
        allCookies: document.cookie
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const testRefreshToken = async () => {
    setTestResult('Testing refresh token...');
    try {
      // First, let's debug what we can find
      const refreshTokenFromCookies = Cookies.get('refresh_token');
      const refreshTokenFromManager = tokenManager.getRefreshToken();
      const allCookies = document.cookie;
      
      setTestResult(`Debug Info:
Cookies.get('refresh_token'): ${refreshTokenFromCookies ? 'Found' : 'Not found'}
tokenManager.getRefreshToken(): ${refreshTokenFromManager ? 'Found' : 'Not found'}
All cookies: ${allCookies}

🔍 NOTE: Refresh token is HttpOnly, so it's not accessible to JavaScript.
The backend will automatically use the HttpOnly refresh_token cookie.

Testing refresh with HttpOnly cookie approach...`);
      
      const result = await tokenManager.refreshAccessToken('user');
      setTestResult(`Refresh result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`Refresh error: ${error.message}`);
    }
  };

  const testExtendSession = async () => {
    setTestResult('Testing extend session...');
    try {
      const result = await tokenManager.extendSession('user');
      setTestResult(`Extend session result: ${result}`);
    } catch (error) {
      setTestResult(`Extend session error: ${error.message}`);
    }
  };

  const testCookieReading = () => {
    setTestResult('Testing cookie reading...');
    try {
      // Test different ways to read cookies
      const jsCookieResult = Cookies.get('refresh_token');
      const allCookies = document.cookie;
      const cookieArray = allCookies.split(';');
      let manualResult = null;
      
      for (const cookie of cookieArray) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'refresh_token' && value) {
          manualResult = value;
          break;
        }
      }
      
      setTestResult(`Cookie Reading Test:
js-cookie result: ${jsCookieResult ? 'Found' : 'Not found'}
Manual parsing result: ${manualResult ? 'Found' : 'Not found'}
All cookies: ${allCookies}
Cookie array: ${JSON.stringify(cookieArray, null, 2)}

🔍 ANALYSIS:
The refresh_token cookie is NOT accessible to JavaScript because it's set as HttpOnly by the backend.
This is a security feature that prevents client-side JavaScript from reading sensitive cookies.

✅ SOLUTION:
The refresh token flow has been updated to work with HttpOnly cookies.
The backend will automatically use the HttpOnly refresh_token cookie when we make refresh requests.`);
    } catch (error) {
      setTestResult(`Cookie reading error: ${error.message}`);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded shadow mb-4 max-w-4xl">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Refresh Token Debug</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Refresh Token</h4>
          {debugInfo.refreshToken ? (
            debugInfo.refreshToken.error ? (
              <div className="text-red-500">Error: {debugInfo.refreshToken.error}</div>
            ) : (
              <div className="text-sm space-y-1">
                <div>Username: {debugInfo.refreshToken.payload.username || 'N/A'}</div>
                <div>Role: {debugInfo.refreshToken.payload.role || 'N/A'}</div>
                <div>Expires: {debugInfo.refreshToken.expiresAt.toLocaleString()}</div>
                <div className={debugInfo.refreshToken.isExpired ? 'text-red-500' : 'text-green-500'}>
                  Status: {debugInfo.refreshToken.isExpired ? 'EXPIRED' : 'VALID'}
                </div>
                <div>Time Left: {Math.floor(debugInfo.refreshToken.timeLeft / 60)} minutes</div>
              </div>
            )
          ) : (
            <div className="text-red-500">No refresh token found</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 rounded">
          <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Access Token</h4>
          {debugInfo.accessToken ? (
            debugInfo.accessToken.error ? (
              <div className="text-red-500">Error: {debugInfo.accessToken.error}</div>
            ) : (
              <div className="text-sm space-y-1">
                <div>Username: {debugInfo.accessToken.payload.username || 'N/A'}</div>
                <div>Role: {debugInfo.accessToken.payload.role || 'N/A'}</div>
                <div>Expires: {debugInfo.accessToken.expiresAt.toLocaleString()}</div>
                <div className={debugInfo.accessToken.isExpired ? 'text-red-500' : 'text-green-500'}>
                  Status: {debugInfo.accessToken.isExpired ? 'EXPIRED' : 'VALID'}
                </div>
                <div>Time Left: {Math.floor(debugInfo.accessToken.timeLeft / 60)} minutes</div>
              </div>
            )
          ) : (
            <div className="text-red-500">No access token found</div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-3 rounded mb-4">
        <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Session Info</h4>
        <div className="text-sm space-y-1">
          <div>User Role: {debugInfo.userRole || 'None'}</div>
          <div>Has Valid Session: {debugInfo.hasValidSession ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button 
          onClick={testRefreshToken}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Test Refresh Token
        </button>
        <button 
          onClick={testExtendSession}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
        >
          Test Extend Session
        </button>
        <button 
          onClick={testCookieReading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
        >
          Test Cookie Reading
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
          <h4 className="font-semibold mb-2">Test Result:</h4>
          <pre className="text-xs whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}

      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mt-4">
        <h4 className="font-semibold mb-2">All Cookies:</h4>
        <pre className="text-xs whitespace-pre-wrap">{debugInfo.allCookies}</pre>
      </div>
    </div>
  );
};

export default RefreshTokenDebug;
