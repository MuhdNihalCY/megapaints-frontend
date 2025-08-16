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
  canCreateCard as canCreateCardPermission, 
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
  SET_LABELS: 'SET_LABELS',
  ADD_LABEL: 'ADD_LABEL',
  UPDATE_LABEL: 'UPDATE_LABEL',
  DELETE_LABEL: 'DELETE_LABEL',
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

/**
 * Generate dynamic subcolumns based on user designations
 * @param {Array} users - Array of users
 * @returns {Object} Updated columns with dynamic subcolumns
 */
const generateDynamicColumns = (users) => {
  const columns = Object.values(DEFAULT_COLUMNS);
  
  // Ensure users is an array
  if (!Array.isArray(users)) {
    console.warn('generateDynamicColumns: users is not an array:', users);
    return columns;
  }
  
  // Debug: Log all user designations
  console.log('All user designations:', users.map(user => ({
    id: user.id,
    name: user.name,
    username: user.username,
    designation: user.designation,
    role: user.role,
    allKeys: Object.keys(user)
  })));
  
  // Debug: Show all possible field values that might indicate user type
  console.log('User field analysis:', users.map(user => ({
    id: user.id,
    name: user.name,
    designation: user.designation,
    role: user.role,
    department: user.department,
    position: user.position,
    jobTitle: user.jobTitle,
    title: user.title,
    type: user.type,
    category: user.category
  })));
  
  // Helper function to check if user is of a specific type
  const isUserOfType = (user, type) => {
    if (!user) return false;
    
    const typeLower = type.toLowerCase();
    const fieldsToCheck = [
      user.designation,
      user.role,
      user.department,
      user.position,
      user.jobTitle,
      user.title,
      user.type,
      user.category
    ];
    
    return fieldsToCheck.some(field => 
      field && field.toLowerCase().includes(typeLower)
    );
  };
  
  // Filter users by designation or role
  const productionUsers = users.filter(user => isUserOfType(user, 'production'));
  const driverUsers = users.filter(user => isUserOfType(user, 'driver'));
  
  console.log('Filtered users:', {
    productionUsers: productionUsers.map(u => ({ id: u.id, name: u.name, designation: u.designation })),
    driverUsers: driverUsers.map(u => ({ id: u.id, name: u.name, designation: u.designation }))
  });

  // Debug logging for dynamic column generation
  if (process.env.NODE_ENV === 'development') {
    console.log('Generating dynamic columns:', {
      totalUsers: users.length,
      productionUsersCount: productionUsers.length,
      driverUsersCount: driverUsers.length,
      productionUsersList: productionUsers.map(u => ({ id: u.id, name: u.name, username: u.username, designation: u.designation })),
      driverUsersList: driverUsers.map(u => ({ id: u.id, name: u.name, username: u.username, designation: u.designation }))
    });
  }

  // Debug: Log all columns and their types
  console.log('All columns before update:', columns.map(col => ({ id: col.id, type: col.type, title: col.title })));
  console.log('Looking for columns with types:', { production: COLUMN_TYPES.PRODUCTION, drivers: COLUMN_TYPES.DRIVERS });
  console.log('COLUMN_TYPES values:', COLUMN_TYPES);

  // Update Production column with user subcolumns
  const productionColumn = columns.find(col => col.type === COLUMN_TYPES.PRODUCTION);
  if (productionColumn) {
    productionColumn.subcolumns = productionUsers.map(user => ({
      id: `production-${user.id}`,
      title: user.name || user.username,
      userId: user.id,
      type: 'user'
    }));
    // Mark as grouped if there are subcolumns
    if (productionColumn.subcolumns.length > 0) {
      productionColumn.isGrouped = true;
    }
    console.log('Production column updated:', {
      columnId: productionColumn.id,
      type: productionColumn.type,
      subcolumnsCount: productionColumn.subcolumns.length,
      isGrouped: productionColumn.isGrouped,
      subcolumns: productionColumn.subcolumns
    });
  } else {
    console.warn('Production column not found in columns:', columns.map(col => ({ id: col.id, type: col.type })));
  }

  // Update Drivers column with user subcolumns
  const driversColumn = columns.find(col => col.type === COLUMN_TYPES.DRIVERS);
  if (driversColumn) {
    driversColumn.subcolumns = driverUsers.map(user => ({
      id: `driver-${user.id}`,
      title: user.name || user.username,
      userId: user.id,
      type: 'user'
    }));
    // Mark as grouped if there are subcolumns
    if (driversColumn.subcolumns.length > 0) {
      driversColumn.isGrouped = true;
    }
    console.log('Drivers column updated:', {
      columnId: driversColumn.id,
      type: driversColumn.type,
      subcolumnsCount: driversColumn.subcolumns.length,
      isGrouped: driversColumn.isGrouped,
      subcolumns: driversColumn.subcolumns
    });
  } else {
    console.warn('Drivers column not found in columns:', columns.map(col => ({ id: col.id, type: col.type })));
  }

  // Debug logging for generated columns
  if (process.env.NODE_ENV === 'development') {
    console.log('Generated columns:', columns.map(col => ({
      type: col.type,
      title: col.title,
      subcolumnsCount: col.subcolumns ? col.subcolumns.length : 0,
      subcolumns: col.subcolumns
    })));
  }

  return columns;
};

