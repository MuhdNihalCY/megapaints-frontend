import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import tokenManager from '../utils/tokenManager';
import sessionManager from '../utils/sessionManager';

/**
 * Session Status Component
 * Shows current session state and token information for debugging
 */
const SessionStatus = () => {
  const { user } = useAuth();
  const [sessionStatus, setSessionStatus] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    const updateStatus = () => {
      const status = sessionManager.getSessionStatus();
      setSessionStatus(status);

      // Get token information
      const accessToken = tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();
      
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          const expiresIn = Math.max(0, payload.exp - currentTime);
          
          setTokenInfo({
            expiresIn: Math.floor(expiresIn),
            expiresAt: new Date(payload.exp * 1000).toLocaleString(),
            issuedAt: new Date(payload.iat * 1000).toLocaleString(),
            username: payload.username,
            role: payload.role
          });
        } catch (error) {
          setTokenInfo({ error: 'Failed to parse token' });
        }
      } else {
        setTokenInfo(null);
      }
    };

    // Update immediately
    updateStatus();

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return null; // Don't show when not logged in
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm text-xs">
      <div className="font-semibold mb-2">Session Status</div>
      
      {sessionStatus && (
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>Role:</span>
            <span className={sessionStatus.role === 'admin' ? 'text-red-400' : 'text-blue-400'}>
              {sessionStatus.role}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Extension Active:</span>
            <span className={sessionStatus.isActive ? 'text-green-400' : 'text-red-400'}>
              {sessionStatus.isActive ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Access Token:</span>
            <span className={sessionStatus.hasAccessToken ? 'text-green-400' : 'text-red-400'}>
              {sessionStatus.hasAccessToken ? 'Valid' : 'Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Refresh Token:</span>
            <span className={sessionStatus.hasRefreshToken ? 'text-green-400' : 'text-red-400'}>
              {sessionStatus.hasRefreshToken ? 'Available' : 'Missing'}
            </span>
          </div>
        </div>
      )}

      {tokenInfo && !tokenInfo.error && (
        <div className="space-y-1 mb-3">
          <div className="font-semibold text-sm">Access Token Info</div>
          <div className="flex justify-between">
            <span>Expires in:</span>
            <span className={tokenInfo.expiresIn < 300 ? 'text-red-400' : 'text-green-400'}>
              {Math.floor(tokenInfo.expiresIn / 60)}m {tokenInfo.expiresIn % 60}s
            </span>
          </div>
          <div className="flex justify-between">
            <span>Username:</span>
            <span>{tokenInfo.username}</span>
          </div>
        </div>
      )}

      {tokenInfo?.error && (
        <div className="text-red-400 text-xs">
          Token Error: {tokenInfo.error}
        </div>
      )}

      <div className="text-xs text-gray-400">
        Auto-refresh: Every 5 minutes
      </div>
    </div>
  );
};

export default SessionStatus;
