/**
 * Notification Model
 * Complete data structure for user notifications with mentions
 */

/**
 * @typedef {Object} NotificationAuthor
 * @property {string} id - User ID who triggered the notification
 * @property {string} name - User's display name
 * @property {string} email - User's email
 * @property {string} avatar - User's avatar URL
 * @property {string} designation - User's role/designation
 */

/**
 * @typedef {Object} NotificationTarget
 * @property {string} type - Type of target (card, comment, checklist, attachment)
 * @property {string} id - Target ID
 * @property {string} title - Target title or preview
 * @property {string} cardId - Associated card ID
 * @property {string} boardId - Associated board ID
 * @property {string} columnId - Associated column ID
 */

/**
 * @typedef {Object} Notification
 * @property {string} _id - Notification unique ID
 * @property {string} type - Notification type (mention, assignment, due_date, comment, etc.)
 * @property {string} recipient_id - User ID receiving the notification
 * @property {NotificationAuthor} author - User who triggered the notification
 * @property {NotificationTarget} target - Where the mention/action occurred
 * @property {string} message - Notification message
 * @property {string} preview - Preview text of the mention/comment
 * @property {boolean} is_read - Whether notification has been read
 * @property {boolean} is_clicked - Whether notification has been clicked/viewed
 * @property {string} created_at - ISO timestamp
 * @property {string} read_at - ISO timestamp when read
 * @property {string} clicked_at - ISO timestamp when clicked
 * @property {Object} metadata - Additional metadata
 */

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  MENTION: 'mention',
  ASSIGNMENT: 'assignment',
  DUE_DATE: 'due_date',
  COMMENT: 'comment',
  CARD_MOVED: 'card_moved',
  CHECKLIST_COMPLETE: 'checklist_complete',
  ATTACHMENT_ADDED: 'attachment_added',
  CARD_ARCHIVED: 'card_archived',
  WATCHED_CARD_UPDATE: 'watched_card_update'
};

/**
 * Create a new notification
 * @param {Object} data - Notification data
 * @returns {Notification}
 */
