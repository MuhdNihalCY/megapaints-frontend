/**
 * Notification Context
 * Manages notification state, real-time updates, and sound playback
 */

import React, {
    createContext,
    useContext,
    useReducer,
    useCallback,
    useEffect,
    useRef,
} from "react";
import { kanbanService } from "../services/kanbanService";
import {
    createMentionNotifications,
    createAssignmentNotifications,
    NOTIFICATION_TYPES,
} from "../types/notificationModel";

// Initial state
const initialState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    isPanelOpen: false,
    soundEnabled: true,
};

// Action types
const ActionTypes = {
    SET_NOTIFICATIONS: "SET_NOTIFICATIONS",
    ADD_NOTIFICATION: "ADD_NOTIFICATION",
    MARK_AS_READ: "MARK_AS_READ",
    MARK_AS_CLICKED: "MARK_AS_CLICKED",
    MARK_ALL_AS_READ: "MARK_ALL_AS_READ",
    DELETE_NOTIFICATION: "DELETE_NOTIFICATION",
    SET_LOADING: "SET_LOADING",
    SET_ERROR: "SET_ERROR",
    TOGGLE_PANEL: "TOGGLE_PANEL",
    SET_PANEL_OPEN: "SET_PANEL_OPEN",
    TOGGLE_SOUND: "TOGGLE_SOUND",
    CLEAR_ALL: "CLEAR_ALL",
};

// Reducer
function notificationReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_NOTIFICATIONS: {
            const notifications = action.payload;
            const unreadCount = notifications.filter((n) => !n.is_read).length;
            return {
                ...state,
                notifications,
                unreadCount,
                isLoading: false,
            };
        }

        case ActionTypes.ADD_NOTIFICATION: {
            const newNotif = action.payload;
            // Check if notification already exists
            if (state.notifications.some((n) => n._id === newNotif._id)) {
                return state;
            }

            const notifications = [newNotif, ...state.notifications];
            const unreadCount = notifications.filter((n) => !n.is_read).length;

            return {
                ...state,
                notifications,
                unreadCount,
            };
        }

        case ActionTypes.MARK_AS_READ: {
            const notificationId = action.payload;
            const notifications = state.notifications.map((n) =>
                n._id === notificationId
                    ? { ...n, is_read: true, read_at: new Date().toISOString() }
                    : n,
            );
            const unreadCount = notifications.filter((n) => !n.is_read).length;

            return {
                ...state,
                notifications,
                unreadCount,
            };
        }

        case ActionTypes.MARK_AS_CLICKED: {
            const notificationId = action.payload;
            const notifications = state.notifications.map((n) =>
                n._id === notificationId
                    ? {
                          ...n,
                          is_clicked: true,
                          is_read: true,
                          clicked_at: new Date().toISOString(),
                          read_at: n.read_at || new Date().toISOString(),
                      }
                    : n,
            );
            const unreadCount = notifications.filter((n) => !n.is_read).length;

            return {
                ...state,
                notifications,
                unreadCount,
            };
        }

        case ActionTypes.MARK_ALL_AS_READ: {
            const now = new Date().toISOString();
            const notifications = state.notifications.map((n) => ({
                ...n,
                is_read: true,
                read_at: n.read_at || now,
            }));

            return {
                ...state,
                notifications,
                unreadCount: 0,
            };
        }

        case ActionTypes.DELETE_NOTIFICATION: {
            const notificationId = action.payload;
            const notifications = state.notifications.filter(
                (n) => n._id !== notificationId,
            );
            const unreadCount = notifications.filter((n) => !n.is_read).length;

            return {
                ...state,
                notifications,
                unreadCount,
            };
        }

        case ActionTypes.CLEAR_ALL: {
            return {
                ...state,
                notifications: [],
                unreadCount: 0,
            };
        }

        case ActionTypes.SET_LOADING:
            return { ...state, isLoading: action.payload };

        case ActionTypes.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false };

        case ActionTypes.TOGGLE_PANEL:
            return { ...state, isPanelOpen: !state.isPanelOpen };

        case ActionTypes.SET_PANEL_OPEN:
            return { ...state, isPanelOpen: action.payload };

        case ActionTypes.TOGGLE_SOUND:
            return { ...state, soundEnabled: !state.soundEnabled };

        default:
            return state;
    }
}

// Create context
const NotificationContext = createContext(null);

