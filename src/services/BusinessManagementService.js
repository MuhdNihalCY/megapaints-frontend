/**
 * Business Management Service
 * Specialized service for admin business operations
 * Handles branches, users, and other business-related operations
 */
class BusinessManagementService {
    constructor(adminApiService) {
        this.adminApi = adminApiService;
    }

    // ==================== BRANCH MANAGEMENT ====================

    /**
     * Get all branches with pagination and filtering
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Branches data
     */
    async getBranches(options = {}) {
        const params = {
            page: 1,
            limit: 20,
            search: "",
            is_active: null,
            ...options,
        };
        return await this.adminApi.getBranches(params);
    }

    /**
     * Get active branches only
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Active branches
     */
    async getActiveBranches(options = {}) {
        return await this.getBranches({
            ...options,
            is_active: true,
        });
    }

    /**
     * Search branches by name, code, or address
     * @param {string} searchTerm - Search term
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Search results
     */
    async searchBranches(searchTerm, options = {}) {
        return await this.getBranches({
            ...options,
            search: searchTerm,
        });
    }

    /**
     * Create a new branch
     * @param {Object} branchData - Branch data
     * @returns {Promise<Object>} Created branch
     */
    async createBranch(branchData) {
        return await this.adminApi.createBranch(branchData);
    }

    /**
     * Get branch by ID
     * @param {string} branchId - Branch ID
     * @returns {Promise<Object>} Branch data
     */
    async getBranchById(branchId) {
        return await this.adminApi.apiRequest(
            `/admin/business/branches/${branchId}`,
        );
    }

    /**
     * Update branch
     * @param {string} branchId - Branch ID
     * @param {Object} branchData - Branch data
     * @returns {Promise<Object>} Updated branch
     */
    async updateBranch(branchId, branchData) {
        return await this.adminApi.apiRequest(
            `/admin/business/branches/${branchId}`,
            {
                method: "PUT",
                body: JSON.stringify(branchData),
            },
        );
    }

