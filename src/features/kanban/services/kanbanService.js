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
      const response = await api.get('/v2/board');
      return response.data;
    } catch (error) {
      console.warn('v2/board endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return {
          columns: [
            {
              id: 'sales',
              title: 'Sales',
              type: 'sales',
              order: 1,
              isActive: true,
              cards: []
            },
            {
              id: 'office',
              title: 'Office',
              type: 'office',
              order: 2,
              isActive: true,
              cards: []
            },
            {
              id: 'production',
              title: 'Production',
              type: 'production',
              order: 3,
              isActive: true,
              subcolumns: [
                { id: 'production-1', title: 'John Production', userId: '1', type: 'user' },
                { id: 'production-2', title: 'Jane Production', userId: '2', type: 'user' },
                { id: 'production-3', title: 'Bob Production', userId: '3', type: 'user' },
                { id: 'production-4', title: 'Alice Production', userId: '4', type: 'user' }
              ],
              isGrouped: true,
              cards: []
            },
            {
              id: 'ready',
              title: 'Ready',
              type: 'ready',
              order: 4,
              isActive: true,
              subcolumns: [
                { id: 'for-dispatch', title: 'For Dispatch' },
                { id: 'for-customer-collection', title: 'For Customer Collection' }
              ],
              isGrouped: true,
              cards: []
            },
            {
              id: 'drivers',
              title: 'Drivers',
              type: 'drivers',
              order: 5,
              isActive: true,
              subcolumns: [
                { id: 'drivers-5', title: 'Mike Driver', userId: '5', type: 'user' },
                { id: 'drivers-6', title: 'Sarah Driver', userId: '6', type: 'user' },
                { id: 'drivers-7', title: 'Tom Driver', userId: '7', type: 'user' },
                { id: 'drivers-8', title: 'Lisa Driver', userId: '8', type: 'user' }
              ],
              isGrouped: true,
              cards: []
            },
            {
              id: 'done',
              title: 'Done',
              type: 'done',
              order: 6,
              isActive: true,
              subcolumns: [
                { id: 'done-today', title: 'Done Today' },
                { id: 'less-than-7-days', title: '< 7 Days' },
                { id: 'more-than-7-days', title: '> 7 Days' }
              ],
              isGrouped: true,
              cards: []
            }
          ],
          cards: [
            {
              id: 'card-1',
              title: 'Sample Task 1',
              description: 'This is a sample task for testing the Kanban board',
              columnId: 'sales',
              subcolumnId: null,
              priority: 'medium',
              labels: [],
              assignees: [],
              dueDate: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'card-2',
              title: 'Sample Task 2',
              description: 'Another sample task in progress',
              columnId: 'office',
              subcolumnId: null,
              priority: 'high',
              labels: [],
              assignees: [],
              dueDate: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        };
      }
      
      throw error;
    }
  }

  /**
   * Get all cards
   * @returns {Promise<Array>} Array of cards
   */
  async getCards() {
    try {
      const response = await api.get('/v2/board/cards');
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return [
          {
            id: 'card-1',
            title: 'Sample Task 1',
            description: 'This is a sample task for testing the Kanban board',
            columnId: 'sales',
            subcolumnId: null,
            priority: 'medium',
            labels: [],
            assignees: [],
            dueDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'card-2',
            title: 'Sample Task 2',
            description: 'Another sample task in progress',
            columnId: 'office',
            subcolumnId: null,
            priority: 'high',
            labels: [],
            assignees: [],
            dueDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
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
      const response = await api.get(`/v2/board/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards GET endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return {
          id: cardId,
          title: 'Sample Task',
          description: 'This is a sample task for testing the Kanban board',
          columnId: 'todo',
          subcolumnId: null,
          priority: 'medium',
          labels: [],
          assignees: [],
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
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
      const response = await api.post('/v2/board/cards', cardData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards POST endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const newCard = {
          id: `card-${Date.now()}`,
          ...cardData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return newCard;
      }
      
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
      const response = await api.put(`/v2/board/cards/${cardId}`, cardData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards PUT endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const updatedCard = {
          id: cardId,
          ...cardData,
          updatedAt: new Date().toISOString()
        };
        return updatedCard;
      }
      
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
      const response = await api.post(`/v2/board/cards/${cardId}/move`, {
        fromColumn,
        toColumn,
        toSubcolumn
      });
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards move endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const movedCard = {
          id: cardId,
          columnId: toColumn,
          subcolumnId: toSubcolumn,
          updatedAt: new Date().toISOString()
        };
        return movedCard;
      }
      
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
      await api.delete(`/v2/board/cards/${cardId}`);
    } catch (error) {
      console.warn('v2/board/cards DELETE endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return { success: true };
      }
      
      throw error;
    }
  }

  /**
   * Get all columns
   * @returns {Promise<Array>} Array of columns
   */
  async getColumns() {
    try {
      const response = await api.get('/v2/board/columns');
      return response.data;
    } catch (error) {
      console.warn('v2/board/columns endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return [
          {
            id: 'sales',
            title: 'Sales',
            type: 'sales',
            order: 1,
            isActive: true,
            cards: []
          },
          {
            id: 'office',
            title: 'Office',
            type: 'office',
            order: 2,
            isActive: true,
            cards: []
          },
          {
            id: 'production',
            title: 'Production',
            type: 'production',
            order: 3,
            isActive: true,
            subcolumns: [
              { id: 'production-1', title: 'John Production', userId: '1', type: 'user' },
              { id: 'production-2', title: 'Jane Production', userId: '2', type: 'user' },
              { id: 'production-3', title: 'Bob Production', userId: '3', type: 'user' },
              { id: 'production-4', title: 'Alice Production', userId: '4', type: 'user' }
            ],
            isGrouped: true,
            cards: []
          },
          {
            id: 'ready',
            title: 'Ready',
            type: 'ready',
            order: 4,
            isActive: true,
            subcolumns: [
              { id: 'for-dispatch', title: 'For Dispatch' },
              { id: 'for-customer-collection', title: 'For Customer Collection' }
            ],
            isGrouped: true,
            cards: []
          },
          {
            id: 'drivers',
            title: 'Drivers',
            type: 'drivers',
            order: 5,
            isActive: true,
            subcolumns: [
              { id: 'drivers-5', title: 'Mike Driver', userId: '5', type: 'user' },
              { id: 'drivers-6', title: 'Sarah Driver', userId: '6', type: 'user' },
              { id: 'drivers-7', title: 'Tom Driver', userId: '7', type: 'user' },
              { id: 'drivers-8', title: 'Lisa Driver', userId: '8', type: 'user' }
            ],
            isGrouped: true,
            cards: []
          },
          {
            id: 'done',
            title: 'Done',
            type: 'done',
            order: 6,
            isActive: true,
            subcolumns: [
              { id: 'done-today', title: 'Done Today' },
              { id: 'less-than-7-days', title: '< 7 Days' },
              { id: 'more-than-7-days', title: '> 7 Days' }
            ],
            isGrouped: true,
            cards: []
          }
        ];
      }
      
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
      const response = await api.post('/v2/board/columns', columnData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/columns POST endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const newColumn = {
          id: `column-${Date.now()}`,
          ...columnData,
          createdAt: new Date().toISOString()
        };
        return newColumn;
      }
      
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
      const response = await api.put(`/v2/board/columns/${columnId}`, columnData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/columns PUT endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const updatedColumn = {
          id: columnId,
          ...columnData,
          updatedAt: new Date().toISOString()
        };
        return updatedColumn;
      }
      
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
      const response = await api.post(`/v2/board/columns/${columnId}/toggle`, {
        isActive
      });
      return response.data;
    } catch (error) {
      console.warn('v2/board/columns toggle endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const updatedColumn = {
          id: columnId,
          isActive: isActive,
          updatedAt: new Date().toISOString()
        };
        return updatedColumn;
      }
      
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
      await api.delete(`/v2/board/columns/${columnId}`);
    } catch (error) {
      console.warn('v2/board/columns DELETE endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return { success: true };
      }
      
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
      const response = await api.put('/v2/board/columns/reorder', {
        columnOrder
      });
      return response.data;
    } catch (error) {
      console.warn('v2/board/columns reorder endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return columnOrder.map((id, index) => ({
          id: id,
          order: index + 1,
          updatedAt: new Date().toISOString()
        }));
      }
      
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
      const response = await api.get(`/v2/board/cards/${cardId}/comments`);
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards comments endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return [
          {
            id: 'comment-1',
            cardId: cardId,
            content: 'This is a sample comment',
            author: { id: '1', name: 'John Production', username: 'john.prod' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      
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
      const response = await api.post(`/v2/board/cards/${cardId}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards comments POST endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const newComment = {
          id: `comment-${Date.now()}`,
          cardId: cardId,
          ...commentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return newComment;
      }
      
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
      const response = await api.put(`/v2/board/comments/${commentId}`, commentData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/comments PUT endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const updatedComment = {
          id: commentId,
          ...commentData,
          updatedAt: new Date().toISOString()
        };
        return updatedComment;
      }
      
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
      await api.delete(`/v2/board/comments/${commentId}`);
    } catch (error) {
      console.warn('v2/board/comments DELETE endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return { success: true };
      }
      
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
      const response = await api.get(`/v2/board/cards/${cardId}/activity`);
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards activity endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return [
          {
            id: 'activity-1',
            cardId: cardId,
            type: 'card_created',
            description: 'Card created',
            user: { id: '1', name: 'John Production', username: 'john.prod' },
            createdAt: new Date().toISOString()
          }
        ];
      }
      
      throw error;
    }
  }

  /**
   * Get all users for mentions and assignments
   * @returns {Promise<Array>} Array of users
   */
  async getUsers() {
    try {
      // Try the v2 endpoint first
      const response = await api.get('/v2/users');
      // Debug logging for user data
      if (process.env.NODE_ENV === 'development') {
        console.log('Response from getUsers:', response.data);
      }
      return response.data;
    } catch (error) {
      console.warn('v2/users endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return [
          // Production Users
          { id: '1', name: 'John Production', username: 'john.prod', designation: 'Production', role: 'user' },
          { id: '2', name: 'Jane Production', username: 'jane.prod', designation: 'Production', role: 'user' },
          { id: '3', name: 'Bob Production', username: 'bob.prod', designation: 'Production', role: 'user' },
          { id: '4', name: 'Alice Production', username: 'alice.prod', designation: 'Production', role: 'user' },
          // Driver Users
          { id: '5', name: 'Mike Driver', username: 'mike.driver', designation: 'Driver', role: 'user' },
          { id: '6', name: 'Sarah Driver', username: 'sarah.driver', designation: 'Driver', role: 'user' },
          { id: '7', name: 'Tom Driver', username: 'tom.driver', designation: 'Driver', role: 'user' },
          { id: '8', name: 'Lisa Driver', username: 'lisa.driver', designation: 'Driver', role: 'user' },
          // Other Users
          { id: '9', name: 'Admin User', username: 'admin', designation: 'Admin', role: 'admin' },
          { id: '10', name: 'Sales User', username: 'sales', designation: 'Sales', role: 'user' }
        ];
      }
      
      throw error;
    }
  }

  /**
   * Get all labels
   * @returns {Promise<Array>} Array of labels
   */
  async getLabels() {
    try {
      const response = await api.get('/v2/board/labels');
      return response.data || [];
    } catch (error) {
      console.warn('v2/board/labels endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return [
          { id: 'label-1', name: 'Bug', color: '#ef4444' },
          { id: 'label-2', name: 'Feature', color: '#10b981' },
          { id: 'label-3', name: 'Urgent', color: '#f59e0b' },
          { id: 'label-4', name: 'Low Priority', color: '#6b7280' }
        ];
      }
      
      // Return empty array if labels endpoint doesn't exist yet
      return [];
    }
  }

  /**
   * Create a new label
   * @param {Object} labelData - The label data
   * @returns {Promise<Object>} Created label
   */
  async createLabel(labelData) {
    try {
      const response = await api.post('/v2/board/labels', labelData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/labels POST endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const newLabel = {
          id: `label-${Date.now()}`,
          ...labelData,
          createdAt: new Date().toISOString()
        };
        return newLabel;
      }
      
      throw error;
    }
  }

  /**
   * Update a label
   * @param {string} labelId - The label ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object>} Updated label
   */
  async updateLabel(labelId, updates) {
    try {
      const response = await api.put(`/v2/board/labels/${labelId}`, updates);
      return response.data;
    } catch (error) {
      console.warn('v2/board/labels PUT endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const updatedLabel = {
          id: labelId,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return updatedLabel;
      }
      
      throw error;
    }
  }

  /**
   * Delete a label
   * @param {string} labelId - The label ID
   * @returns {Promise<void>}
   */
  async deleteLabel(labelId) {
    try {
      await api.delete(`/v2/board/labels/${labelId}`);
    } catch (error) {
      console.warn('v2/board/labels DELETE endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return { success: true };
      }
      
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
      const response = await api.get('/v2/users/search', {
        params: { q: searchTerm }
      });
      return response.data;
    } catch (error) {
      console.warn('v2/users/search endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const mockUsers = [
          { id: '1', name: 'John Production', username: 'john.prod', designation: 'Production', role: 'user' },
          { id: '2', name: 'Jane Production', username: 'jane.prod', designation: 'Production', role: 'user' },
          { id: '3', name: 'Bob Production', username: 'bob.prod', designation: 'Production', role: 'user' },
          { id: '4', name: 'Alice Production', username: 'alice.prod', designation: 'Production', role: 'user' },
          { id: '5', name: 'Mike Driver', username: 'mike.driver', designation: 'Driver', role: 'user' },
          { id: '6', name: 'Sarah Driver', username: 'sarah.driver', designation: 'Driver', role: 'user' },
          { id: '7', name: 'Tom Driver', username: 'tom.driver', designation: 'Driver', role: 'user' },
          { id: '8', name: 'Lisa Driver', username: 'lisa.driver', designation: 'Driver', role: 'user' },
          { id: '9', name: 'Admin User', username: 'admin', designation: 'Admin', role: 'admin' },
          { id: '10', name: 'Sales User', username: 'sales', designation: 'Sales', role: 'user' }
        ];
        
        if (!searchTerm) return mockUsers;
        
        const searchLower = searchTerm.toLowerCase();
        return mockUsers.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower) ||
          user.designation.toLowerCase().includes(searchLower)
        );
      }
      
      throw error;
    }
  }

  /**
   * Search cards within a specific column
   * @param {string} columnId - The column ID to search within
   * @param {string} searchTerm - The search term
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Array of matching cards
   */
  async searchCards(columnId, searchTerm, filters = {}) {
    try {
      const response = await api.get('/v2/board/cards/search', {
        params: { 
          columnId, 
          searchTerm, 
          ...filters 
        }
      });
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards/search endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const mockCards = [
          {
            id: 'card-1',
            title: 'Sample Task 1',
            description: 'This is a sample task for testing the Kanban board',
            columnId: 'sales',
            subcolumnId: null,
            priority: 'medium',
            labels: [],
            assignees: [],
            dueDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'card-2',
            title: 'Sample Task 2',
            description: 'Another sample task in progress',
            columnId: 'office',
            subcolumnId: null,
            priority: 'high',
            labels: [],
            assignees: [],
            dueDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        if (!searchTerm) return mockCards;
        
        const searchLower = searchTerm.toLowerCase();
        return mockCards.filter(card => 
          card.title.toLowerCase().includes(searchLower) ||
          card.description.toLowerCase().includes(searchLower)
        );
      }
      
      throw error;
    }
  }

  /**
   * Log activity for audit trail
   * @param {Object} activityData - The activity data
   * @returns {Promise<Object>} Logged activity
   */
  async logActivity(activityData) {
    try {
      const response = await api.post('/v2/board/activity', activityData);
      return response.data;
    } catch (error) {
      console.warn('v2/board/activity endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const loggedActivity = {
          id: `activity-${Date.now()}`,
          ...activityData,
          createdAt: new Date().toISOString()
        };
        return loggedActivity;
      }
      
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

      const response = await api.post(`/v2/board/cards/${cardId}/attachments`, formData, {
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
      await api.delete(`/v2/board/cards/${cardId}/attachments/${attachmentId}`);
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
      const response = await api.post(`/v2/board/cards/${cardId}/assign`, {
        userIds
      });
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards assign endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const updatedCard = {
          id: cardId,
          assignees: userIds,
          updatedAt: new Date().toISOString()
        };
        return updatedCard;
      }
      
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
      const response = await api.put(`/v2/board/cards/reorder`, {
        columnId,
        cardOrder
      });
      return response.data;
    } catch (error) {
      console.warn('v2/board/cards reorder endpoint not available, using mock data:', error.message);
      
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        return cardOrder.map((id, index) => ({
          id: id,
          columnId: columnId,
          order: index + 1,
          updatedAt: new Date().toISOString()
        }));
      }
      
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
      const response = await api.get(`/v2/board/${boardId}/members`);
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
      const response = await api.post(`/v2/board/${boardId}/members`, {
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
      const response = await api.delete(`/v2/board/${boardId}/members/${userId}`);
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
      const response = await api.post('/v2/board', boardData);
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
      const response = await api.put(`/v2/board/${boardId}`, boardData);
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
      await api.delete(`/v2/board/${boardId}`);
    } catch (error) {
      console.error('Error deleting board:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const kanbanService = new KanbanService();
