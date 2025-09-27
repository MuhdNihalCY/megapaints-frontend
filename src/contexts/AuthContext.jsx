import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../utils/authService';
import apiServiceFactory from '../services/ApiServiceFactory.js';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication on page load...');
        
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          console.log('👤 Found user in localStorage:', currentUser?.username || 'Unknown');
          
          if (currentUser) {
            // Set user immediately from localStorage (no API call needed)
            setUser(currentUser);
            setIsAdmin(authService.isAdmin());
            console.log('✅ User restored from localStorage');
            
            // Optionally validate session in background (non-blocking)
            try {
              console.log('🔄 Validating session in background...');
              const profile = await authService.getCurrentProfile();
              // Update user data with fresh profile if available
              if (profile.admin || profile.user) {
                setUser(profile.admin || profile.user);
                console.log('✅ Session validated, user data updated');
              }
            } catch (error) {
              console.warn('⚠️ Session validation failed, but keeping user logged in:', error.message);
              // Don't clear auth on validation failure - keep user logged in
              // Only clear if it's a critical error (like 401)
              if (error.message && error.message.includes('401')) {
                console.log('❌ 401 error, clearing auth');
                authService.clearTokens();
                setUser(null);
                setIsAdmin(false);
              }
            }
          } else {
            console.log('❌ No user found in localStorage');
            authService.clearTokens();
          }
        } else {
          console.log('❌ No access token found');
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // Only clear auth on critical errors
        if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
          authService.clearTokens();
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
        console.log('🏁 Auth check completed');
      }
    };

    checkAuth();
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const result = await authService.userRegister(userData);
      
      if (result.success) {
        return {
          success: true,
          message: result.message || 'Registration successful'
        };
      } else {
        // Pass through validation errors
        return {
          success: false,
          message: result.message || 'Registration failed',
          validationErrors: result.validationErrors
        };
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password, type = 'user') => {
    try {
      setLoading(true);
      console.log(`🔐 Attempting ${type} login for:`, username);
      
      const data = type === 'admin' 
        ? await authService.adminLogin(username, password)
        : await authService.userLogin(username, password);
      
      if (data.success) {
        const userData = data.admin || data.user;
        console.log('✅ Login successful, storing user data:', userData.username);
        
        setUser(userData);
        setIsAdmin(type === 'admin');
        
        // Store user data
        const storageKey = type === 'admin' ? 'adminUser' : 'user';
        localStorage.setItem(storageKey, JSON.stringify(userData));
        
        // Verify storage
        const storedUser = localStorage.getItem(storageKey);
        const storedToken = localStorage.getItem('accessToken');
        console.log('💾 Storage verification:', {
          userStored: !!storedUser,
          tokenStored: !!storedToken,
          userKey: storageKey
        });
        
        return data;
      } else {
        console.log('❌ Login failed:', data.message);
        // Pass through validation errors
        return {
          success: false,
          message: data.message || 'Login failed',
          validationErrors: data.validationErrors
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout(isAdmin ? 'admin' : 'user');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
    }
  }, [isAdmin]);

  const refreshSession = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const userType = isAdmin ? 'admin' : 'user';
        const result = await authService.refreshAccessToken(userType);
        
        if (result.success) {
          // Session refreshed successfully
          return true;
        } else {
          // Refresh failed, logout user
          await logout();
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      await logout();
      return false;
    }
  }, [isAdmin, logout]);

  const apiRequest = useCallback(async (endpoint, options = {}) => {
    try {
      return await authService.apiRequest(endpoint, options);
    } catch (error) {
      // If it's an auth error, try to refresh and retry once
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        const refreshed = await refreshSession();
        if (refreshed) {
          return await authService.apiRequest(endpoint, options);
        }
      }
      throw error;
    }
  }, [refreshSession]);

  const value = {
    user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    refreshSession,
    apiRequest,
    isAuthenticated: !!user,
    getUserRole: () => apiServiceFactory.getUserRole(),
    getCurrentUser: () => apiServiceFactory.getCurrentUser(),
    validateEmail: apiServiceFactory.validateEmail,
    validatePassword: apiServiceFactory.validatePassword,
    // New API services
    getApiServices: () => apiServiceFactory.getAvailableServices(),
    getAdminServices: () => apiServiceFactory.initializeAdminServices(),
    getUserServices: () => apiServiceFactory.initializeUserServices(),
    hasPermission: (permission) => apiServiceFactory.hasPermission(permission),
    hasAnyPermission: (permissions) => apiServiceFactory.hasAnyPermission(permissions),
    hasAllPermissions: (permissions) => apiServiceFactory.hasAllPermissions(permissions)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};