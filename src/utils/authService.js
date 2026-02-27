/**
 * Authentication Service for MegaPaints
 * Handles JWT-based authentication for both users and admins
 * Updated to work with the new API structure and separate admin/user services
 */
import {
    getApiUrl,
    debugApiConfig,
    apiConfig,
    getEnvironment,
} from "../config/api.js";

class AuthService {
    constructor() {
        // Use centralized API configuration
        this.baseURL = "/api"; // Will be handled by proxy in development
        // Try to restore tokens from localStorage on initialization
        this.accessToken = localStorage.getItem("accessToken") || null;
        this.refreshToken = localStorage.getItem("refreshToken") || null;
        this.isRefreshing = false;
        this.pendingRequests = [];

        // Debug API configuration
        debugApiConfig();
    }

    /**
     * Admin Authentication
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {Promise<Object>} Login result with admin data
     */
    async adminLogin(username, password) {
        try {
            const finalUrl = getApiUrl("/auth/admin/login");

            const response = await fetch(finalUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include", // Include cookies
                mode: "cors", // Explicitly set CORS mode
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Admin login failed with status:",
                    response.status,
                    "Error:",
                    errorText,
                );

                // Handle validation errors (400)
                if (response.status === 400) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (
                            errorData.details &&
                            Array.isArray(errorData.details)
                        ) {
                            return {
                                success: false,
                                message:
                                    errorData.message || "Admin login failed",
                                validationErrors: errorData.details,
                            };
                        }
                        // If it's a 400 error but not validation, return the message
                        return {
                            success: false,
                            message: errorData.message || "Admin login failed",
                        };
                    } catch (parseError) {
                        console.error(
                            "Failed to parse error response:",
                            parseError,
                        );
                        return {
                            success: false,
                            message: errorText || "Admin login failed",
                        };
                    }
                }

                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            // Admin login successful

