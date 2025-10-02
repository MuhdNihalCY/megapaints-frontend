/**
 * Permissions System
 * RBAC/ABAC implementation for Kanban board
 */

// Permission types
export const PERMISSIONS = {
  VIEW_BOARD: 'VIEW_BOARD',
  CREATE_CARD: 'CREATE_CARD',
  EDIT_CARD: 'EDIT_CARD',
  DELETE_CARD: 'DELETE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  MANAGE_COLUMNS: 'MANAGE_COLUMNS',
  COMMENT: 'COMMENT',
  ASSIGN_USERS: 'ASSIGN_USERS',
  CHANGE_DUE: 'CHANGE_DUE',
  CHANGE_LABELS: 'CHANGE_LABELS',
  SEARCH_CARDS: 'SEARCH_CARDS',
  VIEW_ACTIVITY: 'VIEW_ACTIVITY'
};

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  SALES_LEAD: 'saleslead',
  PRODUCTION_LEAD: 'productionlead',
  DRIVER_LEAD: 'driverlead',
  SALES: 'sales',
  PRODUCTION: 'production',
  DRIVER: 'driver',
  OFFICE: 'office'
};

// Permission matrix
const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.SALES_LEAD]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.MANAGE_COLUMNS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [ROLES.PRODUCTION_LEAD]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.MANAGE_COLUMNS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [ROLES.DRIVER_LEAD]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.MANAGE_COLUMNS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [ROLES.SALES]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [ROLES.PRODUCTION]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [ROLES.DRIVER]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [ROLES.OFFICE]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ]
};

/**
 * Check if user has permission
 */
export const hasPermission = (user, permission) => {
  console.log("user________________:", user);
  console.log("permission________________:", permission);
  if (!user || !user.role) return false;
  const userPermissions = PERMISSION_MATRIX[user.designation] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user can perform action
 */
export const canPerformAction = (user, action, resource = null) => {
  if (!user) return false;
  console.log("user________________:", user);
  console.log("action________________:", action);
  console.log("resource________________:", resource);
  switch (action) {
    case 'CREATE_CARD':
      return hasPermission(user, PERMISSIONS.CREATE_CARD) && 
            //  (resource?.type === 'sales' || resource?.id === 'sales');
            true;
    
    case 'EDIT_CARD':
      return hasPermission(user, PERMISSIONS.EDIT_CARD) ||
             resource?.createdBy === user.id ||
             resource?.assignees?.includes(user.id);
    
    case 'DELETE_CARD':
      return hasPermission(user, PERMISSIONS.DELETE_CARD) ||
             resource?.createdBy === user.id;
    
    case 'MOVE_CARD':
      return hasPermission(user, PERMISSIONS.MOVE_CARD);
    
    case 'MANAGE_COLUMNS':
      return hasPermission(user, PERMISSIONS.MANAGE_COLUMNS);
    
    case 'COMMENT':
      return hasPermission(user, PERMISSIONS.COMMENT);
    
    case 'ASSIGN_USERS':
      return hasPermission(user, PERMISSIONS.ASSIGN_USERS);
    
    case 'CHANGE_DUE':
      return hasPermission(user, PERMISSIONS.CHANGE_DUE);
    
    case 'CHANGE_LABELS':
      return hasPermission(user, PERMISSIONS.CHANGE_LABELS);
    
    case 'SEARCH_CARDS':
      return hasPermission(user, PERMISSIONS.SEARCH_CARDS);
    
    case 'VIEW_ACTIVITY':
      return hasPermission(user, PERMISSIONS.VIEW_ACTIVITY);
    
    default:
      return false;
  }
};

export default { PERMISSIONS, ROLES, hasPermission, canPerformAction };