/**
 * Kanban Board Permissions System
 * Role-based and attribute-based access control for the Kanban board
 */

import { PERMISSIONS, USER_ROLES, COLUMN_TYPES, DND_RESTRICTIONS, DONE_SUBCOLUMNS } from './constants';

/**
 * Permission matrix defining what each role can do
 */
const PERMISSION_MATRIX = {
  [USER_ROLES.SALES]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ],
  [USER_ROLES.SALES_LEAD]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ],
  [USER_ROLES.PRODUCTION]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ],
  [USER_ROLES.PRODUCTION_LEAD]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.MANAGE_COLUMNS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ],
  [USER_ROLES.DRIVER]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ],
  [USER_ROLES.DRIVER_LEAD]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.MANAGE_COLUMNS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ],
  [USER_ROLES.OFFICE]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ],
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.MANAGE_COLUMNS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.MENTION
  ]
};

/**
 * Column-specific permissions
 */
const COLUMN_PERMISSIONS = {
  [COLUMN_TYPES.SALES]: {
    createCard: [USER_ROLES.SALES, USER_ROLES.SALES_LEAD, USER_ROLES.ADMIN],
    editCard: [USER_ROLES.SALES, USER_ROLES.SALES_LEAD, USER_ROLES.ADMIN],
    manageColumn: [USER_ROLES.SALES_LEAD, USER_ROLES.ADMIN]
  },
  [COLUMN_TYPES.PRODUCTION]: {
    createCard: [USER_ROLES.PRODUCTION_LEAD, USER_ROLES.ADMIN],
    editCard: [USER_ROLES.PRODUCTION, USER_ROLES.PRODUCTION_LEAD, USER_ROLES.ADMIN],
    manageColumn: [USER_ROLES.PRODUCTION_LEAD, USER_ROLES.ADMIN]
  },
  [COLUMN_TYPES.DRIVERS]: {
    createCard: [USER_ROLES.DRIVER_LEAD, USER_ROLES.ADMIN],
    editCard: [USER_ROLES.DRIVER, USER_ROLES.DRIVER_LEAD, USER_ROLES.ADMIN],
    manageColumn: [USER_ROLES.DRIVER_LEAD, USER_ROLES.ADMIN]
  }
};

/**
 * Check if a user has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean} Whether the user has the permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const userPermissions = PERMISSION_MATRIX[userRole] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if a user can perform an action on a specific column
 * @param {string} userRole - The user's role
 * @param {string} columnType - The column type
 * @param {string} action - The action to perform
 * @returns {boolean} Whether the user can perform the action
 */
export const canPerformColumnAction = (userRole, columnType, action) => {
  if (!userRole || !columnType || !action) return false;
  
  const columnPermissions = COLUMN_PERMISSIONS[columnType];
  if (!columnPermissions) return true; // Default allow for columns without specific permissions
  
  const allowedRoles = columnPermissions[action];
  return allowedRoles ? allowedRoles.includes(userRole) : true;
};

/**
 * Check if a user can edit a specific card
 * @param {string} userRole - The user's role
 * @param {Object} card - The card object
 * @param {string} userId - The current user's ID
 * @returns {boolean} Whether the user can edit the card
 */
export const canEditCard = (userRole, card, userId) => {
  if (!card || !userRole) return false;
  
  // Admin can edit any card
  if (userRole === USER_ROLES.ADMIN) return true;
  
  // Creator can edit their own card
  if (card.createdBy === userId) return true;
  
  // Assignee can edit their assigned card
  if (card.assignees && card.assignees.includes(userId)) return true;
  
  // Check role-based permissions
  return hasPermission(userRole, PERMISSIONS.EDIT_CARD);
};

/**
 * Check if a user can move a card between columns
 * @param {string} userRole - The user's role
 * @param {string} fromColumn - Source column type
 * @param {string} toColumn - Destination column type
 * @returns {boolean} Whether the user can move the card
 */
