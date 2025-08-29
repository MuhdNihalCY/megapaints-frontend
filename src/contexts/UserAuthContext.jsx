import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api, { setJwtToken, clearJwtToken, setUserRole } from '../utils/api';
import tokenManager from '../utils/tokenManager';
import sessionManager from '../utils/sessionManager';

const UserAuthContext = createContext();

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session on first load using refresh tokens
  const hydrateSession = useCallback(async () => {
    try {
      console.debug('[UserAuth] Hydrating user session...');
      
      // Check if we have a valid session using refresh tokens
      if (!tokenManager.hasValidSession()) {
        console.warn('[UserAuth] No valid session found');
        setUser(null);
        return;
      }

      // Get user role from stored tokens
      const role = tokenManager.getUserRole();
      if (role !== 'user') {
        console.warn('[UserAuth] Not a user session, clearing');
        setUser(null);
        return;
      }

      // Try to extend session using refresh token
      const sessionExtended = await tokenManager.extendSession('user');
      if (!sessionExtended) {
        console.warn('[UserAuth] Failed to extend session');
        setUser(null);
        return;
      }

      // Now try to get user info with fresh token
      console.debug('[UserAuth] Checking user session via /api/auth/me');
      try {
        const res = await api.get('/auth/me');
        console.debug('[UserAuth] /api/auth/me http', res?.status);
        if (res?.data?.status) {
          setUser({ 
            username: res.data.user?.username, 
            role: 'user',
            ...res.data.user 
          });
          localStorage.setItem('lastRole', 'user');
          
          // Set token if provided in response
          const token = res.data.token || res.data.accessToken;
          if (token) {
            setJwtToken(token, 'user');
            setUserRole('user');
          }
          
          console.info('[UserAuth] User session valid');
          
          // Start session extension
          sessionManager.startSessionExtension('user');
          return;
        }
        console.warn('[UserAuth] /api/auth/me returned status=false', res?.data);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          console.warn('[UserAuth] User token expired/invalid (401) on /api/auth/me');
        } else {
          console.error('[UserAuth] /api/auth/me request error', err?.message || err);
        }
      }
      
      // If we get here, session is invalid
      setUser(null);
    } catch (error) {
      console.error('[UserAuth] Error hydrating session:', error);
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
        console.debug('[UserAuth] Keep-alive tick: revalidating session');
        await hydrateSession();
      } catch (_) {}
    };

    // Periodic keep-alive (sliding window on server if supported)
    intervalId = window.setInterval(tick, KEEP_ALIVE_MS);

    // Re-validate when tab becomes active
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.debug('[UserAuth] Tab visible: revalidating session');
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
      console.debug('[UserAuth] Attempting user login...');
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.status) {
        const userData = {
          username: response.data.user?.username,
          role: 'user',
          ...response.data.user
        };
        
        // Store tokens using TokenManager
        const accessToken = response.data.token || response.data.accessToken;
        const refreshToken = response.data.refreshToken;
        
        if (accessToken) {
          tokenManager.storeTokens(accessToken, refreshToken, 'user');
          setJwtToken(accessToken, 'user');
          setUserRole('user');
        }
        
        setUser(userData);
        localStorage.setItem('lastRole', 'user');
        
        // Start proactive session extension
        sessionManager.startSessionExtension('user');
        
        console.info('[UserAuth] User login successful');
        return { success: true, user: userData };
      } else {
        console.warn('[UserAuth] Login failed:', response.data.message);
        return { success: false, message: response.data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('[UserAuth] Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.debug('[UserAuth] Logging out user...');
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('[UserAuth] Logout error (continuing anyway):', error);
    } finally {
      setUser(null);
      localStorage.removeItem('lastRole');
      // Stop session extension
      sessionManager.stopSessionExtension();
      // Clear all tokens using TokenManager
      tokenManager.clearTokens();
      clearJwtToken();
      console.info('[UserAuth] User logged out');
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    hydrateSession
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};
