/**
 * Inventory Service
 * Specialized service for admin inventory management
 * Handles all inventory-related operations including stock management, analytics, and sync
 */
class InventoryService {
    constructor(adminApiService) {
        this.adminApi = adminApiService;
    }

    // ==================== INVENTORY MANAGEMENT ====================

    /**
     * Get all inventory with pagination and filtering
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Inventory data
     */
    async getInventory(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.page) params.append("page", options.page);
            if (options.limit) params.append("limit", options.limit);
            if (options.branch_id)
                params.append("branch_id", options.branch_id);
            if (options.product_id)
                params.append("product_id", options.product_id);
            if (options.product_type)
                params.append("product_type", options.product_type);
            if (options.search) params.append("search", options.search);
            if (options.sort) params.append("sort", options.sort);

            const queryString = params.toString();
            const endpoint = `/admin/inventory${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            // Validate response structure
            if (!response || !response.data) {
                console.warn("InventoryService: Response missing data field");
            }
            if (response?.data && !Array.isArray(response.data.inventories)) {
                console.warn("InventoryService: Inventories is not an array");
            }

            return response;
        } catch (error) {
            console.error("InventoryService error:", error.message);
            throw error;
        }
    }

    /**
     * Get inventory summary
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Summary data
     */
    async getSummary(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.branch_id)
                params.append("branch_id", options.branch_id);
            if (options.product_type)
                params.append("product_type", options.product_type);

            const queryString = params.toString();
            const endpoint = `/admin/inventory/summary${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            return response;
        } catch (error) {
            console.error("Get inventory summary error:", error);
            throw error;
        }
    }

    /**
     * Get inventory for specific branch
     * @param {String} branchId - Branch ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Branch inventory data
     */
    async getBranchInventory(branchId, options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.product_type)
                params.append("product_type", options.product_type);
            if (options.search) params.append("search", options.search);

            const queryString = params.toString();
            const endpoint = `/admin/inventory/${branchId}${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            return response;
        } catch (error) {
            console.error("Get branch inventory error:", error);
            throw error;
        }
    }

    /**
     * Get specific product inventory
     * @param {String} branchId - Branch ID
     * @param {String} productId - Product ID
     * @returns {Promise<Object>} Product inventory data
     */
    async getProductInventory(branchId, productId) {
        try {
            const response = await this.adminApi.apiRequest(
                `/admin/inventory/${branchId}/${productId}`,
                {
                    method: "GET",
                },
            );

            return response;
        } catch (error) {
            console.error("Get product inventory error:", error);
            throw error;
        }
    }

    /**
     * Create/initialize inventory
     * @param {Object} data - Inventory data
     * @returns {Promise<Object>} Created inventory
     */
    async createInventory(data) {
        try {
            const response = await this.adminApi.apiRequest(
                "/admin/inventory",
                {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            return response;
        } catch (error) {
            console.error("Create inventory error:", error);
            throw error;
        }
    }

    /**
     * Update inventory
     * @param {String} branchId - Branch ID
     * @param {String} productId - Product ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated inventory
     */
    async updateInventory(branchId, productId, updates) {
        try {
            const response = await this.adminApi.apiRequest(
                `/admin/inventory/${branchId}/${productId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(updates),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            return response;
        } catch (error) {
            console.error("Update inventory error:", error);
            throw error;
        }
    }

    /**
     * Bulk update inventory
     * @param {Array} updates - Array of update objects
     * @returns {Promise<Object>} Bulk update results
     */
    async bulkUpdateInventory(updates) {
        try {
            const response = await this.adminApi.apiRequest(
                "/admin/inventory/bulk-update",
                {
                    method: "POST",
                    body: JSON.stringify({ updates }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            return response;
        } catch (error) {
            console.error("Bulk update inventory error:", error);
            throw error;
        }
    }

    /**
     * Add stock
     * @param {String} branchId - Branch ID
     * @param {String} productId - Product ID
     * @param {Number} quantity - Quantity to add
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Updated inventory
     */
    async addStock(branchId, productId, quantity, metadata = {}) {
        try {
            const response = await this.adminApi.apiRequest(
                `/admin/inventory/${branchId}/${productId}/add`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        quantity,
                        ...metadata,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            return response;
        } catch (error) {
            console.error("Add stock error:", error);
            throw error;
        }
    }

    /**
     * Deduct stock
     * @param {String} branchId - Branch ID
     * @param {String} productId - Product ID
     * @param {Number} quantity - Quantity to deduct
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Updated inventory
     */
    async deductStock(branchId, productId, quantity, metadata = {}) {
        try {
            const response = await this.adminApi.apiRequest(
                `/admin/inventory/${branchId}/${productId}/deduct`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        quantity,
                        ...metadata,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            return response;
        } catch (error) {
            console.error("Deduct stock error:", error);
            throw error;
        }
    }

    /**
     * Delete inventory record
     * @param {String} branchId - Branch ID
     * @param {String} productId - Product ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteInventory(branchId, productId) {
        try {
            const response = await this.adminApi.apiRequest(
                `/admin/inventory/${branchId}/${productId}`,
                {
                    method: "DELETE",
                },
            );

            return response;
        } catch (error) {
            console.error("Delete inventory error:", error);
            throw error;
        }
    }

    // ==================== ANALYTICS ====================

    /**
     * Get analytics summary
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Analytics summary
     */
    async getAnalyticsSummary(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.branch_id)
                params.append("branch_id", options.branch_id);
            if (options.product_type)
                params.append("product_type", options.product_type);

            const queryString = params.toString();
            const endpoint = `/admin/inventory/analytics/summary${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            return response;
        } catch (error) {
            console.error("Get analytics summary error:", error);
            throw error;
        }
    }

    /**
     * Get movement trends
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Movement trends
     */
    async getMovementTrends(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.branch_id)
                params.append("branch_id", options.branch_id);
            params.append("period", options.period || "monthly");

            const queryString = params.toString();
            const endpoint = `/admin/inventory/analytics/trends${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            return response;
        } catch (error) {
            console.error("Get movement trends error:", error);
            throw error;
        }
    }

    /**
     * Get financial metrics
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Financial metrics
     */
    async getFinancialMetrics(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.branch_id)
                params.append("branch_id", options.branch_id);
            params.append("period", options.period || "monthly");

            const queryString = params.toString();
            const endpoint = `/admin/inventory/analytics/financial${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            return response;
        } catch (error) {
            console.error("Get financial metrics error:", error);
            throw error;
        }
    }

    /**
     * Get low stock alerts
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Low stock alerts
     */
    async getAlerts(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.branch_id)
                params.append("branch_id", options.branch_id);

            const queryString = params.toString();
            const endpoint = `/admin/inventory/alerts${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            return response;
        } catch (error) {
            console.error("Get alerts error:", error);
            throw error;
        }
    }

    // ==================== SYNC OPERATIONS ====================

    /**
     * Trigger manual sync
     * @param {Object} options - Sync options
     * @returns {Promise<Object>} Sync result
     */
    async syncInventory(options = {}) {
        try {
            const response = await this.adminApi.apiRequest(
                "/admin/inventory/sync",
                {
                    method: "POST",
                    body: JSON.stringify({
                        branch_id: options.branch_id,
                        product_id: options.product_id,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            return response;
        } catch (error) {
            console.error("Sync inventory error:", error);
            throw error;
        }
    }

    /**
     * Get sync conflicts
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Sync conflicts
     */
    async getSyncConflicts(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.branch_id)
                params.append("branch_id", options.branch_id);
            if (options.product_id)
                params.append("product_id", options.product_id);

            const queryString = params.toString();
            const endpoint = `/admin/inventory/sync/conflicts${queryString ? `?${queryString}` : ""}`;

            const response = await this.adminApi.apiRequest(endpoint, {
                method: "GET",
            });

            return response;
        } catch (error) {
            console.error("Get sync conflicts error:", error);
            throw error;
        }
    }

    /**
     * Resolve conflict
     * @param {String} conflictId - Conflict ID
     * @param {String} resolution - Resolution strategy
     * @param {Object} resolutionData - Resolution data
     * @returns {Promise<Object>} Resolution result
     */
    async resolveConflict(conflictId, resolution, resolutionData = {}) {
        try {
            const response = await this.adminApi.apiRequest(
                "/admin/inventory/sync/resolve",
                {
                    method: "POST",
                    body: JSON.stringify({
                        conflict_id: conflictId,
                        resolution,
                        resolution_data: resolutionData,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            return response;
        } catch (error) {
            console.error("Resolve conflict error:", error);
            throw error;
        }
    }
}

export default InventoryService;
