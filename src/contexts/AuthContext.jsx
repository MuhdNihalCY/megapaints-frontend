import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/api';

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

  // Hydrate session on first load using server-side validation
  const hydrateSession = useCallback(async () => {
    try {
      // Prefer checking the last known role to avoid unnecessary 401s
      const lastRole = localStorage.getItem('lastRole');

      const tryUserMe = async () => {
        console.debug('[Auth] Checking user session via /api/auth/me');
        try {
          const res = await api.get('/api/auth/me');
          console.debug('[Auth] /api/auth/me http', res?.status);
          if (res?.data?.status) {
            setUser({ username: res.data.user?.username, role: 'user' });
            localStorage.setItem('lastRole', 'user');
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
          const res = await api.get('/api/admin/auth/me');
          console.debug('[Auth] /api/admin/auth/me http', res?.status);
          if (res?.data?.status) {
            setUser({ username: res.data.user?.username, role: 'admin' });
            localStorage.setItem('lastRole', 'admin');
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

      if (lastRole === 'user') {
        try {
          if (await tryUserMe()) return;
        } catch (_) {}
        try {
          if (await tryAdminMe()) return;
        } catch (_) {}
      } else if (lastRole === 'admin') {
        try {
          if (await tryAdminMe()) return;
        } catch (_) {}
        try {
          if (await tryUserMe()) return;
        } catch (_) {}
      } else {
        // No hint; try only user to avoid noisy admin 401s on first load
        try {
          if (await tryUserMe()) return;
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
      const endpoint = isAdmin ? '/api/admin/auth/login' : '/api/auth/login';
      const response = await api.post(endpoint, credentials);
      
      if (response.data.status) {
        const userData = {
          username: response.data.user?.username,
          role: isAdmin ? 'admin' : 'user'
        };
        setUser(userData);
        localStorage.setItem('lastRole', userData.role);
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
      const endpoint = user?.role === 'admin' ? '/api/admin/auth/logout' : '/api/auth/logout';
      await api.post(endpoint);
    } catch (error) {
      console.warn('[Auth] Logout error (continuing anyway):', error);
    } finally {
      setUser(null);
      localStorage.removeItem('lastRole');
      // Clear any stored tokens
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_access_token');
        localStorage.removeItem('admin_access_token');
        Cookies.remove('access_token');
        Cookies.remove('user_access_token');
        Cookies.remove('admin_access_token');
      } catch (_) {}
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
