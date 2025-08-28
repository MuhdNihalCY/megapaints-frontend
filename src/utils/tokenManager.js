import Cookies from 'js-cookie';
import api from './api';

/**
 * Token Manager for handling refresh tokens and session extension
 * Manages both access tokens and refresh tokens stored in cookies
 */
class TokenManager {
  constructor() {
    this.isRefreshing = false;
    this.pendingRequests = [];
  }

  /**
 * Get refresh token from cookies
 * @returns {string|null} Refresh token or null if not found
 */
getRefreshToken() {
    try {
      // Debug: Log all available cookies
      console.log('[TokenManager] All cookies from js-cookie:', Cookies.get());
      console.log('[TokenManager] All cookies from document.cookie:', document.cookie);
      
      // Try js-cookie first
      let refreshToken = Cookies.get('refresh_token');
      
      console.debug('[TokenManager] getRefreshToken - js-cookie result:', {
        found: !!refreshToken,
        length: refreshToken?.length || 0,
        allCookies: Object.keys(Cookies.get())
      });
      
      // If js-cookie didn't find it, try direct document.cookie parsing
      if (!refreshToken) {
        console.debug('[TokenManager] js-cookie failed, trying document.cookie...');
        const allCookies = document.cookie.split(';');
        console.log('[TokenManager] Parsed cookies:', allCookies);
        
        for (const cookie of allCookies) {
          const [name, value] = cookie.trim().split('=');
          console.log('[TokenManager] Checking cookie:', { name, value: value ? value.substring(0, 20) + '...' : null });
          
          if (name === 'refresh_token' && value) {
            refreshToken = value;
            console.debug('[TokenManager] Found refresh_token via document.cookie');
            break;
          }
        }
      }
      
      if (refreshToken) {
        console.debug('[TokenManager] Refresh token found:', {
          length: refreshToken.length,
          preview: refreshToken.substring(0, 50) + '...'
        });
      } else {
        console.warn('[TokenManager] No refresh token found in any method');
        console.log('[TokenManager] Available cookie names:', document.cookie.split(';').map(c => c.trim().split('=')[0]));
      }
      
      return refreshToken;
    } catch (error) {
      console.error('[TokenManager] Error reading refresh token:', error);
      return null;
    }
  }

  /**
 * Get access token from cookies
 * @returns {string|null} Access token or null if not found
 */
getAccessToken() {
    try {
      // Try js-cookie first
      let accessToken = Cookies.get('auth_token') || Cookies.get('user_access_token') || Cookies.get('admin_access_token');
      
      console.debug('[TokenManager] getAccessToken - js-cookie result:', {
        found: !!accessToken,
        length: accessToken?.length || 0
      });
      
      // If js-cookie didn't find it, try direct document.cookie parsing
      if (!accessToken) {
        console.debug('[TokenManager] js-cookie failed for access token, trying document.cookie...');
        const allCookies = document.cookie.split(';');
        
        for (const cookie of allCookies) {
          const [name, value] = cookie.trim().split('=');
          if ((name === 'auth_token' || name === 'user_access_token' || name === 'admin_access_token') && value) {
            accessToken = value;
            console.debug('[TokenManager] Found access token via document.cookie:', name);
            break;
          }
        }
      }
      
      return accessToken;
    } catch (error) {
      console.error('[TokenManager] Error reading access token:', error);
      return null;
    }
  }