// Initial state
const getInitialColumns = () => {
  return Object.values(DEFAULT_COLUMNS);
};

const initialState = {
  loading: true,
  error: null,
  cards: [],
  columns: getInitialColumns(),
  users: [],
  labels: [], // Dynamic labels created by users
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
      // Preserve dynamic subcolumns from state if they exist
      let updatedColumns = action.payload.columns || state.columns || Object.values(DEFAULT_COLUMNS);
      
      console.log('SET_BOARD_DATA - Initial columns:', updatedColumns.map(col => ({ id: col.id, type: col.type, subcolumnsCount: col.subcolumns ? col.subcolumns.length : 0 })));
      console.log('SET_BOARD_DATA - State users count:', state.users ? state.users.length : 0);
      
      // If we have dynamic columns in state, merge them with board data
      if (state.columns && state.users && state.users.length > 0) {
        console.log('SET_BOARD_DATA - Regenerating dynamic columns');
        const dynamicColumns = generateDynamicColumns(state.users);
        updatedColumns = updatedColumns.map(boardColumn => {
          const dynamicColumn = dynamicColumns.find(dc => dc.id === boardColumn.id);
          if (dynamicColumn && dynamicColumn.subcolumns && dynamicColumn.subcolumns.length > 0) {
            console.log(`SET_BOARD_DATA - Merging subcolumns for ${boardColumn.id}:`, dynamicColumn.subcolumns.length);
            return { ...boardColumn, subcolumns: dynamicColumn.subcolumns };
          }
          return boardColumn;
        });
      }
      
      console.log('SET_BOARD_DATA - Final columns:', updatedColumns.map(col => ({ id: col.id, type: col.type, subcolumnsCount: col.subcolumns ? col.subcolumns.length : 0 })));
      
      return {
        ...state,
        cards: action.payload.cards || [],
        columns: updatedColumns,
        loading: false,
        error: null
      };

    case ACTIONS.SET_CARDS:
      return { ...state, cards: action.payload };

    case ACTIONS.SET_COLUMNS:
      return { ...state, columns: action.payload };

    case ACTIONS.SET_USERS:
      try {
        const processedUsers = action.payload || [];
        const dynamicColumns = generateDynamicColumns(processedUsers);
        return { 
          ...state, 
          users: processedUsers,
          columns: dynamicColumns
        };
      } catch (error) {
        console.error('Error generating dynamic columns:', error);
        return { 
          ...state, 
          users: action.payload || [],
          columns: Object.values(DEFAULT_COLUMNS)
        };
      }

    case ACTIONS.SET_LABELS:
      return { ...state, labels: action.payload || [] };

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
      
      // Load users first to generate dynamic columns
      let users = await kanbanService.getUsers();
      
      // Handle different response formats
      if (users && typeof users === 'object' && !Array.isArray(users)) {
        // If users is an object, try to extract the array
        if (users.users && Array.isArray(users.users)) {
          users = users.users;
        } else if (users.data && Array.isArray(users.data)) {
          users = users.data;
        } else if (users.results && Array.isArray(users.results)) {
          users = users.results;
        } else {
          console.warn('Users data is not in expected format:', users);
          users = [];
        }
      }
      
      // Ensure users is an array
      if (!Array.isArray(users)) {
        console.warn('Users is not an array after processing:', users);
        users = [];
      }
      
      // If no users found, provide some mock data for testing
      if (users.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('No users found, using mock data for testing');
        users = [
          // Production Users
          { id: '1', name: 'John Production', username: 'john.prod', designation: 'Production' },
          { id: '2', name: 'Jane Production', username: 'jane.prod', designation: 'Production' },
          { id: '3', name: 'Bob Production', username: 'bob.prod', designation: 'Production' },
          { id: '4', name: 'Alice Production', username: 'alice.prod', designation: 'Production' },
          // Driver Users
          { id: '5', name: 'Mike Driver', username: 'mike.driver', designation: 'Driver' },
          { id: '6', name: 'Sarah Driver', username: 'sarah.driver', designation: 'Driver' },
          { id: '7', name: 'Tom Driver', username: 'tom.driver', designation: 'Driver' },
          { id: '8', name: 'Lisa Driver', username: 'lisa.driver', designation: 'Driver' },
          // Other Users (for testing)
          { id: '9', name: 'Admin User', username: 'admin', designation: 'Admin' },
          { id: '10', name: 'Sales User', username: 'sales', designation: 'Sales' }
        ];
      }
      

      
        // Debug logging for user data structure
  if (process.env.NODE_ENV === 'development') {
    console.log('Users data processed:', {
      type: typeof users,
      isArray: Array.isArray(users),
      length: users?.length,
      data: users
    });
    
    // Log the first few users to see their structure
    if (users && users.length > 0) {
      console.log('Sample users:', users.slice(0, 3).map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        designation: user.designation,
        role: user.role,
        allKeys: Object.keys(user)
      })));
    }
  }
      
      dispatch({ type: ACTIONS.SET_USERS, payload: users });
      
      // Then load board data and labels
      const [boardData, labels] = await Promise.all([
        kanbanService.getBoard(),
        kanbanService.getLabels()
      ]);
      
      dispatch({ type: ACTIONS.SET_BOARD_DATA, payload: boardData });
      dispatch({ type: ACTIONS.SET_LABELS, payload: labels });
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

  // Get user subcolumns for a specific column type
  const getUserSubcolumns = useCallback((columnType) => {
    const column = state.columns.find(col => col.type === columnType);
    if (!column || !column.subcolumns) return [];
    
    return column.subcolumns.filter(subcol => subcol.type === 'user');
  }, [state.columns]);

  // Get user by subcolumn ID
  const getUserBySubcolumnId = useCallback((subcolumnId) => {
    const userId = subcolumnId.replace(/^(production|driver)-/, '');
    return state.users.find(user => user.id === userId);
  }, [state.users]);

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
    createLabel,
    updateLabel,
    deleteLabel,
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
    getUserSubcolumns,
    getUserBySubcolumnId,
    getActiveColumns,
    isActivating,
    
    // Permissions
    canCreateCard: (columnId, subcolumn = null) => {
      const column = state.columns.find(col => col.id === columnId);
      return canCreateCardPermission(user?.role, column?.type, subcolumn);
    },
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
const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};

export { useKanban };

