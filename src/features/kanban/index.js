/**
 * Kanban Board System - Main Exports
 * Central export file for all Kanban components and utilities
 */

// Main Components
export { default as KanbanBoard } from './components/board/KanbanBoard';
export { default as KanbanColumn } from './components/columns/KanbanColumn';
export { default as KanbanCard } from './components/cards/KanbanCard';
export { default as PragmaticKanbanCard } from './components/cards/PragmaticKanbanCard';
export { default as CardModal } from './components/cards/CardModal';
export { default as CardChecklist } from './components/cards/CardChecklist';
export { default as BoardHeader } from './components/board/BoardHeader';
export { default as BoardStats } from './components/board/BoardStats';
export { default as ColumnHeader } from './components/columns/ColumnHeader';
export { default as FiltersPanel } from './components/ui/FiltersPanel';
export { default as CreateCardButton } from './components/ui/CreateCardButton';
export { default as HelpPanel } from './components/ui/HelpPanel';
export { default as KeyboardShortcuts } from './components/ui/KeyboardShortcuts';
export { default as LabelManager } from './components/ui/LabelManager';
export { default as ColumnSearch } from './components/search/ColumnSearch';

// Common Components
export { default as ErrorBoundary } from './components/common/ErrorBoundary';
export { default as LoadingSpinner, CardSkeleton, ColumnSkeleton, BoardSkeleton, LoadingStates } from './components/common/LoadingSpinner';
export { default as ApiStatusNotification } from './components/common/ApiStatusNotification';
export { default as AuthGuard } from './components/common/AuthGuard';

// Activity and Comments
export { default as ActivityLog } from './components/activity/ActivityLog';
export { default as CommentsSection } from './components/comments/CommentsSection';

// Contexts
export { KanbanProvider, useKanban } from './contexts/KanbanContext';
export { PermissionProvider, usePermissions } from './contexts/PermissionContext';

// Hooks
export { default as useCardModal } from './hooks/useCardModal';
export { default as useDragDrop } from './hooks/useDragDrop';

// Services
export { default as kanbanService } from './services/kanbanService';
export { default as MockKanbanService, mockUsers, mockCards, mockColumns, mockLabels, mockActivities } from './services/mockData';

// Utils
export * from './utils/constants';
export * from './utils/permissions';
export * from './utils/dragDropRules';
export * from './utils/activityLogger';

// Types
export * from './types/index';

// Pages
export { default as KanbanDashboard } from './pages/KanbanDashboard';

// Testing
export * from './tests/utils/testHelpers';
export * from './automation/test-automation';

// Default export for easy importing
export { default } from './pages/KanbanDashboard';