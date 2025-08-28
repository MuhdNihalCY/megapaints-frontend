import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api, { setJwtToken, clearJwtToken, setUserRole } from '../utils/api';
import tokenManager from '../utils/tokenManager';
import sessionManager from '../utils/sessionManager';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session on first load using refresh tokens
  const hydrateSession = useCallback(async () => {
    try {
      console.debug('[Auth] Hydrating session...');
      
      // Debug: Check what tokens are available
      const accessToken = tokenManager.getAccessToken();
      const refreshToken = tokenManager.getRefreshToken();
      const role = tokenManager.getUserRole();
      
      console.debug('[Auth] Token check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        role: role,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });
      
      // Check if we have a valid session using refresh tokens
      if (!tokenManager.hasValidSession()) {
        console.warn('[Auth] No valid session found');
        setUser(null);
        return;
      }

      // Get user role from stored tokens
      if (!role) {
        console.warn('[Auth] No user role found in tokens');
        setUser(null);
        return;
      }

      // Try to extend session using refresh token
      const sessionExtended = await tokenManager.extendSession(role);
      if (!sessionExtended) {
        console.warn('[Auth] Failed to extend session');
        setUser(null);
        return;
      }

      // Now try to get user info with fresh token
      const tryUserMe = async () => {
        console.debug('[Auth] Checking user session via /api/auth/me');
        try {
          const res = await api.get('/auth/me');
          console.debug('[Auth] /api/auth/me http', res?.status);
          if (res?.data?.status) {
            setUser({ username: res.data.user?.username, role: 'user' });
            localStorage.setItem('lastRole', 'user');
            
            // Set token if provided in response
            const token = res.data.token || res.data.accessToken;
            if (token) {
              setJwtToken(token, 'user');
              setUserRole('user');
            }
            
            console.info('[Auth] User session valid');
            return true;
          }
          console.warn('[Auth] /api/auth/me returned status=false', res?.data);
          return false;
        } catch (err) {
          const status = err?.response?.status;
          if (status === 401) {
            console.warn('[Auth] User token expired/invalid (401) on /api/auth/me');
          } else {
            console.error('[Auth] /api/auth/me request error', err?.message || err);
          }
          return false;
        }
      };

      const tryAdminMe = async () => {
        console.debug('[Auth] Checking admin session via /api/admin/auth/me');
        try {
          const res = await api.get('/admin/auth/me');
          console.debug('[Auth] /api/admin/auth/me http', res?.status);
          if (res?.data?.status) {
            setUser({ username: res.data.user?.username, role: 'admin' });
            localStorage.setItem('lastRole', 'admin');
            
            // Set token if provided in response
            const token = res.data.token || res.data.accessToken;
            if (token) {
              setJwtToken(token, 'admin');
              setUserRole('admin');
            }
            
            console.info('[Auth] Admin session valid');
            return true;
          }
          console.warn('[Auth] /api/admin/auth/me returned status=false', res?.data);
          return false;
        } catch (err) {
          const status = err?.response?.status;
          if (status === 401) {
            console.warn('[Auth] Admin token expired/invalid (401) on /api/admin/auth/me');
          } else {
            console.error('[Auth] /api/admin/auth/me request error', err?.message || err);
          }
          return false;
        }
      };

      // Try based on role
      if (role === 'user') {
        try {
          if (await tryUserMe()) {
            // Start session extension for user
            sessionManager.startSessionExtension('user');
            return;
          }
        } catch (_) {}
        try {
          if (await tryAdminMe()) {
            // Start session extension for admin
            sessionManager.startSessionExtension('admin');
            return;
          }
        } catch (_) {}
      } else if (role === 'admin') {
        try {
          if (await tryAdminMe()) {
            // Start session extension for admin
            sessionManager.startSessionExtension('admin');
            return;
          }
        } catch (_) {}
        try {
          if (await tryUserMe()) {
            // Start session extension for user
            sessionManager.startSessionExtension('user');
            return;
          }
        } catch (_) {}
      }
      
      // Fallback: Try the old approach if TokenManager approach failed
      console.warn('[Auth] TokenManager approach failed, trying fallback...');
      const lastRole = localStorage.getItem('lastRole');
      
      if (lastRole === 'user') {
        try {
          if (await tryUserMe()) {
            sessionManager.startSessionExtension('user');
            return;
          }
        } catch (_) {}
        try {
          if (await tryAdminMe()) {
            sessionManager.startSessionExtension('admin');
            return;
          }
        } catch (_) {}
      } else if (lastRole === 'admin') {
        try {
          if (await tryAdminMe()) {
            sessionManager.startSessionExtension('admin');
            return;
          }
        } catch (_) {}
        try {
          if (await tryUserMe()) {
            sessionManager.startSessionExtension('user');
            return;
          }
        } catch (_) {}
      } else {
        // No hint; try only user to avoid noisy admin 401s on first load
        try {
          if (await tryUserMe()) {
            sessionManager.startSessionExtension('user');
            return;
          }
        } catch (_) {}
      }
      
      // If neither worked, clear
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  // Keep-alive timer and focus-based rehydrate
  useEffect(() => {
    let intervalId;
    const KEEP_ALIVE_MS = 4 * 60 * 1000; // 4 minutes

    const tick = async () => {
      try {
        console.debug('[Auth] Keep-alive tick: revalidating session');
        await hydrateSession();
      } catch (_) {}
    };

    // Periodic keep-alive (sliding window on server if supported)
    intervalId = window.setInterval(tick, KEEP_ALIVE_MS);

    // Re-validate when tab becomes active
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.debug('[Auth] Tab visible: revalidating session');
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hydrateSession]);

  const login = useCallback(async (credentials, isAdmin = false) => {
    try {
      const endpoint = isAdmin ? '/admin/auth/login' : '/auth/login';
      const response = await api.post(endpoint, credentials);
      
      if (response.data.status) {
        const userData = {
          username: response.data.user?.username,
          role: isAdmin ? 'admin' : 'user'
        };
        
        // Store tokens using TokenManager
        const accessToken = response.data.token || response.data.accessToken;
        const refreshToken = response.data.refreshToken;
        const role = isAdmin ? 'admin' : 'user';
        
        if (accessToken) {
          tokenManager.storeTokens(accessToken, refreshToken, role);
          setJwtToken(accessToken, role); // Set for immediate use with role
          setUserRole(role); // Set the role for token selection
        }
        
        setUser(userData);
        localStorage.setItem('lastRole', userData.role);
        
        // Start proactive session extension
        sessionManager.startSessionExtension(role);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/admin/auth/logout' : '/auth/logout';
      await api.post(endpoint);
    } catch (error) {
      console.warn('[Auth] Logout error (continuing anyway):', error);
    } finally {
      setUser(null);
      localStorage.removeItem('lastRole');
      // Stop session extension
      sessionManager.stopSessionExtension();
      // Clear all tokens using TokenManager
      tokenManager.clearTokens();
      clearJwtToken(); // Clear in-memory token
    }
  }, [user?.role]);

  const value = {
    user,
    loading,
    login,
    logout,
    hydrateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

