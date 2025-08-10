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
        console.debug('[Auth] Checking user session via /auth/me');
        try {
          const res = await api.get('/auth/me');
          console.debug('[Auth] /auth/me http', res?.status);
          if (res?.data?.status) {
            setUser({ username: res.data.user?.username, role: 'user' });
            localStorage.setItem('lastRole', 'user');
            console.info('[Auth] User session valid');
            return true;
          }
          console.warn('[Auth] /auth/me returned status=false', res?.data);
          return false;
        } catch (err) {
          const status = err?.response?.status;
          if (status === 401) {
            console.warn('[Auth] User token expired/invalid (401) on /auth/me');
          } else {
            console.error('[Auth] /auth/me request error', err?.message || err);
          }
          return false;
        }
      };

      const tryAdminMe = async () => {
        console.debug('[Auth] Checking admin session via /admin/auth/me');
        try {
          const res = await api.get('/admin/auth/me');
          console.debug('[Auth] /admin/auth/me http', res?.status);
          if (res?.data?.status) {
            setUser({ username: res.data.user?.username, role: 'admin' });
            localStorage.setItem('lastRole', 'admin');
            console.info('[Auth] Admin session valid');
            return true;
          }
          console.warn('[Auth] /admin/auth/me returned status=false', res?.data);
          return false;
        } catch (err) {
          const status = err?.response?.status;
          if (status === 401) {
            console.warn('[Auth] Admin token expired/invalid (401) on /admin/auth/me');
          } else {
            console.error('[Auth] /admin/auth/me request error', err?.message || err);
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

  const login = async (username, password, role = 'user') => {
    try {
      const endpoint = role === 'admin' ? '/admin/auth/login' : '/auth/login';
      const response = await api.post(endpoint, { username, password });

      if (response.data.status) {
        localStorage.setItem('lastRole', role);
        // Server sets cookies; trust /me to reflect state
        await hydrateSession();
        return { success: true, redirect: response.data.redirect };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call both logout endpoints to ensure server clears any HttpOnly cookies
      await Promise.allSettled([
        api.post('/auth/logout', {}),
        api.post('/admin/auth/logout', {}),
      ]);
    } catch (e) {
      // ignore, proceed to local clear
    } finally {
      // Best-effort cookie removal (httpOnly cookies removed by server; non-httpOnly we clear here)
      const cookieNames = [
        'user_access_token',
        'admin_access_token',
        'access_token',
        'user_refresh_token',
        'admin_refresh_token',
        'refresh_token',
      ];
      cookieNames.forEach((name) => {
        Cookies.remove(name);
        Cookies.remove(name, { path: '/' });
        Cookies.remove(name, { path: '/api' });
        Cookies.remove(name, { path: '/api/auth' });
        Cookies.remove(name, { path: '/api/admin/auth' });
        Cookies.remove(name, { domain: window.location.hostname });
        Cookies.remove(name, { domain: window.location.hostname, path: '/' });
      });
      localStorage.removeItem('lastRole');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    refreshSession: hydrateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
