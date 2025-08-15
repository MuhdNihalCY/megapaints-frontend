/**
 * Kanban Board Service
 * Handles all API calls and data management for the Kanban board
 * Uses live backend API instead of mock data
 */

import api from '../../../utils/api';
import { API_ENDPOINTS, ACTIVITY_TYPES } from '../utils/constants';

/**
 * Kanban Board Service Class
 */
class KanbanService {
  /**
   * Get the entire Kanban board data
   * @returns {Promise<Object>} Board data including columns and cards
   */
  async getBoard() {
    try {
      const response = await api.get('/api/v2/board');
      return response.data;
    } catch (error) {
      console.error('Error fetching board:', error);
      throw error;
    }
  }

  /**
   * Get all cards
   * @returns {Promise<Array>} Array of cards
   */
  async getCards() {
    try {
      const response = await api.get('/api/v2/board/cards');
      return response.data;
    } catch (error) {
      console.error('Error fetching cards:', error);
      throw error;
    }
  }

  /**
   * Get a specific card by ID
   * @param {string} cardId - The card ID
   * @returns {Promise<Object>} Card data
   */
  async getCard(cardId) {
    try {
      const response = await api.get(`/api/v2/board/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching card:', error);
      throw error;
    }
  }

  /**
   * Create a new card
   * @param {Object} cardData - The card data
   * @returns {Promise<Object>} Created card
   */
  async createCard(cardData) {
    try {
      const response = await api.post('/api/v2/board/cards', cardData);
      return response.data;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  /**
   * Update an existing card
   * @param {string} cardId - The card ID
   * @param {Object} cardData - The updated card data
   * @returns {Promise<Object>} Updated card
   */
  async updateCard(cardId, cardData) {
    try {
      const response = await api.put(`/api/v2/board/cards/${cardId}`, cardData);
      return response.data;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }

  /**
   * Move a card to a different column
   * @param {string} cardId - The card ID
   * @param {string} fromColumn - Source column
   * @param {string} toColumn - Destination column
   * @param {string} toSubcolumn - Destination subcolumn (optional)
   * @returns {Promise<Object>} Updated card
   */
  async moveCard(cardId, fromColumn, toColumn, toSubcolumn = null) {
    try {
      const response = await api.post(`/api/v2/board/cards/${cardId}/move`, {
        fromColumn,
        toColumn,
        toSubcolumn
      });
      return response.data;
    } catch (error) {
      console.error('Error moving card:', error);
      throw error;
    }
  }

  /**
   * Delete a card
   * @param {string} cardId - The card ID
   * @returns {Promise<void>}
   */
  async deleteCard(cardId) {
    try {
      await api.delete(`/api/v2/board/cards/${cardId}`);
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }

  /**
   * Get all columns
   * @returns {Promise<Array>} Array of columns
   */
  async getColumns() {
    try {
      const response = await api.get('/api/v2/board/columns');
      return response.data;
    } catch (error) {
      console.error('Error fetching columns:', error);
      throw error;
    }
  }

  /**
   * Create a new column
   * @param {Object} columnData - The column data
   * @returns {Promise<Object>} Created column
   */
  async createColumn(columnData) {
    try {
      const response = await api.post('/api/v2/board/columns', columnData);
      return response.data;
    } catch (error) {
      console.error('Error creating column:', error);
      throw error;
    }
  }

  /**
   * Update column configuration
   * @param {string} columnId - The column ID
   * @param {Object} columnData - The updated column data
   * @returns {Promise<Object>} Updated column
   */
  async updateColumn(columnId, columnData) {
    try {
      const response = await api.put(`/api/v2/board/columns/${columnId}`, columnData);
      return response.data;
    } catch (error) {
      console.error('Error updating column:', error);
      throw error;
    }
  }

  /**
   * Toggle column activation
   * @param {string} columnId - The column ID
   * @param {boolean} isActive - Whether the column should be active
   * @returns {Promise<Object>} Updated column
   */
  async toggleColumnActivation(columnId, isActive) {
    try {
      const response = await api.post(`/api/v2/board/columns/${columnId}/toggle`, {
        isActive
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling column activation:', error);
      throw error;
    }
  }

  /**
   * Delete a column
   * @param {string} columnId - The column ID
   * @returns {Promise<void>}
   */
  async deleteColumn(columnId) {
    try {
      await api.delete(`/api/v2/board/columns/${columnId}`);
    } catch (error) {
      console.error('Error deleting column:', error);
      throw error;
    }
  }

  /**
   * Reorder columns
   * @param {Array} columnOrder - Array of column IDs in new order
   * @returns {Promise<Array>} Updated columns
   */
  async reorderColumns(columnOrder) {
    try {
      const response = await api.put('/api/v2/board/columns/reorder', {
        columnOrder
      });
      return response.data;
    } catch (error) {
      console.error('Error reordering columns:', error);
      throw error;
    }
  }

  /**
   * Get comments for a card
   * @param {string} cardId - The card ID
   * @returns {Promise<Array>} Array of comments
   */
  async getComments(cardId) {
    try {
      const response = await api.get(`/api/v2/board/cards/${cardId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a card
   * @param {string} cardId - The card ID
   * @param {Object} commentData - The comment data
   * @returns {Promise<Object>} Created comment
   */
  async addComment(cardId, commentData) {
    try {
      const response = await api.post(`/api/v2/board/cards/${cardId}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   * @param {string} commentId - The comment ID
   * @param {Object} commentData - The updated comment data
   * @returns {Promise<Object>} Updated comment
   */
  async updateComment(commentId, commentData) {
    try {
      const response = await api.put(`/api/v2/board/comments/${commentId}`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - The comment ID
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    try {
      await api.delete(`/api/v2/board/comments/${commentId}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Get activity log for a card
   * @param {string} cardId - The card ID
   * @returns {Promise<Array>} Array of activity entries
   */
  async getActivity(cardId) {
    try {
      const response = await api.get(`/api/v2/board/cards/${cardId}/activity`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  }

  /**
   * Get all users for mentions and assignments
   * @returns {Promise<Array>} Array of users
   */
  async getUsers() {
    try {
      const response = await api.get('/api/v2/users');
      console.log('Response from getUsers:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Search users for mentions
   * @param {string} searchTerm - The search term
   * @returns {Promise<Array>} Array of matching users
   */
  async searchUsers(searchTerm) {
    try {
      const response = await api.get('/api/v2/users/search', {
        params: { q: searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Search cards
   * @param {string} boardId - The board ID
   * @param {string} searchTerm - The search term
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Array of matching cards
   */
  async searchCards(boardId, searchTerm, filters = {}) {
    try {
      const response = await api.get('/api/v2/board/cards/search', {
        params: { 
          boardId, 
          searchTerm, 
          ...filters 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching cards:', error);
      throw error;
    }
  }

  /**
   * Upload attachment for a card
   * @param {string} cardId - The card ID
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Uploaded attachment data
   */
  async uploadAttachment(cardId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/api/v2/board/cards/${cardId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Delete attachment from a card
   * @param {string} cardId - The card ID
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<void>}
   */
  async deleteAttachment(cardId, attachmentId) {
    try {
      await api.delete(`/api/v2/board/cards/${cardId}/attachments/${attachmentId}`);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  }

  /**
   * Assign users to a card
   * @param {string} cardId - The card ID
   * @param {Array} userIds - Array of user IDs to assign
   * @returns {Promise<Object>} Updated card
   */
  async assignUsers(cardId, userIds) {
    try {
      const response = await api.post(`/api/v2/board/cards/${cardId}/assign`, {
        userIds
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning users:', error);
      throw error;
    }
  }

  /**
   * Reorder cards within a column
   * @param {string} columnId - The column ID
   * @param {Array} cardOrder - Array of card IDs in new order
   * @returns {Promise<Array>} Updated cards
   */
  async reorderCards(columnId, cardOrder) {
    try {
      const response = await api.put(`/api/v2/board/cards/reorder`, {
        columnId,
        cardOrder
      });
      return response.data;
    } catch (error) {
      console.error('Error reordering cards:', error);
      throw error;
    }
  }

  /**
   * Get board members
   * @param {string} boardId - The board ID
   * @returns {Promise<Array>} Array of board members
   */
  async getBoardMembers(boardId) {
    try {
      const response = await api.get(`/api/v2/board/${boardId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching board members:', error);
      throw error;
    }
  }

  /**
   * Add member to board
   * @param {string} boardId - The board ID
   * @param {string} userId - The user ID to add
   * @returns {Promise<Object>} Updated board
   */
  async addBoardMember(boardId, userId) {
    try {
      const response = await api.post(`/api/v2/board/${boardId}/members`, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error adding board member:', error);
      throw error;
    }
  }

  /**
   * Remove member from board
   * @param {string} boardId - The board ID
   * @param {string} userId - The user ID to remove
   * @returns {Promise<Object>} Updated board
   */
  async removeBoardMember(boardId, userId) {
    try {
      const response = await api.delete(`/api/v2/board/${boardId}/members/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing board member:', error);
      throw error;
    }
  }

  /**
   * Create a new board
   * @param {Object} boardData - The board data
   * @returns {Promise<Object>} Created board
   */
  async createBoard(boardData) {
    try {
      const response = await api.post('/api/v2/board', boardData);
      return response.data;
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  }

  /**
   * Update board settings
   * @param {string} boardId - The board ID
   * @param {Object} boardData - The updated board data
   * @returns {Promise<Object>} Updated board
   */
  async updateBoard(boardId, boardData) {
    try {
      const response = await api.put(`/api/v2/board/${boardId}`, boardData);
      return response.data;
    } catch (error) {
      console.error('Error updating board:', error);
      throw error;
    }
  }

  /**
   * Delete a board
   * @param {string} boardId - The board ID
   * @returns {Promise<void>}
   */
  async deleteBoard(boardId) {
    try {
      await api.delete(`/api/v2/board/${boardId}`);
    } catch (error) {
      console.error('Error deleting board:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const kanbanService = new KanbanService();
