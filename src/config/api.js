/**
 * Centralized API Configuration
 * All API calls and backend URLs use .env (VITE_API_BASE_URL). No hardcoded host/port.
 */

const envBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

// Environment-based API configuration (all from .env)
const API_CONFIG = {
    development: {
        baseURL: envBaseUrl || "/api",
        useProxy: !envBaseUrl,
    },
    production: {
        baseURL: envBaseUrl || "/api",
        useProxy: false,
    },
    staging: {
        baseURL: envBaseUrl || "/api",
        useProxy: false,
    },
};

// Get current environment
export const getEnvironment = () => {
    if (import.meta.env.DEV) return "development";
    if (import.meta.env.PROD) return "production";
    return "staging";
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
    const currentConfig = getApiConfig();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    let cleanBaseURL = currentConfig.baseURL.endsWith("/")
        ? currentConfig.baseURL.slice(0, -1)
        : currentConfig.baseURL;
    return `${cleanBaseURL}/${cleanEndpoint}`;
};

// Helper function to get base URL (from .env VITE_API_BASE_URL)
export const getBaseUrl = () => apiConfig.baseURL;

/** Backend origin for static assets (e.g. /uploads). Derives from VITE_API_BASE_URL (no /api). */
export const getBackendOrigin = () => {
    const base = getBaseUrl() || "";
    if (!base) return "";
    return base.replace(/\/api\/?$/, "") || "";
};

// Export for debugging
export const debugApiConfig = () => {
    // Debug function - no longer logs to console
};

// Debug URL construction
export const debugUrlConstruction = (endpoint) => {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    const cleanBaseURL = apiConfig.baseURL.endsWith("/") ? apiConfig.baseURL.slice(0, -1) : apiConfig.baseURL;
    const finalUrl = `${cleanBaseURL}/${cleanEndpoint}`;

    return finalUrl;
};

// Helper function to switch between direct connection or proxy (uses .env at runtime)
export const switchToDirectConnection = () => {
    if (getEnvironment() === "development") {
        API_CONFIG.development.baseURL = import.meta.env.VITE_API_BASE_URL || "/api";
        API_CONFIG.development.useProxy = false;
    }
};

export const switchToProxyMode = () => {
    if (getEnvironment() === "development") {
        API_CONFIG.development.baseURL = "/api";
        API_CONFIG.development.useProxy = true;
    }
};

export default apiConfig;