    /**
     * Delete branch
     * @param {string} branchId - Branch ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteBranch(branchId) {
        return await this.adminApi.apiRequest(
            `/admin/business/branches/${branchId}`,
            {
                method: "DELETE",
            },
        );
    }

    /**
     * Get branch statistics
     * @param {string} branchId - Branch ID
     * @returns {Promise<Object>} Branch statistics
     */
    async getBranchStatistics(branchId) {
        try {
            const branch = await this.getBranchById(branchId);
            const users = await this.getUsersByBranch(branchId);

            return {
                status: "success",
                data: {
                    branch: branch.data.branch,
                    userCount: users.data.users?.length || 0,
                    inventorySummary:
                        branch.data.branch.inventory_summary || {},
                    lowStockProducts:
                        branch.data.branch.low_stock_products || 0,
                },
            };
        } catch (error) {
            console.error("Failed to get branch statistics:", error);
            throw error;
        }
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * Get all users with pagination and filtering
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Users data
     */
    async getUsers(options = {}) {
        const params = {
            page: 1,
            limit: 20,
            search: "",
            ...options,
        };

        // Remove null/undefined values
        Object.keys(params).forEach((key) => {
            if (
                params[key] === null ||
                params[key] === undefined ||
                params[key] === ""
            ) {
                delete params[key];
            }
        });

        return await this.adminApi.getUsers(params);
    }

    /**
     * Get users by branch
     * @param {string} branchId - Branch ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Users in branch
     */
    async getUsersByBranch(branchId, options = {}) {
        return await this.getUsers({
            ...options,
            branch_id: branchId,
        });
    }

    /**
     * Get users by designation
     * @param {string} designation - User designation
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Users with designation
     */
    async getUsersByDesignation(designation, options = {}) {
        return await this.getUsers({
            ...options,
            designation: designation,
        });
    }

    /**
     * Get active users only
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Active users
     */
    async getActiveUsers(options = {}) {
        return await this.getUsers({
            ...options,
            is_active: true,
        });
    }

    /**
     * Search users by name, email, or username
     * @param {string} searchTerm - Search term
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Search results
     */
    async searchUsers(searchTerm, options = {}) {
        return await this.getUsers({
            ...options,
            search: searchTerm,
        });
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        return await this.adminApi.createUser(userData);
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getUserById(userId) {
        return await this.adminApi.getUserById(userId);
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, userData) {
        return await this.adminApi.updateUser(userId, userData);
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteUser(userId) {
        return await this.adminApi.apiRequest(
            `/admin/business/users/${userId}`,
            {
                method: "DELETE",
            },
        );
    }

    /**
     * Activate user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Activation result
     */
    async activateUser(userId) {
        return await this.updateUser(userId, { is_active: true });
    }

    /**
     * Deactivate user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Deactivation result
     */
    async deactivateUser(userId) {
        return await this.updateUser(userId, { is_active: false });
    }

    /**
     * Reset user password
     * @param {string} userId - User ID
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Reset result
     */
    async resetUserPassword(userId, newPassword) {
        return await this.adminApi.apiRequest(
            `/admin/business/users/${userId}/reset-password`,
            {
                method: "POST",
                body: JSON.stringify({ newPassword }),
            },
        );
    }

    /**
     * Get user permissions
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User permissions
     */
    async getUserPermissions(userId) {
        try {
            const user = await this.getUserById(userId);
            return {
                status: "success",
                data: {
                    permissions: user.data.user.permissions || [],
                    roles: user.data.user.roles || [],
                },
            };
        } catch (error) {
            console.error("Failed to get user permissions:", error);
            throw error;
        }
    }

    /**
     * Update user permissions
     * @param {string} userId - User ID
     * @param {Array} permissions - New permissions array
     * @returns {Promise<Object>} Update result
     */
    async updateUserPermissions(userId, permissions) {
        return await this.updateUser(userId, { permissions });
    }

    /**
     * Update user roles
     * @param {string} userId - User ID
     * @param {Array} roles - New roles array
     * @returns {Promise<Object>} Update result
     */
    async updateUserRoles(userId, roles) {
        return await this.updateUser(userId, { roles });
    }

    // ==================== ANALYTICS & REPORTING ====================

    /**
     * Get business overview statistics
     * @returns {Promise<Object>} Business overview
     */
    async getBusinessOverview() {
        try {
            const [branches, users, activeUsers] = await Promise.all([
                this.getBranches({ limit: 1 }),
                this.getUsers({ limit: 1 }),
                this.getActiveUsers({ limit: 1 }),
            ]);

            return {
                status: "success",
                data: {
                    totalBranches: branches.data.pagination?.total || 0,
                    totalUsers: users.data.pagination?.total || 0,
                    activeUsers: activeUsers.data.pagination?.total || 0,
                    inactiveUsers:
                        (users.data.pagination?.total || 0) -
                        (activeUsers.data.pagination?.total || 0),
                },
            };
        } catch (error) {
            console.error("Failed to get business overview:", error);
            throw error;
        }
    }

    /**
     * Get user activity report
     * @param {Object} options - Report options
     * @returns {Promise<Object>} User activity report
     */
    async getUserActivityReport(options = {}) {
        try {
            const { startDate, endDate, branchId } = options;
            const params = {
                limit: 1000,
                ...(branchId && { branch_id: branchId }),
            };

            const users = await this.getUsers(params);
            const filteredUsers =
                users.data.users?.filter((user) => {
                    if (!startDate && !endDate) return true;

                    const lastLogin = new Date(user.last_login);
                    const start = startDate ? new Date(startDate) : new Date(0);
                    const end = endDate ? new Date(endDate) : new Date();

                    return lastLogin >= start && lastLogin <= end;
                }) || [];

            return {
                status: "success",
                data: {
                    users: filteredUsers,
                    totalUsers: filteredUsers.length,
                    activeUsers: filteredUsers.filter((u) => u.is_active)
                        .length,
                    inactiveUsers: filteredUsers.filter((u) => !u.is_active)
                        .length,
                },
            };
        } catch (error) {
            console.error("Failed to get user activity report:", error);
            throw error;
        }
    }

    /**
     * Get branch performance report
     * @param {Object} options - Report options
     * @returns {Promise<Object>} Branch performance report
     */
    async getBranchPerformanceReport(options = {}) {
        try {
            const branches = await this.getBranches({ limit: 1000 });
            const branchStats = await Promise.all(
                branches.data.branches.map(async (branch) => {
                    const stats = await this.getBranchStatistics(branch._id);
                    return {
                        ...branch,
                        userCount: stats.data.userCount,
                        inventorySummary: stats.data.inventorySummary,
                        lowStockProducts: stats.data.lowStockProducts,
                    };
                }),
            );

            return {
                status: "success",
                data: {
                    branches: branchStats,
                    totalBranches: branchStats.length,
                    activeBranches: branchStats.filter((b) => b.is_active)
                        .length,
                },
            };
        } catch (error) {
            console.error("Failed to get branch performance report:", error);
            throw error;
        }
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk create users
     * @param {Array} users - Array of users to create
     * @returns {Promise<Object>} Bulk creation result
     */
    async bulkCreateUsers(users) {
        const results = {
            successful: [],
            failed: [],
            total: users.length,
        };

        for (const user of users) {
            try {
                const result = await this.createUser(user);
                results.successful.push(result.data);
            } catch (error) {
                results.failed.push({
                    user,
                    error: error.message,
                });
            }
        }

        return {
            status: "success",
            data: results,
        };
    }

    /**
     * Bulk update user status
     * @param {Array} userIds - Array of user IDs
     * @param {boolean} isActive - New active status
     * @returns {Promise<Object>} Bulk update result
     */
    async bulkUpdateUserStatus(userIds, isActive) {
        const results = {
            successful: [],
            failed: [],
            total: userIds.length,
        };

        for (const userId of userIds) {
            try {
                const result = await this.updateUser(userId, {
                    is_active: isActive,
                });
                results.successful.push(result.data);
            } catch (error) {
                results.failed.push({
                    userId,
                    error: error.message,
                });
            }
        }

        return {
            status: "success",
            data: results,
        };
    }

    /**
     * Export users to CSV
     * @param {Object} options - Export options
     * @returns {Promise<string>} CSV data
     */
    async exportUsersToCSV(options = {}) {
        try {
            const users = await this.getUsers({ limit: 1000, ...options });
            return this.convertUsersToCSV(users.data.users || []);
        } catch (error) {
            console.error("Failed to export users to CSV:", error);
            throw error;
        }
    }

    /**
     * Export branches to CSV
     * @param {Object} options - Export options
     * @returns {Promise<string>} CSV data
     */
    async exportBranchesToCSV(options = {}) {
        try {
            const branches = await this.getBranches({
                limit: 1000,
                ...options,
            });
            return this.convertBranchesToCSV(branches.data.branches || []);
        } catch (error) {
            console.error("Failed to export branches to CSV:", error);
            throw error;
        }
    }

    /**
     * Convert users array to CSV format
     * @param {Array} users - Users array
     * @returns {string} CSV data
     */
    convertUsersToCSV(users) {
        if (!users || users.length === 0) {
            return "No data available";
        }

        const headers = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "company",
            "designation",
            "roles",
            "permissions",
            "is_active",
            "last_login",
        ];

        const csvRows = [
            headers.join(","),
            ...users.map((user) =>
                headers
                    .map((header) => {
                        let value = user[header];
                        if (Array.isArray(value)) {
                            value = value.join(";");
                        }
                        return typeof value === "object"
                            ? JSON.stringify(value)
                            : value || "";
                    })
                    .join(","),
            ),
        ];

        return csvRows.join("\n");
    }

    /**
     * Convert branches array to CSV format
     * @param {Array} branches - Branches array
     * @returns {string} CSV data
     */
    convertBranchesToCSV(branches) {
        if (!branches || branches.length === 0) {
            return "No data available";
        }

        const headers = [
            "name",
            "code",
            "phone",
            "email",
            "address",
            "is_active",
            "createdAt",
        ];

        const csvRows = [
            headers.join(","),
            ...branches.map((branch) =>
                headers
                    .map((header) => {
                        let value = branch[header];
                        if (header === "address" && typeof value === "object") {
                            value = `${value.street}, ${value.city}, ${value.state} ${value.pincode}, ${value.country}`;
                        }
                        return typeof value === "object"
                            ? JSON.stringify(value)
                            : value || "";
                    })
                    .join(","),
            ),
        ];

        return csvRows.join("\n");
    }

    // ==================== VALIDATION HELPERS ====================

    /**
     * Validate user data
     * @param {Object} userData - User data to validate
     * @returns {Object} Validation result
     */
    validateUserData(userData) {
        const errors = [];

        if (!userData.username || userData.username.length < 3) {
            errors.push(
                "Username is required and must be at least 3 characters",
            );
        }

        if (!userData.email || !this.isValidEmail(userData.email)) {
            errors.push("Valid email is required");
        }

        if (!userData.password || userData.password.length < 6) {
            errors.push(
                "Password is required and must be at least 6 characters",
            );
        }

        if (!userData.first_name) {
            errors.push("First name is required");
        }

        if (!userData.last_name) {
            errors.push("Last name is required");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate branch data
     * @param {Object} branchData - Branch data to validate
     * @returns {Object} Validation result
     */
    validateBranchData(branchData) {
        const errors = [];

        if (!branchData.name) {
            errors.push("Branch name is required");
        }

        if (!branchData.code) {
            errors.push("Branch code is required");
        }

        if (!branchData.address || !branchData.address.street) {
            errors.push("Branch address is required");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Validation result
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export default BusinessManagementService;
