import axios from 'axios';

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
    const results = await Promise.allSettled([
      api.post('/auth/refresh', {}, { signal: controllers[0].signal, _noIntercept: true }),
      api.post('/admin/auth/refresh', {}, { signal: controllers[1].signal, _noIntercept: true }),
    ]);
    const anyFulfilled = results.find(r => r.status === 'fulfilled' && r.value?.data?.status);
    if (anyFulfilled) {
      // Cancel the other one (best-effort)
      controllers.forEach((c) => { try { c.abort(); } catch {} });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Avoid infinite loop for refresh calls
    if (!config.headers) config.headers = {};
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
      return new Promise((resolve, reject) => {
        enqueuePendingRequest((refreshError) => {
          if (refreshError) return reject(refreshError);
          // Retry original request after refresh
          api.request(originalRequest).then(resolve).catch(reject);
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
        api.request(originalRequest).then(resolve).catch(reject);
      } else {
        rejectPendingRequests(error);
        reject(error);
      }
    });
  }
);

export default api;
