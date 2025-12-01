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
  handleResponse(response, endpoint = 'unknown') {
    // Check if response is HTML (indicates API endpoint doesn't exist)
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.warn(`⚠️ [API Warning] ${endpoint}: API endpoint returned HTML instead of JSON - endpoint may not exist`);
      return null;
    }
    
    if (response.data?.success !== false) {
      const result = response.data?.data || response.data;
      return result;
    }
    
    console.error(`❌ [API Error] ${endpoint}:`, response.data?.message || 'API request failed');
    throw new Error(response.data?.message || 'API request failed');
  }

  /**
   * Handle API errors
   */
  handleError(error, endpoint = 'unknown') {
    console.error(`💥 [API Error] ${endpoint}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });
    
    // Preserve the original error with response data
    if (error.response?.data?.message) {
      const newError = new Error(error.response.data.message);
      // Attach original error and response for debugging
      newError.originalError = error;
      newError.response = error.response;
      newError.status = error.response.status;
      throw newError;
    }
    throw error;
  }

  // ==================== BOARD MANAGEMENT ====================

  /**
   * Get all boards
   * GET /api/kanban/boards
   */
  async getBoards(params = {}) {
    const endpoint = 'GET /api/kanban/boards';
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/boards`, { params });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Get board by ID
   * GET /api/kanban/boards/:id
   */
  async getBoard(boardId) {
    const endpoint = `GET /api/kanban/boards/${boardId}`;
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/boards/${boardId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Create a new board
   * POST /api/kanban/boards
   */
  async createBoard(boardData) {
    const endpoint = 'POST /api/kanban/boards';
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/boards`, boardData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Update board
   * PUT /api/kanban/boards/:id
   */
  async updateBoard(boardId, boardData) {
    const endpoint = `PUT /api/kanban/boards/${boardId}`;
    
    try {
      const response = await api.put(`${this.baseURL}/kanban/boards/${boardId}`, boardData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Delete board
   * DELETE /api/kanban/boards/:id
   */
  async deleteBoard(boardId) {
    const endpoint = `DELETE /api/kanban/boards/${boardId}`;
    
    try {
      const response = await api.delete(`${this.baseURL}/kanban/boards/${boardId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Get boards by branch (legacy endpoint)
   * GET /api/kanban/boards/v2/board/branch
   */
  async getBoardsByBranch(branchId) {
    const endpoint = `GET /api/kanban/boards/v2/board/branch`;
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/boards/v2/board/branch?branch_id=${branchId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  // ==================== TASK MANAGEMENT ====================

  /**
   * Get all tasks
   * GET /api/kanban/tasks
   */
  async getTasks(params = {}) {
    const endpoint = 'GET /api/kanban/tasks';
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/cards`, { params });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Get task by ID
   * GET /api/kanban/tasks/:id
   */
  async getTask(taskId) {
    const endpoint = `GET /api/kanban/tasks/${taskId}`;
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/cards/${taskId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Create a new task
   * POST /api/kanban/cards
   */
  async createTask(taskData) {
    const endpoint = 'POST /api/kanban/cards';
    
    try {
      // Transform frontend format to backend API format
      const apiData = {
        title: taskData.title,
        description: taskData.description || '',
        board_id: taskData.board_id || taskData.boardId || taskData.board_id,
        column_id: taskData.column_id || taskData.columnId || taskData.listId,
        position: taskData.position || 0,
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || taskData.dueDate || null,
        start_date: taskData.start_date || taskData.startDate || null,
        estimated_hours: taskData.estimated_hours || taskData.estimatedHours || null,
        assignees: taskData.assignees || [],
        labels: taskData.labels || [],
        checklists: taskData.checklists || []
      };
      
      // Remove null/undefined values
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === null || apiData[key] === undefined) {
          delete apiData[key];
        }
      });
      
      const response = await api.post(`${this.baseURL}/kanban/cards`, apiData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Update an existing task
   * PUT /api/kanban/tasks/:id
   */
  async updateTask(taskId, taskData) {
    const endpoint = `PUT /api/kanban/tasks/${taskId}`;
    
    try {
      const response = await api.put(`${this.baseURL}/kanban/cards/${taskId}`, taskData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Delete a task
   * DELETE /api/kanban/tasks/:id
   */
  async deleteTask(taskId) {
    const endpoint = `DELETE /api/kanban/tasks/${taskId}`;
    
    try {
      const response = await api.delete(`${this.baseURL}/kanban/cards/${taskId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Move a task to a different column
   * POST /api/kanban/tasks/:id/move
   */
  async moveTask(taskId, moveData) {
    const endpoint = `POST /api/kanban/tasks/${taskId}/move`;
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/move`, moveData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Archive a task
   * POST /api/kanban/tasks/:id/archive
   */
  async archiveTask(taskId) {
    const endpoint = `POST /api/kanban/tasks/${taskId}/archive`;
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/archive`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Assign task to user
   * POST /api/kanban/tasks/:id/assign
   */
  async assignTask(taskId, userId) {
    const endpoint = `POST /api/kanban/tasks/${taskId}/assign`;
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/assign`, { user_id: userId });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Unassign task from user
   * DELETE /api/kanban/tasks/:id/assign/:userId
   */
  async unassignTask(taskId, userId) {
    const endpoint = `DELETE /api/kanban/tasks/${taskId}/assign/${userId}`;
    
    try {
      const response = await api.delete(`${this.baseURL}/kanban/cards/${taskId}/assign/${userId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Watch task (subscribe to updates)
   * POST /api/kanban/tasks/:id/watch
   */
  async watchTask(taskId) {
    const endpoint = `POST /api/kanban/tasks/${taskId}/watch`;
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/watch`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Unwatch task (unsubscribe from updates)
   * DELETE /api/kanban/tasks/:id/watch
   */
  async unwatchTask(taskId) {
    const endpoint = `DELETE /api/kanban/tasks/${taskId}/watch`;
    
    try {
      const response = await api.delete(`${this.baseURL}/kanban/cards/${taskId}/watch`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  // ==================== LEGACY CARD METHODS (for backward compatibility) ====================

  /**
   * @deprecated Use getTasks() instead
   */
  async getCards(params = {}) {
    return this.getTasks(params);
  }

  /**
   * @deprecated Use getTask() instead
   */
  async getCard(cardId) {
    return this.getTask(cardId);
  }

  /**
   * @deprecated Use createTask() instead
   */
  async createCard(cardData) {
    return this.createTask(cardData);
  }

  /**
   * @deprecated Use updateTask() instead
   */
  async updateCard(cardId, cardData) {
    return this.updateTask(cardId, cardData);
  }

  /**
   * @deprecated Use deleteTask() instead
   */
  async deleteCard(cardId) {
    return this.deleteTask(cardId);
  }

  /**
   * @deprecated Use moveTask() instead
   */
  async moveCard(cardId, moveData) {
    return this.moveTask(cardId, moveData);
  }

  /**
   * @deprecated Use archiveTask() instead
   */
  async archiveCard(cardId) {
    return this.archiveTask(cardId);
  }

  /**
   * @deprecated Use watchTask() instead
   */
  async watchCard(cardId) {
    return this.watchTask(cardId);
  }

  /**
   * @deprecated Use unwatchTask() instead
   */
  async unwatchCard(cardId) {
    return this.unwatchTask(cardId);
  }

  // ==================== COLUMN MANAGEMENT ====================

  /**
   * Get all columns for a board
   * GET /api/kanban/boards/:boardId/columns
   */
  async getColumns(boardId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/boards/${boardId}/columns`);
      return this.handleResponse(response);
      } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new column
   * POST /api/kanban/boards/:boardId/columns
   */
  async createColumn(boardId, columnData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/boards/${boardId}/columns`, columnData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a column
   * PUT /api/kanban/boards/:boardId/columns/:id
   */
  async updateColumn(boardId, columnId, columnData) {
    try {
      const response = await api.put(`${this.baseURL}/kanban/boards/${boardId}/columns/${columnId}`, columnData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a column
   * DELETE /api/kanban/boards/:boardId/columns/:id
   */
  async deleteColumn(boardId, columnId) {
    try {
      const response = await api.delete(`${this.baseURL}/kanban/boards/${boardId}/columns/${columnId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Toggle column activation
   * PATCH /api/kanban/boards/:boardId/columns/:id
   */
  async toggleColumnActivation(boardId, columnId, isActive) {
    try {
      const response = await api.patch(`${this.baseURL}/kanban/boards/${boardId}/columns/${columnId}`, { is_active: isActive });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Reorder columns
   * PUT /api/kanban/boards/:boardId/columns/reorder/positions
   */
  async reorderColumns(boardId, reorderData) {
    try {
      const response = await api.put(`${this.baseURL}/kanban/boards/${boardId}/columns/reorder/positions`, reorderData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== ATTACHMENT MANAGEMENT ====================

  /**
   * Upload attachment to a task
   * POST /api/kanban/tasks/:taskId/attachments
   */
  async addAttachment(taskId, attachmentData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/attachments`, attachmentData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get attachments for a task
   * GET /api/kanban/tasks/:taskId/attachments
   */
  async getAttachments(taskId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/cards/${taskId}/attachments`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete attachment from a task
   * DELETE /api/kanban/tasks/:taskId/attachments/:attachmentId
   */
  async deleteAttachment(taskId, attachmentId) {
    try {
      const response = await api.delete(`${this.baseURL}/kanban/cards/${taskId}/attachments/${attachmentId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Set card cover image
   * POST /api/kanban/tasks/:id/cover
   */
  async setCardCover(taskId, coverData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/cover`, coverData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Download attachment
   * GET /api/kanban/attachments/:attachmentId/download
   */
  async downloadAttachment(attachmentId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/attachments/${attachmentId}/download`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== CHECKLIST MANAGEMENT ====================

  /**
   * Add checklist to a task
   * POST /api/kanban/checklists/:taskId
   */
  async addChecklist(taskId, checklistData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/checklists/${taskId}`, checklistData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all checklists for a task
   * GET /api/kanban/checklists/:taskId
   */
  async getChecklists(taskId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/checklists/${taskId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update checklist
   * PUT /api/kanban/checklists/:taskId/:checklistId
   */
  async updateChecklist(taskId, checklistId, checklistData) {
    try {
      const response = await api.put(`${this.baseURL}/kanban/checklists/${taskId}/${checklistId}`, checklistData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete checklist from a task
   * DELETE /api/kanban/checklists/:taskId/:checklistId
   */
  async deleteChecklist(taskId, checklistId) {
    try {
      const response = await api.delete(`${this.baseURL}/kanban/checklists/${taskId}/${checklistId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Toggle checklist item completion
   * PUT /api/kanban/checklists/:taskId/:checklistId/items/:itemId
   */
  async toggleChecklistItem(taskId, checklistId, itemId, completed) {
    try {
      const response = await api.put(`${this.baseURL}/kanban/checklists/${taskId}/${checklistId}/items/${itemId}`, { completed });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== WATCH/SUBSCRIBE ====================

  /**
   * Subscribe to card updates
   */
  async watchCard(cardId) {
    try {
      const response = await api.post(`${this.baseURL}/card/${cardId}/watch`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Unsubscribe from card updates
   */
  async unwatchCard(cardId) {
    try {
      const response = await api.delete(`${this.baseURL}/card/${cardId}/watch`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== COMMENT MANAGEMENT ====================

  /**
   * Get comments for a task
   * GET /api/kanban/tasks/:id/comments
   */
  async getComments(taskId, params = {}) {
    const endpoint = `GET /api/kanban/tasks/${taskId}/comments`;
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/cards/${taskId}/comments`, { params });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Add a comment to a task
   * POST /api/kanban/tasks/:id/comments
   */
  async addComment(taskId, commentData) {
    const endpoint = `POST /api/kanban/tasks/${taskId}/comments`;
    
    try {
      if (!taskId) {
        throw new Error('Task ID is required to add a comment');
      }
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/comments`, commentData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Update a comment
   * PUT /api/kanban/tasks/:id/comments/:commentId
   */
  async updateComment(taskId, commentId, updates) {
    const endpoint = `PUT /api/kanban/tasks/${taskId}/comments/${commentId}`;
    
    try {
      if (!taskId || !commentId) {
        throw new Error('Task ID and Comment ID are required to update a comment');
      }
      const response = await api.put(`${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}`, updates);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Delete a comment
   * DELETE /api/kanban/tasks/:id/comments/:commentId
   */
  async deleteComment(taskId, commentId) {
    const endpoint = `DELETE /api/kanban/tasks/${taskId}/comments/${commentId}`;
    
    try {
      if (!taskId || !commentId) {
        throw new Error('Task ID and Comment ID are required to delete a comment');
      }
      const response = await api.delete(`${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Add reaction to a comment
   * POST /api/kanban/tasks/:id/comments/:commentId/reactions
   */
  async addReaction(taskId, commentId, emoji) {
    const endpoint = `POST /api/kanban/tasks/${taskId}/comments/${commentId}/reactions`;
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}/reactions`, { emoji });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Remove reaction from a comment
   * DELETE /api/kanban/tasks/:id/comments/:commentId/reactions
   */
  async removeReaction(taskId, commentId) {
    const endpoint = `DELETE /api/kanban/tasks/${taskId}/comments/${commentId}/reactions`;
    
    try {
      const response = await api.delete(`${this.baseURL}/kanban/cards/${taskId}/comments/${commentId}/reactions`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  // ==================== LABEL MANAGEMENT ====================

  /**
   * Get all labels
   * GET /api/kanban/labels
   */
  async getLabels() {
      try {
      const response = await api.get(`${this.baseURL}/kanban/labels`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get label by ID
   * GET /api/kanban/labels/:id
   */
  async getLabel(labelId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/labels/${labelId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new label
   * POST /api/kanban/labels
   */
  async createLabel(labelData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/labels`, labelData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a label
   * PUT /api/kanban/labels/:id
   */
  async updateLabel(labelId, labelData) {
    try {
      const response = await api.put(`${this.baseURL}/kanban/labels/${labelId}`, labelData);
      return this.handleResponse(response);
      } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a label
   * DELETE /api/kanban/labels/:id
   */
  async deleteLabel(labelId) {
    try {
      const response = await api.delete(`${this.baseURL}/kanban/labels/${labelId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get labels by board
   * GET /api/kanban/labels/v2/labels
   */
  async getLabelsByBoard(boardId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/labels/v2/labels?board_id=${boardId}`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get labels by branch
   * GET /api/kanban/labels/v2/labels?branch_id=xxx
   */
  async getLabelsByBranch(branchId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/labels/v2/labels`, {
        params: { branch_id: branchId }
      });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all labels (with optional branch filter)
   * GET /api/kanban/labels?branch_id=xxx
   */
  async getLabels(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/labels`, {
        params
      });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== CUSTOM FIELDS MANAGEMENT ====================

  /**
   * Get custom field definitions for a board
   * GET /api/kanban/boards/:boardId/custom-fields
   */
  async getCustomFields(boardId) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/boards/${boardId}/custom-fields`);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create custom field definition
   * POST /api/kanban/boards/:boardId/custom-fields
   */
  async createCustomField(boardId, fieldData) {
    try {
      const response = await api.post(`${this.baseURL}/kanban/boards/${boardId}/custom-fields`, fieldData);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update card custom field value
   * PUT /api/kanban/tasks/:id/custom-fields/:fieldId
   */
  async updateCustomFieldValue(taskId, fieldId, value) {
    try {
      const response = await api.put(`${this.baseURL}/kanban/cards/${taskId}/custom-fields/${fieldId}`, { value });
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
    const endpoint = 'GET /api/kanban/users';
    
    try {
      // Use Kanban-specific users endpoint
      const response = await api.get(`${this.baseURL}/kanban/users`);
      response.data = response.data.data.users;
      const result = this.handleResponse(response, endpoint);
      
      // Ensure we always return an array
      const users = Array.isArray(result) ? result : [];
      return users;
    } catch (error) {
      console.warn(`⚠️ [API Warning] ${endpoint}: Kanban users endpoint not available:`, error.message);
      
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
    const endpoint = `GET /api/kanban/users/${userId}`;
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/users/${userId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const endpoint = 'POST /api/kanban/users';
    // API Call userData });
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/users`, userData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, userData) {
    const endpoint = `PUT /api/kanban/users/${userId}`;
    // API Call userId, userData });
    
    try {
      const response = await api.put(`${this.baseURL}/kanban/users/${userId}`, userData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Soft delete user
   */
  async deleteUser(userId) {
    const endpoint = `DELETE /api/kanban/users/${userId}`;
    // API Call userId });
    
    try {
      const response = await api.delete(`${this.baseURL}/kanban/users/${userId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId) {
    const endpoint = `GET /api/kanban/users/${userId}/activity`;
    // API Call userId });
    
    try {
      const response = await api.get(`${this.baseURL}/kanban/users/${userId}/activity`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Invite user to workspace
   */
  async inviteUserToWorkspace(userId, workspaceData) {
    const endpoint = `POST /api/kanban/users/${userId}/invite-to-workspace`;
    // API Call userId, workspaceData });
    
    try {
      const response = await api.post(`${this.baseURL}/kanban/users/${userId}/invite-to-workspace`, workspaceData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
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

  // ==================== NOTIFICATION MANAGEMENT ====================

  /**
   * Get notifications for a user
   * GET /api/notification/user/:userId
   */
  async getNotifications(userId, params = {}) {
    const endpoint = `GET /api/notification/user/${userId}`;
    // API Call userId, params });
    
    try {
      const response = await api.get(`${this.baseURL}/notification/user/${userId}`, { params });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.warn(`⚠️ [API Warning] ${endpoint}: Notifications endpoint not available:`, error.message);
      return []; // Return empty array if endpoint doesn't exist yet
    }
  }

  /**
   * Mark notification as read
   * PUT /api/notification/:notificationId/read
   */
  async markNotificationAsRead(notificationId) {
    const endpoint = `PUT /api/notification/${notificationId}/read`;
    // API Call notificationId });
    
    try {
      const response = await api.put(`${this.baseURL}/notification/${notificationId}/read`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Mark notification as clicked
   * PUT /api/notification/:notificationId/clicked
   */
  async markNotificationAsClicked(notificationId) {
    const endpoint = `PUT /api/notification/${notificationId}/clicked`;
    // API Call notificationId });
    
    try {
      const response = await api.put(`${this.baseURL}/notification/${notificationId}/clicked`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Mark all notifications as read for a user
   * PUT /api/notification/user/:userId/read-all
   */
  async markAllNotificationsAsRead(userId) {
    const endpoint = `PUT /api/notification/user/${userId}/read-all`;
    // API Call userId });
    
    try {
      const response = await api.put(`${this.baseURL}/notification/user/${userId}/read-all`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Delete notification
   * DELETE /api/notification/:notificationId
   */
  async deleteNotification(notificationId) {
    const endpoint = `DELETE /api/notification/${notificationId}`;
    // API Call notificationId });
    
    try {
      const response = await api.delete(`${this.baseURL}/notification/${notificationId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Clear all notifications for a user
   * DELETE /api/notification/user/:userId/clear-all
   */
  async clearAllNotifications(userId) {
    const endpoint = `DELETE /api/notification/user/${userId}/clear-all`;
    // API Call userId });
    
    try {
      const response = await api.delete(`${this.baseURL}/notification/user/${userId}/clear-all`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Create mention notification
   * POST /api/notification/mention
   */
  async createMentionNotification(notificationData) {
    const endpoint = 'POST /api/notification/mention';
    // API Call notificationData });
    
    try {
      const response = await api.post(`${this.baseURL}/notification/mention`, notificationData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  // ==================== SEARCH ====================

  /**
   * Search tasks
   * GET /api/kanban/search/tasks
   */
  async searchTasks(query, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/search/tasks`, { 
        params: { q: query, ...params } 
      });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Search boards
   * GET /api/kanban/search/boards
   */
  async searchBoards(query, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/search/boards`, { 
        params: { q: query, ...params } 
      });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get filter suggestions
   * GET /api/kanban/filters/suggestions
   */
  async getFilterSuggestions(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/kanban/filters/suggestions`, { params });
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== LEGACY SEARCH METHODS (for backward compatibility) ====================

  /**
   * @deprecated Use searchTasks() instead
   */
  async searchCards(query, params = {}) {
    return this.searchTasks(query, params);
  }

  /**
   * @deprecated Use searchTasks() instead
   */
  async searchCardsInColumn(columnId, query, params = {}) {
    return this.searchTasks(query, { columnId, ...params });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Transform task data to frontend format
   */
  transformTaskData(apiTask) {
    if (!apiTask) return null;
    
    // Extract assignees to members (array of user IDs)
    const members = (apiTask.assignees || []).map(assignee => {
      if (typeof assignee === 'object' && assignee.user_id) {
        return assignee.user_id._id || assignee.user_id.id || assignee.user_id;
      }
      return assignee._id || assignee.id || assignee;
    });
    
    // Extract labels to array of label IDs
    const labelIds = (apiTask.labels || []).map(label => {
      if (typeof label === 'object' && (label._id || label.id || label.label_id)) {
        return label._id || label.id || label.label_id;
      }
      return label;
    });
    
    // Handle due date
    let dueDate = null;
    if (apiTask.due_date) {
      dueDate = {
        date: apiTask.due_date,
        completed: apiTask.due_date_completed || false
      };
    } else if (apiTask.dueDate) {
      dueDate = typeof apiTask.dueDate === 'object' 
        ? apiTask.dueDate 
        : { date: apiTask.dueDate, completed: false };
    }
    
    return {
      id: apiTask._id || apiTask.id,
      _id: apiTask._id || apiTask.id, // Keep both for compatibility
      title: apiTask.title || 'Untitled Task',
      identifier: apiTask.identifier || null,
      description: apiTask.description || '',
      cardId: apiTask.cardId || apiTask._id || apiTask.id,
      columnId: apiTask.column_id || apiTask.columnId,
      listId: apiTask.column_id || apiTask.columnId, // Alias for compatibility
      subcolumnId: apiTask.subcolumn_id || apiTask.subcolumnId || null,
      priority: apiTask.priority || 'medium',
      labels: labelIds, // Array of label IDs
      labelObjects: (apiTask.labels || []).map(label => ({
        id: label._id || label.id || label.label_id,
        name: label.text || label.name,
        color: label.color || '#6b7280'
      })),
      members: members, // Array of member/user IDs
      assignees: apiTask.assignees || [], // Keep original for reference
      dueDate: dueDate,
      due_date: apiTask.due_date, // Keep original format
      customer: apiTask.customer || null, // Customer object or ID
      createdAt: apiTask.createdAt || apiTask.created_at || new Date().toISOString(),
      updatedAt: apiTask.updatedAt || apiTask.updated_at || new Date().toISOString(),
      createdBy: apiTask.created_by || apiTask.createdBy,
      // Additional fields
      attachments: apiTask.attachments || [],
      comments: apiTask.comments || [],
      activities: apiTask.activity_log || apiTask.activities || [],
      activityLog: apiTask.activity_log || apiTask.activities || [],
      checklists: apiTask.checklists || [],
      customFields: apiTask.customFields || apiTask.custom_fields || [],
      contacts: apiTask.contacts || [],
      readyProducts: apiTask.ready_products || apiTask.readyProducts || [],
      isDeleted: apiTask.isDeleted || apiTask.is_deleted || false,
      isArchived: apiTask.isArchived || apiTask.is_archived || false,
      closed: apiTask.is_archived || apiTask.isArchived || false,
      position: apiTask.position || 0,
      branchId: apiTask.branch_id || apiTask.branchId,
      watchers: apiTask.watchers || [],
      subscriptions: apiTask.watchers || [], // Alias for compatibility
      // Keep original data for debugging
      _originalData: apiTask
    };
  }

  /**
   * Transform frontend task data to API format
   */
  transformTaskToApi(frontendTask) {
    const apiData = {};
    
    // Basic fields
    if (frontendTask.title !== undefined) apiData.title = frontendTask.title;
    if (frontendTask.description !== undefined) apiData.description = frontendTask.description;
    if (frontendTask.priority !== undefined) apiData.priority = frontendTask.priority;
    
    // Date fields - convert to ISO string
    if (frontendTask.dueDate !== undefined) {
      if (frontendTask.dueDate && typeof frontendTask.dueDate === 'object' && frontendTask.dueDate.date) {
        apiData.due_date = frontendTask.dueDate.date;
      } else if (frontendTask.dueDate) {
        apiData.due_date = frontendTask.dueDate;
      } else {
        apiData.due_date = null;
      }
    }
    if (frontendTask.due_date !== undefined) {
      apiData.due_date = frontendTask.due_date;
    }
    
    if (frontendTask.startDate !== undefined) {
      if (frontendTask.startDate && typeof frontendTask.startDate === 'object' && frontendTask.startDate.date) {
        apiData.start_date = frontendTask.startDate.date;
      } else if (frontendTask.startDate) {
        apiData.start_date = frontendTask.startDate;
      } else {
        apiData.start_date = null;
      }
    }
    if (frontendTask.start_date !== undefined) {
      apiData.start_date = frontendTask.start_date;
    }
    
    // Column/List ID
    if (frontendTask.column_id !== undefined) apiData.column_id = frontendTask.column_id;
    if (frontendTask.columnId !== undefined) apiData.column_id = frontendTask.columnId;
    if (frontendTask.listId !== undefined) apiData.column_id = frontendTask.listId;
    
    if (frontendTask.subcolumnId !== undefined) apiData.subcolumn_id = frontendTask.subcolumnId;
    if (frontendTask.subcolumn_id !== undefined) apiData.subcolumn_id = frontendTask.subcolumn_id;
    
    // Members to Assignees conversion
    if (frontendTask.members !== undefined) {
      apiData.assignees = (frontendTask.members || []).map(memberId => ({
        user_id: memberId
      }));
    }
    if (frontendTask.assignees !== undefined) {
      apiData.assignees = frontendTask.assignees;
    }
    
    // Labels - handle both IDs and objects
    if (frontendTask.labels !== undefined) {
      apiData.labels = (frontendTask.labels || []).map(label => {
        if (typeof label === 'object') {
          return {
            label_id: label.id || label._id || label.label_id,
            text: label.name || label.text,
            color: label.color
          };
        }
        return { label_id: label };
      });
    }
    
    // Customer field
    if (frontendTask.customer !== undefined) {
      if (frontendTask.customer && typeof frontendTask.customer === 'object') {
        apiData.customer = frontendTask.customer._id || frontendTask.customer.id;
      } else {
        apiData.customer = frontendTask.customer;
      }
    }
    
    // Other fields
    if (frontendTask.contacts !== undefined) apiData.contacts = frontendTask.contacts || [];
    if (frontendTask.checklists !== undefined) apiData.checklists = frontendTask.checklists || [];
    if (frontendTask.readyProducts !== undefined || frontendTask.ready_products !== undefined) {
      apiData.ready_products = frontendTask.readyProducts || frontendTask.ready_products || [];
    }
    if (frontendTask.attachments !== undefined) apiData.attachments = frontendTask.attachments || [];
    if (frontendTask.customFields !== undefined) apiData.customFields = frontendTask.customFields || [];
    if (frontendTask.position !== undefined) apiData.position = frontendTask.position || 0;
    
    // Archive status
    if (frontendTask.closed !== undefined) apiData.is_archived = frontendTask.closed;
    if (frontendTask.is_archived !== undefined) apiData.is_archived = frontendTask.is_archived;
    if (frontendTask.isArchived !== undefined) apiData.is_archived = frontendTask.isArchived;
    
    return apiData;
  }

  /**
   * Transform move data for API
   */
  transformMoveData(moveData) {
    return {
      column_id: moveData.toColumnId || moveData.columnId,
      position: moveData.position || 0
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

  // ==================== PRIMARY IDENTIFIER SYSTEM ====================
  async reserveIdentifier(boardId, format = 'DD-MM-YY-###') {
    const endpoint = 'POST /api/kanban/cards/reserve-identifier';
    // API Call boardId, format });
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/reserve-identifier`, {
        board_id: boardId,
        format: format
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ [Identifier Reservation Failed] ${endpoint}:`, {
        boardId,
        format,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async useReservation(reservationId, taskId) {
    const endpoint = 'POST /api/kanban/cards/use-reservation';
    // API Call reservationId, taskId });
    try {
      const response = await api.post(`${this.baseURL}/kanban/cards/use-reservation`, {
        reservation_id: reservationId,
        task_id: taskId
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ [Use Reservation Failed] ${endpoint}:`, {
        reservationId,
        taskId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async releaseReservation(reservationId) {
    const endpoint = 'DELETE /api/kanban/cards/release-reservation';
    // API Call reservationId });
    try {
      const response = await api.delete(`${this.baseURL}/kanban/cards/release-reservation`, {
        data: { reservation_id: reservationId }
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ [Release Reservation Failed] ${endpoint}:`, {
        reservationId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async getActiveReservations(boardId) {
    const endpoint = `GET /api/kanban/cards/reservations/board/${boardId}`;
    // API Call boardId });
    try {
      const response = await api.get(`${this.baseURL}/kanban/cards/reservations/board/${boardId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ [Get Active Reservations Failed] ${endpoint}:`, {
        boardId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async getTaskByIdentifier(identifier) {
    const endpoint = `GET /api/kanban/cards/identifier/${identifier}`;
    // API Call identifier });
    try {
      const response = await api.get(`${this.baseURL}/kanban/cards/identifier/${identifier}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ [Get Task by Identifier Failed] ${endpoint}:`, {
        identifier,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async getBoardIdentifiers(boardId) {
    const endpoint = `GET /api/kanban/cards/identifiers/board/${boardId}`;
    // API Call boardId });
    try {
      const response = await api.get(`${this.baseURL}/kanban/cards/identifiers/board/${boardId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ [Get Board Identifiers Failed] ${endpoint}:`, {
        boardId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async updateTaskIdentifier(taskId, identifier) {
    const endpoint = `PUT /api/kanban/cards/${taskId}/identifier`;
    // API Call taskId, identifier });
    try {
      const response = await api.put(`${this.baseURL}/kanban/cards/${taskId}/identifier`, {
        identifier: identifier
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ [Update Task Identifier Failed] ${endpoint}:`, {
        taskId,
        identifier,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.handleError(error, endpoint);
      throw error;
    }
  }

  // ==================== CUSTOMER MANAGEMENT ====================
  async getCustomers(params = {}) {
    const endpoint = 'GET /api/kanban/customers';
    // API Call params });
    try {
      const response = await api.get(`${this.baseURL}/kanban/customers`, { params });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async getCustomerById(customerId) {
    const endpoint = `GET /api/kanban/customers/${customerId}`;
    // API Call customerId });
    try {
      const response = await api.get(`${this.baseURL}/kanban/customers/${customerId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async createCustomer(customerData) {
    const endpoint = 'POST /api/kanban/customers';
    // API Call customerData });
    try {
      const response = await api.post(`${this.baseURL}/kanban/customers`, customerData);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async updateCustomer(customerId, updates) {
    const endpoint = `PUT /api/kanban/customers/${customerId}`;
    // API Call customerId, updates });
    try {
      const response = await api.put(`${this.baseURL}/kanban/customers/${customerId}`, updates);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async deleteCustomer(customerId) {
    const endpoint = `DELETE /api/kanban/customers/${customerId}`;
    // API Call customerId });
    try {
      const response = await api.delete(`${this.baseURL}/kanban/customers/${customerId}`);
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  async searchCustomers(query, params = {}) {
    const endpoint = 'GET /api/kanban/customers/search';
    // API Call query, params });
    try {
      const searchParams = { q: query, ...params };
      const response = await api.get(`${this.baseURL}/kanban/customers/search`, { params: searchParams });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  // ==================== LEGACY UTILITY METHODS (for backward compatibility) ====================

  /**
   * @deprecated Use transformTaskData() instead
   */
  transformCardData(apiCard) {
    return this.transformTaskData(apiCard);
  }

  /**
   * @deprecated Use transformTaskToApi() instead
   */
  transformCardToApi(frontendCard) {
    return this.transformTaskToApi(frontendCard);
  }
}

// Create singleton instance
const kanbanService = new KanbanService();

export { kanbanService };