/**
 * User API Service
 * Handles all user-specific API calls based on the updated API documentation
 * Separated from admin APIs for better organization and security
 */
import { getApiUrl } from "../config/api.js";

class UserApiService {
    constructor() {
        this.baseURL = "/api"; // Will be handled by proxy in development
        this.accessToken =
            localStorage.getItem("userAccessToken") ||
            localStorage.getItem("accessToken");
    }

    /**
     * Get headers with user authentication
     * @returns {Object} Headers object
     */
    getHeaders() {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
        };
    }

    /**
     * Build query parameters from object
     * @param {Object} params - Parameters object
     * @returns {string} Query string
     */
    buildQueryParams(params) {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== "") {
                queryParams.append(key, params[key]);
            }
        });
        return queryParams.toString();
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     */
    async apiRequest(endpoint, options = {}) {
        const url = getApiUrl(endpoint);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers,
                },
                credentials: "include",
            });

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
                data = await response.json();
            }

            if (!response.ok) {
                const error = new Error(
                    data?.message ||
                        `HTTP ${response.status}: ${response.statusText}`,
                );
                error.response = {
                    status: response.status,
                    data: data,
                };
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`User API request failed [${endpoint}]:`, error);
            throw error;
        }
    }

    // ==================== AUTHENTICATION ====================

    /**
     * User Registration
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    async register(userData) {
        try {
            const response = await fetch(getApiUrl("/auth/user/register"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (data.status === "success") {
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("User registration failed:", error);
            throw error;
        }
    }

    /**
     * User Login
     * @param {string} username - Username or email
     * @param {string} password - Password
     * @returns {Promise<Object>} Login result
     */
    async login(username, password) {
        try {
            const response = await fetch(getApiUrl("/auth/user/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.status === "success") {
                // Store user-specific tokens
                localStorage.setItem(
                    "userAccessToken",
                    data.data.tokens.accessToken,
                );
                localStorage.setItem(
                    "userRefreshToken",
                    data.data.tokens.refreshToken,
                );
                localStorage.setItem("user", JSON.stringify(data.data.user));

                // Also store in general tokens for compatibility
                localStorage.setItem(
                    "accessToken",
                    data.data.tokens.accessToken,
                );
                localStorage.setItem(
                    "refreshToken",
                    data.data.tokens.refreshToken,
                );

                this.accessToken = data.data.tokens.accessToken;
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("User login failed:", error);
            throw error;
        }
    }

    /**
     * User Logout
     * @returns {Promise<Object>} Logout result
     */
    async logout() {
        try {
            return await this.apiRequest("/auth/user/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error("User logout failed:", error);
            throw error;
        } finally {
            this.clearTokens();
        }
    }

    /**
     * Refresh User Token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New tokens
     */
    async refreshToken(refreshToken) {
        try {
            const response = await fetch(getApiUrl("/auth/user/refresh"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (data.status === "success") {
                // Update stored tokens
                localStorage.setItem(
                    "userAccessToken",
                    data.data.tokens.accessToken,
                );
                localStorage.setItem(
                    "userRefreshToken",
                    data.data.tokens.refreshToken,
                );
                localStorage.setItem(
                    "accessToken",
                    data.data.tokens.accessToken,
                );
                localStorage.setItem(
                    "refreshToken",
                    data.data.tokens.refreshToken,
                );

                this.accessToken = data.data.tokens.accessToken;
                return data.data.tokens;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("User token refresh failed:", error);
            throw error;
        }
    }

    /**
     * Get Current User Profile
     * @returns {Promise<Object>} User profile
     */
    async getProfile() {
        return await this.apiRequest("/auth/user/me");
    }

    /**
     * Update User Profile
     * @param {Object} profileData - Profile data to update
     * @returns {Promise<Object>} Updated profile
     */
    async updateProfile(profileData) {
        return await this.apiRequest("/auth/user/profile", {
            method: "PUT",
            body: JSON.stringify(profileData),
        });
    }

    /**
     * Change User Password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Result
     */
    async changePassword(currentPassword, newPassword) {
        return await this.apiRequest("/auth/user/change-password", {
            method: "POST",
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    // ==================== USER DASHBOARD ====================

    /**
     * Get User Dashboard Data
     * @returns {Promise<Object>} Dashboard data
     */
    async getDashboard() {
        return await this.apiRequest("/user/dashboard");
    }

    // ==================== FORMULA MANAGEMENT ====================

    /**
     * Get User Formulas
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Formulas data
     */
    async getFormulas(params = {}) {
        const queryString = this.buildQueryParams({
            page: 1,
            limit: 20,
            ...params,
        });
        return await this.apiRequest(`/user/formulas?${queryString}`);
    }

    /**
     * Create Formula
     * @param {Object} formulaData - Formula data
     * @returns {Promise<Object>} Created formula
     */
    async createFormula(formulaData) {
        return await this.apiRequest("/user/formulas", {
            method: "POST",
            body: JSON.stringify(formulaData),
        });
    }

    /**
     * Update Formula
     * @param {string} formulaId - Formula ID
     * @param {Object} formulaData - Formula data
     * @returns {Promise<Object>} Updated formula
     */
    async updateFormula(formulaId, formulaData) {
        return await this.apiRequest(`/user/formulas/${formulaId}`, {
            method: "PUT",
            body: JSON.stringify(formulaData),
        });
    }

    /**
     * Delete Formula
     * @param {string} formulaId - Formula ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFormula(formulaId) {
        return await this.apiRequest(`/user/formulas/${formulaId}`, {
            method: "DELETE",
        });
    }

    // ==================== ORDER MANAGEMENT ====================

    /**
     * Get User Orders
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Orders data
     */
    async getOrders(params = {}) {
        const queryString = this.buildQueryParams({
            page: 1,
            limit: 20,
            ...params,
        });
        return await this.apiRequest(`/user/orders?${queryString}`);
    }

    /**
     * Create Order
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} Created order
     */
    async createOrder(orderData) {
        return await this.apiRequest("/user/orders", {
            method: "POST",
            body: JSON.stringify(orderData),
        });
    }

    /**
     * Create formula order (from formula)
     * @param {Object} orderData - { customer_id, formula_id, quantities: { requested, unit }, pricing: { total }, branch_id, ... }
     * @returns {Promise<Object>} Created formula order
     */
    async createFormulaOrder(orderData) {
        return await this.apiRequest("/user/orders/formula", {
            method: "POST",
            body: JSON.stringify(orderData),
        });
    }

    /**
     * Get formula order preview: costing, metrics, scaled formula (re-evaluated server-side)
     * @param {Object} params - { formula_id, quantity, unit }
     * @returns {Promise<Object>} { formula_data, metrics, costing: { cost, currency }, sampled_qty, sampled_unit }
     */
    async getFormulaOrderPreview(params) {
        const q = new URLSearchParams();
        if (params.formula_id) q.set("formula_id", params.formula_id);
        if (params.quantity != null) q.set("quantity", String(params.quantity));
        if (params.unit) q.set("unit", params.unit);
        return await this.apiRequest(`/user/orders/formula-preview?${q.toString()}`, { method: "GET" });
    }

    /**
     * Stock out a formula order (deduct inventory for order components)
     * @param {string} orderId - Formula order ID
     * @returns {Promise<Object>} Stock-out result
     */
    async stockOutFormulaOrder(orderId) {
        return await this.apiRequest(`/user/orders/formula/${orderId}/stock-out`, {
            method: "POST",
        });
    }

    /**
     * Delete own order (soft delete) with access key
     * @param {string} orderId - Order ID
     * @param {string} orderType - "formula" | "wholesale" | "retail"
     * @param {string} accessKey - Controlled access key
     * @returns {Promise<Object>} Result
     */
    async deleteOrder(orderId, orderType, accessKey) {
        return await this.apiRequest(`/user/orders/${orderType}/${orderId}`, {
            method: "DELETE",
            body: JSON.stringify({ accessKey: accessKey.trim() }),
        });
    }

    // ==================== USER INVENTORY (branch-scoped) ====================

    /**
     * Get inventory list for user's branch(es)
     * @param {Object} options - { branch_id, page, limit, search, product_type, sort }
     * @returns {Promise<Object>} Inventory data with inventories and pagination
     */
    async getInventory(options = {}) {
        const queryString = this.buildQueryParams(options);
        const endpoint = `/user/inventory${queryString ? `?${queryString}` : ""}`;
        return await this.apiRequest(endpoint, { method: "GET" });
    }

    /**
     * Get inventory for a specific branch (must be user's branch)
     * @param {string} branchId - Branch ID
     * @param {Object} options - { product_type, search }
     * @returns {Promise<Object>} Branch inventory and summary
     */
    async getBranchInventory(branchId, options = {}) {
        const queryString = this.buildQueryParams(options);
        const endpoint = `/user/inventory/${encodeURIComponent(branchId)}${queryString ? `?${queryString}` : ""}`;
        return await this.apiRequest(endpoint, { method: "GET" });
    }

    /**
     * Update inventory for a branch-product
     * @param {string} branchId - Branch ID
     * @param {string} productId - Product ID
     * @param {Object} updates - { quantity, reason, ... }
     * @returns {Promise<Object>} Updated inventory
     */
    async updateInventory(branchId, productId, updates) {
        return await this.apiRequest(
            `/user/inventory/${encodeURIComponent(branchId)}/${encodeURIComponent(productId)}`,
            {
                method: "PUT",
                body: JSON.stringify(updates),
            }
        );
    }

    /**
     * Add stock to inventory
     * @param {string} branchId - Branch ID
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to add
     * @param {Object} metadata - { reason, ... }
     * @returns {Promise<Object>} Updated inventory
     */
    async addStock(branchId, productId, quantity, metadata = {}) {
        return await this.apiRequest(
            `/user/inventory/${encodeURIComponent(branchId)}/${encodeURIComponent(productId)}/add`,
            {
                method: "POST",
                body: JSON.stringify({ quantity, ...metadata }),
            }
        );
    }

    /**
     * Deduct stock from inventory
     * @param {string} branchId - Branch ID
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to deduct
     * @param {Object} metadata - { reason, reference_type, reference_id }
     * @returns {Promise<Object>} Updated inventory
     */
    async deductStock(branchId, productId, quantity, metadata = {}) {
        return await this.apiRequest(
            `/user/inventory/${encodeURIComponent(branchId)}/${encodeURIComponent(productId)}/deduct`,
            {
                method: "POST",
                body: JSON.stringify({ quantity, ...metadata }),
            }
        );
    }

    /**
     * Get Order by ID
     * @param {string} orderId - Order ID
     * @param {string} orderType - Order type: "formula" | "wholesale" | "retail"
     * @returns {Promise<Object>} Order data
     */
    async getOrderById(orderId, orderType = "formula") {
        return await this.apiRequest(`/user/orders/${orderType}/${orderId}`);
    }

    /**
     * Update Order
     * @param {string} orderId - Order ID
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} Updated order
     */
    async updateOrder(orderId, orderData) {
        return await this.apiRequest(`/user/orders/${orderId}`, {
            method: "PUT",
            body: JSON.stringify(orderData),
        });
    }

    /**
     * Cancel Order
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelOrder(orderId) {
        return await this.apiRequest(`/user/orders/${orderId}/cancel`, {
            method: "POST",
        });
    }

    // ==================== ACCESS KEY MANAGEMENT ====================

    /**
     * Get Access Keys
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Access keys data
     */
    async getAccessKeys(params = {}) {
        const queryString = this.buildQueryParams({
            page: 1,
            limit: 20,
            ...params,
        });
        return await this.apiRequest(`/user/access-keys?${queryString}`);
    }

    /**
     * Create Access Key
     * @param {Object} accessKeyData - Access key data
     * @returns {Promise<Object>} Created access key
     */
    async createAccessKey(accessKeyData) {
        return await this.apiRequest("/user/access-keys", {
            method: "POST",
            body: JSON.stringify(accessKeyData),
        });
    }

    /**
     * Revoke Access Key
     * @param {string} accessKeyId - Access key ID
     * @returns {Promise<Object>} Revocation result
     */
    async revokeAccessKey(accessKeyId) {
        return await this.apiRequest(
            `/user/access-keys/${accessKeyId}/revoke`,
            {
                method: "POST",
            },
        );
    }

    // ==================== FILE NUMBER MANAGEMENT ====================

    /**
     * Get File Numbers
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} File numbers data
     */
    async getFileNumbers(params = {}) {
        const queryString = this.buildQueryParams({
            page: 1,
            limit: 20,
            ...params,
        });
        return await this.apiRequest(`/user/file-numbers?${queryString}`);
    }

    /**
     * Create File Number
     * @param {Object} fileNumberData - File number data
     * @returns {Promise<Object>} Created file number
     */
    async createFileNumber(fileNumberData) {
        return await this.apiRequest("/user/file-numbers", {
            method: "POST",
            body: JSON.stringify(fileNumberData),
        });
    }

    /**
     * Update File Number
     * @param {string} fileNumberId - File number ID
     * @param {Object} fileNumberData - File number data
     * @returns {Promise<Object>} Updated file number
     */
    async updateFileNumber(fileNumberId, fileNumberData) {
        return await this.apiRequest(`/user/file-numbers/${fileNumberId}`, {
            method: "PUT",
            body: JSON.stringify(fileNumberData),
        });
    }

    /**
     * Delete File Number
     * @param {string} fileNumberId - File number ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteFileNumber(fileNumberId) {
        return await this.apiRequest(`/user/file-numbers/${fileNumberId}`, {
            method: "DELETE",
        });
    }

    // ==================== PRODUCT CATALOG (READ-ONLY) ====================

    /**
     * Get Available Products (Read-only for users)
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Products data
     */
    async getAvailableProducts(params = {}) {
        const queryString = this.buildQueryParams({
            page: 1,
            limit: 20,
            ...params,
        });
        return await this.apiRequest(`/user/products?${queryString}`);
    }

    /**
     * Get Product Categories (Read-only for users)
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Categories data
     */
    async getProductCategories(params = {}) {
        const queryString = this.buildQueryParams({
            page: 1,
            limit: 20,
            ...params,
        });
        return await this.apiRequest(
            `/user/products/categories?${queryString}`,
        );
    }

    /**
     * Search Products
     * @param {string} searchTerm - Search term
     * @param {Object} filters - Additional filters
     * @returns {Promise<Object>} Search results
     */
    async searchProducts(searchTerm, filters = {}) {
        return await this.getAvailableProducts({
            search: searchTerm,
            ...filters,
        });
    }

    // ==================== CUSTOMER MANAGEMENT ====================

    /**
     * Get Customers
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Customers data
     */
    async getCustomers(params = {}) {
        const queryString = this.buildQueryParams({
            page: 1,
            limit: 20,
            ...params,
        });
        return await this.apiRequest(`/customers?${queryString}`);
    }

    /**
     * Get Customer by ID
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object>} Customer data
     */
    async getCustomer(customerId) {
        return await this.apiRequest(`/customers/${customerId}`);
    }

    /**
     * Create Customer
     * @param {Object} customerData - Customer data
     * @returns {Promise<Object>} Created customer
     */
    async createCustomer(customerData) {
        return await this.apiRequest("/customers", {
            method: "POST",
            body: JSON.stringify(customerData),
        });
    }

    /**
     * Update Customer
     * @param {string} customerId - Customer ID
     * @param {Object} customerData - Customer data
     * @returns {Promise<Object>} Updated customer
     */
    async updateCustomer(customerId, customerData) {
        return await this.apiRequest(`/customers/${customerId}`, {
            method: "PUT",
            body: JSON.stringify(customerData),
        });
    }

    /**
     * Delete Customer
     * @param {string} customerId - Customer ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteCustomer(customerId) {
        return await this.apiRequest(`/customers/${customerId}`, {
            method: "DELETE",
        });
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Clear stored tokens
     */
    clearTokens() {
        localStorage.removeItem("userAccessToken");
        localStorage.removeItem("userRefreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        this.accessToken = null;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return !!this.accessToken;
    }

    /**
     * Get current user
     * @returns {Object|null} User data
     */
    getCurrentUser() {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Validation result
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with details
     */
    validatePassword(password) {
        const minLength = 6;
        const hasMinLength = password.length >= minLength;

        return {
            isValid: hasMinLength,
            hasMinLength,
            minLength,
            message: hasMinLength
                ? "Password is valid"
                : `Password must be at least ${minLength} characters`,
        };
    }

    /**
     * Get user activity summary
     * @returns {Promise<Object>} Activity summary
     */
    async getActivitySummary() {
        try {
            const [formulas, orders, accessKeys] = await Promise.all([
                this.getFormulas({ page: 1, limit: 1 }),
                this.getOrders({ page: 1, limit: 1 }),
                this.getAccessKeys({ page: 1, limit: 1 }),
            ]);

            return {
                formulas: formulas.data?.pagination?.total || 0,
                orders: orders.data?.pagination?.total || 0,
                accessKeys: accessKeys.data?.pagination?.total || 0,
            };
        } catch (error) {
            console.error("Failed to get activity summary:", error);
            return {
                formulas: 0,
                orders: 0,
                accessKeys: 0,
            };
        }
    }
}

export default UserApiService;
