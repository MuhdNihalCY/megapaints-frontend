import axios from 'axios';
import tokenManager from './tokenManager';

/**
 * API Client for Kanban Board API v2
 * Handles JWT authentication and base configuration
 */
class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor to add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const role = tokenManager.getUserRole();
            if (role) {
              const refreshResult = await tokenManager.refreshAccessToken(role);
              if (refreshResult.success) {
                // Retry the original request with new token
                const newToken = this.getToken();
                if (newToken) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }

          // If refresh fails, redirect to login or handle auth error
          tokenManager.clearTokens();
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get JWT token from token manager
   * @returns {string|null} JWT token or null
   */
  getToken() {
    return tokenManager.getAccessToken();
  }

  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {Object} config - Axios config
   * @returns {Promise} Axios response
   */
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} Axios response
   */
  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * PATCH request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} Axios response
   */
  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} Axios response
   */
  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {Object} config - Axios config
   * @returns {Promise} Axios response
   */
  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
