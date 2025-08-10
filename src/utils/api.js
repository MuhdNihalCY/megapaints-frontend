import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance with default config
const api = axios.create({
  // Use Vite dev proxy in development; backend should be mounted under /api
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
  // Try user and admin refresh; whichever succeeds first wins
  const controllers = [new AbortController(), new AbortController()];
  try {
    console.info('[API] Attempting silent refresh...');
    const results = await Promise.allSettled([
      api.post('/auth/refresh', {}, { signal: controllers[0].signal, _noIntercept: true }),
      api.post('/admin/auth/refresh', {}, { signal: controllers[1].signal, _noIntercept: true }),
    ]);
    const anyFulfilled = results.find(r => r.status === 'fulfilled' && r.value?.data?.status);
    if (anyFulfilled) {
      try {
        const which = results.findIndex(r => r.status === 'fulfilled' && r.value?.data?.status);
        console.info('[API] Silent refresh succeeded via', which === 0 ? '/auth/refresh' : '/admin/auth/refresh');
      } catch {}
      // Cancel the other one (best-effort)
      controllers.forEach((c) => { try { c.abort(); } catch {} });
      return true;
    }
    console.warn('[API] Silent refresh failed (no endpoint succeeded)');
    return false;
  } catch {
    console.error('[API] Silent refresh threw an error');
    return false;
  }
}

// --- JWT header support (optional in addition to cookies) ---
let inMemoryJwtToken = null;

export function setJwtToken(token) {
  inMemoryJwtToken = token || null;
  if (token) {
    try { localStorage.setItem('access_token', token); } catch (_) {}
  } else {
    try { localStorage.removeItem('access_token'); } catch (_) {}
  }
}

export function clearJwtToken() {
  inMemoryJwtToken = null;
  try { localStorage.removeItem('access_token'); } catch (_) {}
}

function readJwtToken() {
  if (inMemoryJwtToken) return inMemoryJwtToken;
  try {
    const ls = localStorage.getItem('access_token') || localStorage.getItem('user_access_token') || localStorage.getItem('admin_access_token');
    if (ls) return ls;
  } catch (_) {}
  try {
    // Non-HttpOnly fallbacks if server sets readable cookies (if HttpOnly, this will be undefined and we rely on cookies via withCredentials)
    const ck = Cookies.get('access_token') || Cookies.get('user_access_token') || Cookies.get('admin_access_token');
    if (ck) return ck;
  } catch (_) {}
  return null;
}

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Avoid infinite loop for refresh calls
    if (!config.headers) config.headers = {};
    // Attach Authorization header if a JWT is available (server may validate either header or cookie)
    try {
      const token = readJwtToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {}
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
