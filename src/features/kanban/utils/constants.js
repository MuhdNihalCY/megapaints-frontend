/**
 * Kanban Board Constants
 * Central configuration for the entire Kanban system
 */

// Column Types and Configuration
export const COLUMN_TYPES = {
    SALES: "sales",
    OFFICE: "office",
    PRODUCTION: "production",
    READY: "ready",
    DRIVERS: "drivers",
    DONE: "done",
};

// Column Groups
export const COLUMN_GROUPS = {
    MAIN: "main", // Sales, Office
    GROUPED: "grouped", // Production, Ready, Drivers, Done
};

// Column Configuration
export const DEFAULT_COLUMNS = {
    [COLUMN_TYPES.SALES]: {
        id: "sales",
        name: "Sales",
        type: COLUMN_TYPES.SALES,
        group: COLUMN_GROUPS.MAIN,
        position: 0,
        isActive: true,
        canCreateCard: true,
        color: "#3B82F6",
        description: "New orders and sales opportunities",
    },
    [COLUMN_TYPES.OFFICE]: {
        id: "office",
        name: "Office",
        type: COLUMN_TYPES.OFFICE,
        group: COLUMN_GROUPS.MAIN,
        position: 1,
        isActive: true,
        canCreateCard: false,
        color: "#8B5CF6",
        description: "Office processing and administration",
    },
    [COLUMN_TYPES.PRODUCTION]: {
        id: "production",
        name: "Production",
        type: COLUMN_TYPES.PRODUCTION,
        group: COLUMN_GROUPS.GROUPED,
        position: 2,
        isActive: true,
        canCreateCard: false,
        color: "#F59E0B",
        description: "Production workflow by assigned users",
        hasSubColumns: true,
        subColumns: [], // Will be populated with user-specific columns
    },
    [COLUMN_TYPES.READY]: {
        id: "ready",
        name: "Ready",
        type: COLUMN_TYPES.READY,
        group: COLUMN_GROUPS.GROUPED,
        position: 3,
        isActive: true,
        canCreateCard: false,
        color: "#10B981",
        description: "Ready for dispatch or customer collection",
        hasSubColumns: true,
        subColumns: [
            { id: "ready-dispatch", name: "For Dispatch", position: 0 },
            {
                id: "ready-collection",
                name: "For Customer Collection",
                position: 1,
            },
        ],
    },
    [COLUMN_TYPES.DRIVERS]: {
        id: "drivers",
        name: "Drivers",
        type: COLUMN_TYPES.DRIVERS,
        group: COLUMN_GROUPS.GROUPED,
        position: 4,
        isActive: true,
        canCreateCard: false,
        color: "#EF4444",
        description: "Driver assignments and deliveries",
        hasSubColumns: true,
        subColumns: [], // Will be populated with driver-specific columns
    },
    [COLUMN_TYPES.DONE]: {
        id: "done",
        name: "Done",
        type: COLUMN_TYPES.DONE,
        group: COLUMN_GROUPS.GROUPED,
        position: 5,
        isActive: true,
        canCreateCard: false,
        color: "#6B7280",
        description: "Completed orders",
        hasSubColumns: true,
        subColumns: [
            { id: "done-today", name: "Done Today", position: 0 },
            {
                id: "done-less-7",
                name: "< 7 Days",
                position: 1,
                isRestricted: true,
            },
            {
                id: "done-more-7",
                name: "> 7 Days",
                position: 2,
                isRestricted: true,
                hasSearch: true,
            },
        ],
    },
};

// Card Priorities
export const CARD_PRIORITIES = {
    LOW: { id: "low", name: "Low", color: "#6B7280", order: 1 },
    MEDIUM: { id: "medium", name: "Medium", color: "#3B82F6", order: 2 },
    HIGH: { id: "high", name: "High", color: "#F59E0B", order: 3 },
    URGENT: { id: "urgent", name: "Urgent", color: "#EF4444", order: 4 },
};

// Card Labels
export const CARD_LABELS = {
    BUG: { id: "bug", name: "Bug", color: "#EF4444", textColor: "#FFFFFF" },
    FEATURE: {
        id: "feature",
        name: "Feature",
        color: "#3B82F6",
        textColor: "#FFFFFF",
    },
    TASK: { id: "task", name: "Task", color: "#10B981", textColor: "#FFFFFF" },
    URGENT: {
        id: "urgent",
        name: "Urgent",
        color: "#F59E0B",
        textColor: "#000000",
    },
    REVIEW: {
        id: "review",
        name: "Review",
        color: "#8B5CF6",
        textColor: "#FFFFFF",
    },
    BLOCKED: {
        id: "blocked",
        name: "Blocked",
        color: "#6B7280",
        textColor: "#FFFFFF",
    },
};

// Drag & Drop Rules
export const DRAG_DROP_RULES = {
    RESTRICTED_COLUMNS: ["done-less-7", "done-more-7"],
    ALLOWED_MOVES: {
        sales: ["office", "production", "ready", "drivers", "done-today"],
        office: ["sales", "production", "ready", "drivers", "done-today"],
        production: ["sales", "office", "ready", "drivers", "done-today"],
        ready: ["sales", "office", "production", "drivers", "done-today"],
        drivers: ["sales", "office", "production", "ready", "done-today"],
        "done-today": ["sales", "office", "production", "ready", "drivers"],
    },
};

