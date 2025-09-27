/**
 * Kanban Board Constants
 * Configuration for the Kanban board system with API integration
 */

// Column Types (for mapping API data)
export const COLUMN_TYPES = {
  SALES: 'sales',
  OFFICE: 'office',
  PRODUCTION: 'production',
  READY: 'ready',
  DRIVERS: 'drivers',
  DONE: 'done'
};

// Card Priorities
export const CARD_PRIORITIES = {
  low: {
    label: 'Low',
    color: '#6b7280',
    icon: '⬇️',
    bgColor: '#f3f4f6',
    textColor: '#374151'
  },
  medium: {
    label: 'Medium',
    color: '#3b82f6',
    icon: '➡️',
    bgColor: '#dbeafe',
    textColor: '#1e40af'
  },
  high: {
    label: 'High',
    color: '#f59e0b',
    icon: '⬆️',
    bgColor: '#fef3c7',
    textColor: '#92400e'
  },
  urgent: {
    label: 'Urgent',
    color: '#ef4444',
    icon: '🚨',
    bgColor: '#fee2e2',
    textColor: '#991b1b'
  }
};

// Activity Types (for logging)
export const ACTIVITY_TYPES = {
  CARD_CREATED: 'card_created',
  CARD_EDITED: 'card_edited',
  CARD_MOVED: 'card_moved',
  CARD_ASSIGNED: 'card_assigned',
  CARD_LABEL_CHANGED: 'card_label_changed',
  COMMENT_ADDED: 'comment_added',
  COMMENT_EDITED: 'comment_edited',
  COMMENT_DELETED: 'comment_deleted'
};

// UI Constants
export const UI_CONSTANTS = {
  CARD_MIN_HEIGHT: 80,
  COLUMN_MIN_WIDTH: 280,
  COLUMN_MAX_WIDTH: 400,
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 200
};


