/**
 * Activity Logging System
 * Immutable audit trail for all Kanban board actions
 */

import { ACTIVITY_TYPES } from "./constants";

/**
 * Create activity log entry
 */
export const createActivityLog = (
    type,
    userId,
    cardId,
    data = {},
    before = null,
    after = null,
) => {
    return {
        type,
        userId,
        cardId,
        timestamp: new Date().toISOString(),
        data: {
            action: type,
            description: getActivityDescription(type, data),
            metadata: data,
        },
        before,
        after,
    };
};

/**
 * Get human-readable description for activity type
 */
export const getActivityDescription = (type, data) => {
    const descriptions = {
        [ACTIVITY_TYPES.CARD_CREATED]: `Card "${data.title}" was created`,
        [ACTIVITY_TYPES.CARD_UPDATED]: `Card "${data.title}" was updated`,
        [ACTIVITY_TYPES.CARD_MOVED]: `Card "${data.title}" was moved from ${data.fromColumn} to ${data.toColumn}`,
        [ACTIVITY_TYPES.CARD_DELETED]: `Card "${data.title}" was deleted`,
        [ACTIVITY_TYPES.CARD_ASSIGNED]: `Card "${data.title}" was assigned to ${data.assigneeName}`,
        [ACTIVITY_TYPES.CARD_UNASSIGNED]: `Card "${data.title}" was unassigned from ${data.assigneeName}`,
        [ACTIVITY_TYPES.LABEL_ADDED]: `Label "${data.labelName}" was added to card "${data.title}"`,
        [ACTIVITY_TYPES.LABEL_REMOVED]: `Label "${data.labelName}" was removed from card "${data.title}"`,
        [ACTIVITY_TYPES.DUE_DATE_CHANGED]: `Due date for card "${data.title}" was changed to ${data.dueDate}`,
        [ACTIVITY_TYPES.PRIORITY_CHANGED]: `Priority for card "${data.title}" was changed to ${data.priority}`,
        [ACTIVITY_TYPES.COMMENT_ADDED]: `Comment was added to card "${data.title}"`,
        [ACTIVITY_TYPES.COMMENT_UPDATED]: `Comment was updated on card "${data.title}"`,
        [ACTIVITY_TYPES.COMMENT_DELETED]: `Comment was deleted from card "${data.title}"`,
        [ACTIVITY_TYPES.ATTACHMENT_ADDED]: `Attachment "${data.filename}" was added to card "${data.title}"`,
        [ACTIVITY_TYPES.ATTACHMENT_REMOVED]: `Attachment "${data.filename}" was removed from card "${data.title}"`,
        [ACTIVITY_TYPES.CHECKLIST_ITEM_ADDED]: `Checklist item "${data.itemText}" was added to card "${data.title}"`,
        [ACTIVITY_TYPES.CHECKLIST_ITEM_COMPLETED]: `Checklist item "${data.itemText}" was completed on card "${data.title}"`,
        [ACTIVITY_TYPES.CHECKLIST_ITEM_DELETED]: `Checklist item "${data.itemText}" was deleted from card "${data.title}"`,
        [ACTIVITY_TYPES.COLUMN_ACTIVATED]: `Column "${data.columnName}" was activated`,
        [ACTIVITY_TYPES.COLUMN_DEACTIVATED]: `Column "${data.columnName}" was deactivated`,
        [ACTIVITY_TYPES.COLUMN_RENAMED]: `Column was renamed from "${data.oldName}" to "${data.newName}"`,
        [ACTIVITY_TYPES.COLUMN_REORDERED]: `Column "${data.columnName}" was reordered`,
    };

    return descriptions[type] || `Unknown activity: ${type}`;
};

/**
 * Log card creation
 */
export const logCardCreated = (card, user) => {
    return createActivityLog(ACTIVITY_TYPES.CARD_CREATED, user._id, card._id, {
        title: card.title,
        columnId: card.columnId,
        subcolumnId: card.subcolumnId,
        priority: card.priority,
        labels: card.labels?.map((l) => l.name) || [],
        assignees: card.assignees?.map((a) => a.username) || [],
    });
};

/**
 * Log card update
 */
export const logCardUpdated = (card, user, changes) => {
    return createActivityLog(
        ACTIVITY_TYPES.CARD_UPDATED,
        user._id,
        card._id,
        {
            title: card.title,
            changes: Object.keys(changes),
            ...changes,
        },
        changes.before,
        changes.after,
    );
};

/**
 * Log card move
 */
export const logCardMoved = (
    card,
    user,
    fromColumn,
    toColumn,
    fromSubColumn,
    toSubColumn,
) => {
    return createActivityLog(ACTIVITY_TYPES.CARD_MOVED, user._id, card._id, {
        title: card.title,
        fromColumn,
        toColumn,
        fromSubColumn,
        toSubColumn,
        fromPosition: card.position,
        toPosition: card.position,
    });
};

/**
 * Log card deletion
 */
