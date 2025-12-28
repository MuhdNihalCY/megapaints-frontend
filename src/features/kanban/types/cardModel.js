/**
 * Complete Trello-style Card Data Model
 * Based on comprehensive card model specifications
 */

/**
 * Card Model
 * @typedef {Object} Card
 * @property {string} id - Unique identifier
 * @property {string} title - Card title (required, displayed on front)
 * @property {string} description - Rich text description with markdown support
 * @property {string} listId - Parent list/column reference
 * @property {string} boardId - Parent board reference
 * @property {number} position - Position for drag-drop ordering
 * @property {boolean} closed - Archive status
 * @property {string} dateCreated - ISO timestamp
 * @property {string} dateLastActivity - ISO timestamp
 * @property {string} url - Permanent card link
 *
 * @property {CoverImage} coverImage - Cover image or color
 * @property {Label[]} labels - Array of labels
 *
 * @property {string[]} members - Array of user IDs
 * @property {DueDate} dueDate - Due date with completion status
 * @property {string} startDate - Optional start date (ISO timestamp)
 *
 * @property {Attachment[]} attachments - Array of attachments
 * @property {Checklist[]} checklists - Array of checklists
 * @property {CustomField[]} customFields - Array of custom fields
 * @property {Comment[]} comments - Array of comments
 * @property {Activity[]} activityLog - Activity history
 *
 * @property {Sticker[]} stickers - Array of stickers
 * @property {string[]} subscriptions - Array of subscribed user IDs
 */

/**
 * @typedef {Object} CoverImage
 * @property {string} attachmentId - Reference to attachment if image
 * @property {string} url - Image URL
 * @property {string} color - Solid color if no image (#hex format)
 * @property {string} size - 'normal' | 'full'
 */

/**
 * @typedef {Object} Label
 * @property {string} id - Unique identifier
 * @property {string} color - Color code or name
 * @property {string} name - Label name (max 25 chars)
 */

/**
 * @typedef {Object} DueDate
 * @property {string} date - ISO datetime string
 * @property {boolean} completed - Completion status
 * @property {boolean} dueComplete - Mark as complete flag
 */

/**
 * @typedef {Object} Attachment
 * @property {string} id - Unique identifier
 * @property {string} name - File name
 * @property {string} url - File URL
 * @property {string} type - 'image' | 'pdf' | 'link' | 'file'
 * @property {number} size - File size in bytes
 * @property {string} dateAdded - ISO timestamp
 * @property {boolean} isUploadedToCard - Upload status
 * @property {string} mimeType - MIME type
 */

/**
 * @typedef {Object} Checklist
 * @property {string} id - Unique identifier
 * @property {string} title - Checklist title
 * @property {number} position - Display order
 * @property {ChecklistItem[]} items - Array of checklist items
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {string} id - Unique identifier
 * @property {string} name - Item text
 * @property {boolean} completed - Completion status
 * @property {number} position - Display order
 * @property {string} dueDate - Optional due date (ISO timestamp, Premium feature)
 * @property {string} assignedMember - Optional assigned user ID (Premium feature)
 */

/**
 * @typedef {Object} CustomField
 * @property {string} fieldId - Field definition reference
 * @property {string} name - Field name
 * @property {string} type - 'text' | 'number' | 'date' | 'dropdown' | 'checkbox'
 * @property {any} value - Field value (type depends on field type)
 * @property {string[]} options - Available options for dropdown type
 */

/**
 * @typedef {Object} Comment
 * @property {string} id - Unique identifier
 * @property {string} authorId - User ID of author
 * @property {string} text - Comment text (markdown supported)
 * @property {string} dateCreated - ISO timestamp
 * @property {string} dateEdited - ISO timestamp (null if not edited)
 * @property {Reaction[]} reactions - Array of emoji reactions
 */

/**
 * @typedef {Object} Reaction
 * @property {string} emoji - Emoji character
 * @property {string[]} userIds - Array of user IDs who reacted
 */

/**
 * @typedef {Object} Activity
 * @property {string} id - Unique identifier
 * @property {string} type - Activity type ('comment' | 'edit' | 'move' | 'add_member' | 'add_label' | 'due_date' | 'attachment' | 'checklist' | 'archive' | 'unarchive')
 * @property {string} authorId - User ID who performed action
 * @property {string} timestamp - ISO timestamp
 * @property {Object} data - Type-specific data
 * @property {string} text - Human-readable activity description
 */

/**
 * @typedef {Object} Sticker
 * @property {string} id - Unique identifier
 * @property {string} imageUrl - Sticker image URL
 * @property {number} top - Y position (%)
 * @property {number} left - X position (%)
 * @property {number} zIndex - Stack order
 * @property {number} rotate - Rotation angle (degrees)
 */

