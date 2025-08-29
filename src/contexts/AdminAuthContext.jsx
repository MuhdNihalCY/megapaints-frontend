import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api, { setJwtToken, clearJwtToken, setUserRole } from '../utils/api';
import tokenManager from '../utils/tokenManager';
import sessionManager from '../utils/sessionManager';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session on first load using refresh tokens
  const hydrateSession = useCallback(async () => {
    try {
      console.debug('[AdminAuth] Hydrating admin session...');
      
      // Check if we have a valid session using refresh tokens
      if (!tokenManager.hasValidSession()) {
        console.warn('[AdminAuth] No valid session found');
        setAdmin(null);
        return;
      }

      // Get user role from stored tokens
      const role = tokenManager.getUserRole();
      if (role !== 'admin') {
        console.warn('[AdminAuth] Not an admin session, clearing');
        setAdmin(null);
        return;
      }

      // Try to extend session using refresh token
      const sessionExtended = await tokenManager.extendSession('admin');
      if (!sessionExtended) {
        console.warn('[AdminAuth] Failed to extend session');
        setAdmin(null);
        return;
      }

      // Now try to get admin info with fresh token
      console.debug('[AdminAuth] Checking admin session via /api/admin/auth/me');
      try {
        const res = await api.get('/admin/auth/me');
        console.debug('[AdminAuth] /api/admin/auth/me http', res?.status);
        if (res?.data?.status) {
          setAdmin({ 
            username: res.data.user?.username, 
            role: 'admin',
            ...res.data.user 
          });
          localStorage.setItem('lastRole', 'admin');
          
          // Set token if provided in response
          const token = res.data.token || res.data.accessToken;
          if (token) {
            setJwtToken(token, 'admin');
            setUserRole('admin');
          }
          
          console.info('[AdminAuth] Admin session valid');
          
          // Start session extension
          sessionManager.startSessionExtension('admin');
          return;
        }
        console.warn('[AdminAuth] /api/admin/auth/me returned status=false', res?.data);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          console.warn('[AdminAuth] Admin token expired/invalid (401) on /api/admin/auth/me');
        } else {
          console.error('[AdminAuth] /api/admin/auth/me request error', err?.message || err);
        }
      }
      
      // If we get here, session is invalid
      setAdmin(null);
    } catch (error) {
      console.error('[AdminAuth] Error hydrating session:', error);
      setAdmin(null);
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
        console.debug('[AdminAuth] Keep-alive tick: revalidating session');
        await hydrateSession();
      } catch (_) {}
    };

    // Periodic keep-alive (sliding window on server if supported)
    intervalId = window.setInterval(tick, KEEP_ALIVE_MS);

    // Re-validate when tab becomes active
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.debug('[AdminAuth] Tab visible: revalidating session');
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [hydrateSession]);

  const login = useCallback(async (credentials) => {
    try {
      console.debug('[AdminAuth] Attempting admin login...');
      const response = await api.post('/admin/auth/login', credentials);
      
      if (response.data.status) {
        const adminData = {
          username: response.data.user?.username,
          role: 'admin',
          ...response.data.user
        };
        
        // Store tokens using TokenManager
        const accessToken = response.data.token || response.data.accessToken;
        const refreshToken = response.data.refreshToken;
        
        if (accessToken) {
          tokenManager.storeTokens(accessToken, refreshToken, 'admin');
          setJwtToken(accessToken, 'admin');
          setUserRole('admin');
        }
        
        setAdmin(adminData);
        localStorage.setItem('lastRole', 'admin');
        
        // Start proactive session extension
        sessionManager.startSessionExtension('admin');
        
        console.info('[AdminAuth] Admin login successful');
        return { success: true, admin: adminData };
      } else {
        console.warn('[AdminAuth] Login failed:', response.data.message);
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('[AdminAuth] Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.debug('[AdminAuth] Logging out admin...');
      await api.post('/admin/auth/logout');
    } catch (error) {
      console.warn('[AdminAuth] Logout error (continuing anyway):', error);
    } finally {
      setAdmin(null);
      localStorage.removeItem('lastRole');
      // Stop session extension
      sessionManager.stopSessionExtension();
      // Clear all tokens using TokenManager
      tokenManager.clearTokens();
      clearJwtToken();
      console.info('[AdminAuth] Admin logged out');
    }
  }, []);

  const value = {
    admin,
    loading,
    login,
    logout,
    hydrateSession
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
