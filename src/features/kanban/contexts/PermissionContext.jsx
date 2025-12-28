/**
 * PermissionContext
 * Context for managing user permissions in Kanban board
 */

import React, { createContext, useContext, useMemo } from "react";
import {
    canPerformAction,
    hasPermission,
    PERMISSIONS,
    DESIGNATIONS,
    isAdmin,
    isLead,
    canManageColumnType,
} from "../utils/permissions";

// Permission Context
const PermissionContext = createContext();

// Permission Provider
export const PermissionProvider = ({ children, user }) => {
    const permissions = useMemo(() => {
        if (!user) {
            return {
                canViewBoard: false,
                canCreateCard: () => false,
                canEditCard: () => false,
                canMoveCard: () => false,
                canDeleteCard: () => false,
                canAssignUsers: false,
                canChangeDueDate: false,
                canChangeLabels: false,
                canManageColumns: () => false,
                canToggleColumnActivation: () => false,
                canAddComment: false,
                canMentionUsers: false,
            };
        }

        return {
            canViewBoard: canPerformAction(user, "VIEW_BOARD"),
            canCreateCard: (resource, context) =>
                canPerformAction(user, "CREATE_CARD", resource, context),
            canEditCard: (resource) =>
                canPerformAction(user, "EDIT_CARD", resource),
            canMoveCard: (resource, context) =>
                canPerformAction(user, "MOVE_CARD", resource, context),
            canDeleteCard: (resource) =>
                canPerformAction(user, "DELETE_CARD", resource),
            canAssignUsers: canPerformAction(user, "ASSIGN_USERS"),
            canChangeDueDate: canPerformAction(user, "CHANGE_DUE"),
            canChangeLabels: canPerformAction(user, "CHANGE_LABELS"),
            canManageColumns: (resource) =>
                canPerformAction(user, "MANAGE_COLUMNS", resource),
            canToggleColumnActivation: (columnType) =>
                canManageColumnType(user, columnType),
            canAddComment: canPerformAction(user, "COMMENT"),
            canMentionUsers: canPerformAction(user, "COMMENT"),
            canSearchCards: canPerformAction(user, "SEARCH_CARDS"),
            canViewActivity: canPerformAction(user, "VIEW_ACTIVITY"),
            isAdmin: isAdmin(user),
            isLead: isLead(user),
            designation: user.designation,
        };
    }, [user]);

    const value = {
        user,
        permissions,
        ...permissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

// Hook to use permissions
export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error(
            "usePermissions must be used within a PermissionProvider",
        );
    }
    return context;
};

export default PermissionContext;