export const logCardDeleted = (card, user) => {
    return createActivityLog(ACTIVITY_TYPES.CARD_DELETED, user._id, card._id, {
        title: card.title,
        columnId: card.columnId,
        subcolumnId: card.subcolumnId,
    });
};

/**
 * Log card assignment
 */
export const logCardAssigned = (card, user, assignee) => {
    return createActivityLog(ACTIVITY_TYPES.CARD_ASSIGNED, user._id, card._id, {
        title: card.title,
        assigneeId: assignee._id,
        assigneeName: assignee.username,
    });
};

/**
 * Log card unassignment
 */
export const logCardUnassigned = (card, user, assignee) => {
    return createActivityLog(
        ACTIVITY_TYPES.CARD_UNASSIGNED,
        user._id,
        card._id,
        {
            title: card.title,
            assigneeId: assignee._id,
            assigneeName: assignee.username,
        },
    );
};

/**
 * Log label addition
 */
export const logLabelAdded = (card, user, label) => {
    return createActivityLog(ACTIVITY_TYPES.LABEL_ADDED, user._id, card._id, {
        title: card.title,
        labelId: label._id,
        labelName: label.name,
        labelColor: label.color,
    });
};

/**
 * Log label removal
 */
export const logLabelRemoved = (card, user, label) => {
    return createActivityLog(ACTIVITY_TYPES.LABEL_REMOVED, user._id, card._id, {
        title: card.title,
        labelId: label._id,
        labelName: label.name,
        labelColor: label.color,
    });
};

/**
 * Log due date change
 */
export const logDueDateChanged = (card, user, oldDueDate, newDueDate) => {
    return createActivityLog(
        ACTIVITY_TYPES.DUE_DATE_CHANGED,
        user._id,
        card._id,
        {
            title: card.title,
            oldDueDate,
            dueDate: newDueDate,
        },
        { dueDate: oldDueDate },
        { dueDate: newDueDate },
    );
};

/**
 * Log priority change
 */
export const logPriorityChanged = (card, user, oldPriority, newPriority) => {
    return createActivityLog(
        ACTIVITY_TYPES.PRIORITY_CHANGED,
        user._id,
        card._id,
        {
            title: card.title,
            oldPriority,
            priority: newPriority,
        },
        { priority: oldPriority },
        { priority: newPriority },
    );
};

/**
 * Log comment addition
 */
export const logCommentAdded = (card, user, comment) => {
    return createActivityLog(ACTIVITY_TYPES.COMMENT_ADDED, user._id, card._id, {
        title: card.title,
        commentId: comment._id,
        commentText:
            comment.text.substring(0, 50) +
            (comment.text.length > 50 ? "..." : ""),
        mentions: comment.mentions?.map((m) => m.username) || [],
    });
};

/**
 * Log comment update
 */
export const logCommentUpdated = (card, user, comment, oldText) => {
    return createActivityLog(
        ACTIVITY_TYPES.COMMENT_UPDATED,
        user._id,
        card._id,
        {
            title: card.title,
            commentId: comment._id,
            oldText:
                oldText.substring(0, 50) + (oldText.length > 50 ? "..." : ""),
            commentText:
                comment.text.substring(0, 50) +
                (comment.text.length > 50 ? "..." : ""),
        },
        { text: oldText },
        { text: comment.text },
    );
};

/**
 * Log comment deletion
 */
export const logCommentDeleted = (card, user, comment) => {
    return createActivityLog(
        ACTIVITY_TYPES.COMMENT_DELETED,
        user._id,
        card._id,
        {
            title: card.title,
            commentId: comment._id,
            commentText:
                comment.text.substring(0, 50) +
                (comment.text.length > 50 ? "..." : ""),
        },
    );
};

/**
 * Log attachment addition
 */
export const logAttachmentAdded = (card, user, attachment) => {
    return createActivityLog(
        ACTIVITY_TYPES.ATTACHMENT_ADDED,
        user._id,
        card._id,
        {
            title: card.title,
            attachmentId: attachment._id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
        },
    );
};

/**
 * Log attachment removal
 */
export const logAttachmentRemoved = (card, user, attachment) => {
    return createActivityLog(
        ACTIVITY_TYPES.ATTACHMENT_REMOVED,
        user._id,
        card._id,
        {
            title: card.title,
            attachmentId: attachment._id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
        },
    );
};

/**
 * Log checklist item addition
 */
export const logChecklistItemAdded = (card, user, checklistItem) => {
    return createActivityLog(
        ACTIVITY_TYPES.CHECKLIST_ITEM_ADDED,
        user._id,
        card._id,
        {
            title: card.title,
            itemId: checklistItem._id,
            itemText: checklistItem.text,
        },
    );
};

/**
 * Log checklist item completion
 */
