/**
 * Kanban Board Management Service
 * Handles all Kanban board-related API calls based on the new API v2.0
 * Provides comprehensive board, card, column, and comment management
 */
class KanbanBoardService {
  constructor(adminApiService) {
    this.adminApi = adminApiService;
    this.baseURL = '/api/board/v2';
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
      console.error(`Kanban API request failed [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== BOARD MANAGEMENT ====================

  /**
   * Get all boards with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Boards data
   */
  async getBoards(options = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...options
    });
    return await this.adminApi.apiRequest(`/board?${queryString}`);
  }

  /**
   * Get board by ID
   * @param {string} boardId - Board ID
   * @returns {Promise<Object>} Board data
   */
  async getBoardById(boardId) {
    return await this.adminApi.apiRequest(`/board/${boardId}`);
  }

  /**
   * Create new board
   * @param {Object} boardData - Board data
   * @returns {Promise<Object>} Created board
   */
  async createBoard(boardData) {
    return await this.adminApi.apiRequest('/board', {
      method: 'POST',
      body: JSON.stringify(boardData)
    });
  }

  /**
   * Update board
   * @param {string} boardId - Board ID
   * @param {Object} boardData - Board data
   * @returns {Promise<Object>} Updated board
   */
  async updateBoard(boardId, boardData) {
    return await this.adminApi.apiRequest(`/board/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(boardData)
    });
  }

  /**
   * Delete board
   * @param {string} boardId - Board ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBoard(boardId) {
    return await this.adminApi.apiRequest(`/board/${boardId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get boards by branch
   * @param {string} branchId - Branch ID
   * @returns {Promise<Object>} Branch boards
   */
  async getBoardsByBranch(branchId) {
    return await this.apiRequest(`/board/branch?branchId=${branchId}`);
  }

  // ==================== BOARD V2 MANAGEMENT ====================

  /**
   * Get branch board data (complete board with columns and cards)
   * @returns {Promise<Object>} Complete board data
   */
  async getBranchBoardData() {
    return await this.apiRequest('/board/branch');
  }

  /**
   * Get board structure
   * @returns {Promise<Object>} Board structure
   */
  async getBoardStructure() {
    return await this.apiRequest('/board');
  }

  /**
   * Update board settings
   * @param {Object} settings - Board settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateBoardSettings(settings) {
    return await this.apiRequest('/board/branch', {
      method: 'PATCH',
      body: JSON.stringify({ settings })
    });
  }

  /**
   * Get board activity
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Board activity
   */
  async getBoardActivity(options = {}) {
    const queryString = this.buildQueryParams({
      limit: 50,
      ...options
    });
    return await this.apiRequest(`/board/branch/activity?${queryString}`);
  }

  // ==================== CARD MANAGEMENT ====================

  /**
   * Get cards with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Cards data
   */
  async getCards(options = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...options
    });
    return await this.apiRequest(`/card?${queryString}`);
  }

  /**
   * Get card by ID
   * @param {string} cardId - Card ID
   * @returns {Promise<Object>} Card data
   */
  async getCardById(cardId) {
    return await this.apiRequest(`/card/${cardId}`);
  }

  /**
   * Create new card
   * @param {Object} cardData - Card data
   * @returns {Promise<Object>} Created card
   */
  async createCard(cardData) {
    return await this.apiRequest('/card', {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  }

  /**
   * Update card
   * @param {string} cardId - Card ID
   * @param {Object} cardData - Card data
   * @returns {Promise<Object>} Updated card
   */
  async updateCard(cardId, cardData) {
    return await this.apiRequest(`/card/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(cardData)
    });
  }

  /**
   * Delete card
   * @param {string} cardId - Card ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCard(cardId) {
    return await this.apiRequest(`/card/${cardId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Move card to different column
   * @param {string} cardId - Card ID
   * @param {Object} moveData - Move data
   * @returns {Promise<Object>} Move result
   */
  async moveCard(cardId, moveData) {
    return await this.apiRequest(`/card/${cardId}/move`, {
      method: 'POST',
      body: JSON.stringify(moveData)
    });
  }

  /**
   * Archive card
   * @param {string} cardId - Card ID
   * @returns {Promise<Object>} Archive result
   */
  async archiveCard(cardId) {
    return await this.apiRequest(`/card/${cardId}/archive`, {
      method: 'POST'
    });
  }

  /**
   * Restore archived card
   * @param {string} cardId - Card ID
   * @returns {Promise<Object>} Restore result
   */
  async restoreCard(cardId) {
    return await this.apiRequest(`/card/${cardId}/restore`, {
      method: 'POST'
    });
  }

  /**
   * Duplicate card
   * @param {string} cardId - Card ID
   * @param {Object} duplicateData - Duplicate options
   * @returns {Promise<Object>} Duplicated card
   */
  async duplicateCard(cardId, duplicateData = {}) {
    return await this.apiRequest(`/card/${cardId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(duplicateData)
    });
  }

  // ==================== COLUMN MANAGEMENT ====================

  /**
   * Get all columns for user's branch
   * @returns {Promise<Object>} Columns data
   */
  async getColumns() {
    return await this.apiRequest('/columns');
  }

  /**
   * Create new column
   * @param {Object} columnData - Column data
   * @returns {Promise<Object>} Created column
   */
  async createColumn(columnData) {
    return await this.apiRequest('/columns', {
      method: 'POST',
      body: JSON.stringify(columnData)
    });
  }

  /**
   * Update column
   * @param {string} columnId - Column ID
   * @param {Object} columnData - Column data
   * @returns {Promise<Object>} Updated column
   */
  async updateColumn(columnId, columnData) {
    return await this.apiRequest(`/columns/${columnId}`, {
      method: 'PUT',
      body: JSON.stringify(columnData)
    });
  }

  /**
   * Delete column
   * @param {string} columnId - Column ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteColumn(columnId) {
    return await this.apiRequest(`/columns/${columnId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Reorder columns
   * @param {Array} columnOrder - New column order
   * @returns {Promise<Object>} Reorder result
   */
  async reorderColumns(columnOrder) {
    return await this.apiRequest('/columns/reorder', {
      method: 'PUT',
      body: JSON.stringify({ columnOrder })
    });
  }

  // ==================== COMMENT MANAGEMENT ====================

  /**
   * Get card comments
   * @param {string} cardId - Card ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Comments data
   */
  async getCardComments(cardId, options = {}) {
    const queryString = this.buildQueryParams({
      limit: 50,
      skip: 0,
      ...options
    });
    return await this.apiRequest(`/comment/card/${cardId}?${queryString}`);
  }

  /**
   * Add comment to card
   * @param {string} cardId - Card ID
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Created comment
   */
  async addComment(cardId, commentData) {
    return await this.apiRequest(`/comment/card/${cardId}`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
  }

  /**
   * Update comment
   * @param {string} commentId - Comment ID
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Updated comment
   */
  async updateComment(commentId, commentData) {
    return await this.apiRequest(`/comment/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(commentData)
    });
  }

  /**
   * Delete comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteComment(commentId) {
    return await this.apiRequest(`/comment/${commentId}`, {
      method: 'DELETE'
    });
  }

  // ==================== LABEL MANAGEMENT ====================

  /**
   * Get all labels for user's branch
   * @returns {Promise<Object>} Labels data
   */
  async getLabels() {
    return await this.apiRequest('/labels');
  }

  /**
   * Create new label
   * @param {Object} labelData - Label data
   * @returns {Promise<Object>} Created label
   */
  async createLabel(labelData) {
    return await this.apiRequest('/labels', {
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
    return await this.apiRequest(`/labels/${labelId}`, {
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
    return await this.apiRequest(`/labels/${labelId}`, {
      method: 'DELETE'
    });
  }

  // ==================== ANALYTICS & STATISTICS ====================

  /**
   * Get board statistics
   * @returns {Promise<Object>} Board statistics
   */
  async getBoardStatistics() {
    try {
      const boardData = await this.getBranchBoardData();
      return {
        status: 'success',
        data: boardData.data.stats || {}
      };
    } catch (error) {
      console.error('Failed to get board statistics:', error);
      throw error;
    }
  }

  /**
   * Get card analytics
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Card analytics
   */
  async getCardAnalytics(options = {}) {
    try {
      const cards = await this.getCards({ limit: 1000, ...options });
      const analytics = this.calculateCardAnalytics(cards.data);
      
      return {
        status: 'success',
        data: analytics
      };
    } catch (error) {
      console.error('Failed to get card analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate card analytics from cards data
   * @param {Array} cards - Cards array
   * @returns {Object} Analytics data
   */
  calculateCardAnalytics(cards) {
    const totalCards = cards.length;
    const completedCards = cards.filter(card => card.status === 'completed').length;
    const overdueCards = cards.filter(card => 
      card.dueDate && new Date(card.dueDate) < new Date() && card.status !== 'completed'
    ).length;
    
    const priorityBreakdown = {
      low: cards.filter(card => card.priority === 'low').length,
      medium: cards.filter(card => card.priority === 'medium').length,
      high: cards.filter(card => card.priority === 'high').length,
      urgent: cards.filter(card => card.priority === 'urgent').length
    };

    const completionRate = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

    return {
      totalCards,
      completedCards,
      overdueCards,
      completionRate: Math.round(completionRate * 100) / 100,
      priorityBreakdown
    };
  }

  // ==================== SEARCH & FILTERING ====================

  /**
   * Search cards
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchCards(searchTerm, options = {}) {
    return await this.getCards({
      ...options,
      search: searchTerm
    });
  }

  /**
   * Filter cards by criteria
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Filtered cards
   */
  async filterCards(filters) {
    return await this.getCards(filters);
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk update cards
   * @param {Array} cardUpdates - Array of card updates
   * @returns {Promise<Object>} Bulk update result
   */
  async bulkUpdateCards(cardUpdates) {
    const results = {
      successful: [],
      failed: [],
      total: cardUpdates.length
    };

    for (const update of cardUpdates) {
      try {
        const result = await this.updateCard(update.cardId, update.data);
        results.successful.push(result.data);
      } catch (error) {
        results.failed.push({
          cardId: update.cardId,
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
   * Bulk move cards
   * @param {Array} cardMoves - Array of card moves
   * @returns {Promise<Object>} Bulk move result
   */
  async bulkMoveCards(cardMoves) {
    const results = {
      successful: [],
      failed: [],
      total: cardMoves.length
    };

    for (const move of cardMoves) {
      try {
        const result = await this.moveCard(move.cardId, move.moveData);
        results.successful.push(result.data);
      } catch (error) {
        results.failed.push({
          cardId: move.cardId,
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
   * Transform card data for API
   * @param {Object} cardData - Card data
   * @returns {Object} Transformed data
   */
  transformCardToApi(cardData) {
    return {
      title: cardData.title,
      description: cardData.description,
      priority: cardData.priority || 'medium',
      status: cardData.status || 'todo',
      dueDate: cardData.dueDate,
      assigneeId: cardData.assigneeId,
      labels: cardData.labels || [],
      checklist: cardData.checklist || [],
      attachments: cardData.attachments || []
    };
  }

  /**
   * Transform API card data for frontend
   * @param {Object} apiCard - API card data
   * @returns {Object} Transformed data
   */
  transformCardFromApi(apiCard) {
    return {
      id: apiCard._id,
      title: apiCard.title,
      description: apiCard.description,
      priority: apiCard.priority,
      status: apiCard.status,
      dueDate: apiCard.dueDate,
      assignee: apiCard.assignee,
      labels: apiCard.labels || [],
      checklist: apiCard.checklist || [],
      attachments: apiCard.attachments || [],
      comments: apiCard.comments || [],
      createdAt: apiCard.createdAt,
      updatedAt: apiCard.updatedAt
    };
  }

  /**
   * Validate card data
   * @param {Object} cardData - Card data to validate
   * @returns {Object} Validation result
   */
  validateCardData(cardData) {
    const errors = [];
    
    if (!cardData.title || cardData.title.trim().length === 0) {
      errors.push('Card title is required');
    }
    
    if (cardData.title && cardData.title.length > 200) {
      errors.push('Card title must be less than 200 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default KanbanBoardService;
