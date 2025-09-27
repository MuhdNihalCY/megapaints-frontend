/**
 * Label Management Service
 * Handles all label-related API calls based on the new API v2.0
 * Provides comprehensive label management with color management and analytics
 */
class LabelManagementService {
  constructor(adminApiService) {
    this.adminApi = adminApiService;
    this.baseURL = '/api/label';
  }

  /**
   * Get headers with authentication
   * @returns {Object} Headers object
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.adminApi.accessToken}`
    };
  }

  /**
   * Build query parameters from object
   * @param {Object} params - Parameters object
   * @returns {string} Query string
   */
  buildQueryParams(params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
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
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Label API request failed [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== LABEL MANAGEMENT ====================

  /**
   * Get all labels with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Labels data
   */
  async getLabels(options = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...options
    });
    return await this.apiRequest(`?${queryString}`);
  }

  /**
   * Get label by ID
   * @param {string} labelId - Label ID
   * @returns {Promise<Object>} Label data
   */
  async getLabelById(labelId) {
    return await this.apiRequest(`/${labelId}`);
  }

  /**
   * Create new label
   * @param {Object} labelData - Label data
   * @returns {Promise<Object>} Created label
   */
  async createLabel(labelData) {
    return await this.apiRequest('', {
      method: 'POST',
      body: JSON.stringify(labelData)
    });
  }