// Provider component
export function NotificationProvider({ children, currentUser }) {
    const [state, dispatch] = useReducer(notificationReducer, initialState);
    const audioRef = useRef(null);
    const lastNotifIdsRef = useRef(new Set());

    // Initialize audio
    useEffect(() => {
        // Create notification sound
        const audio = new Audio();
        // Simple notification sound using data URI (short beep)
        audio.src =
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaN0fDTgjMGHm7A7+OZTRAKH5Dj8bxwJAU1f9Lx1YY6CA1qtO/nmlILDE+u5vmvcyMGN4fL8dqHOQcaZ73v5ppPDAg/kODzu3AkBTF/0/DThDoIDmq07+eaUgwMT67l+a9zIwY3h8rx2oc5BxpnvO/nmlAMCT+Q4PG7cCQFMX/T8NOEOggOarTv55pSCwxPruX5r3MjBjeHyvHahzkHGme87+eaUAwJP5Dg8rtwJAUxf9Pw04Q6CA5qtO/nmlILDE+u5fmvcyMGN4fK8dqHOQcaZ7zv55pQDAk/kODyu3AkBTF/0/DThDoIDmq07+eaUgsMT67l+a9zIwY3h8rx2oc5BxpnvO/nmlAMCT+Q4PK7cCQFMX/T8NOEOggOarTv55pSCwxPruX5r3MjBjeHyvHahzkHGme87+eaUAwJP5Dg8rtwJAUxf9Pw04Q6CA5qtO/nmlILDE+u5fmvcyMGN4fK8dqHOQcaZ7zv55pQDAk/kODyu3AkBTF/0/DThDoIDmq07+eaUgsMT67l+a9zIwY3h8rx2oc5BxpnvO/nmlAMCT+Q4PK7cCQFMX/T8NOEOggOarTv55pSCwxPruX5r3MjBjeHyvHahzkHGme87+eaUAwJP5Dg8rtwJAUxf9Pw04Q6CA5qtO/nmlILDE+u5fmvcyMGN4fK8dqHOQcaZ7zv55pQDAk/kODyu3AkBTF/0/DThDoIDmq07+eaUgsMT67l+a9zIwY3h8rx2oc5BxpnvO/nmlAMCT+Q4PK7cCQFMX/T8NOEOggOarTv55pSCwxPruX5r3MjBjeHyvHahzkHGme87+eaUAwJP5Dg8rtwJAUxf9Pw04Q6CA5qtO/nmlILDE+u5fmvcyMGN4fK8dqHOQcaZ7zv55pQDAk/kODyu3AkBTF/0/DThDoIDmq07+eaUgsMT67l+a9zIwY3h8rx2oc5BxpnvO/nmlAMCT+Q4PK7cCQFMX/T8NOEOggOarTv55pSCwxPruX5r3MjBjeHyvHahzkHGme87+eaUAwJP5Dg8rtwJAUxf9Pw04Q6CA5qtO/nmlILDE+u5fmvcyMGN4fK8dqHOQcaZ7zv55pQDAk/kODyu3AkBTF/0/DThDoIDmq07+eaUgsMT67l+a9zIwY3h8rx2oc5BxpnvO/nmlAMCT+Q4PK7cCQFMX/T8NOEOggOarTv55pSCwxPruX5r3MjBjeHyvHahzkHGme87+eaUAwJP5Dg8rtwJAUxf9Pw04Q6CA5qtO/nmlILDE+u5fmvcyMGN4fK8dqHOQcaZ7zv55pQDAk/kODyu3AkBTF/0/DThDoIDmq07+eaUgsMT67l+a9zIwY3h8rx2oc5BxpnvO/nmlAMCT+Q4PK7cCQFMX/T8NOEOggOarTv55pSCwxPruX5r3MjBjeHyvHahzkHGme87+ea";
        audioRef.current = audio;
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (state.soundEnabled && audioRef.current) {
            try {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {
                    // Could not play notification sound
                });
            } catch (error) {
                // Error playing notification sound
            }
        }
    }, [state.soundEnabled]);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!currentUser || !(currentUser.id ?? currentUser._id)) {
            return;
        }

        try {
            dispatch({ type: ActionTypes.SET_LOADING, payload: true });
            const uid = currentUser.id ?? currentUser._id;
            const list = await kanbanService.getNotifications(uid);
            const notifications = Array.isArray(list) ? list : [];

            // Play sound if there are new unread notifications (e.g. from polling)
            const prevIds = lastNotifIdsRef.current;
            const hasNewUnread = notifications.some(
                (n) => !n.is_read && !prevIds.has(n._id),
            );
            if (hasNewUnread && state.soundEnabled) {
                playNotificationSound();
            }
            lastNotifIdsRef.current = new Set(notifications.map((n) => n._id));

            dispatch({
                type: ActionTypes.SET_NOTIFICATIONS,
                payload: notifications,
            });
        } catch (error) {
            dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
        }
    }, [currentUser, playNotificationSound, state.soundEnabled]);

    // Add notification
    const addNotification = useCallback(
        (notification) => {
            dispatch({
                type: ActionTypes.ADD_NOTIFICATION,
                payload: notification,
            });
            // Only play sound when the notification is for the current user (e.g. you were mentioned).
            // Don't play when we're adding notifications for others (e.g. you mentioned someone).
            const currentUserId = currentUser?.id ?? currentUser?._id;
            const recipientId = notification?.recipient_id;
            if (
                currentUserId != null &&
                recipientId != null &&
                String(recipientId) === String(currentUserId)
            ) {
                playNotificationSound();
            }
        },
        [currentUser, playNotificationSound],
    );

    // Mark as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await kanbanService.markNotificationAsRead(notificationId);
            dispatch({
                type: ActionTypes.MARK_AS_READ,
                payload: notificationId,
            });
        } catch (error) {
            // Error marking notification as read
        }
    }, []);

    // Mark as clicked (opened)
    const markAsClicked = useCallback(async (notificationId) => {
        try {
            await kanbanService.markNotificationAsClicked(notificationId);
            dispatch({
                type: ActionTypes.MARK_AS_CLICKED,
                payload: notificationId,
            });
        } catch (error) {
            // Error marking notification as clicked
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        const uid = currentUser?.id ?? currentUser?._id;
        if (!currentUser || uid == null) return;

        try {
            await kanbanService.markAllNotificationsAsRead(uid);
            dispatch({ type: ActionTypes.MARK_ALL_AS_READ });
        } catch (error) {
            // Error marking all notifications as read
        }
    }, [currentUser]);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            await kanbanService.deleteNotification(notificationId);
            dispatch({
                type: ActionTypes.DELETE_NOTIFICATION,
                payload: notificationId,
            });
        } catch (error) {
            // Error deleting notification
        }
    }, []);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        const uid = currentUser?.id ?? currentUser?._id;
        if (!currentUser || uid == null) return;

        try {
            await kanbanService.clearAllNotifications(uid);
            dispatch({ type: ActionTypes.CLEAR_ALL });
        } catch (error) {
            // Error clearing notifications
        }
    }, [currentUser]);

    // Toggle panel
    const togglePanel = useCallback(() => {
        dispatch({ type: ActionTypes.TOGGLE_PANEL });
    }, []);

    // Set panel open
    const setPanelOpen = useCallback((isOpen) => {
        dispatch({ type: ActionTypes.SET_PANEL_OPEN, payload: isOpen });
    }, []);

    // Toggle sound
    const toggleSound = useCallback(() => {
        dispatch({ type: ActionTypes.TOGGLE_SOUND });
    }, []);

    // Create mention notifications (helper)
    const createMentionNotificationsForComment = useCallback(
        (comment, mentionedUserIds, author, card) => {
            const notifications = createMentionNotifications(
                comment,
                mentionedUserIds,
                author,
                card,
            );
            notifications.forEach((notification) => {
                if (notification.recipient_id !== currentUser?.id) {
                    addNotification(notification);
                }
            });
            return notifications;
        },
        [currentUser, addNotification],
    );

    // Create assignment notifications (helper)
    const createAssignmentNotificationsForCard = useCallback(
        (card, assignedUserIds, author) => {
            const notifications = createAssignmentNotifications(
                card,
                assignedUserIds,
                author,
            );
            notifications.forEach((notification) => {
                if (notification.recipient_id !== currentUser?.id) {
                    addNotification(notification);
                }
            });
            return notifications;
        },
        [currentUser, addNotification],
    );

    // Load notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Polling for new notifications (every 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const value = {
        ...state,
        fetchNotifications,
        addNotification,
        markAsRead,
        markAsClicked,
        markAllAsRead,
        deleteNotification,
        clearAll,
        togglePanel,
        setPanelOpen,
        toggleSound,
        createMentionNotificationsForComment,
        createAssignmentNotificationsForCard,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

// Custom hook to use notification context
export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            "useNotifications must be used within NotificationProvider",
        );
    }
    return context;
}

export default NotificationContext;
