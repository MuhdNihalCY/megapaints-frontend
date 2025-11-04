/**
 * Branch Management Service
 * Handles branch-related operations and API calls
 */

import { api } from '../../utils/api';

class BranchService {
  constructor() {
    this.baseURL = '/api';
  }

  /**
   * Handle API response
   */
  handleResponse(response, endpoint) {
    console.log(`✅ [API Success] ${endpoint}:`, response.data);
    return response.data;
  }

  /**
   * Handle API error
   */
  handleError(error, endpoint) {
    console.error(`💥 [API Error] ${endpoint}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    });
    throw error;
  }

  // ==================== BRANCH MANAGEMENT ====================

  /**
   * Get all branches
   */
  async getBranches(params = {}) {
    const endpoint = 'GET /api/branches';
    console.log(`🚀 [API Call] ${endpoint}:`, { params });
    try {
      const response = await api.get(`${this.baseURL}/branches`, { params });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  /**
   * Get branch by ID
   */
  async getBranchById(branchId) {
    const endpoint = `GET /api/branches/${branchId}`;
    console.log(`🚀 [API Call] ${endpoint}:`, { branchId });
    try {
      const response = await api.get(`${this.baseURL}/branches/${branchId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  /**
   * Create new branch
   */
  async createBranch(branchData) {
    const endpoint = 'POST /api/branches';
    console.log(`🚀 [API Call] ${endpoint}:`, { branchData });
    try {
      const response = await api.post(`${this.baseURL}/branches`, branchData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  /**
   * Update branch
   */
  async updateBranch(branchId, updates) {
    const endpoint = `PUT /api/branches/${branchId}`;
    console.log(`🚀 [API Call] ${endpoint}:`, { branchId, updates });
    try {
      const response = await api.put(`${this.baseURL}/branches/${branchId}`, updates);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  /**
   * Delete branch
   */
  async deleteBranch(branchId) {
    const endpoint = `DELETE /api/branches/${branchId}`;
    console.log(`🚀 [API Call] ${endpoint}:`, { branchId });
    try {
      const response = await api.delete(`${this.baseURL}/branches/${branchId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  /**
   * Search branches
   */
  async searchBranches(query, params = {}) {
    const endpoint = 'GET /api/branches/search';
    console.log(`🚀 [API Call] ${endpoint}:`, { query, params });
    try {
      const searchParams = { q: query, ...params };
      const response = await api.get(`${this.baseURL}/branches/search`, { params: searchParams });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  /**
   * Get user's current branch
   */
  async getCurrentBranch() {
    const endpoint = 'GET /api/branches/current';
    console.log(`🚀 [API Call] ${endpoint}`);
    try {
      const response = await api.get(`${this.baseURL}/branches/current`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  /**
   * Switch user's branch
   */
  async switchBranch(branchId) {
    const endpoint = 'POST /api/branches/switch';
    console.log(`🚀 [API Call] ${endpoint}:`, { branchId });
    try {
      const response = await api.post(`${this.baseURL}/branches/switch`, { branch_id: branchId });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get default branch ID
   */
  getDefaultBranchId() {
    return 'default-branch-id';
  }

  /**
   * Check if branch ID is valid
   */
  isValidBranchId(branchId) {
    return branchId && branchId !== 'default-branch-id' && branchId.length > 0;
  }

  /**
   * Format branch data for display
   */
  formatBranchForDisplay(branch) {
    if (!branch) return null;
    
    return {
      id: branch._id || branch.id,
      name: branch.name || 'Unknown Branch',
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager: branch.manager || null,
      isActive: branch.is_active !== false,
      createdAt: branch.created_at || branch.createdAt,
      updatedAt: branch.updated_at || branch.updatedAt
    };
  }
}

// Create and export singleton instance
const branchService = new BranchService();
export default branchService;


