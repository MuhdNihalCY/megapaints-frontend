/**
 * Notification Bell Component
 * Shows notification bell icon with unread count badge
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationBell({ className = '' }) {
  const { unreadCount, togglePanel, isPanelOpen } = useNotifications();
  
  return (
    <button
      onClick={togglePanel}
      className={`
        relative p-2 text-gray-600 dark:text-gray-400 
        hover:text-gray-900 dark:hover:text-gray-200 
        hover:bg-gray-100 dark:hover:bg-gray-800 
        rounded-lg transition-colors
        ${isPanelOpen ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200' : ''}
        ${className}
      `}
      title="Notifications"
    >
      {/* Bell icon */}
      <motion.div
        animate={unreadCount > 0 ? {
          rotate: [0, -15, 15, -10, 10, 0],
          transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
        } : {}}
      >
        <Bell className="w-5 h-5" />
      </motion.div>
      
      {/* Unread count badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-900"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Pulse animation for new notifications */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 1, opacity: 1 }}
            animate={{
              scale: 1.5,
              opacity: 0,
              transition: { duration: 1.5, repeat: Infinity }
            }}
            className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-600 rounded-full"
          />
        )}
      </AnimatePresence>
    </button>
  );
}

