/**
 * Kanban Board Context
 * Provides state management and actions for the entire Kanban board
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useAuth } from '../../../contexts/AuthContext';
import { kanbanService } from '../services/kanbanService';
import { 
  COLUMN_TYPES, 
  DEFAULT_COLUMNS, 
  DND_RESTRICTIONS,
  ACTIVITY_TYPES 
} from '../utils/constants';
import { 
  hasPermission, 
  canCreateCard, 
  canEditCard, 
  canMoveCard,
  canManageColumn 
} from '../utils/permissions';

// Action types for the reducer
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BOARD_DATA: 'SET_BOARD_DATA',
  SET_CARDS: 'SET_CARDS',
  SET_COLUMNS: 'SET_COLUMNS',
  SET_USERS: 'SET_USERS',
  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  UPDATE_COLUMN: 'UPDATE_COLUMN',
  TOGGLE_COLUMN_ACTIVATION: 'TOGGLE_COLUMN_ACTIVATION',
  ADD_COMMENT: 'ADD_COMMENT',
  UPDATE_COMMENT: 'UPDATE_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
  SET_FILTERS: 'SET_FILTERS',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  OPTIMISTIC_UPDATE: 'OPTIMISTIC_UPDATE',
  ROLLBACK_UPDATE: 'ROLLBACK_UPDATE'
};

// Initial state
const initialState = {
  loading: true,
  error: null,
  cards: [],
  columns: Object.values(DEFAULT_COLUMNS),
  users: [],
  filters: {
    labels: [],
    assignees: [],
    dueDate: null,
    priority: null,
    text: ''
  },
  searchTerm: '',
  optimisticUpdates: new Map()
};

// Reducer function
function kanbanReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.SET_BOARD_DATA:
      return {
        ...state,
        cards: action.payload.cards || [],
        columns: action.payload.columns || Object.values(DEFAULT_COLUMNS),
        loading: false,
        error: null
      };

    case ACTIONS.SET_CARDS:
      return { ...state, cards: action.payload };

    case ACTIONS.SET_COLUMNS:
      return { ...state, columns: action.payload };

    case ACTIONS.SET_USERS:
      return { ...state, users: action.payload };

    case ACTIONS.ADD_CARD:
      return {
        ...state,
        cards: [...state.cards, action.payload]
      };

    case ACTIONS.UPDATE_CARD:
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.id ? { ...card, ...action.payload } : card
        )
      };

    case ACTIONS.MOVE_CARD:
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.cardId
            ? { 
                ...card, 
                columnId: action.payload.toColumn,
                subcolumnId: action.payload.toSubcolumn || null
              }
            : card
        )
      };

    case ACTIONS.DELETE_CARD:
      return {
        ...state,
        cards: state.cards.filter(card => card.id !== action.payload)
      };

    case ACTIONS.UPDATE_COLUMN:
      return {
        ...state,
        columns: state.columns.map(column =>
          column.id === action.payload.id ? { ...column, ...action.payload } : column
        )
      };

    case ACTIONS.TOGGLE_COLUMN_ACTIVATION:
      return {
        ...state,
        columns: state.columns.map(column =>
          column.id === action.payload.columnId
            ? { ...column, isActive: action.payload.isActive }
            : column
        )
      };

    case ACTIONS.ADD_COMMENT:
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.cardId
            ? { ...card, comments: [...(card.comments || []), action.payload.comment] }
            : card
        )
      };

    case ACTIONS.UPDATE_COMMENT:
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.cardId
            ? {
                ...card,
                comments: (card.comments || []).map(comment =>
                  comment.id === action.payload.commentId
                    ? { ...comment, ...action.payload.updates }
                    : comment
                )
              }
            : card
        )
      };

    case ACTIONS.DELETE_COMMENT:
      return {
        ...state,
        cards: state.cards.map(card =>
          card.id === action.payload.cardId
            ? {
                ...card,
                comments: (card.comments || []).filter(
                  comment => comment.id !== action.payload.commentId
                )
              }
            : card
        )
      };

    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };

    case ACTIONS.OPTIMISTIC_UPDATE:
      return {
        ...state,
        optimisticUpdates: new Map(state.optimisticUpdates).set(
          action.payload.id,
          action.payload.data
        )
      };

    case ACTIONS.ROLLBACK_UPDATE:
      const newOptimisticUpdates = new Map(state.optimisticUpdates);
      newOptimisticUpdates.delete(action.payload);
      return {
        ...state,
        optimisticUpdates: newOptimisticUpdates
      };

    default:
      return state;
  }
}

// Create context
const KanbanContext = createContext();

// Provider component
export const KanbanProvider = ({ children }) => {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);
  const { user } = useAuth();

  // Load initial board data
  const loadBoardData = useCallback(async () => {
    if (!user) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Authentication required' });
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const [boardData, users] = await Promise.all([
        kanbanService.getBoard(),
        kanbanService.getUsers()
      ]);

      dispatch({ type: ACTIONS.SET_BOARD_DATA, payload: boardData });
      dispatch({ type: ACTIONS.SET_USERS, payload: users });
    } catch (error) {
      console.error('Error loading board data:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [user]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      loadBoardData();
    } else {
      // Clear data when user is not authenticated
      dispatch({ type: ACTIONS.SET_BOARD_DATA, payload: { cards: [], columns: [] } });
      dispatch({ type: ACTIONS.SET_USERS, payload: [] });
    }
  }, [loadBoardData, user]);

  // Create a new card
  const createCard = useCallback(async (cardData) => {
    if (!user || !canCreateCard(user.role, cardData.columnId)) {
      throw new Error('Insufficient permissions to create card');
    }

    try {
      const newCard = await kanbanService.createCard({
        ...cardData,
        createdBy: user.username
      });
      
      dispatch({ type: ACTIONS.ADD_CARD, payload: newCard });
      return newCard;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }, [user]);

  // Update a card
  const updateCard = useCallback(async (cardId, updates) => {
    if (!user || !canEditCard(user.role, { id: cardId }, user.username)) {
      throw new Error('Insufficient permissions to edit card');
    }

    try {
      const updatedCard = await kanbanService.updateCard(cardId, {
        ...updates,
        updatedBy: user.username
      });
      
      dispatch({ type: ACTIONS.UPDATE_CARD, payload: updatedCard });
      return updatedCard;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }, [user]);

  // Move a card
  const moveCard = useCallback(async (cardId, fromColumn, toColumn, toSubcolumn = null) => {
    if (!user || !canMoveCard(user.role, fromColumn, toColumn)) {
      throw new Error('Insufficient permissions to move card');
    }

    // Check DnD restrictions
    if (DND_RESTRICTIONS.RESTRICTED_COLUMNS.includes(toColumn)) {
      throw new Error('Cannot move card to restricted column');
    }

    try {
      // Optimistic update
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: { cardId, fromColumn, toColumn, toSubcolumn }
      });

      const result = await kanbanService.moveCard(cardId, fromColumn, toColumn, toSubcolumn);
      return result;
    } catch (error) {
      console.error('Error moving card:', error);
      // Rollback optimistic update
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: { cardId, fromColumn: toColumn, toColumn: fromColumn, toSubcolumn: null }
      });
      throw error;
    }
  }, [user]);

  // Reorder cards within a column or subcolumn
  const reorderCards = useCallback(async (containerId, oldIndex, newIndex) => {
    try {
      // Get cards for the container
      let containerCards;
      if (containerId.includes('production-') || containerId.includes('driver-')) {
        // Subcolumn
        containerCards = state.cards.filter(card => card.subcolumnId === containerId);
      } else {
        // Main column
        containerCards = state.cards.filter(card => card.columnId === containerId);
      }

      if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || 
          oldIndex >= containerCards.length || newIndex >= containerCards.length) {
        return;
      }

      // Reorder the cards
      const reorderedCards = arrayMove(containerCards, oldIndex, newIndex);
      
      // Update the order in the state
      const updatedCards = state.cards.map(card => {
        const reorderedCard = reorderedCards.find(rc => rc.id === card.id);
        if (reorderedCard) {
          return { ...card, order: reorderedCards.indexOf(reorderedCard) };
        }
        return card;
      });

      dispatch({ type: ACTIONS.SET_CARDS, payload: updatedCards });

      // In a real implementation, you would also update the backend
      // await kanbanService.reorderCards(containerId, oldIndex, newIndex);
    } catch (error) {
      console.error('Error reordering cards:', error);
      throw error;
    }
  }, [state.cards]);

  // Delete a card
  const deleteCard = useCallback(async (cardId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await kanbanService.deleteCard(cardId);
      dispatch({ type: ACTIONS.DELETE_CARD, payload: cardId });
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }, [user]);

  // Toggle column activation
  const toggleColumnActivation = useCallback(async (columnId, isActive) => {
    if (!user || !canManageColumn(user.role, columnId)) {
      throw new Error('Insufficient permissions to manage column');
    }

    try {
      const updatedColumn = await kanbanService.toggleColumnActivation(
        columnId,
        isActive
      );
      
      dispatch({
        type: ACTIONS.TOGGLE_COLUMN_ACTIVATION,
        payload: { columnId, isActive }
      });
      
      return updatedColumn;
    } catch (error) {
      console.error('Error toggling column activation:', error);
      throw error;
    }
  }, [user]);

  // Add comment
  const addComment = useCallback(async (cardId, commentText) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const comment = await kanbanService.addComment(cardId, {
        text: commentText,
        authorId: user.username,
        authorName: user.username
      });
      
      dispatch({
        type: ACTIONS.ADD_COMMENT,
        payload: { cardId, comment }
      });
      
      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [user]);

  // Update comment
  const updateComment = useCallback(async (commentId, cardId, updates) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedComment = await kanbanService.updateComment(commentId, {
        ...updates,
        cardId,
        authorId: user.username
      });
      
      dispatch({
        type: ACTIONS.UPDATE_COMMENT,
        payload: { cardId, commentId, updates: updatedComment }
      });
      
      return updatedComment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }, [user]);

  // Delete comment
  const deleteComment = useCallback(async (commentId, cardId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await kanbanService.deleteComment(commentId, cardId, user.username);
      
      dispatch({
        type: ACTIONS.DELETE_COMMENT,
        payload: { cardId, commentId }
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }, [user]);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  // Set search term
  const setSearchTerm = useCallback((searchTerm) => {
    dispatch({ type: ACTIONS.SET_SEARCH_TERM, payload: searchTerm });
  }, []);

  // Get filtered cards
  const getFilteredCards = useCallback(() => {
    let filteredCards = state.cards;

    // Apply text filter
    if (state.filters.text) {
      const searchText = state.filters.text.toLowerCase();
      filteredCards = filteredCards.filter(card =>
        card.title.toLowerCase().includes(searchText) ||
        card.description?.toLowerCase().includes(searchText)
      );
    }

    // Apply label filter
    if (state.filters.labels.length > 0) {
      filteredCards = filteredCards.filter(card =>
        card.labels?.some(label => state.filters.labels.includes(label))
      );
    }

    // Apply assignee filter
    if (state.filters.assignees.length > 0) {
      filteredCards = filteredCards.filter(card =>
        card.assignees?.some(assignee => state.filters.assignees.includes(assignee))
      );
    }

    // Apply priority filter
    if (state.filters.priority) {
      filteredCards = filteredCards.filter(card => card.priority === state.filters.priority);
    }

    // Apply due date filter
    if (state.filters.dueDate) {
      const filterDate = new Date(state.filters.dueDate);
      filteredCards = filteredCards.filter(card => {
        if (!card.dueDate) return false;
        const cardDate = new Date(card.dueDate);
        return cardDate.toDateString() === filterDate.toDateString();
      });
    }

    return filteredCards;
  }, [state.cards, state.filters]);

  // Get cards by column
  const getCardsByColumn = useCallback((columnId) => {
    const filteredCards = getFilteredCards();
    return filteredCards.filter(card => card.columnId === columnId);
  }, [getFilteredCards]);

  // Get cards by subcolumn
  const getCardsBySubcolumn = useCallback((subcolumnId) => {
    const filteredCards = getFilteredCards();
    return filteredCards.filter(card => card.subcolumnId === subcolumnId);
  }, [getFilteredCards]);

  // Get active columns
  const getActiveColumns = useCallback(() => {
    return state.columns.filter(column => column.isActive !== false);
  }, [state.columns]);

  // Check if a column is currently being activated/deactivated
  const isActivating = useCallback((columnId) => {
    // For now, return false as we don't have a loading state for column activation
    // In a real implementation, you might track this in the state
    return false;
  }, []);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    createCard,
    updateCard,
    moveCard,
    reorderCards,
    deleteCard,
    toggleColumnActivation,
    addComment,
    updateComment,
    deleteComment,
    setFilters,
    setSearchTerm,
    loadBoardData,
    
    // Computed values
    getFilteredCards,
    getCardsByColumn,
    getCardsBySubcolumn,
    getActiveColumns,
    isActivating,
    
    // Permissions
    canCreateCard: (columnId) => canCreateCard(user?.role, columnId),
    canEditCard: (card) => canEditCard(user?.role, card, user?.username),
    canMoveCard: (fromColumn, toColumn) => canMoveCard(user?.role, fromColumn, toColumn),
    canManageColumn: (columnId) => canManageColumn(user?.role, columnId),
    hasPermission: (permission) => hasPermission(user?.role, permission)
  };

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
};

// Hook to use the Kanban context
export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};

