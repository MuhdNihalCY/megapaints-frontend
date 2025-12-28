/**
 * Centralized API Configuration
 * All API calls should use this configuration for consistent base URL management
 */

// Environment-based API configuration
const API_CONFIG = {
    // Development environment
    development: {
        baseURL: "http://localhost:3000/api",
        useProxy: false, // Use direct connection to localhost:3000
    },

    // Production environment
    production: {
        baseURL: "https://test.megamixsystems.com/api",
        useProxy: false,
    },

    // Staging environment
    staging: {
        baseURL: "https://test.megamixsystems.com/api",
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
    // Get fresh config to avoid caching issues
    const currentConfig = getApiConfig();
    const env = getEnvironment();

    // Remove leading slash from endpoint to avoid double slashes
    const cleanEndpoint = endpoint.startsWith("/")
        ? endpoint.slice(1)
        : endpoint;

    // Ensure baseURL doesn't end with slash and cleanEndpoint doesn't start with slash
    let cleanBaseURL = currentConfig.baseURL.endsWith("/")
        ? currentConfig.baseURL.slice(0, -1)
        : currentConfig.baseURL;

    // In development, ALWAYS use absolute URL to prevent requests going to frontend dev server
    if (env === "development") {
        // Force absolute URL - if it's relative, prepend http://localhost:3000
        if (
            !cleanBaseURL.startsWith("http://") &&
            !cleanBaseURL.startsWith("https://")
        ) {
            // If it starts with /, it's relative - convert to absolute
            if (cleanBaseURL.startsWith("/")) {
                cleanBaseURL = `http://localhost:3000${cleanBaseURL}`;
            } else {
                // If it doesn't start with /, prepend http://localhost:3000/api
                cleanBaseURL = `http://localhost:3000/api`;
            }
        }
        // Ensure we're ALWAYS using port 3000, never 5173
        cleanBaseURL = cleanBaseURL.replace(":5173", ":3000");
        // Ensure we're using http://localhost:3000/api format
        if (
            cleanBaseURL.includes("localhost") &&
            !cleanBaseURL.includes("/api")
        ) {
            cleanBaseURL = cleanBaseURL.replace(
                "localhost:3000",
                "localhost:3000/api",
            );
        }
    }

    const fullUrl = `${cleanBaseURL}/${cleanEndpoint}`;

    // Final safety check - if still relative, force absolute in development
    if (
        env === "development" &&
        !fullUrl.startsWith("http://") &&
        !fullUrl.startsWith("https://")
    ) {
        const absoluteUrl = `http://localhost:3000/api/${cleanEndpoint}`;
        console.warn(
            "⚠️ getApiUrl returned relative URL, forcing absolute:",
            absoluteUrl,
        );
        return absoluteUrl;
    }

    return fullUrl;
};

// Helper function to get base URL
export const getBaseUrl = () => apiConfig.baseURL;

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

// Helper function to switch between direct connection and proxy mode
export const switchToDirectConnection = () => {
    if (getEnvironment() === "development") {
        API_CONFIG.development.baseURL = "http://localhost:3000/api";
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
