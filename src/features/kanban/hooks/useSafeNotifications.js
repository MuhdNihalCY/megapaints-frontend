/**
 * Safe Notifications Hook
 * Safely uses notification context without throwing errors if provider is not available
 */

import { useContext } from 'react';
import NotificationContext from '../contexts/NotificationContext';

export function useSafeNotifications() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    // Return mock functions if NotificationProvider is not available
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      isPanelOpen: false,
      soundEnabled: true,
      fetchNotifications: () => Promise.resolve(),
      addNotification: () => {},
      markAsRead: () => Promise.resolve(),
      markAsClicked: () => Promise.resolve(),
      markAllAsRead: () => Promise.resolve(),
      deleteNotification: () => Promise.resolve(),
      clearAll: () => Promise.resolve(),
      togglePanel: () => {},
      setPanelOpen: () => {},
      toggleSound: () => {},
      createMentionNotificationsForComment: () => [],
      createAssignmentNotificationsForCard: () => []
    };
  }
  
  return context;
}

export default useSafeNotifications;
