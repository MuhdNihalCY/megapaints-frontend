/**
 * Custom Hooks for Kanban Board
 * Reusable hooks for common Kanban functionality
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { format, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';
import { CARD_PRIORITIES, CARD_LABELS, UI_CONSTANTS } from '../utils/constants';

/**
 * Hook for managing card search functionality
 * @param {Function} searchFunction - Function to perform search
 * @param {number} debounceMs - Debounce delay in milliseconds
 * @returns {Object} Search state and handlers
 */
export const useCardSearch = (searchFunction, debounceMs = UI_CONSTANTS.SEARCH_DEBOUNCE_MS) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Simple debounced search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchFunction(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchFunction, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    clearSearch
  };
};

/**
 * Hook for managing card filters
 * @param {Array} cards - Array of cards to filter
 * @returns {Object} Filter state and filtered cards
 */
export const useCardFilters = (cards) => {
  const [filters, setFilters] = useState({
    labels: [],
    assignees: [],
    dueDate: null,
    priority: null,
    text: ''
  });

  const filteredCards = useMemo(() => {
    let filtered = cards;

    // Text filter
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      filtered = filtered.filter(card =>
        card.title.toLowerCase().includes(searchText) ||
        card.description?.toLowerCase().includes(searchText)
      );
    }

    // Label filter
    if (filters.labels.length > 0) {
      filtered = filtered.filter(card =>
        card.labels?.some(label => filters.labels.includes(label))
      );
    }

    // Assignee filter
    if (filters.assignees.length > 0) {
      filtered = filtered.filter(card =>
        card.assignees?.some(assignee => filters.assignees.includes(assignee))
      );
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(card => card.priority === filters.priority);
    }

    // Due date filter
    if (filters.dueDate) {
      const filterDate = new Date(filters.dueDate);
      filtered = filtered.filter(card => {
        if (!card.dueDate) return false;
        const cardDate = new Date(card.dueDate);
        return cardDate.toDateString() === filterDate.toDateString();
      });
    }

    return filtered;
  }, [cards, filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      labels: [],
      assignees: [],
      dueDate: null,
      priority: null,
      text: ''
    });
  }, []);

  return {
    filters,
    filteredCards,
    updateFilter,
    clearFilters
  };
};

/**
 * Hook for managing drag and drop state
 * @returns {Object} Drag and drop state and handlers
 */
export const useDragAndDrop = () => {
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((card) => {
    setDraggedCard(card);
    setIsDragging(true);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedCard(null);
    setDragOverColumn(null);
    setIsDragging(false);
  }, []);

  const setDragOver = useCallback((columnId) => {
    setDragOverColumn(columnId);
  }, []);

  return {
    draggedCard,
    dragOverColumn,
    isDragging,
    startDrag,
    endDrag,
    setDragOver
  };
};



/**
 * Hook for managing column activation toggles
 * @param {Array} columns - Array of columns
 * @param {Function} toggleFunction - Function to toggle column activation
 * @returns {Object} Column activation state and handlers
 */
export const useColumnActivation = (columns, toggleFunction) => {
  const [activatingColumns, setActivatingColumns] = useState(new Set());

  const toggleColumn = useCallback(async (columnId, isActive) => {
    setActivatingColumns(prev => new Set(prev).add(columnId));
    
    try {
      await toggleFunction(columnId, isActive);
    } catch (error) {
      console.error('Error toggling column:', error);
    } finally {
      setActivatingColumns(prev => {
        const newSet = new Set(prev);
        newSet.delete(columnId);
        return newSet;
      });
    }
  }, [toggleFunction]);

  const isActivating = useCallback((columnId) => {
    return activatingColumns.has(columnId);
  }, [activatingColumns]);

  return {
    toggleColumn,
    isActivating
  };
};

/**
 * Hook for managing card due date status
 * @param {string} dueDate - Card due date
 * @returns {Object} Due date status and formatted date
 */