export function createNotification({
  type,
  recipient_id,
  author,
  target,
  message,
  preview,
  metadata = {}
}) {
  return {
    _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    recipient_id,
    author: {
      id: author.id || author._id,
      name: author.name || author.username,
      email: author.email,
      avatar: author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || author.username)}&background=random`,
      designation: author.designation || 'User'
    },
    target: {
      type: target.type,
      id: target.id,
      title: target.title,
      cardId: target.cardId,
      boardId: target.boardId,
      columnId: target.columnId
    },
    message,
    preview: preview || '',
    is_read: false,
    is_clicked: false,
    created_at: new Date().toISOString(),
    read_at: null,
    clicked_at: null,
    metadata
  };
}

/**
 * Create mention notification from comment
 * @param {Object} comment - Comment object
 * @param {Array<string>} mentionedUserIds - IDs of mentioned users
 * @param {Object} author - User who made the comment
 * @param {Object} card - Card where comment was made
 * @returns {Array<Notification>}
 */
export function createMentionNotifications(comment, mentionedUserIds, author, card) {
  return mentionedUserIds.map(userId => createNotification({
    type: NOTIFICATION_TYPES.MENTION,
    recipient_id: userId,
    author,
    target: {
      type: 'comment',
      id: comment._id || comment.id,
      title: card.title,
      cardId: card.id || card._id,
      boardId: card.boardId,
      columnId: card.columnId || card.listId
    },
    message: `${author.name || author.username} mentioned you in a comment`,
    preview: comment.text.substring(0, 100),
    metadata: {
      commentId: comment._id || comment.id,
      commentText: comment.text
    }
  }));
}

/**
 * Create card mention notification
 * @param {Object} card - Card object
 * @param {Array<string>} mentionedUserIds - IDs of mentioned users
 * @param {Object} author - User who mentioned
 * @returns {Array<Notification>}
 */
export function createCardMentionNotifications(card, mentionedUserIds, author) {
  return mentionedUserIds.map(userId => createNotification({
    type: NOTIFICATION_TYPES.MENTION,
    recipient_id: userId,
    author,
    target: {
      type: 'card',
      id: card.id || card._id,
      title: card.title,
      cardId: card.id || card._id,
      boardId: card.boardId,
      columnId: card.columnId || card.listId
    },
    message: `${author.name || author.username} mentioned you in "${card.title}"`,
    preview: card.description?.substring(0, 100) || 'View card details',
    metadata: {
      field: 'description'
    }
  }));
}

/**
 * Create assignment notification
 * @param {Object} card - Card object
 * @param {Array<string>} assignedUserIds - IDs of assigned users
 * @param {Object} author - User who assigned
 * @returns {Array<Notification>}
 */
export function createAssignmentNotifications(card, assignedUserIds, author) {
  return assignedUserIds.map(userId => createNotification({
    type: NOTIFICATION_TYPES.ASSIGNMENT,
    recipient_id: userId,
    author,
    target: {
      type: 'card',
      id: card.id || card._id,
      title: card.title,
      cardId: card.id || card._id,
      boardId: card.boardId,
      columnId: card.columnId || card.listId
    },
    message: `${author.name || author.username} assigned you to "${card.title}"`,
    preview: card.description?.substring(0, 100) || '',
    metadata: {
      action: 'assignment'
    }
  }));
}

/**
 * Format notification time (relative)
 * @param {string} timestamp - ISO timestamp
 * @returns {string}
 */
export function formatNotificationTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return time.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string}
 */
export function getNotificationIcon(type) {
  const icons = {
    [NOTIFICATION_TYPES.MENTION]: 'at-sign',
    [NOTIFICATION_TYPES.ASSIGNMENT]: 'user-plus',
    [NOTIFICATION_TYPES.DUE_DATE]: 'clock',
    [NOTIFICATION_TYPES.COMMENT]: 'message-square',
    [NOTIFICATION_TYPES.CARD_MOVED]: 'move',
    [NOTIFICATION_TYPES.CHECKLIST_COMPLETE]: 'check-circle',
    [NOTIFICATION_TYPES.ATTACHMENT_ADDED]: 'paperclip',
    [NOTIFICATION_TYPES.CARD_ARCHIVED]: 'archive',
    [NOTIFICATION_TYPES.WATCHED_CARD_UPDATE]: 'eye'
  };
  
  return icons[type] || 'bell';
}

/**
 * Get notification color based on type
 * @param {string} type - Notification type
 * @returns {string}
 */
export function getNotificationColor(type) {
  const colors = {
    [NOTIFICATION_TYPES.MENTION]: 'blue',
    [NOTIFICATION_TYPES.ASSIGNMENT]: 'green',
    [NOTIFICATION_TYPES.DUE_DATE]: 'orange',
    [NOTIFICATION_TYPES.COMMENT]: 'purple',
    [NOTIFICATION_TYPES.CARD_MOVED]: 'indigo',
    [NOTIFICATION_TYPES.CHECKLIST_COMPLETE]: 'green',
    [NOTIFICATION_TYPES.ATTACHMENT_ADDED]: 'gray',
    [NOTIFICATION_TYPES.CARD_ARCHIVED]: 'red',
    [NOTIFICATION_TYPES.WATCHED_CARD_UPDATE]: 'blue'
  };
  
  return colors[type] || 'gray';
}

/**
 * Group notifications by date
 * @param {Array<Notification>} notifications
 * @returns {Object}
 */
export function groupNotificationsByDate(notifications) {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  
  notifications.forEach(notification => {
    const notifDate = new Date(notification.created_at);
    const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());
    
    if (notifDay.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else if (notifDay >= thisWeek) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });
  
  return groups;
}

/**
 * Extract mentioned user IDs from text
 * @param {string} text - Text containing @mentions
 * @returns {Array<string>}
 */
export function extractMentionedUserIds(text) {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentionedIds = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentionedIds.push(match[2]); // match[2] is the user ID
  }
  
  return [...new Set(mentionedIds)]; // Remove duplicates
}

export default {
  createNotification,
  createMentionNotifications,
  createCardMentionNotifications,
  createAssignmentNotifications,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  groupNotificationsByDate,
  extractMentionedUserIds,
  NOTIFICATION_TYPES
};

