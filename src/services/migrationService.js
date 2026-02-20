import { getApiUrl } from "../config/api.js";

class MigrationService {
    constructor() {
        this.baseURL = "/admin/migration";
        this.accessToken =
            localStorage.getItem("adminAccessToken") ||
            localStorage.getItem("accessToken");
    }

    /**
     * Get headers with admin authentication
     * @returns {Object} Headers object
     */
    getHeaders() {
        this.accessToken =
            localStorage.getItem("adminAccessToken") ||
            localStorage.getItem("accessToken");

        const headers = {
            "Content-Type": "application/json",
        };

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
                    ...this.getHeaders(),
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data.data || data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async uploadZipFile(file, onProgress) {
        const formData = new FormData();
        formData.append('zipFile', file);

        try {
            const response = await fetch(getApiUrl(this.baseURL + "/upload"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.accessToken || localStorage.getItem("adminAccessToken") || localStorage.getItem("accessToken")}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Upload failed with status ${response.status}`);
            }

            return data.data || data;
        } catch (error) {
            console.error(`Upload failed:`, error);
            throw error;
        }
    }

    async discoverBackups() {
        return this.apiRequest(this.baseURL + "/discover", {
            method: "GET",
        });
    }

    async analyzeBackup(backupPath) {
        return this.apiRequest(this.baseURL + "/analyze", {
            method: "POST",
            body: JSON.stringify({ backupPath }),
        });
    }

    async getAvailableCollections(backupPath) {
        return this.apiRequest(
            this.baseURL + `/collections?backupPath=${encodeURIComponent(backupPath)}`,
            {
                method: "GET",
            }
        );
    }

    async executeMigration(backupPath, collections, mode, options = {}) {
        return this.apiRequest(this.baseURL + "/execute", {
            method: "POST",
            body: JSON.stringify({
                backupPath,
                collections,
                mode,
                options,
            }),
        });
    }

    async getMigrationProgress(migrationId) {
        return this.apiRequest(this.baseURL + `/progress/${migrationId}`, {
            method: "GET",
        });
    }

    async getMigrationReport(migrationId) {
        return this.apiRequest(this.baseURL + `/report/${migrationId}`, {
            method: "GET",
        });
    }
}

export default new MigrationService();
