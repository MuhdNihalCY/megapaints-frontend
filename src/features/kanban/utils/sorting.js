/**
 * Sorting utilities for Kanban cards
 */

import { parseISO, isAfter, isBefore, isEqual } from 'date-fns';

// Sort options and their configurations
export const SORT_OPTIONS = {
  CUSTOM: {
    id: 'custom',
    label: 'Custom Order',
    description: 'Manual drag and drop order',
    icon: '↕️'
  },
  PRIORITY: {
    id: 'priority',
    label: 'Priority',
    description: 'Sort by priority (Urgent → High → Medium → Low)',
    icon: '⚡'
  },
  CREATED_DATE: {
    id: 'createdDate',
    label: 'Created Date',
    description: 'Sort by creation date',
    icon: '📅'
  },
  UPDATED_DATE: {
    id: 'updatedDate',
    label: 'Last Updated',
    description: 'Sort by last update date',
    icon: '🔄'
  },
  DUE_DATE: {
    id: 'dueDate',
    label: 'Due Date',
    description: 'Sort by due date',
    icon: '⏰'
  },
  TITLE: {
    id: 'title',
    label: 'Title',
    description: 'Sort alphabetically by title',
    icon: '🔤'
  },
  ASSIGNEES: {
    id: 'assignees',
    label: 'Assignees',
    description: 'Sort by number of assignees',
    icon: '👥'
  },
  LABELS: {
    id: 'labels',
    label: 'Labels',
    description: 'Sort by number of labels',
    icon: '🏷️'
  }
};

// Priority order for sorting
const PRIORITY_ORDER = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

/**
 * Get priority value for sorting
 */
const getPriorityValue = (priority) => {
  return PRIORITY_ORDER[priority] || 0;
};

/**
 * Parse date safely
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  try {
    return parseISO(dateString);
  } catch {
    return null;
  }
};

/**
 * Sort cards by priority (Urgent → High → Medium → Low)
 */
export const sortByPriority = (cards, direction = 'desc') => {
  return [...cards].sort((a, b) => {
    const aPriority = getPriorityValue(a.priority);
    const bPriority = getPriorityValue(b.priority);
    
    if (direction === 'asc') {
      return aPriority - bPriority;
    }
    return bPriority - aPriority;
  });
};

/**
 * Sort cards by creation date
 */
export const sortByCreatedDate = (cards, direction = 'desc') => {
  return [...cards].sort((a, b) => {
    const aDate = parseDate(a.createdAt);
    const bDate = parseDate(b.createdAt);
    
    if (!aDate && !bDate) return 0;
    if (!aDate) return direction === 'asc' ? -1 : 1;
    if (!bDate) return direction === 'asc' ? 1 : -1;
    
    if (direction === 'asc') {
      return isAfter(aDate, bDate) ? 1 : -1;
    }
    return isAfter(aDate, bDate) ? -1 : 1;
  });
};

/**
 * Sort cards by updated date
 */
export const sortByUpdatedDate = (cards, direction = 'desc') => {
  return [...cards].sort((a, b) => {
    const aDate = parseDate(a.updatedAt);
    const bDate = parseDate(b.updatedAt);
    
    if (!aDate && !bDate) return 0;
    if (!aDate) return direction === 'asc' ? -1 : 1;
    if (!bDate) return direction === 'asc' ? 1 : -1;
    
    if (direction === 'asc') {
      return isAfter(aDate, bDate) ? 1 : -1;
    }
    return isAfter(aDate, bDate) ? -1 : 1;
  });
};

/**
 * Sort cards by due date
 */
export const sortByDueDate = (cards, direction = 'asc') => {
  return [...cards].sort((a, b) => {
    const aDate = parseDate(a.dueDate);
    const bDate = parseDate(b.dueDate);
    
    // Cards without due dates go to the end
    if (!aDate && !bDate) return 0;
    if (!aDate) return direction === 'asc' ? 1 : -1;
    if (!bDate) return direction === 'asc' ? -1 : 1;
    
    if (direction === 'asc') {
      return isAfter(aDate, bDate) ? 1 : -1;
    }
    return isAfter(aDate, bDate) ? -1 : 1;
  });
};

/**
 * Sort cards by title alphabetically
 */
