/**
 * Drag & Drop Rules Engine
 * Handles all drag and drop logic with permission checks
 */

import { DRAG_DROP_RULES, COLUMN_TYPES } from "./constants";
import { canPerformAction } from "./permissions";

/**
 * Check if a move is allowed by drag & drop rules
 */
export const isMoveAllowed = (
    fromColumnId,
    toColumnId,
    fromSubColumnId,
    toSubColumnId,
) => {
    // Check if source or destination is restricted
    if (
        DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(fromColumnId) ||
        DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(toColumnId)
    ) {
        return false;
    }

    // Check if source or destination subcolumn is restricted
    if (
        DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(fromSubColumnId) ||
        DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(toSubColumnId)
    ) {
        return false;
    }

    // Check allowed moves for main columns
    const allowedMoves = DRAG_DROP_RULES.ALLOWED_MOVES[fromColumnId];
    if (!allowedMoves) {
        return false;
    }

    return allowedMoves.includes(toColumnId);
};

/**
 * Get valid drop targets for a card
 */
export const getValidDropTargets = (card) => {
    const fromColumnId = card.columnId;
    const fromSubColumnId = card.subcolumnId;

    const validTargets = [];

    // Check each possible target column
    Object.keys(DRAG_DROP_RULES.ALLOWED_MOVES).forEach((targetColumnId) => {
        if (isMoveAllowed(fromColumnId, targetColumnId, fromSubColumnId)) {
            validTargets.push({
                columnId: targetColumnId,
                subcolumnId: null,
                reason: "Valid move target",
            });
        }
    });

    return validTargets;
};

/**
 * Validate drag operation before it starts
 */
export const validateDragStart = (card, user) => {
    const validation = {
        canDrag: false,
        reason: null,
        restrictions: [],
    };

    if (user != null) {
        if (!user._id) {
            validation.canDrag = false;
            validation.reason = "Authentication required";
            validation.restrictions.push("auth_required");
            return validation;
        }
        const moveContext = { fromColumn: card.columnId };
        if (!canPerformAction(user, "MOVE_CARD", card, moveContext)) {
            validation.canDrag = false;
            validation.reason = "You do not have permission to move cards";
            validation.restrictions.push("permission_denied");
            return validation;
        }
    }

    // Check if card is in a restricted column
    if (DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(card.columnId)) {
        validation.canDrag = false;
        validation.reason = "Cannot drag from restricted column";
        validation.restrictions.push("restricted_source");
        return validation;
    }

    // Check if card is in a restricted subcolumn
    if (
        card.subcolumnId &&
        DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(card.subcolumnId)
    ) {
        validation.canDrag = false;
        validation.reason = "Cannot drag from restricted subcolumn";
        validation.restrictions.push("restricted_subcolumn_source");
        return validation;
    }

    validation.canDrag = true;
    return validation;
};

/**
 * Validate drop operation
 */
export const validateDrop = (card, targetColumnId, targetSubColumnId, user) => {
    const validation = {
        canDrop: false,
        reason: null,
        restrictions: [],
    };

    if (user != null) {
        if (!user._id) {
            validation.canDrop = false;
            validation.reason = "Authentication required";
            validation.restrictions.push("auth_required");
            return validation;
        }
        const moveContext = {
            fromColumn: card.columnId,
            toColumn: targetColumnId,
        };
        if (!canPerformAction(user, "MOVE_CARD", card, moveContext)) {
            validation.canDrop = false;
            validation.reason = "You do not have permission to move cards";
            validation.restrictions.push("permission_denied");
            return validation;
        }
    }

    // Check if target is restricted
    if (DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(targetColumnId)) {
        validation.canDrop = false;
        validation.reason = "Cannot drop to restricted column";
        validation.restrictions.push("restricted_destination");
        return validation;
    }

    // Check if target subcolumn is restricted
    if (
        targetSubColumnId &&
        DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(targetSubColumnId)
    ) {
        validation.canDrop = false;
        validation.reason = "Cannot drop to restricted subcolumn";
        validation.restrictions.push("restricted_subcolumn_destination");
        return validation;
    }

    // Check if move is allowed by rules
    if (
        !isMoveAllowed(
            card.columnId,
            targetColumnId,
            card.subcolumnId,
            targetSubColumnId,
        )
    ) {
        validation.canDrop = false;
        validation.reason = "Move not allowed by drag & drop rules";
        validation.restrictions.push("invalid_move");
        return validation;
    }

    validation.canDrop = true;
    return validation;
};

/**
 * Get visual feedback for drag operation
 */
export const getDragFeedback = (card, targetColumnId, targetSubColumnId, user) => {
    const validation = validateDrop(card, targetColumnId, targetSubColumnId, user);

    return {
        isValid: validation.canDrop,
        feedback: validation.canDrop ? "valid" : "invalid",
        message: validation.reason,
        restrictions: validation.restrictions,
    };
};

/**
 * Calculate new position for dropped card
 */