export const useDueDateStatus = (dueDate) => {
  const status = useMemo(() => {
    if (!dueDate) return { status: 'none', label: 'No due date' };

    const date = new Date(dueDate);
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const nextWeek = startOfDay(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    // Check if overdue
    if (isBefore(date, today)) {
      return { status: 'overdue', label: 'Overdue', color: 'text-red-600' };
    }

    // Check if due today
    if (isEqual(startOfDay(date), today)) {
      return { status: 'today', label: 'Due today', color: 'text-orange-600' };
    }

    // Check if due tomorrow
    if (isEqual(startOfDay(date), tomorrow)) {
      return { status: 'tomorrow', label: 'Due tomorrow', color: 'text-yellow-600' };
    }

    // Check if due this week
    if (isBefore(date, nextWeek)) {
      return { status: 'this-week', label: 'Due this week', color: 'text-blue-600' };
    }

    return { status: 'future', label: 'Due later', color: 'text-gray-600' };
  }, [dueDate]);

  const formattedDate = useMemo(() => {
    if (!dueDate) return '';
    return format(new Date(dueDate), 'MMM dd, yyyy');
  }, [dueDate]);

  return {
    ...status,
    formattedDate
  };
};

/**
 * Hook for managing card priority display
 * @param {string} priority - Card priority
 * @returns {Object} Priority display information
 */
export const usePriorityDisplay = (priority) => {
  const priorityInfo = useMemo(() => {
    switch (priority) {
      case CARD_PRIORITIES.URGENT:
        return {
          label: 'Urgent',
          color: 'bg-red-500',
          textColor: 'text-red-600',
          icon: '🔥'
        };
      case CARD_PRIORITIES.HIGH:
        return {
          label: 'High',
          color: 'bg-orange-500',
          textColor: 'text-orange-600',
          icon: '⚡'
        };
      case CARD_PRIORITIES.MEDIUM:
        return {
          label: 'Medium',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          icon: '📌'
        };
      case CARD_PRIORITIES.LOW:
        return {
          label: 'Low',
          color: 'bg-green-500',
          textColor: 'text-green-600',
          icon: '📋'
        };
      default:
        return {
          label: 'None',
          color: 'bg-gray-500',
          textColor: 'text-gray-600',
          icon: '📄'
        };
    }
  }, [priority]);

  return priorityInfo;
};

/**
 * Hook for managing card labels display
 * @param {Array} labels - Card labels
 * @returns {Object} Labels display information
 */
export const useLabelsDisplay = (labels) => {
  const labelInfo = useMemo(() => {
    if (!labels || labels.length === 0) {
      return { labels: [], hasLabels: false };
    }

    const labelObjects = labels.map(labelId => {
      const label = Object.values(CARD_LABELS).find(l => l.id === labelId);
      return label || { id: labelId, name: labelId, color: '#6b7280' };
    });

    return {
      labels: labelObjects,
      hasLabels: true
    };
  }, [labels]);

  return labelInfo;
};

/**
 * Hook for managing keyboard shortcuts
 * @param {Object} shortcuts - Object mapping keys to functions
 * @returns {void}
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, ctrlKey, shiftKey, altKey } = event;
      
      // Check for matching shortcuts
      Object.entries(shortcuts).forEach(([keyCombo, handler]) => {
        const [shortcutKey, modifiers] = keyCombo.split('+');
        
        let matches = key.toLowerCase() === shortcutKey.toLowerCase();
        
        if (modifiers) {
          const modifierList = modifiers.split(',');
          matches = matches && 
            (!modifierList.includes('ctrl') || ctrlKey) &&
            (!modifierList.includes('shift') || shiftKey) &&
            (!modifierList.includes('alt') || altKey);
        }
        
        if (matches) {
          event.preventDefault();
          handler(event);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Hook for managing infinite scroll
 * @param {Function} loadMore - Function to load more data
 * @param {boolean} hasMore - Whether there's more data to load
 * @param {number} threshold - Distance from bottom to trigger load
 * @returns {Object} Infinite scroll state and ref
 */
export const useInfiniteScroll = (loadMore, hasMore, threshold = 100) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = useCallback(async (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    
    if (scrollHeight - scrollTop - clientHeight < threshold && hasMore && !isLoading) {
      setIsLoading(true);
      try {
        await loadMore();
      } finally {
        setIsLoading(false);
      }
    }
  }, [loadMore, hasMore, isLoading, threshold]);

  return {
    isLoading,
    handleScroll
  };
};
