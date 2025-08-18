/**
 * Kanban Board Constants
 * Centralized configuration for the Kanban board system
 */

// Column Types
export const COLUMN_TYPES = {
  SALES: 'sales',
  OFFICE: 'office',
  PRODUCTION: 'production',
  READY: 'ready',
  DRIVERS: 'drivers',
  DONE: 'done'
};

// Column Groups
export const COLUMN_GROUPS = {
  NON_GROUPED: [COLUMN_TYPES.SALES, COLUMN_TYPES.OFFICE],
  GROUPED: [COLUMN_TYPES.PRODUCTION, COLUMN_TYPES.READY, COLUMN_TYPES.DRIVERS, COLUMN_TYPES.DONE]
};

// Ready Subcolumns
export const READY_SUBCOLUMNS = {
  FOR_DISPATCH: 'for-dispatch',
  FOR_CUSTOMER_COLLECTION: 'for-customer-collection'
};

// Done Subcolumns
export const DONE_SUBCOLUMNS = {
  DONE_TODAY: 'done-today',
  LESS_THAN_7_DAYS: 'less-than-7-days',
  MORE_THAN_7_DAYS: 'more-than-7-days'
};

// Card Priorities
export const CARD_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Card Labels
export const CARD_LABELS = {
  BUG: { id: 'bug', name: 'Bug', color: '#ef4444' },
  FEATURE: { id: 'feature', name: 'Feature', color: '#3b82f6' },
  IMPROVEMENT: { id: 'improvement', name: 'Improvement', color: '#10b981' },
  DOCUMENTATION: { id: 'documentation', name: 'Documentation', color: '#f59e0b' },
  URGENT: { id: 'urgent', name: 'Urgent', color: '#dc2626' },
  CUSTOMER: { id: 'customer', name: 'Customer', color: '#8b5cf6' }
};

// Default Column Configuration
export const DEFAULT_COLUMNS = {
  [COLUMN_TYPES.SALES]: {
    id: COLUMN_TYPES.SALES,
    title: 'Sales',
    type: COLUMN_TYPES.SALES,
    canCreateCards: true,
    isGrouped: false,
    order: 1
  },
  [COLUMN_TYPES.OFFICE]: {
    id: COLUMN_TYPES.OFFICE,
    title: 'Office',
    type: COLUMN_TYPES.OFFICE,
    canCreateCards: false,
    isGrouped: false,
    order: 2
  },
  [COLUMN_TYPES.PRODUCTION]: {
    id: COLUMN_TYPES.PRODUCTION,
    title: 'Production',
    type: COLUMN_TYPES.PRODUCTION,
    canCreateCards: false,
    isGrouped: true,
    order: 3,
    subcolumns: []
  },
  [COLUMN_TYPES.READY]: {
    id: COLUMN_TYPES.READY,
    title: 'Ready',
    type: COLUMN_TYPES.READY,
    canCreateCards: false,
    isGrouped: true,
    order: 4,
    subcolumns: [
      { id: READY_SUBCOLUMNS.FOR_DISPATCH, title: 'For Dispatch' },
      { id: READY_SUBCOLUMNS.FOR_CUSTOMER_COLLECTION, title: 'For Customer Collection' }
    ]
  },
  [COLUMN_TYPES.DRIVERS]: {
    id: COLUMN_TYPES.DRIVERS,
    title: 'Drivers',
    type: COLUMN_TYPES.DRIVERS,
    canCreateCards: false,
    isGrouped: true,
    order: 5,
    subcolumns: []
  },
  [COLUMN_TYPES.DONE]: {
    id: COLUMN_TYPES.DONE,
    title: 'Done',
    type: COLUMN_TYPES.DONE,
    canCreateCards: false,
    isGrouped: true,
    order: 6,
    subcolumns: [
      { id: DONE_SUBCOLUMNS.DONE_TODAY, title: 'Done Today' },
      { id: DONE_SUBCOLUMNS.LESS_THAN_7_DAYS, title: '< 7 Days' },
      { id: DONE_SUBCOLUMNS.MORE_THAN_7_DAYS, title: '> 7 Days' }
    ]
  }
};

// Drag & Drop Restrictions
export const DND_RESTRICTIONS = {
  RESTRICTED_COLUMNS: [DONE_SUBCOLUMNS.LESS_THAN_7_DAYS, DONE_SUBCOLUMNS.MORE_THAN_7_DAYS],
  ALLOWED_MOVES: {
    [COLUMN_TYPES.SALES]: [COLUMN_TYPES.OFFICE, COLUMN_TYPES.PRODUCTION, COLUMN_TYPES.READY, COLUMN_TYPES.DRIVERS],
    [COLUMN_TYPES.OFFICE]: [COLUMN_TYPES.SALES, COLUMN_TYPES.PRODUCTION, COLUMN_TYPES.READY, COLUMN_TYPES.DRIVERS],
    [COLUMN_TYPES.PRODUCTION]: [COLUMN_TYPES.SALES, COLUMN_TYPES.OFFICE, COLUMN_TYPES.READY, COLUMN_TYPES.DRIVERS],
    [COLUMN_TYPES.READY]: [COLUMN_TYPES.SALES, COLUMN_TYPES.OFFICE, COLUMN_TYPES.PRODUCTION, COLUMN_TYPES.DRIVERS],
    [COLUMN_TYPES.DRIVERS]: [COLUMN_TYPES.SALES, COLUMN_TYPES.OFFICE, COLUMN_TYPES.PRODUCTION, COLUMN_TYPES.READY]
  }
};

// Activity Log Types
export const ACTIVITY_TYPES = {
  CARD_CREATED: 'card_created',
  CARD_EDITED: 'card_edited',
  CARD_MOVED: 'card_moved',
  CARD_ASSIGNED: 'card_assigned',
  CARD_LABEL_CHANGED: 'card_label_changed',
  CARD_DUE_CHANGED: 'card_due_changed',
  CARD_ATTACHMENT_ADDED: 'card_attachment_added',
  CARD_ATTACHMENT_REMOVED: 'card_attachment_removed',
  COMMENT_ADDED: 'comment_added',
  COMMENT_EDITED: 'comment_edited',
  COMMENT_DELETED: 'comment_deleted',
  CHECKLIST_UPDATED: 'checklist_updated',
  TASK_UPDATED: 'task_updated',
  COLUMN_ACTIVATED: 'column_activated',
  COLUMN_DEACTIVATED: 'column_deactivated'
};

// Permission Types
export const PERMISSIONS = {
  VIEW_BOARD: 'view_board',
  CREATE_CARD: 'create_card',
  EDIT_CARD: 'edit_card',
  MOVE_CARD: 'move_card',
  ASSIGN_USERS: 'assign_users',
  CHANGE_DUE: 'change_due',
  CHANGE_LABELS: 'change_labels',
  MANAGE_COLUMNS: 'manage_columns',
  COMMENT: 'comment',
  MENTION: 'mention'
};

// User Roles
export const USER_ROLES = {
  SALES: 'sales',
  SALES_LEAD: 'sales_lead',
  PRODUCTION: 'production',
  PRODUCTION_LEAD: 'production_lead',
  DRIVER: 'driver',
  DRIVER_LEAD: 'driver_lead',
  OFFICE: 'office',
  ADMIN: 'admin'
};

// API Endpoints
export const API_ENDPOINTS = {
  KANBAN: '/v2/board',
  CARDS: '/v2/board/cards',
  COLUMNS: '/v2/board/columns',
  COMMENTS: '/v2/board/comments',
  ACTIVITY: '/v2/board/activity',
  USERS: '/v2/users'
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