/**
 * Card Badge Data (calculated for display)
 * @typedef {Object} CardBadges
 * @property {boolean} hasDescription - Whether card has description
 * @property {number} comments - Number of comments
 * @property {number} attachments - Number of attachments
 * @property {ChecklistProgress} checklist - Checklist progress
 * @property {DueDateBadge} dueDate - Due date display info
 * @property {number} votes - Number of votes (if voting enabled)
 */

/**
 * @typedef {Object} ChecklistProgress
 * @property {number} completed - Number of completed items
 * @property {number} total - Total number of items
 * @property {number} percentage - Completion percentage (0-100)
 */

/**
 * @typedef {Object} DueDateBadge
 * @property {string} text - Display text
 * @property {string} color - Badge color ('green' | 'yellow' | 'red')
 * @property {boolean} isComplete - Whether marked complete
 * @property {boolean} isOverdue - Whether past due
 * @property {boolean} isDueSoon - Whether due in next 24 hours
 */

/**
 * Create empty card with default values
 * @param {Object} overrides - Properties to override
 * @returns {Card}
 */
export function createEmptyCard(overrides = {}) {
    const now = new Date().toISOString();

    return {
        id: null,
        title: "",
        description: "",
        listId: null,
        boardId: null,
        position: 0,
        closed: false,
        dateCreated: now,
        dateLastActivity: now,
        url: "",

        coverImage: null,
        labels: [],

        members: [],
        dueDate: null,
        startDate: null,

        attachments: [],
        checklists: [],
        customFields: [],
        comments: [],
        activityLog: [],

        stickers: [],
        subscriptions: [],

        ...overrides,
    };
}

/**
 * Calculate card badges for display
 * @param {Card} card
 * @returns {CardBadges}
 */
export function calculateCardBadges(card) {
    // Return empty badges if card is null or undefined
    if (!card) {
        return {
            checklistProgress: { completed: 0, total: 0, percentage: 0 },
            dueDateBadge: null,
            attachmentCount: 0,
            commentCount: 0,
            descriptionPresent: false,
            membersCount: 0,
            labelsCount: 0,
        };
    }

    // Calculate checklist progress
    let checklistProgress = { completed: 0, total: 0, percentage: 0 };
    if (card.checklists && card.checklists.length > 0) {
        const allItems = card.checklists.flatMap((cl) => cl.items || []);
        const completedItems = allItems.filter((item) => item.completed);
        checklistProgress = {
            completed: completedItems.length,
            total: allItems.length,
            percentage:
                allItems.length > 0
                    ? Math.round(
                          (completedItems.length / allItems.length) * 100,
                      )
                    : 0,
        };
    }

    // Calculate due date badge
    let dueDateBadge = null;
    if (card.dueDate) {
        const dueDate = new Date(card.dueDate.date || card.dueDate);
        const now = new Date();
        const hoursUntilDue =
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        const isComplete =
            card.dueDate.completed || card.dueDate.dueComplete || false;
        const isOverdue = hoursUntilDue < 0;
        const isDueSoon = hoursUntilDue > 0 && hoursUntilDue <= 24;

        let color = "gray";
        if (isComplete) {
            color = "green";
        } else if (isOverdue) {
            color = "red";
        } else if (isDueSoon) {
            color = "yellow";
        }

        dueDateBadge = {
            text: isComplete
                ? "Complete"
                : isOverdue
                  ? "Overdue"
                  : formatDueDate(dueDate),
            color,
            isComplete,
            isOverdue,
            isDueSoon,
        };
    }

    return {
        hasDescription: !!(card.description && card.description.trim()),
        comments: (card.comments || []).length,
        attachments: (card.attachments || []).length,
        checklist: checklistProgress,
        dueDate: dueDateBadge,
        votes: 0, // Not implemented yet
    };
}

/**
 * Format due date for display
 * @param {Date} date
 * @returns {string}
 */
function formatDueDate(date) {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Tomorrow";
    } else if (diffDays === -1) {
        return "Yesterday";
    } else if (diffDays > 1 && diffDays <= 7) {
        return `In ${diffDays} days`;
    } else {
        const month = date.toLocaleString("default", { month: "short" });
        const day = date.getDate();
        return `${month} ${day}`;
    }
}

/**
 * Add activity to card
 * @param {Card} card
 * @param {string} type - Activity type
 * @param {string} authorId - User ID
 * @param {Object} data - Activity-specific data
 * @param {string} text - Human-readable description
 * @returns {Card}
 */
export function addActivity(card, type, authorId, data, text) {
    // Return null if card is null or undefined
    if (!card) {
        return null;
    }

    const activity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        authorId,
        timestamp: new Date().toISOString(),
        data,
        text,
    };

    return {
        ...card,
        activityLog: [...(card.activityLog || []), activity],
        dateLastActivity: activity.timestamp,
    };
}

export default {
    createEmptyCard,
    calculateCardBadges,
    addActivity,
};
