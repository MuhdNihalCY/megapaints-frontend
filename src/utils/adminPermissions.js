/**
 * Admin Permissions - Frontend
 * Single source of truth for admin permission strings.
 * Must match backend/utils/adminPermissions.js
 */

export const ADMIN_PERMISSIONS = {
    BRANCHES_READ: "branches:read",
    BRANCHES_CREATE: "branches:create",
    BRANCHES_UPDATE: "branches:update",
    BRANCHES_DELETE: "branches:delete",
    USERS_READ: "users:read",
    USERS_CREATE: "users:create",
    USERS_UPDATE: "users:update",
    USERS_DELETE: "users:delete",
    PRODUCTS_READ: "products:read",
    PRODUCTS_CREATE: "products:create",
    PRODUCTS_UPDATE: "products:update",
    PRODUCTS_DELETE: "products:delete",
    ORDERS_READ: "orders:read",
    ORDERS_UPDATE: "orders:update",
    ORDERS_DELETE: "orders:delete",
    MIGRATION_READ: "migration:read",
    MIGRATION_EXECUTE: "migration:execute",
    BACKUP_CREATE: "backup:create",
    BACKUP_READ: "backup:read",
    BACKUP_DELETE: "backup:delete",
    BACKUP_IMPORT: "backup:import",
    BOARDS_CREATE: "boards:create",
    INVENTORY_READ: "inventory:read",
    INVENTORY_CREATE: "inventory:create",
    INVENTORY_UPDATE: "inventory:update",
    INVENTORY_DELETE: "inventory:delete",
    ANALYTICS_READ: "analytics:read",
    ANALYTICS_CREATE: "analytics:create",
    ANALYTICS_UPDATE: "analytics:update",
    ANALYTICS_DELETE: "analytics:delete",
    SETTINGS_READ: "settings:read",
    SETTINGS_CREATE: "settings:create",
    SETTINGS_UPDATE: "settings:update",
    SETTINGS_DELETE: "settings:delete",
};

/** All admin permission values (for user form and dropdowns) */
export const ALL_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSIONS);

/**
 * Check if user has an admin permission (client-side).
 * @param {Object} user - User object with permissions array
 * @param {string} permission - Permission string (use ADMIN_PERMISSIONS.*)
 * @returns {boolean}
 */
export function hasAdminPermission(user, permission) {
    return !!(user && (user.permissions || []).includes(permission));
}
