/**
 * Custom Hooks for Kanban Board
 * Reusable hooks for common Kanban functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { format, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';
import { CARD_PRIORITIES, CARD_LABELS } from '../utils/constants';

/**
 * Hook for managing drag and drop functionality
 * @returns {Object} Drag and drop state and handlers
 */
export const useDragAndDrop = () => {
  const [draggedCard, setDraggedCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOverState] = useState(null);

  const startDrag = useCallback((card) => {
    setDraggedCard(card);
    setIsDragging(true);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedCard(null);
    setIsDragging(false);
    setDragOverState(null);
  }, []);

  const setDragOver = useCallback((target) => {
    setDragOverState(target);
  }, []);

  return {
    draggedCard,
    isDragging,
    dragOver,
    startDrag,
    endDrag,
    setDragOver
  };
};

/**
 * Hook for managing column activation
 * @param {Array} columns - Array of columns
 * @param {Function} toggleFunction - Function to toggle column activation
 * @returns {Object} Column activation state and handlers
 */
export const useColumnActivation = (columns, toggleFunction) => {
  const [activeColumns, setActiveColumns] = useState(columns.filter(col => col.isActive));

  const toggleColumn = useCallback((columnId) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      toggleFunction(columnId, !column.isActive);
      setActiveColumns(prev => 
        column.isActive 
          ? prev.filter(col => col.id !== columnId)
          : [...prev, column]
      );
    }
  }, [columns, toggleFunction]);

  return {
    activeColumns,
    toggleColumn
  };
};

/**
 * Hook for managing due date status
 * @param {string} dueDate - Due date string
 * @returns {Object} Due date status information
 */
export const useDueDateStatus = (dueDate) => {
  return useMemo(() => {
    if (!dueDate) {
      return {
        status: 'none',
        text: 'No due date',
        color: 'gray',
        isOverdue: false,
        isDueToday: false,
        isUpcoming: false
      };
    }

    const due = new Date(dueDate);
    const now = new Date();
    const today = startOfDay(now);
    const dueDay = startOfDay(due);

    const isOverdue = isBefore(due, today);
    const isDueToday = isEqual(dueDay, today);
    const isUpcoming = isAfter(due, today);

    let status, text, color;

    if (isOverdue) {
      status = 'overdue';
      text = `Overdue (${format(due, 'MMM dd')})`;
      color = 'red';
    } else if (isDueToday) {
      status = 'today';
      text = 'Due today';
      color = 'orange';
    } else if (isUpcoming) {
      status = 'upcoming';
      text = `Due ${format(due, 'MMM dd')}`;
      color = 'blue';
    }

    return {
      status,
      text,
      color,
      isOverdue,
      isDueToday,
      isUpcoming,
      formattedDate: format(due, 'MMM dd, yyyy')
    };
  }, [dueDate]);
};

/**
 * Hook for managing priority display
 * @param {string} priority - Priority level
 * @returns {Object} Priority display information
 */
export const usePriorityDisplay = (priority) => {
  return useMemo(() => {
    const priorityConfig = CARD_PRIORITIES[priority] || CARD_PRIORITIES.medium;
    
    return {
      level: priority || 'medium',
      label: priorityConfig.label,
      color: priorityConfig.color,
      icon: priorityConfig.icon,
      bgColor: priorityConfig.bgColor,
      textColor: priorityConfig.textColor
    };
  }, [priority]);
};

/**
 * Hook for managing labels display
 * @param {Array} labels - Array of label objects
 * @param {Array} availableLabels - Array of available labels
 * @returns {Object} Labels display information
 */
export const useLabelsDisplay = (labels, availableLabels = []) => {
  return useMemo(() => {
    if (!labels || labels.length === 0) {
      return {
        labels: [],
        hasLabels: false,
        labelCount: 0
      };
    }

    const labelInfo = labels.map(label => {
      const availableLabel = availableLabels.find(al => al.id === label.id);
      return {
        id: label.id,
        name: label.name || availableLabel?.name || 'Unknown',
        color: label.color || availableLabel?.color || '#6b7280',
        bgColor: `${label.color || availableLabel?.color || '#6b7280'}20`,
        textColor: label.color || availableLabel?.color || '#6b7280'
      };
    });

    return {
      labels: labelInfo,
      hasLabels: true,
      labelCount: labelInfo.length
    };
  }, [labels, availableLabels]);
};

/**
 * Hook for managing keyboard shortcuts
 * @param {Object} shortcuts - Object containing shortcut configurations
 * @returns {Object} Keyboard shortcut handlers
 */
export const useKeyboardShortcuts = (shortcuts) => {
  const [isEnabled, setIsEnabled] = useState(true);

  const handleKeyDown = useCallback((event) => {
    if (!isEnabled) return;

    const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
    const modifierKey = ctrlKey || metaKey;

    // Find matching shortcut
    const shortcut = Object.values(shortcuts).find(s => 
      s.key === key && 
      s.ctrlKey === modifierKey && 
      s.altKey === altKey && 
      s.shiftKey === shiftKey
    );

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts, isEnabled]);

  const enableShortcuts = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disableShortcuts = useCallback(() => {
    setIsEnabled(false);
  }, []);

  return {
    handleKeyDown,
    enableShortcuts,
    disableShortcuts,
    isEnabled
  };
};

/**
 * Hook for managing infinite scroll
 * @param {Function} loadMore - Function to load more data
 * @param {boolean} hasMore - Whether there's more data to load
 * @param {number} threshold - Scroll threshold in pixels
 * @returns {Object} Infinite scroll handlers
 */
export const useInfiniteScroll = (loadMore, hasMore, threshold = 100) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = useCallback((event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    
    if (scrollHeight - scrollTop <= clientHeight + threshold && hasMore && !isLoading) {
      setIsLoading(true);
      loadMore().finally(() => setIsLoading(false));
    }
  }, [loadMore, hasMore, isLoading, threshold]);

  return {
    handleScroll,
    isLoading
  };
};