export const calculateNewPosition = (
    cards,
    targetColumnId,
    targetSubColumnId,
    dropIndex,
) => {
    const targetCards = cards
        .filter(
            (card) =>
                card.columnId === targetColumnId &&
                card.subcolumnId === targetSubColumnId,
        )
        .sort((a, b) => a.position - b.position);

    if (targetCards.length === 0) {
        return 0;
    }

    if (dropIndex === 0) {
        return targetCards[0].position - 1;
    }

    if (dropIndex >= targetCards.length) {
        return targetCards[targetCards.length - 1].position + 1;
    }

    const prevCard = targetCards[dropIndex - 1];
    const nextCard = targetCards[dropIndex];

    return (prevCard.position + nextCard.position) / 2;
};

/**
 * Reorder cards after move
 */
export const reorderCards = (cards, columnId, subColumnId) => {
    const columnCards = cards
        .filter(
            (card) =>
                card.columnId === columnId && card.subcolumnId === subColumnId,
        )
        .sort((a, b) => a.position - b.position);

    return columnCards.map((card, index) => ({
        ...card,
        position: index * 1000, // Use large intervals for easier reordering
    }));
};

/**
 * Get drag preview data
 */
export const getDragPreview = (card) => {
    return {
        id: card._id,
        title: card.title,
        priority: card.priority,
        labels: card.labels,
        assignees: card.assignees,
        dueDate: card.dueDate,
    };
};

/**
 * Check if column accepts drops
 */
export const canColumnAcceptDrops = (columnId, subColumnId) => {
    return (
        !DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(columnId) &&
        !DRAG_DROP_RULES.RESTRICTED_COLUMNS.includes(subColumnId)
    );
};

/**
 * Get drop zone indicators
 */
export const getDropZoneIndicators = (columnId, subColumnId, cards) => {
    const canAccept = canColumnAcceptDrops(columnId, subColumnId);

    if (!canAccept) {
        return {
            showDropZone: false,
            dropZoneClass: "drop-zone-restricted",
            message: "Cannot drop cards here",
        };
    }

    const cardCount = cards.filter(
        (card) =>
            card.columnId === columnId && card.subcolumnId === subColumnId,
    ).length;

    return {
        showDropZone: true,
        dropZoneClass: "drop-zone-valid",
        message: `Drop here (${cardCount} cards)`,
        cardCount,
    };
};

/**
 * Handle drag end with validation
 */
export const handleDragEnd = (
    card,
    targetColumnId,
    targetSubColumnId,
    targetPosition,
    user,
) => {
    const validation = validateDrop(
        card,
        targetColumnId,
        targetSubColumnId,
        user,
    );

    if (!validation.canDrop) {
        return {
            success: false,
            error: validation.reason,
            rollbackData: {
                cardId: card._id,
                fromColumnId: card.columnId,
                toColumnId: targetColumnId,
                fromPosition: card.position,
                toPosition: targetPosition,
                fromSubColumnId: card.subcolumnId,
                toSubColumnId: targetSubColumnId,
            },
        };
    }

    return {
        success: true,
        moveData: {
            cardId: card._id,
            fromColumnId: card.columnId,
            toColumnId: targetColumnId,
            fromPosition: card.position,
            toPosition: targetPosition,
            fromSubColumnId: card.subcolumnId,
            toSubColumnId: targetSubColumnId,
        },
    };
};

/**
 * Get drag & drop rules summary
 */
export const getDragDropRulesSummary = () => {
    return {
        restrictedColumns: DRAG_DROP_RULES.RESTRICTED_COLUMNS,
        allowedMoves: DRAG_DROP_RULES.ALLOWED_MOVES,
        rules: [
            "Cards cannot be moved from or to < 7 Days and > 7 Days columns",
            "Cards can be moved between Sales, Office, Production, Ready, Drivers, and Done Today",
            "Done Today can receive cards from any main column",
            "System automatically manages < 7 Days and > 7 Days columns",
        ],
    };
};

/**
 * Check if user can perform drag operation
 */
export const canUserDragCard = (user, card) => {
    if (!user || !user._id) return false;
    const moveContext = { fromColumn: card?.columnId };
    return canPerformAction(user, "MOVE_CARD", card ?? null, moveContext);
};

/**
 * Check if user can perform drop operation
 */
export const canUserDropCard = (user, card, targetColumnId) => {
    if (!user || !user._id) return false;
    const moveContext = {
        fromColumn: card?.columnId,
        toColumn: targetColumnId,
    };
    return canPerformAction(user, "MOVE_CARD", card ?? null, moveContext);
};

/**
 * Get drag & drop constraints for UI
 */
export const getDragDropConstraints = (user) => {
    const canMoveCards = user ? canPerformAction(user, "MOVE_CARD", null, {}) : false;
    return {
        canDrag: canMoveCards,
        canDrop: canMoveCards,
        restrictedColumns: DRAG_DROP_RULES.RESTRICTED_COLUMNS,
        allowedMoves: DRAG_DROP_RULES.ALLOWED_MOVES,
        userPermissions: {
            canMoveCards,
            canReorderCards: canMoveCards,
        },
    };
};

export default {
    isMoveAllowed,
    getValidDropTargets,
    validateDragStart,
    validateDrop,
    getDragFeedback,
    calculateNewPosition,
    reorderCards,
    getDragPreview,
    canColumnAcceptDrops,
    getDropZoneIndicators,
    handleDragEnd,
    getDragDropRulesSummary,
    canUserDragCard,
    canUserDropCard,
    getDragDropConstraints,
};
