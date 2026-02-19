/**
 * Backup API Service
 * Handles all database backup and restore operations
 */
import { getApiUrl } from "../config/api.js";

class BackupService {
    constructor() {
        this.baseURL = "/admin/backup";
        this.accessToken =
            localStorage.getItem("adminAccessToken") ||
            localStorage.getItem("accessToken");
    }

    /**
     * Get headers with admin authentication
     * @returns {Object} Headers object
     */
    getHeaders(isMultipart = false) {
        this.accessToken =
            localStorage.getItem("adminAccessToken") ||
            localStorage.getItem("accessToken");

        const headers = {};

        if (!isMultipart) {
            headers["Content-Type"] = "application/json";
        }

        if (this.accessToken) {
            headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        return headers;
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
                    ...this.getHeaders(options.isMultipart),
                    ...options.headers,
                },
                credentials: "include",
            });

            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: response.statusText };
                }
                throw new Error(errorData.message || errorData.details || "Request failed");
            }

            if (options.returnBlob) {
                return await response.blob();
            }

            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            }

            return response;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Create a new database backup
     * @param {Object} params - Backup parameters
     * @param {string} params.type - 'full' or 'selective'
     * @param {Array<string>} params.collections - Array of collection names (for selective backup)
     * @param {string} params.format - 'json' or 'bson'
     * @returns {Promise<Object>} Backup creation result
     */
    async createBackup({ type = 'full', collections = [], format = 'json' }) {
        return this.apiRequest(`${this.baseURL}/create`, {
            method: "POST",
            body: JSON.stringify({ type, collections, format }),
        });
    }

    /**
     * Get list of all backups
     * @returns {Promise<Object>} List of backups with metadata
     */
    async listBackups() {
        return this.apiRequest(`${this.baseURL}/list`, {
            method: "GET",
        });
    }

    /**
     * Get metadata for a specific backup
     * @param {string} backupId - Backup ID
     * @returns {Promise<Object>} Backup metadata
     */
    async getBackupDetails(backupId) {
        return this.apiRequest(`${this.baseURL}/${backupId}`, {
            method: "GET",
        });
    }

    /**
     * Download a backup file
     * @param {string} backupId - Backup ID
     * @param {string} filename - Filename for download
     * @returns {Promise<void>} Triggers browser download
     */
    async downloadBackup(backupId, filename) {
        try {
            const blob = await this.apiRequest(`${this.baseURL}/${backupId}/download`, {
                method: "GET",
                returnBlob: true,
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `backup_${backupId}.gz`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading backup:", error);
            throw error;
        }
    }

    /**
     * Delete a backup
     * @param {string} backupId - Backup ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteBackup(backupId) {
        return this.apiRequest(`${this.baseURL}/${backupId}`, {
            method: "DELETE",
        });
    }

    /**
     * Upload and import a backup file
     * @param {File} file - Backup file to import
     * @param {string} mode - Import mode: 'replace', 'merge', or 'upsert'
     * @param {Array<string>} collections - Optional array of collections to import
     * @returns {Promise<Object>} Import result
     */
    async uploadBackupFile(file, mode = 'merge', collections = null) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        
        if (collections && collections.length > 0) {
            formData.append('collections', JSON.stringify(collections));
        }

        return this.apiRequest(`${this.baseURL}/import`, {
            method: "POST",
            body: formData,
            isMultipart: true,
            headers: {},
        });
    }

    /**
     * Validate a backup file before import
     * @param {File} file - Backup file to validate
     * @returns {Promise<Object>} Validation result with summary
     */
    async validateBackupFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        return this.apiRequest(`${this.baseURL}/validate`, {
            method: "POST",
            body: formData,
            isMultipart: true,
            headers: {},
        });
    }

    /**
     * Get list of available collections in the database
     * @returns {Promise<Object>} List of collection names
     */
    async getAvailableCollections() {
        return this.apiRequest(`${this.baseURL}/collections`, {
            method: "GET",
        });
    }
}

export default new BackupService();
