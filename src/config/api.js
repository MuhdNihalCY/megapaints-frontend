/**
 * Centralized API Configuration
 * All API calls should use this configuration for consistent base URL management
 */

// Environment-based API configuration
const API_CONFIG = {
  // Development environment
  development: {
    baseURL: 'http://localhost:3000/api',
    useProxy: false, // Use direct connection to localhost:3000
  },
  
  // Production environment
  production: {
    baseURL: 'https://test.megamixsystems.com/api',
    useProxy: false,
  },
  
  // Staging environment
  staging: {
    baseURL: 'https://test.megamixsystems.com/api',
    useProxy: false,
  }
};

// Get current environment
const getEnvironment = () => {
  if (import.meta.env.DEV) return 'development';
  if (import.meta.env.PROD) return 'production';
  return 'staging';
};

// Get current API configuration
const getApiConfig = () => {
  const env = getEnvironment();
  const config = API_CONFIG[env];
  
  // Return the configuration directly since we're using direct connections
  return config;
};

// Export the configuration
export const apiConfig = getApiConfig();

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Ensure baseURL doesn't end with slash and cleanEndpoint doesn't start with slash
  const cleanBaseURL = apiConfig.baseURL.endsWith('/') ? apiConfig.baseURL.slice(0, -1) : apiConfig.baseURL;
  
  return `${cleanBaseURL}/${cleanEndpoint}`;
};

// Helper function to get base URL
export const getBaseUrl = () => apiConfig.baseURL;

// Export for debugging
export const debugApiConfig = () => {
  console.log('🔧 API Configuration:', {
    environment: getEnvironment(),
    config: apiConfig,
    viteEnv: {
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      MODE: import.meta.env.MODE
    }
  });
};

// Debug URL construction
export const debugUrlConstruction = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const cleanBaseURL = apiConfig.baseURL.endsWith('/') ? apiConfig.baseURL.slice(0, -1) : apiConfig.baseURL;
  const finalUrl = `${cleanBaseURL}/${cleanEndpoint}`;
  
  console.log('🔗 URL Construction Debug:', {
    originalEndpoint: endpoint,
    cleanEndpoint,
    baseURL: apiConfig.baseURL,
    cleanBaseURL,
    finalUrl,
    environment: getEnvironment()
  });
  
  return finalUrl;
};

// Helper function to switch between direct connection and proxy mode
export const switchToDirectConnection = () => {
  if (getEnvironment() === 'development') {
    API_CONFIG.development.baseURL = 'http://localhost:3000/api';
    API_CONFIG.development.useProxy = false;
    console.log('🔄 Switched to direct connection: http://localhost:3000/api');
  }
};

export const switchToProxyMode = () => {
  if (getEnvironment() === 'development') {
    API_CONFIG.development.baseURL = '/api';
    API_CONFIG.development.useProxy = true;
    console.log('🔄 Switched to proxy mode: /api (proxied by Vite)');
  }
};

export default apiConfig;