            if (data.status === "success") {
                // Store tokens
                this.setTokens(
                    data.data.tokens.accessToken,
                    data.data.tokens.refreshToken,
                );

                // Store admin user data in localStorage for persistence
                localStorage.setItem(
                    "adminUser",
                    JSON.stringify(data.data.admin),
                );

                return {
                    success: true,
                    admin: data.data.admin,
                    tokens: data.data.tokens,
                };
            } else {
                throw new Error(data.message || "Admin login failed");
            }
        } catch (error) {
            console.error("Admin login failed:", error);

            // Provide more specific error messages
            if (
                error.name === "TypeError" &&
                error.message.includes("Failed to fetch")
            ) {
                return {
                    success: false,
                    message:
                        "Unable to connect to server. Please check if the backend is running and CORS is configured properly.",
                };
            }

            return {
                success: false,
                message: error.message || "Admin login failed",
            };
        }
    }

    /**
     * User Registration
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    async userRegister(userData) {
        try {
            const response = await fetch(getApiUrl("/auth/user/register"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                mode: "cors",
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Registration failed with status:",
                    response.status,
                    "Error:",
                    errorText,
                );

                // Handle 404 specifically (route not found)
                if (response.status === 404) {
                    return {
                        success: false,
                        message:
                            "Registration endpoint not implemented yet. Please implement POST /api/auth/user/register in your backend.",
                    };
                }

                // Handle validation errors (400)
                if (response.status === 400) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (
                            errorData.details &&
                            Array.isArray(errorData.details)
                        ) {
                            return {
                                success: false,
                                message:
                                    errorData.message || "Validation failed",
                                validationErrors: errorData.details,
                            };
                        }
                    } catch (parseError) {
                        console.error(
                            "Failed to parse error response:",
                            parseError,
                        );
                    }
                }

                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            // User registration successful

            if (data.status === "success") {
                return {
                    success: true,
                    user: data.data.user,
                    message: data.message || "Registration successful",
                };
            } else {
                throw new Error(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("User registration failed:", error);

            // Provide more specific error messages
            if (
                error.name === "TypeError" &&
                error.message.includes("Failed to fetch")
            ) {
                return {
                    success: false,
                    message:
                        "Unable to connect to server. Please check if the backend is running and CORS is configured properly.",
                };
            }

            return {
                success: false,
                message: error.message || "Registration failed",
            };
        }
    }

    /**
     * User Authentication
     * @param {string} username - User username
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result with user data
     */
    async userLogin(username, password) {
        try {
            const response = await fetch(getApiUrl("/auth/user/login"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include", // Include cookies
                mode: "cors", // Explicitly set CORS mode
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "User login failed with status:",
                    response.status,
                    "Error:",
                    errorText,
                );

                // Handle validation errors (400)
                if (response.status === 400) {
                    try {
                        const errorData = JSON.parse(errorText);
                        if (
                            errorData.details &&
                            Array.isArray(errorData.details)
                        ) {
                            return {
                                success: false,
                                message: errorData.message || "Login failed",
                                validationErrors: errorData.details,
                            };
                        }
                        // If it's a 400 error but not validation, return the message
                        return {
                            success: false,
                            message: errorData.message || "Login failed",
                        };
                    } catch (parseError) {
                        console.error(
                            "Failed to parse error response:",
                            parseError,
                        );
                        return {
                            success: false,
                            message: errorText || "Login failed",
                        };
                    }
                }

                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            // User login successful

            if (data.status === "success") {
                // Store tokens
                this.setTokens(
                    data.data.tokens.accessToken,
                    data.data.tokens.refreshToken,
                );

                // Store user data in localStorage for persistence
                localStorage.setItem("user", JSON.stringify(data.data.user));

                return {
                    success: true,
                    user: data.data.user,
                    tokens: data.data.tokens,
                };
            } else {
                throw new Error(data.message || "User login failed");
            }
        } catch (error) {
            console.error("User login failed:", error);

            // Provide more specific error messages
            if (
                error.name === "TypeError" &&
                error.message.includes("Failed to fetch")
            ) {
                return {
                    success: false,
                    message:
                        "Unable to connect to server. Please check if the backend is running and CORS is configured properly.",
                };
            }

            return {
                success: false,
                message: error.message || "User login failed",
            };
        }
    }

    /**
     * Token Management
     * @param {string} accessToken - Access token
     * @param {string} refreshToken - Refresh token
     */
    setTokens(accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;

        // Store tokens in localStorage for persistence across page refreshes
        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
        } else {
            localStorage.removeItem("accessToken");
        }

        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        } else {
            localStorage.removeItem("refreshToken");
        }
    }

    /**
     * Refresh Access Token
     * @param {string} type - 'admin' or 'user'
     * @returns {Promise<Object>} Refresh result
     */
    async refreshAccessToken(type = "user") {
        if (this.isRefreshing) {
            // If already refreshing, wait for the current refresh to complete
            return new Promise((resolve) => {
                this.pendingRequests.push(resolve);
            });
        }

        // Check if we have a refresh token
        if (!this.refreshToken) {
            console.warn("No refresh token available");
            this.logout();
            return { success: false, message: "No refresh token available" };
        }

        this.isRefreshing = true;

        try {
            const endpoint =
                type === "admin" ? "/auth/admin/refresh" : "/auth/user/refresh";

            const response = await fetch(getApiUrl(endpoint), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `Refresh failed: ${response.status} ${response.statusText}`,
                    errorText,
                );
                throw new Error(
                    `Refresh failed: ${response.status} ${response.statusText}`,
                );
            }

            // Check if response has content before parsing JSON
            const contentType = response.headers.get("content-type");
            const contentLength = response.headers.get("content-length");

            let data = null;
            if (
                response.status !== 204 &&
                contentLength !== "0" &&
                contentType &&
                contentType.includes("application/json")
            ) {
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error(
                        `Failed to parse JSON response for refresh:`,
                        jsonError,
                    );
                    throw new Error(
                        `Invalid JSON response: ${response.status} ${response.statusText}`,
                    );
                }
            }

            if (data.status === "success") {
                this.setTokens(
                    data.data.tokens.accessToken,
                    data.data.tokens.refreshToken,
                );

                // Resolve pending requests
                this.pendingRequests.forEach((resolve) =>
                    resolve({
                        success: true,
                        tokens: data.data.tokens,
                    }),
                );
                this.pendingRequests = [];

                return {
                    success: true,
                    tokens: data.data.tokens,
                };
            } else {
                this.logout();
                throw new Error("Session expired. Please login again.");
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
            this.logout();

            // Reject pending requests
            this.pendingRequests.forEach((resolve) =>
                resolve({
                    success: false,
                    message: error.message || "Token refresh failed",
                }),
            );
            this.pendingRequests = [];

            return {
                success: false,
                message: error.message || "Token refresh failed",
            };
        } finally {
            this.isRefreshing = false;
        }
    }

    /**
     * API Request with Auto-Refresh
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     */
    async apiRequest(endpoint, options = {}) {
        const url = getApiUrl(endpoint);

        const makeRequest = async (token) => {
            return fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                    Authorization: token ? `Bearer ${token}` : undefined,
                },
                credentials: "include",
            });
        };

        try {
            let response = await makeRequest(this.accessToken);

            // If token expired, refresh and retry
            if (response.status === 401 && this.refreshToken) {
                const userType = this.isAdmin() ? "admin" : "user";
                await this.refreshAccessToken(userType);
                response = await makeRequest(this.accessToken);
            }

            // Check if response has content before parsing JSON
            const contentType = response.headers.get("content-type");
            const contentLength = response.headers.get("content-length");

            let data = null;
            if (
                response.status !== 204 &&
                contentLength !== "0" &&
                contentType &&
                contentType.includes("application/json")
            ) {
                try {
                    data = await response.json();
                } catch (jsonError) {
                    console.error(
                        `Failed to parse JSON response for ${endpoint}:`,
                        jsonError,
                    );
                    throw new Error(
                        `Invalid JSON response: ${response.status} ${response.statusText}`,
                    );
                }
            }

            if (!response.ok) {
                const errorMessage =
                    data?.message ||
                    `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    }

    /**
     * Logout
     * @param {string} type - 'admin' or 'user'
     */
    async logout(type = "user") {
        try {
            const endpoint =
                type === "admin" ? "/auth/admin/logout" : "/auth/user/logout";
            await this.apiRequest(endpoint, { method: "POST" });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            this.clearTokens();
        }
    }

    /**
     * Clear all tokens and user data
     */
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;

        // Clear tokens from localStorage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("user");
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!this.accessToken && !!this.refreshToken;
    }

    /**
     * Check if tokens are valid (not expired)
     * @returns {boolean} True if tokens are valid
     */
    hasValidTokens() {
        if (!this.accessToken || !this.refreshToken) {
            return false;
        }

        try {
            // Check if access token is expired
            const tokenPayload = JSON.parse(
                atob(this.accessToken.split(".")[1]),
            );
            const currentTime = Math.floor(Date.now() / 1000);
            const bufferTime = 60; // 1 minute buffer

            return tokenPayload.exp > currentTime + bufferTime;
        } catch (error) {
            console.error("Error checking token validity:", error);
            return false;
        }
    }

    /**
     * Check if current user is admin
     * @returns {boolean} True if admin
     */
    isAdmin() {
        const adminUser = localStorage.getItem("adminUser");
        return !!adminUser;
    }

    /**
     * Check if current user is user (not admin)
     * @returns {boolean} True if user
     */
    isUser() {
        const user = localStorage.getItem("user");
        return !!user;
    }

    /**
     * Get current user data
     * @returns {Object|null} User data or null
     */
    getCurrentUser() {
        const adminUser = localStorage.getItem("adminUser");
        const user = localStorage.getItem("user");
        return adminUser
            ? JSON.parse(adminUser)
            : user
              ? JSON.parse(user)
              : null;
    }

    /**
     * Get current user role
     * @returns {string|null} 'admin', 'user', or null
     */
    getUserRole() {
        if (this.isAdmin()) return "admin";
        const user = localStorage.getItem("user");
        return user ? "user" : null;
    }

    /**
     * Get current user profile
     * @returns {Promise<Object>} User profile data
     */
    async getCurrentProfile() {
        try {
            const userType = this.isAdmin() ? "admin" : "user";
            const endpoint =
                userType === "admin" ? "/auth/admin/me" : "/auth/user/me";

            const data = await this.apiRequest(endpoint);
            return data.data;
        } catch (error) {
            console.error("Failed to get current profile:", error);
            throw error;
        }
    }

    /**
     * Check if token is expired
     * @param {string} token - JWT token
     * @param {number} bufferSeconds - Buffer time in seconds
     * @returns {boolean} True if expired
     */
    isTokenExpired(token, bufferSeconds = 0) {
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime + bufferSeconds;
        } catch (error) {
            console.error("Error parsing token:", error);
            return true;
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {boolean} True if valid
     */
    validatePassword(password) {
        return password.length >= 6;
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
