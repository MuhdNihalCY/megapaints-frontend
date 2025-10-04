/**
 * Notification Panel Component
 * Displays user notifications with filtering, grouping, and actions
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  AtSign,
  UserPlus,
  Clock,
  MessageSquare,
  Move,
  CheckCircle,
  Paperclip,
  Archive,
  Eye,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  formatNotificationTime,
  groupNotificationsByDate,
  NOTIFICATION_TYPES
} from '../../types/notificationModel';

// Notification icon component
const NotificationIcon = ({ type }) => {
  const iconProps = { className: 'w-5 h-5', strokeWidth: 2 };
  
  const icons = {
    [NOTIFICATION_TYPES.MENTION]: <AtSign {...iconProps} />,
    [NOTIFICATION_TYPES.ASSIGNMENT]: <UserPlus {...iconProps} />,
    [NOTIFICATION_TYPES.DUE_DATE]: <Clock {...iconProps} />,
    [NOTIFICATION_TYPES.COMMENT]: <MessageSquare {...iconProps} />,
    [NOTIFICATION_TYPES.CARD_MOVED]: <Move {...iconProps} />,
    [NOTIFICATION_TYPES.CHECKLIST_COMPLETE]: <CheckCircle {...iconProps} />,
    [NOTIFICATION_TYPES.ATTACHMENT_ADDED]: <Paperclip {...iconProps} />,
    [NOTIFICATION_TYPES.CARD_ARCHIVED]: <Archive {...iconProps} />,
    [NOTIFICATION_TYPES.WATCHED_CARD_UPDATE]: <Eye {...iconProps} />
  };
  
  return icons[type] || <Bell {...iconProps} />;
};

// Notification color classes
const getNotificationColorClasses = (type) => {
  const colors = {
    [NOTIFICATION_TYPES.MENTION]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    [NOTIFICATION_TYPES.ASSIGNMENT]: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    [NOTIFICATION_TYPES.DUE_DATE]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    [NOTIFICATION_TYPES.COMMENT]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    [NOTIFICATION_TYPES.CARD_MOVED]: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    [NOTIFICATION_TYPES.CHECKLIST_COMPLETE]: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    [NOTIFICATION_TYPES.ATTACHMENT_ADDED]: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
    [NOTIFICATION_TYPES.CARD_ARCHIVED]: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    [NOTIFICATION_TYPES.WATCHED_CARD_UPDATE]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  };
  
  return colors[type] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
};

// Single notification item
const NotificationItem = ({ notification, onView, onDelete, onMarkAsRead }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`
        relative p-4 cursor-pointer transition-colors
        ${notification.is_read 
          ? 'bg-white dark:bg-gray-800' 
          : 'bg-blue-50 dark:bg-blue-900/20'
        }
        hover:bg-gray-50 dark:hover:bg-gray-750
        border-b border-gray-200 dark:border-gray-700
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(notification)}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
      )}
      
      <div className="flex items-start gap-3 ml-4">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${getNotificationColorClasses(notification.type)}
        `}>
          <NotificationIcon type={notification.type} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author & Message */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {notification.message}
            </p>
            
            {/* Actions (visible on hover) */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                >
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification._id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification._id);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Preview */}
          {notification.preview && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {notification.preview}
            </p>
          )}
          
          {/* Card title */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <span className="font-medium">{notification.target.title}</span>
            <span>•</span>
            <span>{formatNotificationTime(notification.created_at)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Notification group
const NotificationGroup = ({ title, notifications, onView, onDelete, onMarkAsRead }) => {
  if (notifications.length === 0) return null;
  
  return (
    <div className="mb-4">
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {title} ({notifications.length})
        </h3>
      </div>
      <div>
        {notifications.map(notification => (
          <NotificationItem
            key={notification._id}
            notification={notification}
            onView={onView}
            onDelete={onDelete}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </div>
    </div>
  );
};

// Main notification panel
export default function NotificationPanel({ onNavigateToCard }) {
  const {
    notifications,
    unreadCount,
    isPanelOpen,
    soundEnabled,
    isLoading,
    setPanelOpen,
    markAsRead,
    markAsClicked,
    markAllAsRead,
    deleteNotification,
    clearAll,
    toggleSound
  } = useNotifications();
  
  const [filter, setFilter] = useState('all'); // all, unread, mentions
  
  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (filter === 'mentions') {
      filtered = filtered.filter(n => n.type === NOTIFICATION_TYPES.MENTION);
    }
    
    return filtered;
  }, [notifications, filter]);
  
  // Group notifications
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);
  
  // Handle view notification (navigate to card)
  const handleViewNotification = async (notification) => {
    // Mark as clicked
    await markAsClicked(notification._id);
    
    // Close panel
    setPanelOpen(false);
    
    // Navigate to card
    if (onNavigateToCard) {
      onNavigateToCard(notification.target.cardId, notification);
    }
  };
  
  // Handle close
  const handleClose = () => {
    setPanelOpen(false);
  };
  
  if (!isPanelOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
        onClick={handleClose}
      />
      
      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* Sound toggle */}
              <button
                onClick={toggleSound}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setFilter('all')}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('mentions')}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${filter === 'mentions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              <AtSign className="w-4 h-4 inline-block mr-1" />
              Mentions
            </button>
          </div>
          
          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                {filter === 'unread' ? 'No unread notifications' : filter === 'mentions' ? 'No mentions' : 'No notifications'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'All caught up!' : filter === 'mentions' ? 'No one has mentioned you yet' : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div>
              <NotificationGroup
                title="Today"
                notifications={groupedNotifications.today}
                onView={handleViewNotification}
                onDelete={deleteNotification}
                onMarkAsRead={markAsRead}
              />
              <NotificationGroup
                title="Yesterday"
                notifications={groupedNotifications.yesterday}
                onView={handleViewNotification}
                onDelete={deleteNotification}
                onMarkAsRead={markAsRead}
              />
              <NotificationGroup
                title="This Week"
                notifications={groupedNotifications.thisWeek}
                onView={handleViewNotification}
                onDelete={deleteNotification}
                onMarkAsRead={markAsRead}
              />
              <NotificationGroup
                title="Older"
                notifications={groupedNotifications.older}
                onView={handleViewNotification}
                onDelete={deleteNotification}
                onMarkAsRead={markAsRead}
              />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