  /**
   * Store tokens in cookies
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {string} role - User role ('user' or 'admin')
   */
  storeTokens(accessToken, refreshToken, role = 'user') {
    try {
      // Store access token using the same name as backend (auth_token)
      const accessTokenName = 'auth_token';
      
      // Set cookies with appropriate expiration
      Cookies.set(accessTokenName, accessToken, { 
        expires: 1, // 1 day for access token
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      if (refreshToken) {
        Cookies.set('refresh_token', refreshToken, { 
          expires: 30, // 30 days for refresh token
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }

      console.debug('[TokenManager] Tokens stored successfully');
    } catch (error) {
      console.error('[TokenManager] Error storing tokens:', error);
    }
  }

  /**
   * Clear all tokens from cookies and localStorage
   */
  clearTokens() {
    try {
      // Clear cookies
      Cookies.remove('auth_token');
      Cookies.remove('user_access_token');
      Cookies.remove('admin_access_token');
      Cookies.remove('refresh_token');
      
      // Clear localStorage
      localStorage.removeItem('user_access_token');
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('access_token');
      
      console.debug('[TokenManager] All tokens cleared');
    } catch (error) {
      console.error('[TokenManager] Error clearing tokens:', error);
    }
  }

  /**
   * Check if access token is expired
   * @param {string} token - JWT token to check
   * @param {number} bufferSeconds - Buffer time in seconds before considering token expired
   * @returns {boolean} True if token is expired (or will expire within buffer)
   */
  isTokenExpired(token, bufferSeconds = 0) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < (currentTime + bufferSeconds);
    } catch (error) {
      console.error('[TokenManager] Error parsing token:', error);
      return true;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} role - User role ('user' or 'admin')
   * @returns {Promise<Object>} Result with success status and tokens
   */
  async refreshAccessToken(role = 'user') {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      console.warn('[TokenManager] No refresh token available');
      return { success: false, message: 'No refresh token available' };
    }

    if (this.isRefreshing) {
      // If already refreshing, wait for the current refresh to complete
      return new Promise((resolve) => {
        this.pendingRequests.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      console.info('[TokenManager] Refreshing access token...');
      
      const endpoint = role === 'admin' ? '/admin/auth/refresh' : '/auth/refresh';
      const response = await api.post(endpoint, {
        refreshToken: refreshToken
      }, {
        _noIntercept: true // Prevent infinite loop
      });

      if (response.data.status) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        this.storeTokens(accessToken, newRefreshToken, role);
        
        console.info('[TokenManager] Access token refreshed successfully');
        
        // Resolve pending requests
        this.pendingRequests.forEach(resolve => resolve({ 
          success: true, 
          accessToken, 
          refreshToken: newRefreshToken 
        }));
        this.pendingRequests = [];
        
        return { success: true, accessToken, refreshToken: newRefreshToken };
      } else {
        throw new Error(response.data.message || 'Refresh failed');
      }
    } catch (error) {
      console.error('[TokenManager] Token refresh failed:', error);
      
      // Clear tokens on refresh failure
      this.clearTokens();
      
      // Reject pending requests
      this.pendingRequests.forEach(resolve => resolve({ 
        success: false, 
        message: error.message || 'Refresh failed' 
      }));
      this.pendingRequests = [];
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Token refresh failed' 
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Check if user has valid session (either valid access token or refresh token available)
   * @returns {boolean} True if user has valid session
   */
  hasValidSession() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    console.debug('[TokenManager] hasValidSession check:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenExpired: accessToken ? this.isTokenExpired(accessToken) : true,
      refreshTokenExpired: refreshToken ? this.isTokenExpired(refreshToken) : true
    });
    
    // If we have a valid access token, session is valid
    if (accessToken && !this.isTokenExpired(accessToken)) {
      console.debug('[TokenManager] Valid access token found');
      return true;
    }
    
    // If we have a refresh token, we can potentially refresh the session
    if (refreshToken && !this.isTokenExpired(refreshToken)) {
      console.debug('[TokenManager] Valid refresh token found');
      return true;
    }
    
    console.debug('[TokenManager] No valid session found');
    return false;
  }

  /**
   * Get user role from stored tokens
   * @returns {string|null} User role or null if not found
   */
  getUserRole() {
    try {
      // Check for auth_token first (your backend's cookie name)
      const authToken = Cookies.get('auth_token');
      if (authToken) {
        try {
          // Try to decode the token to get role information
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          // Check if it's an admin token by looking for admin-specific fields
          if (payload.role === 'admin' || payload.designation === 'Admin') {
            return 'admin';
          } else {
            return 'user';
          }
        } catch (error) {
          console.warn('[TokenManager] Could not decode auth_token, defaulting to user');
          return 'user';
        }
      }
      
      // Fallback to role-specific cookies
      if (Cookies.get('admin_access_token')) {
        return 'admin';
      } else if (Cookies.get('user_access_token')) {
        return 'user';
      }
      return null;
    } catch (error) {
      console.error('[TokenManager] Error getting user role:', error);
      return null;
    }
  }

  /**
   * Extend session by refreshing tokens if needed
   * @param {string} role - User role ('user' or 'admin')
   * @returns {Promise<boolean>} True if session was extended successfully
   */
  async extendSession(role = 'user') {
    const accessToken = this.getAccessToken();
    
    // If access token is still valid, no need to refresh
    if (accessToken && !this.isTokenExpired(accessToken)) {
      console.debug('[TokenManager] Access token still valid, no refresh needed');
      return true;
    }
    
    // Try to refresh the token
    const result = await this.refreshAccessToken(role);
    return result.success;
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

export default tokenManager;
