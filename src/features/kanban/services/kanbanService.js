/**
 * Kanban Board API Service
 * Handles all API calls for the Kanban board based on the API documentation
 */

import api from '../../../utils/api';

/**
 * Kanban Board Service Class
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
   * List branch cards with filtering and pagination
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
   * Get all branch cards
   */
  async getAllBranchCards() {
    try {
      const response = await api.get(`${this.baseURL}/card/branch`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get cards for a specific column
   */
  async getColumnCards(columnId) {
    try {
      const response = await api.get(`${this.baseURL}/card/column/${columnId}`);
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
   * Get board columns
   */
  async getColumns(boardId) {
    try {
      const response = await api.get(`${this.baseURL}/column/board/${boardId}`);
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
  async reorderColumns(boardId, reorderData) {
    try {
      const response = await api.put(`${this.baseURL}/column/${boardId}/reorder`, reorderData);
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
   * Get all labels
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

  /**
   * Get branch labels
   */
  async getBranchLabels(branchId) {
    try {
      const response = await api.get(`${this.baseURL}/label/branch/${branchId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Get users (for mentions and assignments)
   * Note: This might be a different endpoint depending on your user service
   */
  async getUsers() {
    try {
      // This endpoint might be different in your system
      const response = await api.get('/users') || await api.get('/auth/users');
      return this.handleResponse(response);
    } catch (error) {
      // Fallback for development
      console.warn('Users endpoint not available:', error.message);
      return [];
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Transform API card data to frontend format if needed
   */
  transformCardData(apiCard) {
    // Debug logging
    console.log('Transforming card data:', {
      id: apiCard._id || apiCard.id,
      name: apiCard.Name,
      currentList: apiCard.CurrentList,
      listArray: apiCard.ListArray
    });

    // Determine column ID from CurrentList or ListArray
    let columnId = apiCard.columnId;
    let currentListName = apiCard.CurrentList;
    
    if (!columnId) {
      if (apiCard.CurrentList) {
        columnId = this.mapListToColumn(apiCard.CurrentList);
        currentListName = apiCard.CurrentList;
      } else if (apiCard.ListArray && apiCard.ListArray.length > 0) {
        // Use the most recent list from ListArray that has InTime but no OutTime
        const activeList = apiCard.ListArray.find(list => list.InTime && !list.OutTime);
        if (activeList && activeList.ListName) {
          columnId = this.mapListToColumn(activeList.ListName);
          currentListName = activeList.ListName;
        } else {
          // Fallback to the most recent list
          const latestList = apiCard.ListArray[apiCard.ListArray.length - 1];
          columnId = this.mapListToColumn(latestList.ListName);
          currentListName = latestList.ListName;
        }
      } else {
        // Default fallback - assume it's in ORDERS (sales)
        columnId = 'sales';
        currentListName = 'ORDERS';
      }
    }

    // Determine subcolumn ID if needed
    let subcolumnId = apiCard.subcolumnId || null;
    if (!subcolumnId && currentListName) {
      // Check if it's a done subcolumn
      if (currentListName === 'DONE TODAY') {
        subcolumnId = 'done-today';
      } else if (currentListName === 'LESS THAN 7 DAYS') {
        subcolumnId = 'less-than-7-days';
      } else if (currentListName === 'MORE THAN 7 DAYS') {
        subcolumnId = 'more-than-7-days';
      }
    }

    console.log('Mapped column data:', {
      columnId,
      subcolumnId,
      currentList: apiCard.CurrentList
    });

    return {
      id: apiCard._id || apiCard.id,
      title: apiCard.title || apiCard.Name || 'Untitled Card',
      description: apiCard.description || '',
      cardId: apiCard.cardId || apiCard.OrderIDNumber,
      columnId: columnId,
      subcolumnId: subcolumnId,
      priority: apiCard.priority || 'medium',
      labels: apiCard.labels || (apiCard.Labels || []).map(label => ({
        id: label.Name || label.id || 'unknown',
        name: label.Name || label.name || 'Unknown',
        color: label.Color || label.color || '#6b7280'
      })),
      assignees: apiCard.assignees || [],
      dueDate: apiCard.dueDate || null,
      createdAt: apiCard.createdAt || (apiCard.Card_Created?.Time ? new Date(apiCard.Card_Created.Time).toISOString() : new Date().toISOString()),
      updatedAt: apiCard.updatedAt || new Date().toISOString(),
      createdBy: apiCard.createdBy || apiCard.Card_Created?.Name || 'user',
      // Additional fields from your backend
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
      _originalData: {
        CurrentList: apiCard.CurrentList,
        ListArray: apiCard.ListArray,
        determinedCurrentList: currentListName
      }
    };
  }

  /**
   * Map backend list names to frontend column IDs
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

  /**
   * Map frontend column IDs to backend list names
   */
  mapColumnToList(columnId, subcolumnId = null) {
    if (columnId === 'done' && subcolumnId) {
      const subcolumnMap = {
        'done-today': 'DONE TODAY',
        'less-than-7-days': 'LESS THAN 7 DAYS',
        'more-than-7-days': 'MORE THAN 7 DAYS'
      };
      return subcolumnMap[subcolumnId] || 'DONE TODAY';
    }

    const columnToListMap = {
      'sales': 'ORDERS',
      'office': 'OFFICE SECTION',
      'production': 'PRODUCTION',
      'ready': 'READY',
      'done': 'DONE TODAY'
    };

    return columnToListMap[columnId] || 'ORDERS';
  }

  /**
   * Transform frontend card data to API format
   */
  transformCardToApi(frontendCard) {
    return {
      title: frontendCard.title,
      description: frontendCard.description,
      cardId: frontendCard.cardId,
      priority: frontendCard.priority,
      labels: frontendCard.labels?.map(label => label.name || label) || [],
      assignees: frontendCard.assignees || [],
      dueDate: frontendCard.dueDate,
      columnId: frontendCard.columnId,
      subcolumnId: frontendCard.subcolumnId,
      // Map to backend list format
      toList: this.mapColumnToList(frontendCard.columnId, frontendCard.subcolumnId),
      // Additional fields
      CustomerName: frontendCard.customerName,
      ContactPersonName: frontendCard.contactPersonName,
      ContactNumber: frontendCard.contactNumber,
      ReadyProducts: frontendCard.readyProducts || [],
      CheckListItems: { checkItems: frontendCard.checklistItems || [] },
      ProductionPerson: frontendCard.productionPerson,
      Position: frontendCard.position || 0
    };
  }
}

// Create singleton instance
const kanbanService = new KanbanService();

export { kanbanService };