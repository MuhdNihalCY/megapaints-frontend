/**
 * KanbanContext
 * Main context for Kanban board state management
 * Implements Trello-style Kanban with proper column structure and live API integration
 */

import React, {
    createContext,
    useContext,
    useReducer,
    useEffect,
    useCallback,
} from "react";
import { kanbanService } from "../services/kanbanService";
import {
    logCardCreated,
    logCardUpdated,
    logCardMoved,
    logCardDeleted,
} from "../utils/activityLogger";
import { normalizeComment } from "../utils/commentUtils";
import { canPerformAction as checkPermission } from "../utils/permissions";

// Initial state
const initialState = {
    cards: [],
    columns: [],
    users: [],
    labels: [],
    user: null,
    board: null,
    filters: {
        text: "",
        labels: [],
        assignees: [],
        dueDateRange: {
            start: null,
            end: null,
        },
        priority: [],
        columns: [],
    },
    searchTerm: "",
    isLoading: false,
    error: null,
    lastUpdated: null,
    initialized: false,
};

// Action types
const ACTION_TYPES = {
    SET_LOADING: "SET_LOADING",
    SET_ERROR: "SET_ERROR",
    SET_CARDS: "SET_CARDS",
    SET_COLUMNS: "SET_COLUMNS",
    SET_USERS: "SET_USERS",
    SET_LABELS: "SET_LABELS",
    SET_USER: "SET_USER",
    SET_BOARD: "SET_BOARD",
    ADD_CARD: "ADD_CARD",
    UPDATE_CARD: "UPDATE_CARD",
    DELETE_CARD: "DELETE_CARD",
    MOVE_CARD: "MOVE_CARD",
    SET_FILTERS: "SET_FILTERS",
    SET_SEARCH_TERM: "SET_SEARCH_TERM",
    CLEAR_FILTERS: "CLEAR_FILTERS",
    UPDATE_COLUMN: "UPDATE_COLUMN",
    SET_LAST_UPDATED: "SET_LAST_UPDATED",
    MARK_INITIALIZED: "MARK_INITIALIZED",
    CLEAR_ERROR: "CLEAR_ERROR",
};

// Reducer
const kanbanReducer = (state, action) => {
    switch (action.type) {
        case ACTION_TYPES.SET_LOADING:
            return { ...state, isLoading: action.payload };

        case ACTION_TYPES.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false };

        case ACTION_TYPES.CLEAR_ERROR:
            return { ...state, error: null };

        case ACTION_TYPES.SET_CARDS:
            return { ...state, cards: action.payload };

        case ACTION_TYPES.SET_COLUMNS:
            return { ...state, columns: action.payload };

        case ACTION_TYPES.SET_USERS:
            return { ...state, users: action.payload };

        case ACTION_TYPES.SET_LABELS:
            return { ...state, labels: action.payload };

        case ACTION_TYPES.SET_USER:
            return { ...state, user: action.payload };

        case ACTION_TYPES.SET_BOARD:
            return { ...state, board: action.payload };

        case ACTION_TYPES.ADD_CARD:
            return { ...state, cards: [...state.cards, action.payload] };

        case ACTION_TYPES.UPDATE_CARD:
            return {
                ...state,
                cards: state.cards.map((card) => {
                    // Match by id or _id
                    const cardId = card.id || card._id;
                    const payloadId = action.payload.id || action.payload._id;
                    if (cardId === payloadId) {
                        return { ...card, ...action.payload };
                    }
                    return card;
                }),
            };

        case ACTION_TYPES.DELETE_CARD:
            return {
                ...state,
                cards: state.cards.filter((card) => card.id !== action.payload),
            };

        case ACTION_TYPES.MOVE_CARD:
            return {
                ...state,
                cards: state.cards.map((card) =>
                    card.id === action.payload.cardId
                        ? {
                              ...card,
                              columnId: action.payload.columnId,
                              listId: action.payload.columnId, // Sync listId with columnId
                              column_id: action.payload.columnId, // Sync column_id with columnId
                              subcolumnId: action.payload.subcolumnId,
                              position:
                                  action.payload.position ?? card.position,
                          }
                        : card,
                ),
            };

        case ACTION_TYPES.SET_FILTERS:
            return {
                ...state,
                filters: { ...state.filters, ...action.payload },
            };

        case ACTION_TYPES.SET_SEARCH_TERM:
            return { ...state, searchTerm: action.payload };

        case ACTION_TYPES.CLEAR_FILTERS:
            return { ...state, filters: initialState.filters };

        case ACTION_TYPES.UPDATE_COLUMN:
            return {
                ...state,
                columns: state.columns.map((column) =>
                    column.id === action.payload.id
                        ? { ...column, ...action.payload }
                        : column,
                ),
            };

        case ACTION_TYPES.SET_LAST_UPDATED:
            return { ...state, lastUpdated: action.payload };

        case ACTION_TYPES.MARK_INITIALIZED:
            return { ...state, initialized: true, isLoading: false };

        default:
            return state;
    }
};

