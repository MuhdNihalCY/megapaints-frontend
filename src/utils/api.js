import axios from "axios";
import Cookies from "js-cookie";
import { apiConfig } from "../config/api";

// Create axios instance with default config (base URL from .env via config)
const api = axios.create({
    baseURL: apiConfig.baseURL || "/api",
    withCredentials: true, // Important for cookies
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// --- Silent refresh setup ---
let isRefreshing = false;
let pendingRequestQueue = [];

function enqueuePendingRequest(callback) {
    pendingRequestQueue.push(callback);
}

function resolvePendingRequests() {
    pendingRequestQueue.forEach((cb) => {
        try {
            cb();
        } catch {}
    });
    pendingRequestQueue = [];
}

function rejectPendingRequests(error) {
    pendingRequestQueue.forEach((cb) => {
        try {
            cb(error);
        } catch {}
    });
    pendingRequestQueue = [];
}

async function tryRefreshSession() {
    try {
        // Import AuthService dynamically to avoid circular dependency
        const { default: authService } = await import("./authService");

        // Get user type from auth service
        const userType = authService.isAdmin() ? "admin" : "user";
        if (!userType) {
            console.warn("[API] No user type found for refresh");
            return false;
        }

        // Try to refresh using AuthService
        const result = await authService.refreshAccessToken(userType);
        if (result.success) {
            return true;
        }

        console.warn("[API] Silent refresh failed via AuthService");
        return false;
    } catch (error) {
        console.error("[API] Silent refresh threw an error:", error);
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
            if (role === "admin") {
                localStorage.setItem("admin_access_token", token);
            } else if (role === "user") {
                localStorage.setItem("user_access_token", token);
            } else {
                localStorage.setItem("access_token", token);
            }
        } catch (_) {}
    } else {
        try {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_access_token");
            localStorage.removeItem("admin_access_token");
        } catch (_) {}
    }
}

export function clearJwtToken() {
    inMemoryJwtToken = null;
    currentUserRole = null;
    try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_access_token");
        localStorage.removeItem("admin_access_token");
    } catch (_) {}
}

export function setUserRole(role) {
    currentUserRole = role;
}

// Export the centralized auth token helper for use by other modules
export { getAuthToken };

// Centralized auth token helper that checks both camelCase and snake_case variants
function getAuthToken() {
    // Priority 1: In-memory token from authService
    if (inMemoryJwtToken) return inMemoryJwtToken;

    // Try to get the current user role from authService
    let currentUserRole = null;
    try {
        currentUserRole = authService.isAdmin() ? "admin" : "user";
    } catch (_) {}

    // Priority 2: localStorage variants (both camelCase and snake_case)
    try {
        if (currentUserRole === "admin") {
            const adminToken =
                localStorage.getItem("adminAccessToken") ||
                localStorage.getItem("admin_access_token");
            if (adminToken) return adminToken;
        } else if (currentUserRole === "user") {
            const userToken =
                localStorage.getItem("userAccessToken") ||
                localStorage.getItem("user_access_token");
            if (userToken) return userToken;
        }

        // Fallback to any available token (both camelCase and snake_case)
        const ls =
            localStorage.getItem("accessToken") ||
            localStorage.getItem("access_token") ||
            localStorage.getItem("userAccessToken") ||
            localStorage.getItem("user_access_token") ||
            localStorage.getItem("adminAccessToken") ||
            localStorage.getItem("admin_access_token");
        if (ls) return ls;
    } catch (_) {}

    // Priority 3: Cookie variants (both camelCase and snake_case)
    try {
        const ck =
            Cookies.get("authToken") ||
            Cookies.get("auth_token") ||
            Cookies.get("accessToken") ||
            Cookies.get("access_token") ||
            Cookies.get("userAccessToken") ||
            Cookies.get("user_access_token") ||
            Cookies.get("adminAccessToken") ||
            Cookies.get("admin_access_token");
        if (ck) return ck;
    } catch (_) {}

    return null;
}