export const canMoveCard = (userRole, fromColumn, toColumn) => {
  if (!userRole || !fromColumn || !toColumn) return false;
  
  // Check basic move permission
  if (!hasPermission(userRole, PERMISSIONS.MOVE_CARD)) return false;
  
  // Check DnD restrictions - cannot move from restricted source columns
  if (DND_RESTRICTIONS.RESTRICTED_SOURCE_COLUMNS.includes(fromColumn)) {
    return false;
  }
  
  // Check DnD restrictions - cannot move to restricted destination columns
  if (DND_RESTRICTIONS.RESTRICTED_COLUMNS.includes(toColumn)) {
    return false;
  }
  
  // Check if the move is allowed by DnD rules
  const allowedMoves = DND_RESTRICTIONS.ALLOWED_MOVES[fromColumn];
  if (allowedMoves && !allowedMoves.includes(toColumn)) {
    return false;
  }
  
  return true;
};

/**
 * Check if a user can create cards in a specific column or subcolumn
 * @param {string} userRole - The user's role
 * @param {string} columnType - The column type
 * @param {Object} subcolumn - The subcolumn object (optional)
 * @returns {boolean} Whether the user can create cards
 */
export const canCreateCard = (userRole, columnType, subcolumn = null) => {
  if (!userRole || !columnType) return false;
  
  // Check basic create permission
  if (!hasPermission(userRole, PERMISSIONS.CREATE_CARD)) return false;
  
  // For user subcolumns (Production/Drivers), allow creation if user has appropriate role
  if (subcolumn && subcolumn.type === 'user') {
    if (columnType === COLUMN_TYPES.PRODUCTION) {
      return [USER_ROLES.PRODUCTION, USER_ROLES.PRODUCTION_LEAD, USER_ROLES.ADMIN].includes(userRole);
    }
    if (columnType === COLUMN_TYPES.DRIVERS) {
      return [USER_ROLES.DRIVER, USER_ROLES.DRIVER_LEAD, USER_ROLES.ADMIN].includes(userRole);
    }
  }
  
  // Check column-specific permissions
  return canPerformColumnAction(userRole, columnType, 'createCard');
};

/**
 * Check if a user can manage a specific column
 * @param {string} userRole - The user's role
 * @param {string} columnType - The column type
 * @returns {boolean} Whether the user can manage the column
 */
export const canManageColumn = (userRole, columnType) => {
  if (!userRole || !columnType) return false;
  
  // Check basic manage permission
  if (!hasPermission(userRole, PERMISSIONS.MANAGE_COLUMNS)) return false;
  
  // Check column-specific permissions
  return canPerformColumnAction(userRole, columnType, 'manageColumn');
};

/**
 * Get all permissions for a user role
 * @param {string} userRole - The user's role
 * @returns {Array} Array of permissions the user has
 */
export const getUserPermissions = (userRole) => {
  if (!userRole) return [];
  return PERMISSION_MATRIX[userRole] || [];
};

/**
 * Check if a user can assign users to cards
 * @param {string} userRole - The user's role
 * @returns {boolean} Whether the user can assign users
 */
export const canAssignUsers = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.ASSIGN_USERS);
};

/**
 * Check if a user can change due dates
 * @param {string} userRole - The user's role
 * @returns {boolean} Whether the user can change due dates
 */
export const canChangeDue = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.CHANGE_DUE);
};

/**
 * Check if a user can change labels
 * @param {string} userRole - The user's role
 * @returns {boolean} Whether the user can change labels
 */
export const canChangeLabels = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.CHANGE_LABELS);
};

/**
 * Check if a user can comment
 * @param {string} userRole - The user's role
 * @returns {boolean} Whether the user can comment
 */
export const canComment = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.COMMENT);
};

/**
 * Check if a user can mention other users
 * @param {string} userRole - The user's role
 * @returns {boolean} Whether the user can mention users
 */
export const canMention = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.MENTION);
};

/**
 * Check if a user can toggle column activation for Production/Drivers user subcolumns
 * @param {string} userRole - The user's role
 * @param {string} columnType - The column type (production or drivers)
 * @returns {boolean} Whether the user can toggle column activation
 */
export const canToggleColumnActivation = (userRole, columnType) => {
  if (!userRole || !columnType) return false;
  
  // Check basic manage permission
  if (!hasPermission(userRole, PERMISSIONS.MANAGE_COLUMNS)) return false;
  
  // Only Production and Drivers columns support activation toggles
  if (columnType !== COLUMN_TYPES.PRODUCTION && columnType !== COLUMN_TYPES.DRIVERS) {
    return false;
  }
  
  // Check column-specific permissions
  return canPerformColumnAction(userRole, columnType, 'manageColumn');
};

// Re-export PERMISSIONS for use in other modules
export { PERMISSIONS };