// Activity Types
export const ACTIVITY_TYPES = {
    CARD_CREATED: "card_created",
    CARD_UPDATED: "card_updated",
    CARD_MOVED: "card_moved",
    CARD_DELETED: "card_deleted",
    CARD_ASSIGNED: "card_assigned",
    CARD_UNASSIGNED: "card_unassigned",
    LABEL_ADDED: "label_added",
    LABEL_REMOVED: "label_removed",
    DUE_DATE_CHANGED: "due_date_changed",
    PRIORITY_CHANGED: "priority_changed",
    COMMENT_ADDED: "comment_added",
    COMMENT_UPDATED: "comment_updated",
    COMMENT_DELETED: "comment_deleted",
    ATTACHMENT_ADDED: "attachment_added",
    ATTACHMENT_REMOVED: "attachment_removed",
    CHECKLIST_ITEM_ADDED: "checklist_item_added",
    CHECKLIST_ITEM_COMPLETED: "checklist_item_completed",
    CHECKLIST_ITEM_DELETED: "checklist_item_deleted",
    COLUMN_ACTIVATED: "column_activated",
    COLUMN_DEACTIVATED: "column_deactivated",
    COLUMN_RENAMED: "column_renamed",
    COLUMN_REORDERED: "column_reordered",
};

// API Endpoints
export const API_ENDPOINTS = {
    BOARDS: "/api/board",
    CARDS: "/api/card",
    COLUMNS: "/api/columns",
    COMMENTS: "/api/comment",
    LABELS: "/api/label",
    USERS: "/api/admin/users",
    ACTIVITIES: "/api/activity",
    SEARCH: "/api/search",
};

// UI Constants
export const UI_CONSTANTS = {
    CARD_MIN_HEIGHT: 80,
    CARD_MAX_HEIGHT: 200,
    COLUMN_MIN_WIDTH: 300,
    COLUMN_MAX_WIDTH: 400,
    MODAL_WIDTH: 600,
    MODAL_HEIGHT: 700,
    ANIMATION_DURATION: 200,
    DEBOUNCE_DELAY: 300,
    SEARCH_DELAY: 500,
};

// Form Validation Rules
export const VALIDATION_RULES = {
    CARD_TITLE: {
        minLength: 1,
        maxLength: 100,
        required: true,
    },
    CARD_DESCRIPTION: {
        maxLength: 1000,
        required: false,
    },
    COMMENT_TEXT: {
        minLength: 1,
        maxLength: 500,
        required: true,
    },
    COLUMN_NAME: {
        minLength: 1,
        maxLength: 50,
        required: true,
    },
};

// Error Messages
export const ERROR_MESSAGES = {
    PERMISSION_DENIED: "You do not have permission to perform this action",
    CARD_NOT_FOUND: "Card not found",
    COLUMN_NOT_FOUND: "Column not found",
    USER_NOT_FOUND: "User not found",
    INVALID_MOVE: "This move is not allowed",
    NETWORK_ERROR: "Network error. Please try again",
    VALIDATION_ERROR: "Please check your input and try again",
    UNAUTHORIZED: "You are not authorized to perform this action",
};

// Success Messages
export const SUCCESS_MESSAGES = {
    CARD_CREATED: "Card created successfully",
    CARD_UPDATED: "Card updated successfully",
    CARD_MOVED: "Card moved successfully",
    CARD_DELETED: "Card deleted successfully",
    COMMENT_ADDED: "Comment added successfully",
    COMMENT_UPDATED: "Comment updated successfully",
    COMMENT_DELETED: "Comment deleted successfully",
    COLUMN_ACTIVATED: "Column activated successfully",
    COLUMN_DEACTIVATED: "Column deactivated successfully",
};

// Local Storage Keys
export const STORAGE_KEYS = {
    KANBAN_FILTERS: "kanban_filters",
    KANBAN_COLUMNS: "kanban_columns",
    KANBAN_SETTINGS: "kanban_settings",
    USER_PREFERENCES: "kanban_user_preferences",
    DEBUG_MODE: "kanban_debug_mode",
};

// Feature Flags
export const FEATURE_FLAGS = {
    ENABLE_REAL_TIME: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_ANALYTICS: true,
    ENABLE_EXPORT: false,
    ENABLE_TEMPLATES: false,
    ENABLE_POWER_UPS: false,
    DEBUG_MODE: false,
};

// Default Values
export const DEFAULTS = {
    CARD_PRIORITY: CARD_PRIORITIES.MEDIUM.id,
    CARD_LABELS: [],
    CARD_ASSIGNEES: [],
    CARD_DUE_DATE: null,
    CARD_CHECKLIST: [],
    CARD_ATTACHMENTS: [],
    CARD_COMMENTS: [],
    PAGE_SIZE: 20,
    SEARCH_LIMIT: 50,
    ACTIVITY_LIMIT: 100,
};

export default {
    COLUMN_TYPES,
    COLUMN_GROUPS,
    DEFAULT_COLUMNS,
    CARD_PRIORITIES,
    CARD_LABELS,
    DRAG_DROP_RULES,
    ACTIVITY_TYPES,
    API_ENDPOINTS,
    UI_CONSTANTS,
    VALIDATION_RULES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    STORAGE_KEYS,
    FEATURE_FLAGS,
    DEFAULTS,
};
