/**
 * Kanban Board API Service
 * Handles all API calls for the Kanban board using live backend APIs
 */

import api from '../../../utils/api';

/**
 * Kanban Board Service Class
 */
class KanbanService {
  constructor() {
    this.baseURL = '';
  }

  /**
   * Handle API response and extract data
   */
  handleResponse(response) {
    // Check if response is HTML (indicates API endpoint doesn't exist)
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.warn('API endpoint returned HTML instead of JSON - endpoint may not exist');
      return null;
    }
    
    if (response.data?.success !== false) {
      return response.data?.data || response.data;
    }
    throw new Error(response.data?.message || 'API request failed');
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    console.error('API Error:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }

  // ==================== BOARD MANAGEMENT ====================

  /**
   * Get complete board structure with columns and cards
   */
  async getBoard() {
    try {
      const response = await api.get(`${this.baseURL}/board`);
      console.log('getBoard response:', response);
      return this.handleResponse(response);
      } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update board settings
   */
  async updateBoardSettings(settings) {
    try {
      const response = await api.patch(`${this.baseURL}/board`, { settings });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== CARD MANAGEMENT ====================

  /**
   * List cards with filtering and pagination
   */
  async getCards(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/card`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get card details by ID
   */
  async getCard(cardId) {
    try {
      const response = await api.get(`${this.baseURL}/card/${cardId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new card
   */
  async createCard(cardData) {
    try {
      const response = await api.post(`${this.baseURL}/card`, cardData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update an existing card
   */
  async updateCard(cardId, cardData) {
    try {
      const response = await api.put(`${this.baseURL}/card/${cardId}`, cardData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a card
   */
  async deleteCard(cardId) {
    try {
      const response = await api.delete(`${this.baseURL}/card/${cardId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Move a card to a different column/list
   */
  async moveCard(cardId, moveData) {
    try {
      const response = await api.post(`${this.baseURL}/card/${cardId}/move`, moveData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Archive a card
   */
  async archiveCard(cardId) {
    try {
      const response = await api.post(`${this.baseURL}/card/${cardId}/archive`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== COLUMN MANAGEMENT ====================

  /**
   * Get all columns
   */
  async getColumns() {
    try {
      const response = await api.get(`${this.baseURL}/column`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new column
   */
  async createColumn(columnData) {
    try {
      const response = await api.post(`${this.baseURL}/column`, columnData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a column
   */
  async updateColumn(columnId, columnData) {
    try {
      const response = await api.put(`${this.baseURL}/column/${columnId}`, columnData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a column
   */
  async deleteColumn(columnId) {
    try {
      const response = await api.delete(`${this.baseURL}/column/${columnId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Toggle column activation
   */
  async toggleColumnActivation(columnId, isActive) {
    try {
      const response = await api.post(`${this.baseURL}/column/${columnId}/toggle`, { isActive });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Reorder columns
   */
  async reorderColumns(reorderData) {
    try {
      const response = await api.put(`${this.baseURL}/column/reorder`, reorderData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== COMMENT MANAGEMENT ====================

  /**
   * Get comments for a card
   */
  async getComments(cardId, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/comment/card/${cardId}`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Add a comment to a card
   */
  async addComment(cardId, commentData) {
    try {
      const response = await api.post(`${this.baseURL}/comment/card/${cardId}`, commentData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a comment
   */
  async updateComment(commentId, updates) {
    try {
      const response = await api.put(`${this.baseURL}/comment/${commentId}`, updates);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId) {
    try {
      const response = await api.delete(`${this.baseURL}/comment/${commentId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== LABEL MANAGEMENT ====================

  /**
   * Get labels for the board
   */
  async getLabels() {
      try {
      const response = await api.get(`${this.baseURL}/label`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new label
   */
  async createLabel(labelData) {
    try {
      const response = await api.post(`${this.baseURL}/label`, labelData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a label
   */
  async updateLabel(labelId, labelData) {
    try {
      const response = await api.put(`${this.baseURL}/label/${labelId}`, labelData);
      return this.handleResponse(response);
      } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a label
   */
  async deleteLabel(labelId) {
    try {
      const response = await api.delete(`${this.baseURL}/label/${labelId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Get users (for mentions and assignments)
   * Uses Kanban-specific users API with workspace filtering
   */
  async getUsers() {
    try {
      // Use Kanban-specific users endpoint
      const response = await api.get(`${this.baseURL}/kanban/users`);
      response.data = response.data.data.users;
      const result = this.handleResponse(response);
      
      // Ensure we always return an array
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.warn('Kanban users endpoint not available:', error.message);
      
      // Return mock users for development/testing
      // console.log('Using mock users for development');
      // return this.getMockUsers();
      return {
        status: 'success',
        data: {
          users: [],
          message: 'Kanban users endpoint not available'
        }
      };
    }
  }

  /**
   * Get user by ID with memberships
   */
  async getUserById(userId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/users/${userId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/users`, userData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`${this.baseURL}/kanban/users/${userId}`, userData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Soft delete user
   */
  async deleteUser(userId) {
    try {
      const response = await api.delete(`${this.baseURL}/kanban/users/${userId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/users/${userId}/activity`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Invite user to workspace
   */
  async inviteUserToWorkspace(userId, workspaceData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/users/${userId}/invite-to-workspace`, workspaceData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get mock users for development/testing
   */
  getMockUsers() {
    return [
      // Production Users
      {
        id: 'prod-1',
        _id: 'prod-1',
        name: 'John Smith',
        username: 'john.smith',
        role: 'production',
        department: 'production',
        groupType: 'production',
        email: 'john.smith@megapaints.com'
      },
      {
        id: 'prod-2',
        _id: 'prod-2',
        name: 'Sarah Johnson',
        username: 'sarah.johnson',
        role: 'production',
        department: 'production',
        groupType: 'production',
        email: 'sarah.johnson@megapaints.com'
      },
      {
        id: 'prod-3',
        _id: 'prod-3',
        name: 'Mike Wilson',
        username: 'mike.wilson',
        role: 'production',
        department: 'production',
        groupType: 'production',
        email: 'mike.wilson@megapaints.com'
      },
      // Driver Users
      {
        id: 'driver-1',
        _id: 'driver-1',
        name: 'David Brown',
        username: 'david.brown',
        role: 'driver',
        department: 'drivers',
        groupType: 'drivers',
        email: 'david.brown@megapaints.com'
      },
      {
        id: 'driver-2',
        _id: 'driver-2',
        name: 'Lisa Davis',
        username: 'lisa.davis',
        role: 'driver',
        department: 'drivers',
        groupType: 'drivers',
        email: 'lisa.davis@megapaints.com'
      },
      {
        id: 'driver-3',
        _id: 'driver-3',
        name: 'Tom Miller',
        username: 'tom.miller',
        role: 'driver',
        department: 'drivers',
        groupType: 'drivers',
        email: 'tom.miller@megapaints.com'
      },
      // Other Users (won't be used for subcolumns)
      {
        id: 'admin-1',
        _id: 'admin-1',
        name: 'Admin User',
        username: 'admin',
        role: 'admin',
        department: 'management',
        groupType: 'admin',
        email: 'admin@megapaints.com'
      },
      {
        id: 'sales-1',
        _id: 'sales-1',
        name: 'Sales Rep',
        username: 'sales.rep',
        role: 'sales',
        department: 'sales',
        groupType: 'sales',
        email: 'sales@megapaints.com'
      }
    ];
  }

  // ==================== ACTIVITY LOGGING ====================

  /**
   * Log activity
   */
  async logActivity(activityData) {
    try {
      const response = await api.post(`${this.baseURL}/activity`, activityData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get activity log for a card
   */
  async getCardActivity(cardId, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/activity/card/${cardId}`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== SEARCH ====================

  /**
   * Search cards
   */
  async searchCards(query, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/card/search`, { 
        params: { q: query, ...params } 
      });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search cards in specific column (for > 7 Days column)
   */
  async searchCardsInColumn(columnId, query, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/card/search`, { 
        params: { q: query, columnId, ...params } 
      });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Transform card data to frontend format
   */
  transformCardData(apiCard) {
    return {
      id: apiCard._id || apiCard.id,
      title: apiCard.title || 'Untitled Card',
      description: apiCard.description || '',
      cardId: apiCard.cardId || apiCard._id,
      columnId: apiCard.columnId,
      subcolumnId: apiCard.subcolumnId || null,
      priority: apiCard.priority || 'medium',
      labels: (apiCard.labels || []).map(label => ({
        id: label._id || label.id,
        name: label.text || label.name,
        color: label.color || '#6b7280'
      })),
      assignees: apiCard.assignees || [],
      dueDate: apiCard.dueDate || null,
      createdAt: apiCard.createdAt || new Date().toISOString(),
      updatedAt: apiCard.updatedAt || new Date().toISOString(),
      createdBy: apiCard.createdBy,
      // Additional fields
      attachments: apiCard.attachments || [],
      comments: apiCard.comments || [],
      activities: apiCard.activities || [],
      checklists: apiCard.checklists || [],
      customFields: apiCard.customFields || [],
      contacts: apiCard.contacts || [],
      readyProducts: apiCard.readyProducts || [],
      isDeleted: apiCard.isDeleted || false,
      isArchived: apiCard.isArchived || false,
      position: apiCard.position || 0,
      branchId: apiCard.branchId,
      // Keep original data for debugging
      _originalData: apiCard
    };
  }

  /**
   * Transform frontend card data to API format
   */
  transformCardToApi(frontendCard) {
    return {
      title: frontendCard.title,
      description: frontendCard.description,
      priority: frontendCard.priority,
      dueDate: frontendCard.dueDate,
      columnId: frontendCard.columnId,
      subcolumnId: frontendCard.subcolumnId,
      contacts: frontendCard.contacts || [],
      labels: frontendCard.labels?.map(label => ({
        text: label.name || label.text,
        color: label.color
      })) || [],
      checklists: frontendCard.checklists || [],
      readyProducts: frontendCard.readyProducts || [],
      attachments: frontendCard.attachments || [],
      customFields: frontendCard.customFields || [],
      assignees: frontendCard.assignees || [],
      position: frontendCard.position || 0
    };
  }

  /**
   * Transform move data for API
   */
  transformMoveData(moveData) {
    return {
      toColumnId: moveData.toColumnId || moveData.columnId,
      toSubColumnId: moveData.toSubColumnId || moveData.subcolumnId,
      position: moveData.position || 0,
      fromColumnId: moveData.fromColumnId,
      fromSubColumnId: moveData.fromSubColumnId
    };
  }

  /**
   * Check if move is allowed based on DnD rules
   */
  isMoveAllowed(fromColumn, toColumn, fromSubColumn = null, toSubColumn = null) {
    // Restrict moves to/from < 7 Days and > 7 Days columns
    const restrictedSubColumns = ['less-than-7-days', 'more-than-7-days'];
    
    if (fromSubColumn && restrictedSubColumns.includes(fromSubColumn)) {
      return false;
    }
    
    if (toSubColumn && restrictedSubColumns.includes(toSubColumn)) {
      return false;
    }
    
    return true;
  }
}

// Create singleton instance
const kanbanService = new KanbanService();

export { kanbanService };