export const sortByTitle = (cards, direction = 'asc') => {
  return [...cards].sort((a, b) => {
    const aTitle = (a.title || '').toLowerCase();
    const bTitle = (b.title || '').toLowerCase();
    
    if (direction === 'asc') {
      return aTitle.localeCompare(bTitle);
    }
    return bTitle.localeCompare(aTitle);
  });
};

/**
 * Sort cards by number of assignees
 */
export const sortByAssignees = (cards, direction = 'desc') => {
  return [...cards].sort((a, b) => {
    const aCount = (a.assignees || []).length;
    const bCount = (b.assignees || []).length;
    
    if (direction === 'asc') {
      return aCount - bCount;
    }
    return bCount - aCount;
  });
};

/**
 * Sort cards by number of labels
 */
export const sortByLabels = (cards, direction = 'desc') => {
  return [...cards].sort((a, b) => {
    const aCount = (a.labels || []).length;
    const bCount = (b.labels || []).length;
    
    if (direction === 'asc') {
      return aCount - bCount;
    }
    return bCount - aCount;
  });
};

/**
 * Sort cards by custom order (position field)
 */
export const sortByCustomOrder = (cards, direction = 'asc') => {
  return [...cards].sort((a, b) => {
    const aPosition = a.position || 0;
    const bPosition = b.position || 0;
    
    if (direction === 'asc') {
      return aPosition - bPosition;
    }
    return bPosition - aPosition;
  });
};

/**
 * Main sorting function
 */
export const sortCards = (cards, sortOption, direction = 'desc') => {
  if (!cards || cards.length === 0) return cards;
  
  switch (sortOption) {
    case SORT_OPTIONS.PRIORITY.id:
      return sortByPriority(cards, direction);
    case SORT_OPTIONS.CREATED_DATE.id:
      return sortByCreatedDate(cards, direction);
    case SORT_OPTIONS.UPDATED_DATE.id:
      return sortByUpdatedDate(cards, direction);
    case SORT_OPTIONS.DUE_DATE.id:
      return sortByDueDate(cards, direction);
    case SORT_OPTIONS.TITLE.id:
      return sortByTitle(cards, direction);
    case SORT_OPTIONS.ASSIGNEES.id:
      return sortByAssignees(cards, direction);
    case SORT_OPTIONS.LABELS.id:
      return sortByLabels(cards, direction);
    case SORT_OPTIONS.CUSTOM.id:
    default:
      return sortByCustomOrder(cards, direction);
  }
};

/**
 * Get sort direction options for a given sort type
 */
export const getSortDirections = (sortOption) => {
  switch (sortOption) {
    case SORT_OPTIONS.PRIORITY.id:
    case SORT_OPTIONS.CREATED_DATE.id:
    case SORT_OPTIONS.UPDATED_DATE.id:
    case SORT_OPTIONS.ASSIGNEES.id:
    case SORT_OPTIONS.LABELS.id:
      return [
        { id: 'desc', label: 'High to Low', icon: '⬇️' },
        { id: 'asc', label: 'Low to High', icon: '⬆️' }
      ];
    case SORT_OPTIONS.DUE_DATE.id:
      return [
        { id: 'asc', label: 'Earliest First', icon: '⬆️' },
        { id: 'desc', label: 'Latest First', icon: '⬇️' }
      ];
    case SORT_OPTIONS.TITLE.id:
      return [
        { id: 'asc', label: 'A to Z', icon: '⬆️' },
        { id: 'desc', label: 'Z to A', icon: '⬇️' }
      ];
    case SORT_OPTIONS.CUSTOM.id:
    default:
      return [
        { id: 'asc', label: 'Manual Order', icon: '↕️' }
      ];
  }
};

/**
 * Get default sort option for a column type
 */
export const getDefaultSortOption = (columnType) => {
  switch (columnType) {
    case 'sales':
      return SORT_OPTIONS.CREATED_DATE.id;
    case 'office':
      return SORT_OPTIONS.PRIORITY.id;
    case 'production':
      return SORT_OPTIONS.PRIORITY.id;
    case 'ready':
      return SORT_OPTIONS.DUE_DATE.id;
    case 'drivers':
      return SORT_OPTIONS.DUE_DATE.id;
    case 'done':
      return SORT_OPTIONS.UPDATED_DATE.id;
    default:
      return SORT_OPTIONS.CUSTOM.id;
  }
};

/**
 * Check if a sort option is available for a column
 */
export const isSortOptionAvailable = (sortOption, columnType) => {
  // All sort options are available for all columns
  return true;
};
