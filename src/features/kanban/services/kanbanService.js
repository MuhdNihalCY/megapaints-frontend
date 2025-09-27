/**
 * Kanban Board API Service v2.0
 * Handles all API calls for the Kanban board based on the new API v2.0 documentation
 */

import api from '../../../utils/api';

/**
 * Kanban Board Service Class for API v2.0
 */
class KanbanService {
  constructor() {
    this.baseURL = '/board/v2';
  }

  /**
   * Handle API response and extract data
   */
  handleResponse(response) {
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
   * Get complete board structure with columns and cards for the user's branch
   */
  async getBoard() {
    try {
      // Try API v2.0 first
      try {
        const response = await api.get(`${this.baseURL}/board/branch`);
        console.log('getBoard API v2.0 response:', response);
        return this.handleResponse(response);
      } catch (v2Error) {
        console.warn('API v2.0 not available, falling back to v1:', v2Error.message);
        
        // Fallback to existing API structure
        const response = await api.get('/board');
        console.log('getBoard fallback response:', response);
        return this.handleResponse(response);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get board structure (alternative endpoint)
   */
  async getBoardStructure() {
    try {
      const response = await api.get(`${this.baseURL}/board`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update board settings for the user's branch
   */
  async updateBoardSettings(settings) {
    try {
      const response = await api.patch(`${this.baseURL}/board/branch`, { settings });
      return this.handleResponse(response);
      } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get branch board activity
   */
  async getBoardActivity(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/board/branch/activity`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get branch board members
   */
  async getBoardMembers() {
    try {
      const response = await api.get(`${this.baseURL}/board/branch/members`);
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

  /**
   * Bulk move multiple cards
   */
  async bulkMoveCards(moveData) {
    try {
      const response = await api.post(`${this.baseURL}/card/bulk-move`, moveData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Reorder cards within a column
   */
  async reorderCards(columnId, reorderData) {
    try {
      const response = await api.put(`${this.baseURL}/card/${columnId}/reorder`, reorderData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Assign users to a card
   */
  async assignUsers(cardId, assignmentData) {
    try {
      const response = await api.post(`${this.baseURL}/card/${cardId}/assign`, assignmentData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search cards
   */
  async searchCards(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/card/search`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== COLUMN MANAGEMENT ====================

  /**
   * Get all columns for the user's branch
   */
  async getColumns() {
    try {
      const response = await api.get(`${this.baseURL}/columns`);
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
  async toggleColumnActivation(columnId, activationData) {
    try {
      const response = await api.post(`${this.baseURL}/column/${columnId}/toggle`, activationData);
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
      const response = await api.put(`${this.baseURL}/columns/reorder`, reorderData);
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
  async updateComment(commentId, commentData) {
    try {
      const response = await api.put(`${this.baseURL}/comment/${commentId}`, commentData);
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

  /**
   * Get card timeline (comments + activities)
   */
  async getCardTimeline(cardId, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/comment/card/${cardId}/timeline`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get user comments
   */
  async getUserComments(userId, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/comment/user/${userId}`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== LABEL MANAGEMENT ====================

  /**
   * Get all labels for the user's branch
   */
  async getLabels() {
    try {
      // Try API v2.0 first
      try {
        const response = await api.get(`${this.baseURL}/labels`);
        return this.handleResponse(response);
      } catch (v2Error) {
        console.warn('API v2.0 labels not available, falling back to v1:', v2Error.message);
        
        // Fallback to existing API structure
        const response = await api.get('/label');
        return this.handleResponse(response);
      }
    } catch (error) {
      // If both fail, return empty array to prevent app crash
      console.warn('Labels endpoint not available, returning empty array:', error.message);
      return [];
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

  /**
   * Get branch labels (now handled by getLabels)
   */
  async getBranchLabels() {
    return this.getLabels();
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Get users (for mentions and assignments)
   * Note: This might be a different endpoint depending on your user service
   */
  async getUsers() {
    try {
      // Try multiple possible endpoints
      const endpoints = ['/users', '/auth/users', '/api/users', '/api/auth/users'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          return this.handleResponse(response);
        } catch (endpointError) {
          console.debug(`Users endpoint ${endpoint} not available:`, endpointError.message);
        }
      }
      
      // If all endpoints fail, return empty array
      console.warn('No users endpoint available, returning empty array');
      return [];
    } catch (error) {
      // Fallback for development
      console.warn('Users endpoint not available:', error.message);
      return [];
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Transform card data to frontend format (supports both API v1 and v2)
   */
  transformCardData(apiCard) {
    // Debug logging
    console.log('Transforming card data:', {
      id: apiCard._id || apiCard.id,
      title: apiCard.title || apiCard.Name,
      columnId: apiCard.columnId,
      priority: apiCard.priority
    });

    // Check if this is API v2.0 format
    const isV2 = apiCard._id && apiCard.title && !apiCard.Name;
    
    if (isV2) {
      // API v2.0 format
      return {
        id: apiCard._id,
        title: apiCard.title || 'Untitled Card',
        description: apiCard.description || '',
        cardId: apiCard.cardId || apiCard._id,
        columnId: apiCard.columnId?._id || apiCard.columnId,
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
        createdBy: apiCard.createdBy?._id || apiCard.createdBy,
        // Additional fields from API v2.0
        contacts: apiCard.contacts || [],
        checklists: apiCard.checklists || [],
        readyProducts: apiCard.readyProducts || [],
        attachments: apiCard.attachments || [],
        comments: apiCard.comments || [],
        activities: apiCard.activities || [],
        isDeleted: apiCard.isDeleted || false,
        isArchived: apiCard.isArchived || false,
        position: apiCard.position || 0,
        branchId: apiCard.branchId,
        // Keep original data for debugging
        _originalData: apiCard
      };
    } else {
      // API v1 format (legacy)
      return {
        id: apiCard._id || apiCard.id,
        title: apiCard.title || apiCard.Name || 'Untitled Card',
        description: apiCard.description || '',
        cardId: apiCard.cardId || apiCard.OrderIDNumber || apiCard._id || apiCard.id,
        columnId: apiCard.columnId || this.mapListToColumn(apiCard.CurrentList),
        subcolumnId: apiCard.subcolumnId || null,
        priority: apiCard.priority || 'medium',
        labels: (apiCard.labels || apiCard.Labels || []).map(label => ({
          id: label._id || label.id || label.Name,
          name: label.text || label.name || label.Name,
          color: label.color || label.Color || '#6b7280'
        })),
        assignees: apiCard.assignees || [],
        dueDate: apiCard.dueDate || null,
        createdAt: apiCard.createdAt || (apiCard.Card_Created?.Time ? new Date(apiCard.Card_Created.Time).toISOString() : new Date().toISOString()),
        updatedAt: apiCard.updatedAt || new Date().toISOString(),
        createdBy: apiCard.createdBy || apiCard.Card_Created?.Name || 'user',
        // Additional fields from API v1
        customerName: apiCard.CustomerName,
        contactPersonName: apiCard.ContactPersonName,
        contactNumber: apiCard.ContactNumber,
        comments: apiCard.comments || [],
        activity: apiCard.Activity || [],
        checklistItems: apiCard.CheckListItems?.checkItems || [],
        readyProducts: apiCard.ReadyProducts || [],
        isAttachments: apiCard.IsAttachments || false,
        branch: apiCard.Branch,
        branchId: apiCard.BranchID || apiCard.branchId,
        productionPerson: apiCard.ProductionPerson,
        position: apiCard.Position || 0,
        // Keep original data for debugging
        _originalData: apiCard
      };
    }
  }

  /**
   * Transform frontend card data to API v2.0 format
   */
  transformCardToApi(frontendCard) {
    return {
      title: frontendCard.title,
      description: frontendCard.description,
      priority: frontendCard.priority,
      dueDate: frontendCard.dueDate,
      columnId: frontendCard.columnId,
      contacts: frontendCard.contacts || [],
      labels: frontendCard.labels?.map(label => ({
        text: label.name || label.text,
        color: label.color
      })) || [],
      checklists: frontendCard.checklists || [],
      readyProducts: frontendCard.readyProducts || [],
      attachments: frontendCard.attachments || [],
      position: frontendCard.position || 0
    };
  }

  /**
   * Transform move data for API v2.0
   */
  transformMoveData(moveData) {
    return {
      toList: moveData.toList || moveData.columnId,
      position: moveData.position || 0,
      subcolumnId: moveData.subcolumnId || null
    };
  }

  /**
   * Map backend list names to frontend column IDs (legacy API v1)
   */
  mapListToColumn(currentList) {
    const listToColumnMap = {
      'ORDERS': 'sales',
      'OFFICE SECTION': 'office',
      'PRODUCTION': 'production',
      'READY': 'ready',
      'DONE TODAY': 'done',
      'LESS THAN 7 DAYS': 'done',
      'MORE THAN 7 DAYS': 'done'
    };

    return listToColumnMap[currentList] || 'sales';
  }
}

// Create singleton instance
const kanbanService = new KanbanService();

export { kanbanService };