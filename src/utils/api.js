import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with default config
const api = axios.create({
  // Use Vite proxy instead of direct backend URL
  baseURL: '/api',
  withCredentials: true, // Important for cookies
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// --- Silent refresh setup ---
let isRefreshing = false;
let pendingRequestQueue = [];

function enqueuePendingRequest(callback) {
  pendingRequestQueue.push(callback);
}

function resolvePendingRequests() {
  pendingRequestQueue.forEach((cb) => {
    try { cb(); } catch {}
  });
  pendingRequestQueue = [];
}

function rejectPendingRequests(error) {
  pendingRequestQueue.forEach((cb) => {
    try { cb(error); } catch {}
  });
  pendingRequestQueue = [];
}

async function tryRefreshSession() {
  try {
    console.info('[API] Attempting silent refresh...');
    
    // Import AuthService dynamically to avoid circular dependency
    const { default: authService } = await import('./authService');
    
    // Get user type from auth service
    const userType = authService.isAdmin() ? 'admin' : 'user';
    if (!userType) {
      console.warn('[API] No user type found for refresh');
      return false;
    }
    
    // Try to refresh using AuthService
    const result = await authService.refreshAccessToken(userType);
    if (result.success) {
      console.info('[API] Silent refresh succeeded via AuthService');
      return true;
    }
    
    console.warn('[API] Silent refresh failed via AuthService');
    return false;
  } catch (error) {
    console.error('[API] Silent refresh threw an error:', error);
    return false;
  }
}

// --- JWT header support (optional in addition to cookies) ---
let inMemoryJwtToken = null;
let currentUserRole = null;

export function setJwtToken(token, role = null) {
  inMemoryJwtToken = token || null;
  currentUserRole = role || null;
  
  if (token) {
    try { 
      // Store based on role if provided
      if (role === 'admin') {
        localStorage.setItem('admin_access_token', token);
      } else if (role === 'user') {
        localStorage.setItem('user_access_token', token);
      } else {
        localStorage.setItem('access_token', token);
      }
    } catch (_) {}
  } else {
    try { 
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_access_token');
      localStorage.removeItem('admin_access_token');
    } catch (_) {}
  }
}

export function clearJwtToken() {
  inMemoryJwtToken = null;
  currentUserRole = null;
  try { 
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_access_token');
    localStorage.removeItem('admin_access_token');
  } catch (_) {}
}

export function setUserRole(role) {
  currentUserRole = role;
}

function readJwtToken() {
  if (inMemoryJwtToken) return inMemoryJwtToken;
  
  try {
    // Use in-memory role first, then fallback to any available token
    if (currentUserRole === 'admin') {
      const adminToken = localStorage.getItem('admin_access_token');
      if (adminToken) return adminToken;
    } else if (currentUserRole === 'user') {
      const userToken = localStorage.getItem('user_access_token');
      if (userToken) return userToken;
    }
    
    // Fallback to any available token
    const ls = localStorage.getItem('access_token') || localStorage.getItem('user_access_token') || localStorage.getItem('admin_access_token');
    if (ls) return ls;
  } catch (_) {}
  
  try {
    // Check for the actual cookie names used by your backend
    const ck = Cookies.get('auth_token') || Cookies.get('access_token') || Cookies.get('user_access_token') || Cookies.get('admin_access_token');
    if (ck) return ck;
  } catch (_) {}
  
  return null;
}

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Avoid infinite loop for refresh calls
    if (!config.headers) config.headers = {};
    
    // Skip token for login and refresh endpoints
    const isLoginEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/admin/auth/login');
    const isRefreshEndpoint = config.url?.includes('/auth/refresh') || config.url?.includes('/admin/auth/refresh');
    const shouldSkipToken = isLoginEndpoint || isRefreshEndpoint || config._noIntercept;
    
    if (shouldSkipToken) {
      console.debug('[API] Skipping token for:', config.url);
      return config;
    }
    
    // Attach Authorization header if a JWT is available (server may validate either header or cookie)
    try {
      const token = readJwtToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
        console.debug('[API] Added Authorization header for:', config.url);
      } else if (!token) {
        console.warn('[API] No token available for request:', config.url);
      }
    } catch (error) {
      console.error('[API] Error reading token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config || {};

    // If network error, bubble up
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - please check if the backend server is running');
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;
    if (isUnauthorized) {
      // Log richer context for debugging token expiry
      try {
        console.warn('[API] 401 Unauthorized on', originalRequest?.method?.toUpperCase?.(), originalRequest?.url);
      } catch {}
    }
    const isRefreshCall = typeof originalRequest?.url === 'string' && (
              originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/admin/auth/refresh')
    );

    if (!isUnauthorized || isRefreshCall) {
      return Promise.reject(error);
    }

    // Prevent multiple refresh attempts per request
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // Queue the request while a refresh is in progress
    if (isRefreshing) {
      try {
        console.debug('[API] Queueing request while refresh in progress:', originalRequest?.method?.toUpperCase?.(), originalRequest?.url);
      } catch {}
      return new Promise((resolve, reject) => {
        enqueuePendingRequest((refreshError) => {
          if (refreshError) return reject(refreshError);
          // Retry original request after refresh
          api.request(originalRequest)
            .then((res) => { try { console.debug('[API] Retried request succeeded:', originalRequest?.url); } catch {}; resolve(res); })
            .catch((err) => { try { console.warn('[API] Retried request failed:', originalRequest?.url); } catch {}; reject(err); });
        });
      });
    }

    // Start a refresh
    isRefreshing = true;
    return new Promise(async (resolve, reject) => {
      const ok = await tryRefreshSession();
      isRefreshing = false;
      if (ok) {
        resolvePendingRequests();
        api.request(originalRequest)
          .then((res) => { try { console.debug('[API] Retried after refresh succeeded:', originalRequest?.url); } catch {}; resolve(res); })
          .catch((err) => { try { console.warn('[API] Retried after refresh failed:', originalRequest?.url); } catch {}; reject(err); });
      } else {
        rejectPendingRequests(error);
        reject(error);
      }
    });
  }
);

export default api;
export const http = api; // named export alias for convenience
