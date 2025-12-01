/**
 * KanbanContext
 * Main context for Kanban board state management
 * Implements Trello-style Kanban with proper column structure and live API integration
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { kanbanService } from '../services/kanbanService';
import { logCardCreated, logCardUpdated, logCardMoved, logCardDeleted } from '../utils/activityLogger';
import { canPerformAction as checkPermission } from '../utils/permissions';

// Initial state
const initialState = {
  cards: [],
  columns: [],
  users: [],
  labels: [],
  user: null,
  board: null,
  filters: {
    text: '',
    labels: [],
    assignees: [],
    dueDateRange: {
      start: null,
      end: null
    },
    priority: [],
    columns: []
  },
  searchTerm: '',
  isLoading: false,
  error: null,
  lastUpdated: null,
  initialized: false
};

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CARDS: 'SET_CARDS',
  SET_COLUMNS: 'SET_COLUMNS',
  SET_USERS: 'SET_USERS',
  SET_LABELS: 'SET_LABELS',
  SET_USER: 'SET_USER',
  SET_BOARD: 'SET_BOARD',
  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  SET_FILTERS: 'SET_FILTERS',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  UPDATE_COLUMN: 'UPDATE_COLUMN',
  SET_LAST_UPDATED: 'SET_LAST_UPDATED',
  MARK_INITIALIZED: 'MARK_INITIALIZED',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const kanbanReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ACTION_TYPES.SET_CARDS:
      return { ...state, cards: action.payload };

    case ACTION_TYPES.SET_COLUMNS:
      return { ...state, columns: action.payload };

    case ACTION_TYPES.SET_USERS:
      return { ...state, users: action.payload };
    
    case ACTION_TYPES.SET_LABELS:
      return { ...state, labels: action.payload };
    
    case ACTION_TYPES.SET_USER:
      return { ...state, user: action.payload };
    
    case ACTION_TYPES.SET_BOARD:
      return { ...state, board: action.payload };
    
    case ACTION_TYPES.ADD_CARD:
      return { ...state, cards: [...state.cards, action.payload] };
    
    case ACTION_TYPES.UPDATE_CARD:
      return {
        ...state,
        cards: state.cards.map(card => {
          // Match by id or _id
          const cardId = card.id || card._id;
          const payloadId = action.payload.id || action.payload._id;
          if (cardId === payloadId) {
            return { ...card, ...action.payload };
          }
          return card;
        })
      };

    case ACTION_TYPES.DELETE_CARD:
      return {
        ...state,
        cards: state.cards.filter(card => card.id !== action.payload)
      };

    case ACTION_TYPES.MOVE_CARD:
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.cardId
            ? { ...card, columnId: action.payload.columnId, subcolumnId: action.payload.subcolumnId }
            : card
        )
      };

    case ACTION_TYPES.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case ACTION_TYPES.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };

    case ACTION_TYPES.CLEAR_FILTERS:
      return { ...state, filters: initialState.filters };
    
    case ACTION_TYPES.UPDATE_COLUMN:
      return {
        ...state,
        columns: state.columns.map(column =>
          column.id === action.payload.id ? { ...column, ...action.payload } : column
        )
      };
    
    case ACTION_TYPES.SET_LAST_UPDATED:
      return { ...state, lastUpdated: action.payload };
    
    case ACTION_TYPES.MARK_INITIALIZED:
      return { ...state, initialized: true, isLoading: false };

    default:
      return state;
  }
};

// Create context
const KanbanContext = createContext();

// Provider component
export const KanbanProvider = ({ children, user }) => {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);

  // Set user when provided
  useEffect(() => {
    if (user) {
      dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
    } else {
      // Create a mock user for development
      const mockUser = {
        id: 'dev-user-1',
        name: 'Development User',
        email: 'dev@example.com',
        role: 'Sales',
        permissions: ['VIEW_BOARD', 'CREATE_CARD', 'EDIT_CARD', 'MOVE_CARD', 'COMMENT', 'SEARCH_CARDS', 'VIEW_ACTIVITY']
      };
      dispatch({ type: ACTION_TYPES.SET_USER, payload: mockUser });
    }
  }, [user]);

  // Create default column structure according to specifications
  const createDefaultColumnStructure = useCallback((users = []) => {
    // Filter users by role/type for Production and Drivers
    const productionUsers = users.filter(user => 
      user.role === 'production' || 
      user.type === 'production' || 
      user.department === 'production' ||
      user.groupType === 'production'
    );
    
    const driverUsers = users.filter(user => 
      user.role === 'driver' || 
      user.type === 'driver' || 
      user.department === 'drivers' ||
      user.groupType === 'drivers'
    );

    // Create subcolumns for Production users
    const productionSubcolumns = productionUsers.map((user, index) => ({
      id: `production-${user.id || user._id}`,
      title: user.name || user.username || `User ${index + 1}`,
      position: index,
      isActive: true,
      userId: user.id || user._id,
      userData: user
    }));

    // Create subcolumns for Driver users
    const driverSubcolumns = driverUsers.map((user, index) => ({
      id: `driver-${user.id || user._id}`,
      title: user.name || user.username || `Driver ${index + 1}`,
      position: index,
      isActive: true,
      userId: user.id || user._id,
      userData: user
    }));

    console.log('Creating columns with users:', {
      totalUsers: users.length,
      productionUsers: productionUsers.length,
      driverUsers: driverUsers.length,
      productionSubcolumns: productionSubcolumns.length,
      driverSubcolumns: driverSubcolumns.length
    });

    return [
      // Non-grouped columns
      {
        id: 'sales',
        title: 'Sales',
        type: 'static',
        position: 0,
        isActive: true,
        isGrouped: false,
        cards: [],
        settings: { allowCreateCard: true }
      },
      {
        id: 'office',
        title: 'Office',
        type: 'static',
        position: 1,
        isActive: true,
        isGrouped: false,
        cards: [],
        settings: {}
      },
      // Grouped columns
      {
        id: 'production',
        title: 'Production',
        type: 'grouped',
        position: 2,
        isActive: true,
        isGrouped: true,
        groupType: 'production',
        cards: [],
        subcolumns: productionSubcolumns,
        settings: { allowToggle: true }
      },
      {
        id: 'ready',
        title: 'Ready',
        type: 'grouped',
        position: 3,
        isActive: true,
        isGrouped: true,
        groupType: 'ready',
        cards: [],
        subcolumns: [
          { id: 'for-dispatch', title: 'For Dispatch', position: 0, isActive: true },
          { id: 'for-customer-collection', title: 'For Customer Collection', position: 1, isActive: true }
        ],
        settings: {}
      },
      {
        id: 'drivers',
        title: 'Drivers',
        type: 'grouped',
        position: 4,
        isActive: true,
        isGrouped: true,
        groupType: 'drivers',
        cards: [],
        subcolumns: driverSubcolumns,
        settings: { allowToggle: true }
      },
      {
        id: 'done',
        title: 'Done',
        type: 'grouped',
        position: 5,
        isActive: true,
        isGrouped: true,
        groupType: 'done',
        cards: [],
        subcolumns: [
          { id: 'done-today', title: 'Done Today', position: 0, isActive: true },
          { id: 'less-than-7-days', title: '< 7 Days', position: 1, isActive: true, restricted: true },
          { id: 'more-than-7-days', title: '> 7 Days', position: 2, isActive: true, restricted: true, hasSearch: true }
        ],
        settings: {}
      }
    ];
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
      
      // Try to fetch users from API
      let users = [];
      try {
        users = await kanbanService.getUsers();
        console.log('Fetched users from API:', users);
        
        // Ensure users is an array (handle null/undefined responses)
        if (!Array.isArray(users)) {
          console.warn('API returned non-array users data:', users);
          users = [];
        }
      } catch (error) {
        console.warn('Users API not available, using empty array:', error.message);
        users = [];
      }
      
      // Create default column structure with dynamic subcolumns
      const defaultColumns = createDefaultColumnStructure(users);
      
      // Set default data
      dispatch({ type: ACTION_TYPES.SET_COLUMNS, payload: defaultColumns });
      dispatch({ type: ACTION_TYPES.SET_CARDS, payload: [] });
      dispatch({ type: ACTION_TYPES.SET_LABELS, payload: [] });
      dispatch({ type: ACTION_TYPES.SET_USERS, payload: users });
      dispatch({ type: ACTION_TYPES.SET_BOARD, payload: { id: 'default-board-id', name: 'Default Board' } });
      dispatch({ type: ACTION_TYPES.SET_LAST_UPDATED, payload: new Date().toISOString() });
      dispatch({ type: ACTION_TYPES.MARK_INITIALIZED });
      
    } catch (error) {
      console.error('Error loading board data:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
    }
  }, [createDefaultColumnStructure]);

  // Create card
  const createCard = useCallback(async (cardData) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      const result = await kanbanService.createCard(cardData);
      
      if (result.status === 'success') {
        const transformedCard = kanbanService.transformCardData(result.data);
        dispatch({ type: ACTION_TYPES.ADD_CARD, payload: transformedCard });
        
        // Log activity
        const activity = logCardCreated(transformedCard, state.user);
        await kanbanService.logActivity(activity);
        
        return transformedCard;
      } else {
        throw new Error(result.error || 'Failed to create card');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.user]);

  // Update card
  const updateCard = useCallback(async (cardId, updates) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      // Transform updates to backend format
      const backendUpdates = kanbanService.transformTaskToApi(updates);
      
      const result = await kanbanService.updateCard(cardId, backendUpdates);
      
      if (result.status === 'success') {
        // Handle both { data: { task } } and { data: task } response formats
        const taskData = result.data?.task || result.data;
        const transformedCard = kanbanService.transformCardData(taskData);
        
        // Ensure card has both id and _id for matching
        if (!transformedCard._id) transformedCard._id = transformedCard.id;
        if (!transformedCard.id) transformedCard.id = transformedCard._id;
        
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: transformedCard });
        
        // Log activity (activity logging is now handled in TrelloCardModal)
        // const activity = logCardUpdated(transformedCard, state.user, updates);
        // await kanbanService.logActivity(activity);
        
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
        return transformedCard;
      } else {
        throw new Error(result.error || 'Failed to update card');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      throw error;
    }
  }, [state.user]);

  // Delete card
  const deleteCard = useCallback(async (cardId) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      const result = await kanbanService.deleteCard(cardId);
      
      if (result.status === 'success') {
        dispatch({ type: ACTION_TYPES.DELETE_CARD, payload: cardId });
        
        // Log activity
        const activity = logCardDeleted(cardId, state.user);
        await kanbanService.logActivity(activity);
        
      return result;
      } else {
        throw new Error(result.error || 'Failed to delete card');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.user]);

  // Move card with DnD rules enforcement
  const moveCard = useCallback(async (cardId, moveData) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      // Check if move is allowed based on DnD rules
      const card = state.cards.find(c => c.id === cardId);
      const fromColumn = state.columns.find(c => c.id === card?.columnId);
      const toColumn = state.columns.find(c => c.id === moveData.toColumnId);
      
      if (!kanbanService.isMoveAllowed(fromColumn, toColumn, card?.subcolumnId, moveData.toSubColumnId)) {
        throw new Error('Move not allowed: Cannot move cards to/from < 7 Days or > 7 Days columns');
      }

      const result = await kanbanService.moveCard(cardId, moveData);
      
      if (result.status === 'success') {
        const transformedCard = kanbanService.transformCardData(result.data);
        dispatch({ type: ACTION_TYPES.MOVE_CARD, payload: {
          cardId,
          columnId: moveData.toColumnId,
          subcolumnId: moveData.toSubColumnId
        }});
        
        // Log activity
        const activity = logCardMoved(transformedCard, state.user, moveData);
        await kanbanService.logActivity(activity);
        
        return transformedCard;
      } else {
        throw new Error(result.error || 'Failed to move card');
      }
    } catch (error) {
      console.error('Error moving card:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards, state.columns, state.user]);

  // Toggle column activation
  const toggleColumnActivation = useCallback(async (columnId, isActive) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

      const result = await kanbanService.toggleColumnActivation(columnId, isActive);
      
      if (result.status === 'success') {
        dispatch({ type: ACTION_TYPES.UPDATE_COLUMN, payload: {
          id: columnId,
        isActive
        }});

      // Log activity
        const activity = {
          type: 'column_toggled',
        columnId,
          isActive,
          timestamp: new Date().toISOString(),
          userId: state.user?.id
        };
        await kanbanService.logActivity(activity);
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to toggle column');
      }
    } catch (error) {
      console.error('Error toggling column:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.user]);

  // Search cards in specific column (for > 7 Days column)
  const searchCardsInColumn = useCallback(async (columnId, query) => {
    try {
      const result = await kanbanService.searchCardsInColumn(columnId, query);
      return result;
    } catch (error) {
      console.error('Error searching cards:', error);
      throw error;
    }
  }, []);

  // Add comment to card
  const addComment = useCallback(async (cardId, commentData) => {
    try {
      const result = await kanbanService.addComment(cardId, commentData);
      
      if (result.status === 'success') {
        // Update card with new comment
        const card = state.cards.find(c => c.id === cardId);
        if (card) {
          const updatedCard = {
            ...card,
            comments: [...(card.comments || []), result.data]
          };
          dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
        }
        
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Update comment
  const updateComment = useCallback(async (cardId, commentId, updates) => {
    try {
      const result = await kanbanService.updateComment(cardId, commentId, updates);
      
      if (result.status === 'success') {
        // Update card with updated comment
        const card = state.cards.find(c => (c.id === cardId || c._id === cardId));
        if (card) {
          const updatedCard = {
            ...card,
            comments: card.comments.map(comment =>
              (comment.id === commentId || comment._id === commentId) ? { ...comment, ...updates } : comment
            )
          };
          dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
        }
        
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Delete comment
  const deleteComment = useCallback(async (cardId, commentId) => {
    try {
      const result = await kanbanService.deleteComment(cardId, commentId);
      
      if (result.status === 'success') {
        // Update card with deleted comment
        const card = state.cards.find(c => (c.id === cardId || c._id === cardId));
        if (card) {
          const updatedCard = {
            ...card,
            comments: card.comments.filter(comment => (comment.id !== commentId && comment._id !== commentId))
          };
          dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTION_TYPES.SET_FILTERS, payload: filters });
  }, []);

  // Set search term
  const setSearchTerm = useCallback((searchTerm) => {
    dispatch({ type: ACTION_TYPES.SET_SEARCH_TERM, payload: searchTerm });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_FILTERS });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  }, []);

  // ==================== LABEL METHODS ====================
  
  // Fetch labels by branch
  const fetchLabelsByBranch = useCallback(async (branchId) => {
    try {
      const result = await kanbanService.getLabelsByBranch(branchId);
      if (result && result.data && result.data.labels) {
        dispatch({ type: ACTION_TYPES.SET_LABELS, payload: result.data.labels });
      }
      return result;
    } catch (error) {
      console.error('Error fetching labels by branch:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Create label
  const createLabel = useCallback(async (labelData) => {
    try {
      const result = await kanbanService.createLabel(labelData);
      if (result && result.data && result.data.label) {
        // Add new label to state
        dispatch({ type: ACTION_TYPES.SET_LABELS, payload: [...state.labels, result.data.label] });
      }
      return result;
    } catch (error) {
      console.error('Error creating label:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.labels]);

  // Update label
  const updateLabel = useCallback(async (labelId, labelData) => {
    try {
      const result = await kanbanService.updateLabel(labelId, labelData);
      if (result && result.data && result.data.label) {
        // Update label in state
        const updatedLabels = state.labels.map(label => 
          (label._id === labelId || label.id === labelId) ? result.data.label : label
        );
        dispatch({ type: ACTION_TYPES.SET_LABELS, payload: updatedLabels });
      }
      return result;
    } catch (error) {
      console.error('Error updating label:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.labels]);

  // Delete label
  const deleteLabel = useCallback(async (labelId) => {
    try {
      await kanbanService.deleteLabel(labelId);
      // Remove label from state
      const updatedLabels = state.labels.filter(label => 
        (label._id !== labelId && label.id !== labelId)
      );
      dispatch({ type: ACTION_TYPES.SET_LABELS, payload: updatedLabels });
    } catch (error) {
      console.error('Error deleting label:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.labels]);

  // Get cards by column
  const getCardsByColumn = useCallback((columnId) => {
    return state.cards.filter(card => card.columnId === columnId);
  }, [state.cards]);

  // Get cards by subcolumn
  const getCardsBySubcolumn = useCallback((columnId, subcolumnId) => {
    return state.cards.filter(card => 
      card.columnId === columnId && card.subcolumnId === subcolumnId
    );
  }, [state.cards]);

  // Get active columns
  const getActiveColumns = useCallback(() => {
    return state.columns.filter(column => column.isActive !== false);
  }, [state.columns]);

  // Check if user can perform action (permissions)
  const canPerformAction = useCallback((action, resource = null) => {
    const user = state.user;
    return checkPermission(user, action, resource);
  }, [state.user]);

  // ==================== ATTACHMENT METHODS ====================
  
  // Add attachment to card
  const addAttachment = useCallback(async (cardId, attachmentData) => {
    try {
      const result = await kanbanService.addAttachment(cardId, attachmentData);
      
      if (result) {
        // Optimistically update card with new attachment
        const card = state.cards.find(c => c.id === cardId);
        if (card) {
          const updatedCard = {
            ...card,
            attachments: [...(card.attachments || []), result]
          };
          dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
        }
        return result;
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Delete attachment from card
  const deleteAttachment = useCallback(async (cardId, attachmentId) => {
    try {
      await kanbanService.deleteAttachment(cardId, attachmentId);
      
      // Optimistically update card
      const card = state.cards.find(c => c.id === cardId);
      if (card) {
        const updatedCard = {
          ...card,
          attachments: (card.attachments || []).filter(a => a.id !== attachmentId)
        };
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Set card cover image
  const setCardCover = useCallback(async (cardId, coverData) => {
    try {
      await kanbanService.setCardCover(cardId, coverData);
      
      // Optimistically update card
      const card = state.cards.find(c => c.id === cardId);
      if (card) {
        const updatedCard = {
          ...card,
          coverImage: coverData
        };
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
      }
    } catch (error) {
      console.error('Error setting card cover:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // ==================== CHECKLIST METHODS ====================
  
  // Add checklist to card
  const addChecklist = useCallback(async (cardId, checklistData) => {
    try {
      const result = await kanbanService.addChecklist(cardId, checklistData);
      
      if (result) {
        // Optimistically update card with new checklist
        const card = state.cards.find(c => c.id === cardId);
        if (card) {
          const updatedCard = {
            ...card,
            checklists: [...(card.checklists || []), result]
          };
          dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
        }
        return result;
      }
    } catch (error) {
      console.error('Error adding checklist:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Update checklist
  const updateChecklist = useCallback(async (cardId, checklistId, checklistData) => {
    try {
      await kanbanService.updateChecklist(cardId, checklistId, checklistData);
      
      // Optimistically update card
      const card = state.cards.find(c => c.id === cardId);
      if (card) {
        const updatedCard = {
          ...card,
          checklists: (card.checklists || []).map(cl =>
            cl.id === checklistId ? { ...cl, ...checklistData } : cl
          )
        };
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Delete checklist from card
  const deleteChecklist = useCallback(async (cardId, checklistId) => {
    try {
      await kanbanService.deleteChecklist(cardId, checklistId);
      
      // Optimistically update card
      const card = state.cards.find(c => c.id === cardId);
      if (card) {
        const updatedCard = {
          ...card,
          checklists: (card.checklists || []).filter(cl => cl.id !== checklistId)
        };
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // Toggle checklist item
  const toggleChecklistItem = useCallback(async (cardId, checklistId, itemId) => {
    try {
      await kanbanService.toggleChecklistItem(cardId, checklistId, itemId);
      
      // Optimistically update card
      const card = state.cards.find(c => c.id === cardId);
      if (card) {
        const updatedCard = {
          ...card,
          checklists: (card.checklists || []).map(cl =>
            cl.id === checklistId
              ? {
                  ...cl,
                  items: cl.items.map(item =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                  )
                }
              : cl
          )
        };
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
      }
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards]);

  // ==================== WATCH/SUBSCRIBE METHODS ====================
  
  // Watch card (subscribe to notifications)
  const watchCard = useCallback(async (cardId) => {
    try {
      await kanbanService.watchCard(cardId);
      
      // Optimistically update card
      const card = state.cards.find(c => c.id === cardId);
      if (card && state.user) {
        const updatedCard = {
          ...card,
          watchers: [...(card.watchers || []), state.user.id]
        };
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
      }
    } catch (error) {
      console.error('Error watching card:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards, state.user]);

  // Unwatch card (unsubscribe from notifications)
  const unwatchCard = useCallback(async (cardId) => {
    try {
      await kanbanService.unwatchCard(cardId);
      
      // Optimistically update card
      const card = state.cards.find(c => c.id === cardId);
      if (card && state.user) {
        const updatedCard = {
          ...card,
          watchers: (card.watchers || []).filter(id => id !== state.user.id)
        };
        dispatch({ type: ACTION_TYPES.UPDATE_CARD, payload: updatedCard });
      }
    } catch (error) {
      console.error('Error unwatching card:', error);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.cards, state.user]);

  const value = {
    // State
    ...state,
    
    // Actions
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    toggleColumnActivation,
    searchCardsInColumn,
    addComment,
    updateComment,
    deleteComment,
    setFilters,
    setSearchTerm,
    clearFilters,
    clearError,
    
    // Attachment Actions
    addAttachment,
    deleteAttachment,
    setCardCover,
    
    // Checklist Actions
    addChecklist,
    updateChecklist,
    deleteChecklist,
    toggleChecklistItem,
    
    // Watch Actions
    watchCard,
    unwatchCard,
    
    // Label Actions
    fetchLabelsByBranch,
    createLabel,
    updateLabel,
    deleteLabel,
    
    // Utilities
    getCardsByColumn,
    getCardsBySubcolumn,
    getActiveColumns,
    canPerformAction,
    
    // Service
    kanbanService
  };

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
};

// Hook to use Kanban context
export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};

export default KanbanContext;