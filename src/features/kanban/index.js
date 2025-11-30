/**
 * Kanban Board System - Main Exports
 * Central export file for all Kanban components and utilities
 */

// Main Components
export { default as KanbanBoard } from './components/board/KanbanBoard';
export { default as KanbanColumn } from './components/columns/KanbanColumn';
export { default as KanbanCard } from './components/cards/KanbanCard';
export { default as PragmaticKanbanCard } from './components/cards/PragmaticKanbanCard';
export { default as BoardHeader } from './components/board/BoardHeader';
export { default as BoardStats } from './components/board/BoardStats';
export { default as ColumnHeader } from './components/columns/ColumnHeader';
export { default as FiltersPanel } from './components/ui/FiltersPanel';
export { default as CreateCardButton } from './components/ui/CreateCardButton';
export { default as HelpPanel } from './components/ui/HelpPanel';
export { default as KeyboardShortcuts } from './components/ui/KeyboardShortcuts';
export { default as KeyboardShortcutsHelp } from './components/ui/KeyboardShortcutsHelp';
export { default as LabelManager } from './components/ui/LabelManager';
export { default as ColumnSearch } from './components/search/ColumnSearch';

// New Trello-style Components
export { default as TrelloCardModal } from './components/cards/TrelloCardModal';
export { default as TrelloCardFront } from './components/cards/TrelloCardFront';
export { default as TrelloAttachments } from './components/cards/TrelloAttachments';
export { default as TrelloChecklist } from './components/cards/TrelloChecklist';
export { default as CustomFieldsManager } from './components/cards/CustomFieldsManager';

// Common Components
export { default as ErrorBoundary } from './components/common/ErrorBoundary';
export { default as LoadingSpinner, CardSkeleton, ColumnSkeleton, BoardSkeleton, LoadingStates } from './components/common/LoadingSpinner';
export { default as ApiStatusNotification } from './components/common/ApiStatusNotification';
export { default as AuthGuard } from './components/common/AuthGuard';

// Activity and Comments
export { default as ActivityLog } from './components/activity/ActivityLog';
export { default as CommentsSection } from './components/comments/CommentsSection';

// Notifications
export { default as NotificationPanel } from './components/notifications/NotificationPanel';
export { default as NotificationBell } from './components/notifications/NotificationBell';

// Customer Management - Now in components/customer
export { default as CustomerDropdown } from '../../components/customer/CustomerDropdown';
export { default as CustomerManagementModal } from '../../components/customer/CustomerManagementModal';
export { default as CustomerManagementButton } from '../../components/customer/CustomerManagementButton';
export { default as CustomerFollowupModal } from '../../components/customer/CustomerFollowupModal';

// Contexts
export { KanbanProvider, useKanban } from './contexts/KanbanContext';
export { PermissionProvider, usePermissions } from './contexts/PermissionContext';
export { NotificationProvider, useNotifications } from './contexts/NotificationContext';

// Hooks
export { default as useCardModal } from './hooks/useCardModal';
export { default as useDragDrop } from './hooks/useDragDrop';
export { useSafeNotifications } from './hooks/useSafeNotifications';

// Services
export { default as kanbanService } from './services/kanbanService';
export { default as MockKanbanService, mockUsers, mockCards, mockColumns, mockLabels, mockActivities } from './services/mockData';

// Utils
export * from './utils/constants';
export * from './utils/permissions';
export * from './utils/dragDropRules';
export * from './utils/activityLogger';
export * from './utils/cardTitleUtils';

// Types
export * from './types/index';

// Pages
export { default as KanbanDashboard } from './pages/KanbanDashboard';

// Testing
export * from './tests/utils/testHelpers';
export * from './automation/test-automation';

// Default export for easy importing
export { default } from './pages/KanbanDashboard';