export const logChecklistItemCompleted = (card, user, checklistItem) => {
    return createActivityLog(
        ACTIVITY_TYPES.CHECKLIST_ITEM_COMPLETED,
        user._id,
        card._id,
        {
            title: card.title,
            itemId: checklistItem._id,
            itemText: checklistItem.text,
        },
    );
};

/**
 * Log checklist item deletion
 */
export const logChecklistItemDeleted = (card, user, checklistItem) => {
    return createActivityLog(
        ACTIVITY_TYPES.CHECKLIST_ITEM_DELETED,
        user._id,
        card._id,
        {
            title: card.title,
            itemId: checklistItem._id,
            itemText: checklistItem.text,
        },
    );
};

/**
 * Log column activation
 */
export const logColumnActivated = (column, user) => {
    return createActivityLog(
        ACTIVITY_TYPES.COLUMN_ACTIVATED,
        user._id,
        null, // No specific card
        {
            columnId: column._id,
            columnName: column.name,
            columnType: column.type,
        },
    );
};

/**
 * Log column deactivation
 */
export const logColumnDeactivated = (column, user) => {
    return createActivityLog(
        ACTIVITY_TYPES.COLUMN_DEACTIVATED,
        user._id,
        null, // No specific card
        {
            columnId: column._id,
            columnName: column.name,
            columnType: column.type,
        },
    );
};

/**
 * Log column rename
 */
export const logColumnRenamed = (column, user, oldName, newName) => {
    return createActivityLog(
        ACTIVITY_TYPES.COLUMN_RENAMED,
        user._id,
        null, // No specific card
        {
            columnId: column._id,
            columnName: column.name,
            oldName,
            newName,
        },
        { name: oldName },
        { name: newName },
    );
};

/**
 * Log column reorder
 */
export const logColumnReordered = (column, user, oldPosition, newPosition) => {
    return createActivityLog(
        ACTIVITY_TYPES.COLUMN_REORDERED,
        user._id,
        null, // No specific card
        {
            columnId: column._id,
            columnName: column.name,
            oldPosition,
            newPosition,
        },
        { position: oldPosition },
        { position: newPosition },
    );
};

/**
 * Format activity for display
 */
export const formatActivityForDisplay = (activity, users) => {
    const user = users.find((u) => u._id === activity.userId);
    const userName = user
        ? `${user.first_name} ${user.last_name}`
        : "Unknown User";

    return {
        ...activity,
        userName,
        userAvatar: user?.avatar || null,
        formattedTime: new Date(activity.timestamp).toLocaleString(),
        description: activity.data.description,
    };
};

/**
 * Get activity summary for a card
 */
export const getCardActivitySummary = (activities) => {
    const summary = {
        total: activities.length,
        byType: {},
        recent: activities.slice(0, 5),
        lastActivity: activities.length > 0 ? activities[0] : null,
    };

    activities.forEach((activity) => {
        summary.byType[activity.type] =
            (summary.byType[activity.type] || 0) + 1;
    });

    return summary;
};

/**
 * Filter activities by type
 */
export const filterActivitiesByType = (activities, type) => {
    return activities.filter((activity) => activity.type === type);
};

/**
 * Get activities for a specific user
 */
export const getActivitiesForUser = (activities, userId) => {
    return activities.filter((activity) => activity.userId === userId);
};

/**
 * Get activities for a specific time range
 */
export const getActivitiesInTimeRange = (activities, startDate, endDate) => {
    return activities.filter((activity) => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= startDate && activityDate <= endDate;
    });
};

/**
 * Export activities to CSV
 */
export const exportActivitiesToCSV = (activities, users) => {
    const headers = [
        "Timestamp",
        "User",
        "Type",
        "Description",
        "Card ID",
        "Metadata",
    ];
    const rows = activities.map((activity) => {
        const user = users.find((u) => u._id === activity.userId);
        const userName = user
            ? `${user.first_name} ${user.last_name}`
            : "Unknown User";

        return [
            new Date(activity.timestamp).toISOString(),
            userName,
            activity.type,
            activity.data.description,
            activity.cardId || "",
            JSON.stringify(activity.data.metadata || {}),
        ];
    });

    const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

    return csvContent;
};

export default {
    createActivityLog,
    getActivityDescription,
    logCardCreated,
    logCardUpdated,
    logCardMoved,
    logCardDeleted,
    logCardAssigned,
    logCardUnassigned,
    logLabelAdded,
    logLabelRemoved,
    logDueDateChanged,
    logPriorityChanged,
    logCommentAdded,
    logCommentUpdated,
    logCommentDeleted,
    logAttachmentAdded,
    logAttachmentRemoved,
    logChecklistItemAdded,
    logChecklistItemCompleted,
    logChecklistItemDeleted,
    logColumnActivated,
    logColumnDeactivated,
    logColumnRenamed,
    logColumnReordered,
    formatActivityForDisplay,
    getCardActivitySummary,
    filterActivitiesByType,
    getActivitiesForUser,
    getActivitiesInTimeRange,
    exportActivitiesToCSV,
};