// Create context
const KanbanContext = createContext();

// Provider component
export const KanbanProvider = ({ children, user }) => {
    const [state, dispatch] = useReducer(kanbanReducer, initialState);

    // Set user when provided
    useEffect(() => {
        if (user) {
            dispatch({ type: ACTION_TYPES.SET_USER, payload: user });
        } else {
            // Create a mock user for development
            const mockUser = {
                id: "dev-user-1",
                name: "Development User",
                email: "dev@example.com",
                role: "Sales",
                permissions: [
                    "VIEW_BOARD",
                    "CREATE_CARD",
                    "EDIT_CARD",
                    "MOVE_CARD",
                    "COMMENT",
                    "SEARCH_CARDS",
                    "VIEW_ACTIVITY",
                ],
            };
            dispatch({ type: ACTION_TYPES.SET_USER, payload: mockUser });
        }
    }, [user]);

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = useCallback(async () => {
        try {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

            // Try to fetch users from API
            let users = [];
            try {
                users = await kanbanService.getUsers();

                // Ensure users is an array (handle null/undefined responses)
                if (!Array.isArray(users)) {
                    users = [];
                }
            } catch (error) {
                users = [];
            }

            // Try to fetch boards from API and get the first one
            let board = null;
            try {
                const boardsResponse = await kanbanService.getBoards({
                    limit: 1,
                });

                // Handle different response formats
                let boards = [];
                if (boardsResponse?.status === "success") {
                    // Response format: { status: 'success', data: { boards: [...], pagination: {...} } }
                    boards =
                        boardsResponse.data?.boards ||
                        boardsResponse.data ||
                        [];
                } else if (Array.isArray(boardsResponse)) {
                    boards = boardsResponse;
                } else if (
                    boardsResponse?.data &&
                    Array.isArray(boardsResponse.data)
                ) {
                    boards = boardsResponse.data;
                } else if (
                    boardsResponse?.boards &&
                    Array.isArray(boardsResponse.boards)
                ) {
                    boards = boardsResponse.boards;
                }

                if (Array.isArray(boards) && boards.length > 0) {
                    board = boards[0];
                    // Transform board data to ensure we have id and _id
                    board = {
                        id: board.id || board._id,
                        _id: board._id || board.id,
                        name: board.name || "Kanban Board",
                        ...board,
                    };
                }
            } catch (error) {
                console.error("🔴 Failed to fetch boards:", error);
                console.error("Error details:", {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                });
            }

            // If no board found, create a default one (but this should not happen in production)
            if (!board) {
                console.error(
                    "❌ No board found in database. Card creation will fail. Please create a board first.",
                );
                board = { id: "default-board-id", name: "Default Board" };
            }

            // Fetch columns from backend for this board - ONLY use backend columns
            let columns = [];
            if (board && (board.id || board._id)) {
                try {
                    const columnsResponse = await kanbanService.getColumns(
                        board.id || board._id,
                    );

                    // Handle different response structures
                    let backendColumns = [];
                    if (columnsResponse?.status === "success") {
                        backendColumns =
                            columnsResponse.data?.columns ||
                            columnsResponse.data ||
                            [];
                    } else if (columnsResponse?.data?.columns) {
                        backendColumns = columnsResponse.data.columns;
                    } else if (columnsResponse?.columns) {
                        backendColumns = columnsResponse.columns;
                    } else if (Array.isArray(columnsResponse)) {
                        backendColumns = columnsResponse;
                    }

                    // Transform backend columns to frontend format - use backend data as-is
                    columns = backendColumns.map((col, index) => {
                        // Ensure column has a valid MongoDB ObjectId - required for DnD operations
                        const columnId =
                            col._id?.toString() || col.id?.toString();
                        if (!columnId) {
                            console.error(
                                `❌ Column at index ${index} (${col.name}) is missing _id. This will cause DnD issues.`,
                            );
                            // Still create the column but log the error - the backend should always provide _id
                        }

                        const subColumns = col.sub_columns || [];
                        const isGrouped =
                            (col.has_sub_columns && subColumns.length > 0) ||
                            false;

                        console.log(
                            "[SUB-COL] Transforming column from backend",
                            {
                                columnIndex: index,
                                columnId: columnId,
                                columnName: col.name,
                                hasSubColumns: col.has_sub_columns,
                                subColumnsFromBackend: subColumns,
                                subColumnsCount: subColumns.length,
                                subColumnDetails: subColumns.map((sc) => ({
                                    id: sc.id,
                                    name: sc.name,
                                    is_user_based: sc.is_user_based,
                                    user_id: sc.user_id,
                                })),
                                isGrouped: isGrouped,
                            },
                        );

                        return {
                            id: columnId, // Use backend _id as id - MUST be MongoDB ObjectId
                            _id: columnId, // Keep backend _id
                            title: col.name, // Backend uses 'name', frontend uses 'title'
                            name: col.name, // Also keep name for compatibility
                            color: col.color || "#007bff",
                            position: col.position ?? index,
                            isActive: col.is_active !== false,
                            is_active: col.is_active !== false,
                            has_sub_columns: col.has_sub_columns || false,
                            subcolumns: subColumns, // Include sub-columns from backend (static + dynamic merged)
                            sub_columns: subColumns, // Also keep sub_columns for compatibility
                            type: "static", // Default type
                            isGrouped: isGrouped,
                            cards: [],
                            settings: {},
                        };
                    });

                    console.log("[SUB-COL] All columns transformed", {
                        totalColumns: columns.length,
                        columnsWithSubColumns: columns
                            .filter(
                                (c) => c.subcolumns && c.subcolumns.length > 0,
                            )
                            .map((c) => ({
                                id: c.id,
                                name: c.name,
                                subColumnsCount: c.subcolumns.length,
                                subColumnNames: c.subcolumns.map(
                                    (sc) => sc.name,
                                ),
                            })),
                    });
                } catch (error) {
                    console.error(
                        "❌ Failed to fetch columns from backend:",
                        error,
                    );
                    // Do NOT fall back to default columns - only use backend columns
                    columns = [];
                }
            } else {
                console.error("❌ No board ID available, cannot fetch columns");
                columns = [];
            }

            // Fetch cards from backend for this board
            let cards = [];
            if (board && (board.id || board._id)) {
                try {
                    const boardId = board.id || board._id;
                    const cardsResponse = await kanbanService.getTasks({
                        board_id: boardId,
                    });

                    // Handle different response structures
                    let backendCards = [];
                    if (cardsResponse?.status === "success") {
                        backendCards =
                            cardsResponse.data?.tasks ||
                            cardsResponse.data?.cards ||
                            cardsResponse.data ||
                            [];
                    } else if (cardsResponse?.data?.tasks) {
                        backendCards = cardsResponse.data.tasks;
                    } else if (cardsResponse?.data?.cards) {
                        backendCards = cardsResponse.data.cards;
                    } else if (cardsResponse?.tasks) {
                        backendCards = cardsResponse.tasks;
                    } else if (cardsResponse?.cards) {
                        backendCards = cardsResponse.cards;
                    } else if (Array.isArray(cardsResponse)) {
                        backendCards = cardsResponse;
                    }

                    // Transform backend cards to frontend format
                    if (backendCards.length > 0) {
                        cards = backendCards
                            .map((card) => {
                                try {
                                    const transformed =
                                        kanbanService.transformCardData(card);
                                    return transformed;
                                } catch (transformError) {
                                    console.error(
                                        "🔴 Error transforming card:",
                                        transformError,
                                        card,
                                    );
                                    return null;
                                }
                            })
                            .filter((card) => card !== null); // Remove any null cards from transformation errors
                    }
                } catch (error) {
                    console.error(
                        "🔴 Failed to fetch cards from backend:",
                        error,
                    );
                    console.error("Error details:", {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status,
                        stack: error.stack,
                    });
                    // Continue with empty cards array if fetch fails
                }
            } else {
            }

            // Fetch labels from backend
            let labels = [];
            try {
                const labelsResponse = await kanbanService.getLabels();

                // Handle different response structures
                if (labelsResponse?.status === "success") {
                    labels =
                        labelsResponse.data?.labels ||
                        labelsResponse.data ||
                        [];
                } else if (labelsResponse?.data?.labels) {
                    labels = labelsResponse.data.labels;
                } else if (labelsResponse?.labels) {
                    labels = labelsResponse.labels;
                } else if (Array.isArray(labelsResponse)) {
                    labels = labelsResponse;
                }
            } catch (error) {
                // Continue with empty labels array if fetch fails
            }

            // Set default data
            dispatch({ type: ACTION_TYPES.SET_COLUMNS, payload: columns });
            dispatch({ type: ACTION_TYPES.SET_CARDS, payload: cards });
            dispatch({ type: ACTION_TYPES.SET_LABELS, payload: labels });
            dispatch({ type: ACTION_TYPES.SET_USERS, payload: users });
            dispatch({ type: ACTION_TYPES.SET_BOARD, payload: board });
            dispatch({
                type: ACTION_TYPES.SET_LAST_UPDATED,
                payload: new Date().toISOString(),
            });
            dispatch({ type: ACTION_TYPES.MARK_INITIALIZED });
        } catch (error) {
            console.error("Error loading initial data:", error);
            dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
        }
    }, []);

    // Create card
    const createCard = useCallback(
        async (cardData) => {
            try {
                dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

                // Pass labels context for label transformation
                const cardDataWithLabels = {
                    ...cardData,
                    _availableLabels: state.labels,
                };
                const result =
                    await kanbanService.createCard(cardDataWithLabels);

                if (result && result.status === "success") {
                    // Backend returns { data: { task } }, so extract the task
                    const taskData = result.data?.task || result.data;
                    const transformedCard =
                        kanbanService.transformCardData(taskData);
                    dispatch({
                        type: ACTION_TYPES.ADD_CARD,
                        payload: transformedCard,
                    });

                    // Log activity (non-blocking - backend already logs activity in activity_log)
                    try {
                        const activity = logCardCreated(
                            transformedCard,
                            state.user,
                        );
                        await kanbanService.logActivity(activity);
                    } catch (activityError) {
                        // Activity logging is optional - backend already logs activity
                    }

                    return transformedCard;
                } else {
                    console.error("🔴 Invalid result from createCard", result);
                    throw new Error(
                        result?.error ||
                            result?.message ||
                            "Failed to create card",
                    );
                }
            } catch (error) {
                console.error("🔴 Error in KanbanContext.createCard", error);
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.user, state.labels],
    );

    // Update card
    const updateCard = useCallback(
        async (cardId, updates) => {
            try {
                dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

                // Transform updates to backend format (pass labels for label lookup)
                const updatesWithLabels = {
                    ...updates,
                    _availableLabels: state.labels,
                };
                const backendUpdates =
                    kanbanService.transformTaskToApi(updatesWithLabels);

                const result = await kanbanService.updateCard(
                    cardId,
                    backendUpdates,
                );

                if (result.status === "success") {
                    // Handle both { data: { task } } and { data: task } response formats
                    const taskData = result.data?.task || result.data;
                    const transformedCard =
                        kanbanService.transformCardData(taskData);

                    // Ensure card has both id and _id for matching
                    if (!transformedCard._id)
                        transformedCard._id = transformedCard.id;
                    if (!transformedCard.id)
                        transformedCard.id = transformedCard._id;

                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: transformedCard,
                    });

                    // Note: Activity logging is handled in TrelloCardModal

                    dispatch({
                        type: ACTION_TYPES.SET_LOADING,
                        payload: false,
                    });
                    return transformedCard;
                } else {
                    throw new Error(result.error || "Failed to update card");
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
                throw error;
            }
        },
        [state.user],
    );

    // Delete card
    const deleteCard = useCallback(
        async (cardId) => {
            try {
                dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

                const result = await kanbanService.deleteCard(cardId);

                if (result.status === "success") {
                    dispatch({
                        type: ACTION_TYPES.DELETE_CARD,
                        payload: cardId,
                    });

                    // Log activity
                    const activity = logCardDeleted(cardId, state.user);
                    await kanbanService.logActivity(activity);

                    return result;
                } else {
                    throw new Error(result.error || "Failed to delete card");
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.user],
    );

    // Optimistically update card positions (for immediate UI feedback during reordering)
    const updateCardPositionsOptimistic = useCallback((positionUpdates) => {
        // Update all cards' positions immediately without API calls
        positionUpdates.forEach((update) => {
            dispatch({
                type: ACTION_TYPES.UPDATE_CARD,
                payload: {
                    id: update.cardId,
                    position: update.position,
                },
            });
        });
    }, []);

    // Move card with DnD rules enforcement
    const moveCard = useCallback(
        async (cardId, moveData) => {
            try {
                dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

                // Check if move is allowed based on DnD rules
                const card = state.cards.find((c) => c.id === cardId);
                const fromColumn = state.columns.find(
                    (c) => c.id === card?.columnId,
                );
                const toColumn = state.columns.find(
                    (c) => c.id === moveData.toColumnId,
                );

                if (
                    !kanbanService.isMoveAllowed(
                        fromColumn,
                        toColumn,
                        card?.subcolumnId,
                        moveData.toSubColumnId,
                    )
                ) {
                    throw new Error(
                        "Move not allowed: Cannot move cards to/from < 7 Days or > 7 Days columns",
                    );
                }

                const result = await kanbanService.moveCard(cardId, moveData);

                if (result.status === "success") {
                    const transformedCard = kanbanService.transformCardData(
                        result.data,
                    );
                    dispatch({
                        type: ACTION_TYPES.MOVE_CARD,
                        payload: {
                            cardId,
                            columnId: moveData.toColumnId,
                            subcolumnId: moveData.toSubColumnId,
                            position:
                                moveData.position ??
                                transformedCard.position ??
                                0,
                        },
                    });

                    // Log activity
                    const activity = logCardMoved(
                        transformedCard,
                        state.user,
                        moveData,
                    );
                    await kanbanService.logActivity(activity);

                    return transformedCard;
                } else {
                    throw new Error(result.error || "Failed to move card");
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards, state.columns, state.user],
    );

    // Toggle column activation
    const toggleColumnActivation = useCallback(
        async (columnId, isActive) => {
            try {
                dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

                const result = await kanbanService.toggleColumnActivation(
                    columnId,
                    isActive,
                );

                if (result.status === "success") {
                    dispatch({
                        type: ACTION_TYPES.UPDATE_COLUMN,
                        payload: {
                            id: columnId,
                            isActive,
                        },
                    });

                    // Log activity
                    const activity = {
                        type: "column_toggled",
                        columnId,
                        isActive,
                        timestamp: new Date().toISOString(),
                        userId: state.user?.id,
                    };
                    await kanbanService.logActivity(activity);

                    return result;
                } else {
                    throw new Error(result.error || "Failed to toggle column");
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.user],
    );

    // Search cards in specific column (for > 7 Days column)
    const searchCardsInColumn = useCallback(async (columnId, query) => {
        try {
            const result = await kanbanService.searchCardsInColumn(
                columnId,
                query,
            );
            return result;
        } catch (error) {
            throw error;
        }
    }, []);

    // Add comment to card
    const addComment = useCallback(
        async (cardId, commentData) => {
            try {
                const result = await kanbanService.addComment(
                    cardId,
                    commentData,
                );

                if (result.status === "success") {
                    const rawComment = result.data?.comment ?? result.data;
                    const normalized = normalizeComment(rawComment);
                    const card = state.cards.find(
                        (c) => c.id === cardId || c._id === cardId,
                    );
                    if (card) {
                        const updatedCard = {
                            ...card,
                            comments: [...(card.comments || []), normalized],
                        };
                        dispatch({
                            type: ACTION_TYPES.UPDATE_CARD,
                            payload: updatedCard,
                        });
                    }
                    return normalized;
                } else {
                    throw new Error(result.error || "Failed to add comment");
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Update comment
    const updateComment = useCallback(
        async (cardId, commentId, updates) => {
            try {
                const result = await kanbanService.updateComment(
                    cardId,
                    commentId,
                    updates,
                );

                if (result.status === "success") {
                    const rawComment = result.data?.comment ?? result.data;
                    const normalized = normalizeComment(rawComment);
                    const card = state.cards.find(
                        (c) => c.id === cardId || c._id === cardId,
                    );
                    if (card) {
                        const commentIdStr = String(commentId);
                        const updatedCard = {
                            ...card,
                            comments: (card.comments || []).map((comment) => {
                                const cid =
                                    comment.id ?? comment._id?.toString?.();
                                if (String(cid) === commentIdStr) {
                                    return { ...comment, ...normalized };
                                }
                                return comment;
                            }),
                        };
                        dispatch({
                            type: ACTION_TYPES.UPDATE_CARD,
                            payload: updatedCard,
                        });
                    }
                    return normalized;
                } else {
                    throw new Error(result.error || "Failed to update comment");
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Delete comment
    const deleteComment = useCallback(
        async (cardId, commentId) => {
            try {
                const result = await kanbanService.deleteComment(
                    cardId,
                    commentId,
                );

                if (result.status === "success") {
                    // Update card with deleted comment
                    const card = state.cards.find(
                        (c) => c.id === cardId || c._id === cardId,
                    );
                    if (card) {
                        const updatedCard = {
                            ...card,
                            comments: card.comments.filter(
                                (comment) =>
                                    comment.id !== commentId &&
                                    comment._id !== commentId,
                            ),
                        };
                        dispatch({
                            type: ACTION_TYPES.UPDATE_CARD,
                            payload: updatedCard,
                        });
                    }

                    return result;
                } else {
                    throw new Error(result.error || "Failed to delete comment");
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Set filters
    const setFilters = useCallback((filters) => {
        dispatch({ type: ACTION_TYPES.SET_FILTERS, payload: filters });
    }, []);

    // Set search term
    const setSearchTerm = useCallback((searchTerm) => {
        dispatch({ type: ACTION_TYPES.SET_SEARCH_TERM, payload: searchTerm });
    }, []);

    // Clear filters
    const clearFilters = useCallback(() => {
        dispatch({ type: ACTION_TYPES.CLEAR_FILTERS });
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
    }, []);

    // ==================== LABEL METHODS ====================

    // Fetch labels by branch
    const fetchLabelsByBranch = useCallback(async (branchId) => {
        try {
            const result = await kanbanService.getLabelsByBranch(branchId);
            if (result && result.data && result.data.labels) {
                dispatch({
                    type: ACTION_TYPES.SET_LABELS,
                    payload: result.data.labels,
                });
            }
            return result;
        } catch (error) {
            dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
            throw error;
        }
    }, []);

    // Create label
    const createLabel = useCallback(
        async (labelData) => {
            try {
                const result = await kanbanService.createLabel(labelData);
                // Handle both response formats: { status: 'success', data: { label } } or { data: { label } }
                const label = result?.data?.label || result?.label;
                if (label) {
                    // Add new label to state
                    dispatch({
                        type: ACTION_TYPES.SET_LABELS,
                        payload: [...state.labels, label],
                    });
                }
                return result;
            } catch (error) {
                const errorMessage =
                    error.message ||
                    error.response?.data?.message ||
                    "Failed to create label";
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: errorMessage,
                });
                throw error;
            }
        },
        [state.labels],
    );

    // Update label
    const updateLabel = useCallback(
        async (labelId, labelData) => {
            try {
                const result = await kanbanService.updateLabel(
                    labelId,
                    labelData,
                );
                if (result && result.data && result.data.label) {
                    // Update label in state
                    const updatedLabels = state.labels.map((label) =>
                        label._id === labelId || label.id === labelId
                            ? result.data.label
                            : label,
                    );
                    dispatch({
                        type: ACTION_TYPES.SET_LABELS,
                        payload: updatedLabels,
                    });
                }
                return result;
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.labels],
    );

    // Delete label
    const deleteLabel = useCallback(
        async (labelId) => {
            try {
                await kanbanService.deleteLabel(labelId);
                // Remove label from state
                const updatedLabels = state.labels.filter(
                    (label) => label._id !== labelId && label.id !== labelId,
                );
                dispatch({
                    type: ACTION_TYPES.SET_LABELS,
                    payload: updatedLabels,
                });
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.labels],
    );

    // Get cards by column
    const getCardsByColumn = useCallback(
        (columnId) => {
            return state.cards.filter((card) => card.columnId === columnId);
        },
        [state.cards],
    );

    // Get cards by subcolumn
    const getCardsBySubcolumn = useCallback(
        (columnId, subcolumnId) => {
            return state.cards.filter(
                (card) =>
                    card.columnId === columnId &&
                    card.subcolumnId === subcolumnId,
            );
        },
        [state.cards],
    );

    // Get active columns
    const getActiveColumns = useCallback(() => {
        return state.columns.filter((column) => column.isActive !== false);
    }, [state.columns]);

    // Check if user can perform action (permissions)
    const canPerformAction = useCallback(
        (action, resource = null) => {
            const user = state.user;
            return checkPermission(user, action, resource);
        },
        [state.user],
    );

    // ==================== ATTACHMENT METHODS ====================

    // Add attachment to card
    const addAttachment = useCallback(
        async (cardId, attachmentData) => {
            try {
                const result = await kanbanService.addAttachment(
                    cardId,
                    attachmentData,
                );

                if (result) {
                    // Extract the attachment object from the response
                    // Backend returns: { status: 'success', data: { attachment: {...} } }
                    const uploadedAttachment =
                        result.data?.attachment || result.attachment || result;

                    // Optimistically update card with new attachment
                    const card = state.cards.find((c) => c.id === cardId);
                    if (card) {
                        const updatedCard = {
                            ...card,
                            attachments: [
                                ...(card.attachments || []),
                                uploadedAttachment,
                            ],
                        };
                        dispatch({
                            type: ACTION_TYPES.UPDATE_CARD,
                            payload: updatedCard,
                        });
                    }
                    // Return the actual attachment object (with MongoDB _id)
                    return uploadedAttachment;
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Delete attachment from card
    const deleteAttachment = useCallback(
        async (cardId, attachmentId) => {
            try {
                await kanbanService.deleteAttachment(cardId, attachmentId);

                // Optimistically update card
                const card = state.cards.find((c) => c.id === cardId);
                if (card) {
                    const updatedCard = {
                        ...card,
                        attachments: (card.attachments || []).filter(
                            (a) => a.id !== attachmentId,
                        ),
                    };
                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: updatedCard,
                    });
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Set card cover image
    const setCardCover = useCallback(
        async (cardId, coverData) => {
            try {
                await kanbanService.setCardCover(cardId, coverData);

                // Optimistically update card
                const card = state.cards.find((c) => c.id === cardId);
                if (card) {
                    const updatedCard = {
                        ...card,
                        coverImage: coverData,
                    };
                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: updatedCard,
                    });
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // ==================== CHECKLIST METHODS ====================

    // Add checklist to card
    const addChecklist = useCallback(
        async (cardId, checklistData) => {
            try {
                const result = await kanbanService.addChecklist(
                    cardId,
                    checklistData,
                );

                if (result) {
                    // Backend returns { data: { checklist } }; normalize for frontend (use .id)
                    const raw =
                        result?.data?.checklist ?? result;
                    const checklist = raw
                        ? {
                            ...raw,
                            id: raw.id ?? raw._id,
                            items: (raw.items || []).map((it) => ({
                                ...it,
                                id: it.id ?? it._id,
                                name: it.name ?? it.text,
                            })),
                        }
                        : null;
                    if (!checklist) return result;

                    // Optimistically update card with new checklist
                    const card = state.cards.find((c) => c.id === cardId);
                    if (card) {
                        const updatedCard = {
                            ...card,
                            checklists: [...(card.checklists || []), checklist],
                        };
                        dispatch({
                            type: ACTION_TYPES.UPDATE_CARD,
                            payload: updatedCard,
                        });
                    }
                    return checklist;
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Update checklist
    const updateChecklist = useCallback(
        async (cardId, checklistId, checklistData) => {
            try {
                await kanbanService.updateChecklist(
                    cardId,
                    checklistId,
                    checklistData,
                );

                // Optimistically update card
                const card = state.cards.find((c) => c.id === cardId);
                if (card) {
                    const updatedCard = {
                        ...card,
                        checklists: (card.checklists || []).map((cl) =>
                            cl.id === checklistId
                                ? { ...cl, ...checklistData }
                                : cl,
                        ),
                    };
                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: updatedCard,
                    });
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Delete checklist from card
    const deleteChecklist = useCallback(
        async (cardId, checklistId) => {
            try {
                await kanbanService.deleteChecklist(cardId, checklistId);

                // Optimistically update card
                const card = state.cards.find((c) => c.id === cardId);
                if (card) {
                    const updatedCard = {
                        ...card,
                        checklists: (card.checklists || []).filter(
                            (cl) => cl.id !== checklistId,
                        ),
                    };
                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: updatedCard,
                    });
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // Toggle checklist item
    const toggleChecklistItem = useCallback(
        async (cardId, checklistId, itemId) => {
            try {
                await kanbanService.toggleChecklistItem(
                    cardId,
                    checklistId,
                    itemId,
                );

                // Optimistically update card
                const card = state.cards.find((c) => c.id === cardId);
                if (card) {
                    const updatedCard = {
                        ...card,
                        checklists: (card.checklists || []).map((cl) =>
                            cl.id === checklistId
                                ? {
                                      ...cl,
                                      items: cl.items.map((item) =>
                                          item.id === itemId
                                              ? {
                                                    ...item,
                                                    completed: !item.completed,
                                                }
                                              : item,
                                      ),
                                  }
                                : cl,
                        ),
                    };
                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: updatedCard,
                    });
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards],
    );

    // ==================== WATCH/SUBSCRIBE METHODS ====================

    // Watch card (subscribe to notifications)
    const watchCard = useCallback(
        async (cardId) => {
            try {
                await kanbanService.watchCard(cardId);

                // Optimistically update card
                const card = state.cards.find((c) => c.id === cardId);
                if (card && state.user) {
                    const updatedCard = {
                        ...card,
                        watchers: [...(card.watchers || []), state.user.id],
                    };
                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: updatedCard,
                    });
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards, state.user],
    );

    // Unwatch card (unsubscribe from notifications)
    const unwatchCard = useCallback(
        async (cardId) => {
            try {
                await kanbanService.unwatchCard(cardId);

                // Optimistically update card
                const card = state.cards.find((c) => c.id === cardId);
                if (card && state.user) {
                    const updatedCard = {
                        ...card,
                        watchers: (card.watchers || []).filter(
                            (id) => id !== state.user.id,
                        ),
                    };
                    dispatch({
                        type: ACTION_TYPES.UPDATE_CARD,
                        payload: updatedCard,
                    });
                }
            } catch (error) {
                dispatch({
                    type: ACTION_TYPES.SET_ERROR,
                    payload: error.message,
                });
                throw error;
            }
        },
        [state.cards, state.user],
    );

    const value = {
        // State
        ...state,

        // Actions
        createCard,
        updateCard,
        deleteCard,
        moveCard,
        updateCardPositionsOptimistic,
        toggleColumnActivation,
        searchCardsInColumn,
        addComment,
        updateComment,
        deleteComment,
        setFilters,
        setSearchTerm,
        clearFilters,
        clearError,

        // Attachment Actions
        addAttachment,
        deleteAttachment,
        setCardCover,

        // Checklist Actions
        addChecklist,
        updateChecklist,
        deleteChecklist,
        toggleChecklistItem,

        // Watch Actions
        watchCard,
        unwatchCard,

        // Label Actions
        fetchLabelsByBranch,
        createLabel,
        updateLabel,
        deleteLabel,

        // Utilities
        getCardsByColumn,
        getCardsBySubcolumn,
        getActiveColumns,
        canPerformAction,

        // Service
        kanbanService,
    };

    return (
        <KanbanContext.Provider value={value}>
            {children}
        </KanbanContext.Provider>
    );
};

// Hook to use Kanban context
export const useKanban = () => {
    const context = useContext(KanbanContext);
    if (!context) {
        throw new Error("useKanban must be used within a KanbanProvider");
    }
    return context;
};

export default KanbanContext;
