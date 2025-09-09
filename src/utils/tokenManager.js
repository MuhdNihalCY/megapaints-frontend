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
            console.debug('[TokenManager] Getting refresh token...');
            
            // Try js-cookie first
            let refreshToken = Cookies.get('refresh_token');
            console.debug('[TokenManager] js-cookie result:', refreshToken ? 'Found' : 'Not found');

            // If js-cookie didn't find it, try direct document.cookie parsing
            if (!refreshToken) {
                console.debug('[TokenManager] Trying manual cookie parsing...');
                const allCookies = document.cookie;
                console.debug('[TokenManager] All cookies:', allCookies);
                
                const cookieArray = allCookies.split(';');
                for (const cookie of cookieArray) {
                    const [name, value] = cookie.trim().split('=');
                    console.debug('[TokenManager] Checking cookie:', name, '=', value ? 'has value' : 'no value');
                    if (name === 'refresh_token' && value) {
                        refreshToken = value;
                        console.debug('[TokenManager] Found refresh token via manual parsing');
                        break;
                    }
                }
            }

            console.debug('[TokenManager] Final refresh token result:', refreshToken ? 'Found' : 'Not found');
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

            // If js-cookie didn't find it, try direct document.cookie parsing
            if (!accessToken) {
                const allCookies = document.cookie.split(';');
                for (const cookie of allCookies) {
                    const [name, value] = cookie.trim().split('=');
                    if ((name === 'auth_token' || name === 'user_access_token' || name === 'admin_access_token') && value) {
                        accessToken = value;
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
        // For HttpOnly cookies, we don't need to read the refresh token
        // The backend will automatically use the HttpOnly refresh_token cookie
        console.info('[TokenManager] Refreshing access token for role:', role);

        if (this.isRefreshing) {
            // If already refreshing, wait for the current refresh to complete
            console.debug('[TokenManager] Already refreshing, queuing request');
            return new Promise((resolve) => {
                this.pendingRequests.push(resolve);
            });
        }

        this.isRefreshing = true;

        try {
            const endpoint = role === 'admin' ? '/admin/auth/refresh' : '/auth/refresh';
            console.debug('[TokenManager] Calling endpoint:', endpoint);
            
            // For HttpOnly cookies, we don't send the refresh token in the body
            // The backend will automatically use the HttpOnly refresh_token cookie
            const response = await api.post(endpoint, {}, {
                _noIntercept: true, // Prevent infinite loop
                timeout: 10000 // 10 second timeout
            });

            console.debug('[TokenManager] Refresh response:', {
                status: response.status,
                dataStatus: response.data?.status,
                hasAccessToken: !!response.data?.accessToken,
                hasRefreshToken: !!response.data?.refreshToken
            });

            if (response.data && response.data.status) {
                const { accessToken, refreshToken: newRefreshToken } = response.data;

                if (!accessToken) {
                    throw new Error('No access token in refresh response');
                }

                // Store new tokens (the backend will handle refresh token storage)
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
                const errorMsg = response.data?.message || 'Refresh failed - invalid response';
                console.error('[TokenManager] Refresh failed:', errorMsg, response.data);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('[TokenManager] Token refresh failed:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });

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
        // For HttpOnly cookies, we can't check the refresh token directly
        // We'll assume we have a valid session if we have any access token
        // The backend will handle refresh token validation

        console.debug('[TokenManager] hasValidSession check:', {
            hasAccessToken: !!accessToken,
            accessTokenExpired: accessToken ? this.isTokenExpired(accessToken) : true,
            note: 'Refresh token is HttpOnly, cannot check directly'
        });

        // If we have a valid access token, session is valid
        if (accessToken && !this.isTokenExpired(accessToken)) {
            console.debug('[TokenManager] Valid access token found');
            return true;
        }

        // For HttpOnly refresh tokens, we assume we can try to refresh
        // The backend will validate the refresh token
        if (accessToken) {
            console.debug('[TokenManager] Access token expired, but will try refresh with HttpOnly cookie');
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
        // For HttpOnly cookies, we can't check the refresh token directly

        console.debug('[TokenManager] Extending session for role:', role, {
            hasAccessToken: !!accessToken,
            accessTokenExpired: accessToken ? this.isTokenExpired(accessToken) : true,
            note: 'Refresh token is HttpOnly, backend will validate'
        });

        // If access token is still valid, no need to refresh
        if (accessToken && !this.isTokenExpired(accessToken)) {
            console.debug('[TokenManager] Access token still valid, no refresh needed');
            return true;
        }

        // For HttpOnly refresh tokens, we try to refresh and let the backend validate
        if (!accessToken) {
            console.warn('[TokenManager] No access token available for session extension');
            return false;
        }

        // Try to refresh the token
        console.info('[TokenManager] Access token expired, attempting refresh with HttpOnly cookie...');
        const result = await this.refreshAccessToken(role);
        
        if (result.success) {
            console.info('[TokenManager] Session extended successfully');
        } else {
            console.error('[TokenManager] Failed to extend session:', result.message);
        }
        
        return result.success;
    }
}

// Create singleton instance
const tokenManager = new TokenManager();

export default tokenManager;