  /**
   * Update label
   * @param {string} labelId - Label ID
   * @param {Object} labelData - Label data
   * @returns {Promise<Object>} Updated label
   */
  async updateLabel(labelId, labelData) {
    return await this.apiRequest(`/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify(labelData)
    });
  }

  /**
   * Delete label
   * @param {string} labelId - Label ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteLabel(labelId) {
    return await this.apiRequest(`/${labelId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get labels by board
   * @param {string} boardId - Board ID
   * @returns {Promise<Object>} Board labels
   */
  async getLabelsByBoard(boardId) {
    return await this.apiRequest(`/v2/labels?boardId=${boardId}`);
  }

  // ==================== LABEL V2 MANAGEMENT ====================

  /**
   * Get all labels for user's branch (V2 API)
   * @returns {Promise<Object>} Branch labels
   */
  async getBranchLabels() {
    return await this.apiRequest('/v2/labels');
  }

  /**
   * Create label for branch (V2 API)
   * @param {Object} labelData - Label data
   * @returns {Promise<Object>} Created label
   */
  async createBranchLabel(labelData) {
    return await this.apiRequest('/v2/labels', {
      method: 'POST',
      body: JSON.stringify(labelData)
    });
  }

  /**
   * Update branch label (V2 API)
   * @param {string} labelId - Label ID
   * @param {Object} labelData - Label data
   * @returns {Promise<Object>} Updated label
   */
  async updateBranchLabel(labelId, labelData) {
    return await this.apiRequest(`/v2/labels/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify(labelData)
    });
  }

  /**
   * Delete branch label (V2 API)
   * @param {string} labelId - Label ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBranchLabel(labelId) {
    return await this.apiRequest(`/v2/labels/${labelId}`, {
      method: 'DELETE'
    });
  }

  // ==================== LABEL CATEGORIES ====================

  /**
   * Get labels by category
   * @param {string} category - Label category
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Labels by category
   */
  async getLabelsByCategory(category, options = {}) {
    return await this.getLabels({
      ...options,
      category: category
    });
  }

  /**
   * Get priority labels
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Priority labels
   */
  async getPriorityLabels(options = {}) {
    return await this.getLabelsByCategory('priority', options);
  }

  /**
   * Get status labels
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Status labels
   */
  async getStatusLabels(options = {}) {
    return await this.getLabelsByCategory('status', options);
  }

  /**
   * Get type labels
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Type labels
   */
  async getTypeLabels(options = {}) {
    return await this.getLabelsByCategory('type', options);
  }

  /**
   * Get custom labels
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Custom labels
   */
  async getCustomLabels(options = {}) {
    return await this.getLabelsByCategory('custom', options);
  }

  // ==================== COLOR MANAGEMENT ====================

  /**
   * Get available colors
   * @returns {Array} Available colors
   */
  getAvailableColors() {
    return [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#A9DFBF', '#F9E79F', '#D5A6BD', '#A3E4D7', '#FADBD8'
    ];
  }

  /**
   * Generate random color
   * @returns {string} Random color
   */
  generateRandomColor() {
    const colors = this.getAvailableColors();
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Calculate text color for background
   * @param {string} backgroundColor - Background color
   * @returns {string} Text color (white or black)
   */
  calculateTextColor(backgroundColor) {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  /**
   * Validate color format
   * @param {string} color - Color to validate
   * @returns {boolean} Validation result
   */
  validateColor(color) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  // ==================== SEARCH & FILTERING ====================

  /**
   * Search labels
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchLabels(searchTerm, options = {}) {
    return await this.getLabels({
      ...options,
      search: searchTerm
    });
  }

  /**
   * Filter labels by criteria
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Filtered labels
   */
  async filterLabels(filters) {
    return await this.getLabels(filters);
  }

  /**
   * Get labels by usage count
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Labels sorted by usage
   */
  async getLabelsByUsage(options = {}) {
    return await this.getLabels({
      ...options,
      sort: 'usageCount',
      order: 'desc'
    });
  }

  // ==================== ANALYTICS & STATISTICS ====================

  /**
   * Get label statistics
   * @returns {Promise<Object>} Label statistics
   */
  async getLabelStatistics() {
    try {
      const labels = await this.getBranchLabels();
      const stats = this.calculateLabelStatistics(labels.data);
      
      return {
        status: 'success',
        data: stats
      };
    } catch (error) {
      console.error('Failed to get label statistics:', error);
      throw error;
    }
  }

  /**
   * Calculate label statistics from labels data
   * @param {Array} labels - Labels array
   * @returns {Object} Statistics data
   */
  calculateLabelStatistics(labels) {
    const totalLabels = labels.length;
    const categoryBreakdown = {};
    const colorBreakdown = {};
    let totalUsage = 0;

    labels.forEach(label => {
      // Category breakdown
      const category = label.category || 'custom';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      
      // Color breakdown
      const color = label.color || '#000000';
      colorBreakdown[color] = (colorBreakdown[color] || 0) + 1;
      
      // Usage count
      totalUsage += label.usageCount || 0;
    });

    const averageUsage = totalLabels > 0 ? totalUsage / totalLabels : 0;
    const mostUsedLabel = labels.reduce((max, label) => 
      (label.usageCount || 0) > (max.usageCount || 0) ? label : max, 
      { usageCount: 0 }
    );

    return {
      totalLabels,
      totalUsage,
      averageUsage: Math.round(averageUsage * 100) / 100,
      categoryBreakdown,
      colorBreakdown,
      mostUsedLabel: mostUsedLabel.usageCount > 0 ? mostUsedLabel : null
    };
  }

  /**
   * Get label usage analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Usage analytics
   */
  async getLabelUsageAnalytics(options = {}) {
    try {
      const labels = await this.getBranchLabels();
      const analytics = this.calculateUsageAnalytics(labels.data, options);
      
      return {
        status: 'success',
        data: analytics
      };
    } catch (error) {
      console.error('Failed to get label usage analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate usage analytics from labels data
   * @param {Array} labels - Labels array
   * @param {Object} options - Analytics options
   * @returns {Object} Analytics data
   */
  calculateUsageAnalytics(labels, options = {}) {
    const { timeRange = '30d', groupBy = 'category' } = options;
    
    // Sort labels by usage count
    const sortedLabels = labels.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    
    // Get top labels
    const topLabels = sortedLabels.slice(0, 10);
    
    // Group by category
    const categoryGroups = {};
    labels.forEach(label => {
      const category = label.category || 'custom';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(label);
    });

    return {
      topLabels,
      categoryGroups,
      timeRange,
      groupBy,
      totalLabels: labels.length
    };
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk create labels
   * @param {Array} labels - Array of labels to create
   * @returns {Promise<Object>} Bulk creation result
   */
  async bulkCreateLabels(labels) {
    const results = {
      successful: [],
      failed: [],
      total: labels.length
    };

    for (const label of labels) {
      try {
        const result = await this.createBranchLabel(label);
        results.successful.push(result.data);
      } catch (error) {
        results.failed.push({
          label,
          error: error.message
        });
      }
    }

    return {
      status: 'success',
      data: results
    };
  }

  /**
   * Bulk update labels
   * @param {Array} labelUpdates - Array of label updates
   * @returns {Promise<Object>} Bulk update result
   */
  async bulkUpdateLabels(labelUpdates) {
    const results = {
      successful: [],
      failed: [],
      total: labelUpdates.length
    };

    for (const update of labelUpdates) {
      try {
        const result = await this.updateBranchLabel(update.labelId, update.data);
        results.successful.push(result.data);
      } catch (error) {
        results.failed.push({
          labelId: update.labelId,
          error: error.message
        });
      }
    }

    return {
      status: 'success',
      data: results
    };
  }

  /**
   * Bulk delete labels
   * @param {Array} labelIds - Array of label IDs to delete
   * @returns {Promise<Object>} Bulk deletion result
   */
  async bulkDeleteLabels(labelIds) {
    const results = {
      successful: [],
      failed: [],
      total: labelIds.length
    };

    for (const labelId of labelIds) {
      try {
        const result = await this.deleteBranchLabel(labelId);
        results.successful.push({ labelId, result });
      } catch (error) {
        results.failed.push({
          labelId,
          error: error.message
        });
      }
    }

    return {
      status: 'success',
      data: results
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate label data
   * @param {Object} labelData - Label data to validate
   * @returns {Object} Validation result
   */
  validateLabelData(labelData) {
    const errors = [];
    
    if (!labelData.text || labelData.text.trim().length === 0) {
      errors.push('Label text is required');
    }
    
    if (labelData.text && labelData.text.length > 50) {
      errors.push('Label text must be less than 50 characters');
    }
    
    if (labelData.color && !this.validateColor(labelData.color)) {
      errors.push('Invalid color format. Use hex format (#RRGGBB)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform label data for API
   * @param {Object} labelData - Label data
   * @returns {Object} Transformed data
   */
  transformLabelToApi(labelData) {
    return {
      text: labelData.text,
      color: labelData.color || this.generateRandomColor(),
      category: labelData.category || 'custom',
      description: labelData.description || '',
      isActive: labelData.isActive !== undefined ? labelData.isActive : true
    };
  }

  /**
   * Transform API label data for frontend
   * @param {Object} apiLabel - API label data
   * @returns {Object} Transformed data
   */
  transformLabelFromApi(apiLabel) {
    return {
      id: apiLabel._id,
      text: apiLabel.text,
      color: apiLabel.color,
      category: apiLabel.category,
      description: apiLabel.description,
      usageCount: apiLabel.usageCount || 0,
      isActive: apiLabel.isActive !== undefined ? apiLabel.isActive : true,
      textColor: this.calculateTextColor(apiLabel.color),
      createdAt: apiLabel.createdAt,
      updatedAt: apiLabel.updatedAt
    };
  }

  /**
   * Create default labels for new board
   * @returns {Array} Default labels
   */
  createDefaultLabels() {
    return [
      { text: 'High Priority', color: '#FF6B6B', category: 'priority' },
      { text: 'Medium Priority', color: '#FFEAA7', category: 'priority' },
      { text: 'Low Priority', color: '#96CEB4', category: 'priority' },
      { text: 'Bug', color: '#FF6B6B', category: 'type' },
      { text: 'Feature', color: '#4ECDC4', category: 'type' },
      { text: 'Enhancement', color: '#45B7D1', category: 'type' },
      { text: 'In Progress', color: '#F7DC6F', category: 'status' },
      { text: 'Review', color: '#DDA0DD', category: 'status' },
      { text: 'Done', color: '#96CEB4', category: 'status' }
    ];
  }

  /**
   * Export labels to CSV
   * @param {Object} options - Export options
   * @returns {Promise<string>} CSV data
   */
  async exportLabelsToCSV(options = {}) {
    try {
      const labels = await this.getBranchLabels();
      return this.convertLabelsToCSV(labels.data);
    } catch (error) {
      console.error('Failed to export labels to CSV:', error);
      throw error;
    }
  }

  /**
   * Convert labels array to CSV format
   * @param {Array} labels - Labels array
   * @returns {string} CSV data
   */
  convertLabelsToCSV(labels) {
    if (!labels || labels.length === 0) {
      return 'No data available';
    }

    const headers = ['text', 'color', 'category', 'description', 'usageCount', 'isActive'];
    const csvRows = [
      headers.join(','),
      ...labels.map(label => 
        headers.map(header => {
          const value = label[header];
          return typeof value === 'object' ? JSON.stringify(value) : (value || '');
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }
}

export default LabelManagementService;
