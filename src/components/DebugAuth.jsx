import { useAuth } from '../contexts/AuthContext';
import tokenManager from '../utils/tokenManager';

const DebugAuth = () => {
  const { user, loading } = useAuth();
  
  const accessToken = tokenManager.getAccessToken();
  const refreshToken = tokenManager.getRefreshToken();
  const userRole = tokenManager.getUserRole();
  const hasValidSession = tokenManager.hasValidSession();

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded shadow mb-4">
      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Auth Debug Info</h3>
      <div className="text-xs space-y-1 text-yellow-700 dark:text-yellow-300">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>User: {user ? JSON.stringify(user) : 'None'}</div>
        <div>Access Token: {accessToken ? `${accessToken.substring(0, 20)}...` : 'None'}</div>
        <div>Refresh Token: {refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None'}</div>
        <div>User Role: {userRole || 'None'}</div>
        <div>Has Valid Session: {hasValidSession ? 'Yes' : 'No'}</div>
        <div>Cookies: {document.cookie || 'None'}</div>
      </div>
    </div>
  );
};

export default DebugAuth;
