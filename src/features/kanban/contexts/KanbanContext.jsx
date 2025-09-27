/**
 * Kanban Board Context
 * Provides state management and API integration for the entire Kanban board
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
// Removed @dnd-kit dependency - using custom array move function
const arrayMove = (array, from, to) => {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
};
import { useAuth } from '../../../contexts/AuthContext';
import { kanbanService } from '../services/kanbanService';
import { COLUMN_TYPES, ACTIVITY_TYPES } from '../utils/constants';
// Removed sorting utilities - using Pragmatic DND only

// Action types for the reducer
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BOARD_DATA: 'SET_BOARD_DATA',
  SET_CARDS: 'SET_CARDS',
  SET_COLUMNS: 'SET_COLUMNS',
  SET_USERS: 'SET_USERS',
  SET_LABELS: 'SET_LABELS',
  ADD_CARD: 'ADD_CARD',
  UPDATE_CARD: 'UPDATE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  DELETE_CARD: 'DELETE_CARD',
  ADD_COLUMN: 'ADD_COLUMN',
  UPDATE_COLUMN: 'UPDATE_COLUMN',
  DELETE_COLUMN: 'DELETE_COLUMN',
  TOGGLE_COLUMN_ACTIVATION: 'TOGGLE_COLUMN_ACTIVATION',
  ADD_COMMENT: 'ADD_COMMENT',
  UPDATE_COMMENT: 'UPDATE_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
  ADD_LABEL: 'ADD_LABEL',
  UPDATE_LABEL: 'UPDATE_LABEL',
  DELETE_LABEL: 'DELETE_LABEL',
  SET_FILTERS: 'SET_FILTERS',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  // Removed sorting action types - using Pragmatic DND only
  MARK_INITIALIZED: 'MARK_INITIALIZED'
};

// Initial state
const initialState = {
  loading: true,
  error: null,
  cards: [],
  columns: [],
  users: [],
  labels: [],
  filters: {
    labels: [],
    assignees: [],
    dueDate: null,
    priority: null,
    text: ''
  },
  searchTerm: '',
  // Removed columnSorts - using Pragmatic DND only
  isInitialized: false
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
        columns: action.payload.columns || [],
        cards: action.payload.cards || [],
        loading: false,
        error: null
      };

    case ACTIONS.SET_CARDS:
      return { ...state, cards: action.payload };

    case ACTIONS.SET_COLUMNS:
      return { ...state, columns: action.payload };

    case ACTIONS.SET_USERS:
      return { ...state, users: action.payload };

    case ACTIONS.SET_LABELS:
      return { ...state, labels: Array.isArray(action.payload) ? action.payload : [] };

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

    case ACTIONS.ADD_COLUMN:
      return {
        ...state,
        columns: [...state.columns, action.payload]
      };

    case ACTIONS.UPDATE_COLUMN:
      return {
        ...state,
        columns: state.columns.map(column =>
          column.id === action.payload.id ? { ...column, ...action.payload } : column
        )
      };

    case ACTIONS.DELETE_COLUMN:
      return {
        ...state,
        columns: state.columns.filter(column => column.id !== action.payload)
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

    case ACTIONS.ADD_LABEL:
      return {
        ...state,
        labels: [...state.labels, action.payload]
      };

    case ACTIONS.UPDATE_LABEL:
      return {
        ...state,
        labels: state.labels.map(label => 
          label.id === action.payload.id ? action.payload : label
        )
      };

    case ACTIONS.DELETE_LABEL:
      return {
        ...state,
        labels: state.labels.filter(label => label.id !== action.payload)
      };

    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };

    // Removed sorting reducer cases - using Pragmatic DND only

    case ACTIONS.MARK_INITIALIZED:
      return { ...state, isInitialized: true };

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

  // Load board data from API
  const loadBoardData = useCallback(async (forceRefresh = false) => {
    if (!user) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Authentication required' });
      return;
    }

    // Skip loading if already initialized and not forcing refresh
    if (state.isInitialized && !forceRefresh) {
      return;
    }

    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      // Load board data, labels, and users in parallel (API v2.0)
      const [boardData, labels, users] = await Promise.all([
        kanbanService.getBoard(),
        kanbanService.getLabels(),
        kanbanService.getUsers().catch(() => []) // Users endpoint might not exist
      ]);

      console.log('Loaded API v2.0 board data:', boardData);

      // Extract cards and columns from board data (API v2.0 structure)
      const cards = boardData?.cards || [];
      const columns = boardData?.columns || [];

      // Transform cards data for API v2.0
      const transformedCards = Array.isArray(cards) 
        ? cards.map(card => kanbanService.transformCardData(card))
        : [];

      // Transform columns data for API v2.0
      const transformedColumns = Array.isArray(columns) 
        ? columns.map(column => ({
            id: column._id || column.id,
            title: column.title,
            type: column.type || 'static',
            position: column.position || 0,
            cards: column.cards || [],
            settings: column.settings || {},
            isActive: column.isActive !== false
          }))
        : [];

      // Set board data
      dispatch({ 
        type: ACTIONS.SET_BOARD_DATA, 
        payload: {
          columns: transformedColumns,
          cards: transformedCards
        }
      });

      // Set additional data
      dispatch({ type: ACTIONS.SET_LABELS, payload: labels || [] });
      dispatch({ type: ACTIONS.SET_USERS, payload: users || [] });
      dispatch({ type: ACTIONS.MARK_INITIALIZED });
      
    } catch (error) {
      console.error('Error loading board data:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [user, state.isInitialized]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      loadBoardData();
    } else {
      // Clear data when user is not authenticated
      dispatch({ type: ACTIONS.SET_BOARD_DATA, payload: { cards: [], columns: [] } });
      dispatch({ type: ACTIONS.SET_USERS, payload: [] });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    }
  }, [user?.id, loadBoardData]);

  // Refresh data (force reload)
  const refreshData = useCallback(() => {
    loadBoardData(true);
  }, [loadBoardData]);

  // Create a new card
  const createCard = useCallback(async (cardData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const apiCardData = kanbanService.transformCardToApi({
        ...cardData,
        createdBy: user.username
      });
      
      const newCard = await kanbanService.createCard(apiCardData);
      const transformedCard = kanbanService.transformCardData(newCard);
      
      dispatch({ type: ACTIONS.ADD_CARD, payload: transformedCard });
      return transformedCard;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }, [user]);

  // Update a card
  const updateCard = useCallback(async (cardId, updates) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const apiUpdates = kanbanService.transformCardToApi({
        ...updates,
        updatedBy: user.username
      });
      
      const updatedCard = await kanbanService.updateCard(cardId, apiUpdates);
      const transformedCard = kanbanService.transformCardData(updatedCard);
      
      dispatch({ type: ACTIONS.UPDATE_CARD, payload: transformedCard });
      return transformedCard;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error;
    }
  }, [user]);

  // Move a card
  const moveCard = useCallback(async (cardId, fromColumn, toColumn, toSubcolumn = null, position = null) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate required parameters
    if (!cardId) {
      throw new Error('Card ID is required');
    }
    if (!fromColumn) {
      throw new Error('From column is required');
    }
    if (!toColumn) {
      throw new Error('To column is required');
    }

    // Find the card to get its current data
    const card = state.cards.find(c => c.id === cardId);
    if (!card) {
      throw new Error(`Card with ID ${cardId} not found`);
    }

    // Use card's actual columnId if fromColumn is undefined
    const actualFromColumn = fromColumn || card.columnId;
    if (!actualFromColumn) {
      throw new Error('Unable to determine source column for card');
    }

    console.log('Moving card:', {
      cardId,
      fromColumn: actualFromColumn,
      toColumn,
      toSubcolumn,
      cardData: {
        id: card.id,
        title: card.title,
        columnId: card.columnId,
        subcolumnId: card.subcolumnId
      },
      user: user
    });

    try {
      // Optimistic update
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: { cardId, fromColumn: actualFromColumn, toColumn, toSubcolumn }
      });

      // Ensure we have proper user data
      const userId = user?.id || user?.username || user?.userId || 'unknown';
      const userName = user?.name || user?.username || user?.displayName || 'Unknown User';
      const userRole = user?.role || user?.userRole || 'user';

      // Transform move data for API v2.0
      const moveData = kanbanService.transformMoveData({
        toList: toColumn,
        subcolumnId: toSubcolumn,
        position: position
      });

      console.log('Move data details:', {
        toColumn,
        toSubcolumn,
        moveData
      });

      const result = await kanbanService.moveCard(cardId, moveData);
      return result;
    } catch (error) {
      console.error('Error moving card:', error);
      // Rollback optimistic update
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: { cardId, fromColumn: toColumn, toColumn: actualFromColumn, toSubcolumn: null }
      });
      throw error;
    }
  }, [user, state.cards]);

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
        containerCards = state.cards.filter(card => card.columnId === containerId && !card.subcolumnId);
      }

      if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || 
          oldIndex >= containerCards.length || newIndex >= containerCards.length) {
        return;
      }

      // Reorder the cards locally
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

      // Send to API
      const reorderData = {
        cardOrders: reorderedCards.map((card, index) => ({
          cardId: card.id,
          order: index
        }))
      };

      await kanbanService.reorderCards(containerId, reorderData);
    } catch (error) {
      console.error('Error reordering cards:', error);
      throw error;
    }
  }, [state.cards]);

  // Toggle column activation
  const toggleColumnActivation = useCallback(async (columnId, isActive) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedColumn = await kanbanService.toggleColumnActivation(columnId, { isActive });
      
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
        mentions: [] // Extract mentions from text if needed
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
      const updatedComment = await kanbanService.updateComment(commentId, updates);
      
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
      await kanbanService.deleteComment(commentId);
      
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

  // Clear filters
  const clearFilters = useCallback(() => {
    dispatch({ 
      type: ACTIONS.SET_FILTERS, 
      payload: {
        labels: [],
        assignees: [],
        dueDate: null,
        priority: null,
        text: ''
      }
    });
  }, []);

  // Set search term
  const setSearchTerm = useCallback((searchTerm) => {
    dispatch({ type: ACTIONS.SET_SEARCH_TERM, payload: searchTerm });
  }, []);

  // Label management functions
  const createLabel = useCallback(async (labelData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const newLabel = await kanbanService.createLabel({
        ...labelData,
        createdBy: user.username
      });
      
      dispatch({ type: ACTIONS.ADD_LABEL, payload: newLabel });
      return newLabel;
    } catch (error) {
      console.error('Error creating label:', error);
      throw error;
    }
  }, [user]);

  const updateLabel = useCallback(async (labelId, updates) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedLabel = await kanbanService.updateLabel(labelId, {
        ...updates,
        updatedBy: user.username
      });
      
      dispatch({ type: ACTIONS.UPDATE_LABEL, payload: updatedLabel });
      return updatedLabel;
    } catch (error) {
      console.error('Error updating label:', error);
      throw error;
    }
  }, [user]);

  const deleteLabel = useCallback(async (labelId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await kanbanService.deleteLabel(labelId);
      dispatch({ type: ACTIONS.DELETE_LABEL, payload: labelId });
    } catch (error) {
      console.error('Error deleting label:', error);
      throw error;
    }
  }, [user]);

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
        card.labels?.some(label => state.filters.labels.includes(label.id || label))
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
    return filteredCards.filter(card => card.columnId === columnId && !card.subcolumnId);
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
    return false; // No loading state for now
  }, []);

  // Search cards
  const searchCards = useCallback(async (columnId, searchTerm, filters = {}) => {
    try {
      const params = {
        q: searchTerm,
        ...filters
      };
      
      if (columnId) {
        // If searching within a specific column, add column filter
        params.columnId = columnId;
      }
      
      const results = await kanbanService.searchCards(params);
      return Array.isArray(results) 
        ? results.map(card => kanbanService.transformCardData(card))
        : [];
    } catch (error) {
      console.error('Error searching cards:', error);
      return [];
    }
  }, []);

  // Removed column sorting functions - using Pragmatic DND only

  // Debug function to show card distribution
  const debugCardDistribution = useCallback(() => {
    console.log('=== KANBAN CARD DISTRIBUTION DEBUG ===');
    console.log('Total cards:', state.cards.length);
    console.log('Total columns:', state.columns.length);
    
    state.columns.forEach(column => {
      console.log(`\n--- Column: ${column.title} (${column.id}) ---`);
      console.log('Type:', column.type);
      console.log('Is Active:', column.isActive);
      console.log('Is Grouped:', column.isGrouped);
      
      if (column.isGrouped && column.subcolumns) {
        console.log('Subcolumns:', column.subcolumns.length);
        column.subcolumns.forEach(subcolumn => {
          const subcolumnCards = getCardsBySubcolumn(subcolumn.id);
          console.log(`  └─ Subcolumn: ${subcolumn.title} (${subcolumn.id})`);
          console.log(`     Cards: ${subcolumnCards.length}`);
          subcolumnCards.forEach((card, index) => {
            console.log(`       ${index + 1}. ${card.title} (${card.id})`);
          });
        });
      } else {
        const columnCards = getCardsByColumn(column.id);
        console.log(`Cards: ${columnCards.length}`);
        columnCards.forEach((card, index) => {
          console.log(`  ${index + 1}. ${card.title} (${card.id})`);
          if (card.subcolumnId) {
            console.log(`      └─ In subcolumn: ${card.subcolumnId}`);
          }
        });
      }
    });
    
    console.log('\n=== UNASSIGNED CARDS ===');
    const unassignedCards = state.cards.filter(card => !card.columnId);
    console.log('Unassigned cards:', unassignedCards.length);
    unassignedCards.forEach((card, index) => {
      console.log(`  ${index + 1}. ${card.title} (${card.id})`);
    });
    
    console.log('=== END DEBUG ===');
  }, [state.cards, state.columns, getCardsByColumn, getCardsBySubcolumn]);

  // Escape key handler - clear selections and close modals
  const handleEscape = useCallback(() => {
    // Clear any active filters or search
    if (state.searchTerm) {
      setSearchTerm('');
    }
    
    // Reset any column sorts to default
    // Removed columnSorts reset - using Pragmatic DND only
    
    // Clear filters if any are active
    const hasActiveFilters = Object.values(state.filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : filter
    );
    if (hasActiveFilters) {
      clearFilters();
    }
    
    // Dispatch custom event for other components to handle
    window.dispatchEvent(new CustomEvent('kanban:escape', {
      detail: { timestamp: Date.now() }
    }));
    
    console.log('Kanban escape handler executed');
    return true;
  }, [state.searchTerm, state.filters, clearFilters]);

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
    createLabel,
    updateLabel,
    deleteLabel,
    toggleColumnActivation,
    addComment,
    updateComment,
    deleteComment,
    setFilters,
    clearFilters,
    setSearchTerm,
    loadBoardData,
    refreshData,
    searchCards,
    
    // Computed values
    getFilteredCards,
    getCardsByColumn,
    getCardsBySubcolumn,
    getActiveColumns,
    isActivating,
    
    // Permissions (simplified - all authenticated users can do everything for now)
    canCreateCard: () => !!user,
    canEditCard: () => !!user,
    canMoveCard: () => !!user,
    canManageColumn: () => !!user,
    canToggleColumnActivation: () => !!user,
    canAssignUsers: () => !!user,
    canChangeDue: () => !!user,
    canChangeLabels: () => !!user,
    hasPermission: () => !!user
  };

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
};

// Hook to use the Kanban context
const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};

export { useKanban };