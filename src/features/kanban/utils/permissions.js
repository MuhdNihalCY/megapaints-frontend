/**
 * Permissions System
 * RBAC/ABAC implementation for Kanban board based on user designation
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

// Designation definitions (based on user.designation field)
export const DESIGNATIONS = {
  ADMIN: 'admin',
  SALES_LEAD: 'saleslead',
  PRODUCTION_LEAD: 'productionlead',
  DRIVER_LEAD: 'driverlead',
  SALES: 'sales',
  PRODUCTION: 'production',
  DRIVER: 'driver',
  OFFICE: 'office'
};

// Permission matrix based on designation
const PERMISSION_MATRIX = {
  [DESIGNATIONS.ADMIN]: Object.values(PERMISSIONS),
  [DESIGNATIONS.SALES_LEAD]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.DELETE_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.MANAGE_COLUMNS,
    PERMISSIONS.COMMENT,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.CHANGE_DUE,
    PERMISSIONS.CHANGE_LABELS,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [DESIGNATIONS.PRODUCTION_LEAD]: [
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
  [DESIGNATIONS.DRIVER_LEAD]: [
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
  [DESIGNATIONS.SALES]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [DESIGNATIONS.PRODUCTION]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [DESIGNATIONS.DRIVER]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.EDIT_CARD,
    PERMISSIONS.MOVE_CARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ],
  [DESIGNATIONS.OFFICE]: [
    PERMISSIONS.VIEW_BOARD,
    PERMISSIONS.COMMENT,
    PERMISSIONS.SEARCH_CARDS,
    PERMISSIONS.VIEW_ACTIVITY
  ]
};

/**
 * Check if user has permission based on designation
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.designation) {
    return false;
  }
  
  const userPermissions = PERMISSION_MATRIX[user.designation] || [];
  const hasAccess = userPermissions.includes(permission);
  
  return hasAccess;
};

/**
 * Check if user can perform action with context-aware logic
 */
export const canPerformAction = (user, action, resource = null, context = {}) => {
  if (!user) {
    return false;
  }

  switch (action) {
    case 'CREATE_CARD':
      // Sales users can create cards in sales column
      if (user.designation === DESIGNATIONS.SALES) {
        return hasPermission(user, PERMISSIONS.CREATE_CARD);
      }
      // Sales leads and admins can create cards anywhere
      if (user.designation === DESIGNATIONS.SALES_LEAD || user.designation === DESIGNATIONS.ADMIN) {
        return hasPermission(user, PERMISSIONS.CREATE_CARD);
      }
      return false;
    
    case 'EDIT_CARD':
      // Check if user has edit permission
      if (hasPermission(user, PERMISSIONS.EDIT_CARD)) {
        return true;
      }
      // Allow card creator to edit their own cards
      if (resource?.createdBy === user._id) {
        return true;
      }
      // Allow assignees to edit cards assigned to them
      if (resource?.assignees?.includes(user._id)) {
        return true;
      }
      return false;
    
    case 'DELETE_CARD':
      // Check if user has delete permission
      if (hasPermission(user, PERMISSIONS.DELETE_CARD)) {
        return true;
      }
      // Allow card creator to delete their own cards
      if (resource?.createdBy === user._id) {
        return true;
      }
      return false;
    
    case 'MOVE_CARD':
      // Check if user has move permission
      if (!hasPermission(user, PERMISSIONS.MOVE_CARD)) {
        return false;
      }
      
      // Additional context checks for move restrictions
      if (context.fromColumn && context.toColumn) {
        // Restrict moves to/from < 7 Days and > 7 Days columns
        const restrictedColumns = ['less-than-7-days', 'more-than-7-days'];
        if (restrictedColumns.includes(context.fromColumn) || restrictedColumns.includes(context.toColumn)) {
          return false;
        }
      }
      
      return true;
    
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
    
    case 'VIEW_BOARD':
      return hasPermission(user, PERMISSIONS.VIEW_BOARD);
    
    default:
      return false;
  }
};

/**
 * Get user's permissions list
 */
export const getUserPermissions = (user) => {
  if (!user || !user.designation) {
    return [];
  }
  return PERMISSION_MATRIX[user.designation] || [];
};

/**
 * Check if user is admin
 */
export const isAdmin = (user) => {
  return user?.designation === DESIGNATIONS.ADMIN;
};

/**
 * Check if user is a lead (sales, production, or driver lead)
 */
export const isLead = (user) => {
  return [
    DESIGNATIONS.SALES_LEAD,
    DESIGNATIONS.PRODUCTION_LEAD,
    DESIGNATIONS.DRIVER_LEAD
  ].includes(user?.designation);
};

/**
 * Check if user can manage specific column type
 */
export const canManageColumnType = (user, columnType) => {
  if (isAdmin(user)) return true;
  
  switch (columnType) {
    case 'sales':
      return user.designation === DESIGNATIONS.SALES_LEAD;
    case 'production':
      return user.designation === DESIGNATIONS.PRODUCTION_LEAD;
    case 'drivers':
      return user.designation === DESIGNATIONS.DRIVER_LEAD;
    default:
      return false;
  }
};

export default { 
  PERMISSIONS, 
  DESIGNATIONS, 
  hasPermission, 
  canPerformAction, 
  getUserPermissions,
  isAdmin,
  isLead,
  canManageColumnType
};