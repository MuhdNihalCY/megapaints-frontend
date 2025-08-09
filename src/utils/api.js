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

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
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
    if (error.response?.status === 401) {
      // Unauthorized access
      // Let callers decide how to handle (e.g., refresh flow)
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - please check if the backend server is running');
    }
    return Promise.reject(error);
  }
);

export default api;
