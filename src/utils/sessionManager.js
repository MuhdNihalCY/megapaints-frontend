import tokenManager from './tokenManager';

/**
 * Session Manager for proactive session extension
 * Keeps users logged in by refreshing tokens before they expire
 */
class SessionManager {
  constructor() {
    this.extensionInterval = null;
    this.extensionTimeout = null;
    this.isActive = false;
  }

  /**
   * Start proactive session extension
   * @param {string} role - User role ('user' or 'admin')
   */
  startSessionExtension(role = 'user') {
    if (this.isActive) {
      console.debug('[SessionManager] Session extension already active');
      return;
    }

    console.info('[SessionManager] Starting proactive session extension');
    this.isActive = true;

    // Check session every 5 minutes
    this.extensionInterval = setInterval(async () => {
      await this.extendSessionIfNeeded(role);
    }, 5 * 60 * 1000); // 5 minutes

    // Also check when tab becomes visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Stop proactive session extension
   */
  stopSessionExtension() {
    if (!this.isActive) {
      return;
    }

    console.info('[SessionManager] Stopping proactive session extension');
    this.isActive = false;

    if (this.extensionInterval) {
      clearInterval(this.extensionInterval);
      this.extensionInterval = null;
    }

    if (this.extensionTimeout) {
      clearTimeout(this.extensionTimeout);
      this.extensionTimeout = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle tab visibility change
   */
  handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && this.isActive) {
      console.debug('[SessionManager] Tab became visible, checking session');
      const role = tokenManager.getUserRole();
      if (role) {
        await this.extendSessionIfNeeded(role);
      }
    }
  };

  /**
   * Extend session if needed
   * @param {string} role - User role ('user' or 'admin')
   */
  async extendSessionIfNeeded(role) {
    try {
      const accessToken = tokenManager.getAccessToken();
      
      if (!accessToken) {
        console.warn('[SessionManager] No access token found');
        return false;
      }

      // Check if token will expire in the next 10 minutes
      const isExpiringSoon = tokenManager.isTokenExpired(accessToken, 10 * 60); // 10 minutes buffer
      
      if (isExpiringSoon) {
        console.info('[SessionManager] Token expiring soon, extending session...');
        const result = await tokenManager.refreshAccessToken(role);
        
        if (result.success) {
          console.info('[SessionManager] Session extended successfully');
          return true;
        } else {
          console.warn('[SessionManager] Failed to extend session:', result.message);
          return false;
        }
      } else {
        console.debug('[SessionManager] Token still valid, no extension needed');
        return true;
      }
    } catch (error) {
      console.error('[SessionManager] Error extending session:', error);
      return false;
    }
  }

  /**
   * Get session status
   * @returns {Object} Session status information
   */
  getSessionStatus() {
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();
    const role = tokenManager.getUserRole();
    
    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      role: role,
      isActive: this.isActive,
      accessTokenExpired: accessToken ? tokenManager.isTokenExpired(accessToken) : true,
      accessTokenExpiringSoon: accessToken ? tokenManager.isTokenExpired(accessToken, 10 * 60) : true
    };
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