// Legacy function name for backward compatibility
function readJwtToken() {
    return getAuthToken();
}

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
    (config) => {
        // Avoid infinite loop for refresh calls
        if (!config.headers) config.headers = {};

        // Skip token for login and refresh endpoints
        const isLoginEndpoint =
            config.url?.includes("/auth/admin/login") ||
            config.url?.includes("/auth/user/login");
        const isRefreshEndpoint =
            config.url?.includes("/auth/admin/refresh") ||
            config.url?.includes("/auth/user/refresh");
        const shouldSkipToken =
            isLoginEndpoint || isRefreshEndpoint || config._noIntercept;

        if (shouldSkipToken) {
            return config;
        }

        // Always refresh Authorization header with latest JWT token
        try {
            const token = getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                // Remove stale Authorization header when no token exists
                delete config.headers.Authorization;
                console.warn(
                    "[API] No token available, removed Authorization header for:",
                    config.url,
                );
            }
        } catch (error) {
            console.error("[API] Error reading token:", error);
            delete config.headers.Authorization;
        }

        // Don't set Content-Type for FormData - let browser set it with boundary for multipart/form-data
        if (config.data instanceof FormData) {
            // Remove Content-Type header completely so browser can set it with proper boundary
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
            // Override transformRequest to return FormData as-is without JSON serialization
            config.transformRequest = [
                (data) => {
                    if (data instanceof FormData) {
                        return data; // Return FormData as-is
                    }
                    // For non-FormData, use default JSON stringify
                    if (typeof data === "object") {
                        return JSON.stringify(data);
                    }
                    return data;
                },
            ];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const originalRequest = error.config || {};

        // Suppress console errors for expected 403s on customer endpoints
        // These are handled gracefully in the UI (user doesn't have access to that customer)
        const isCustomer403 =
            error.response?.status === 403 &&
            typeof originalRequest?.url === "string" &&
            originalRequest.url.includes("/kanban/customers/");

        if (isCustomer403) {
            // Silently reject - this is expected behavior, handled in UI
            return Promise.reject(error);
        }

        // If network error, bubble up
        if (error.code === "ERR_NETWORK") {
            console.error(
                "Network error - please check if the backend server is running",
            );
            return Promise.reject(error);
        }

        const isUnauthorized = error.response?.status === 401;
        if (isUnauthorized) {
            // Log richer context for debugging token expiry
            try {
                console.warn(
                    "[API] 401 Unauthorized on",
                    originalRequest?.method?.toUpperCase?.(),
                    originalRequest?.url,
                );
            } catch {}
        }
        const isRefreshCall =
            typeof originalRequest?.url === "string" &&
            (originalRequest.url.includes("/auth/admin/refresh") ||
                originalRequest.url.includes("/auth/user/refresh"));

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
            } catch {}
            return new Promise((resolve, reject) => {
                enqueuePendingRequest((refreshError) => {
                    if (refreshError) return reject(refreshError);
                    // Update Authorization header with fresh token before retry
                    const freshToken = getAuthToken();
                    if (freshToken) {
                        if (!originalRequest.headers)
                            originalRequest.headers = {};
                        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
                    } else {
                        // Remove stale Authorization header when no fresh token available
                        if (!originalRequest.headers)
                            originalRequest.headers = {};
                        delete originalRequest.headers.Authorization;
                    }
                    // Retry original request after refresh
                    api.request(originalRequest)
                        .then((res) => {
                            try {
                            } catch {}
                            resolve(res);
                        })
                        .catch((err) => {
                            try {
                                console.warn(
                                    "[API] Retried request failed:",
                                    originalRequest?.url,
                                );
                            } catch {}
                            reject(err);
                        });
                });
            });
        }

        // Start a refresh
        isRefreshing = true;
        return new Promise((resolve, reject) => {
            tryRefreshSession()
                .then((ok) => {
                    if (ok) {
                        resolvePendingRequests();
                        // Update Authorization header with fresh token before retry
                        const freshToken = getAuthToken();
                        if (freshToken) {
                            if (!originalRequest.headers)
                                originalRequest.headers = {};
                            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
                        } else {
                            // Remove stale Authorization header when no fresh token available
                            if (!originalRequest.headers)
                                originalRequest.headers = {};
                            delete originalRequest.headers.Authorization;
                        }
                        api.request(originalRequest)
                            .then((res) => {
                                try {
                                } catch {}
                                resolve(res);
                            })
                            .catch((err) => {
                                try {
                                    console.warn(
                                        "[API] Retried after refresh failed:",
                                        originalRequest?.url,
                                    );
                                } catch {}
                                reject(err);
                            });
                    } else {
                        const refreshError = new Error("Token refresh failed");
                        rejectPendingRequests(refreshError);
                        reject(refreshError);
                    }
                })
                .catch((refreshError) => {
                    rejectPendingRequests(refreshError);
                    reject(refreshError);
                })
                .finally(() => {
                    isRefreshing = false;
                });
        });
    },
);

export default api;
export const http = api; // named export alias for convenience
