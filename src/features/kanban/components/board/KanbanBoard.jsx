/**
 * KanbanBoard Component
 * Main container for the Kanban board system with enhanced drag and drop
 * Consolidated from PragmaticKanbanBoard for better organization
 */

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, User } from "lucide-react";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useKanban } from "../../contexts/KanbanContext";
import PragmaticKanbanCard from "../cards/PragmaticKanbanCard";
import KanbanColumn from "../columns/KanbanColumn";
import TrelloCardModal from "../cards/TrelloCardModal";
import MoveCardModal from "../cards/MoveCardModal";
import CopyCardModal from "../cards/CopyCardModal";
import { kanbanService } from "../../services/kanbanService";
import toast from "react-hot-toast";

import {
    LoadingOverlay,
    CustomerManagementButton,
} from "../../../../components";

/**
 * Kanban Board Component with Enhanced Drag and Drop
 */
const KanbanBoard = ({ onCardClick, onCreateCard }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        loading,
        error,
        columns,
        cards,
        board,
        user: currentUser,
        archivedCards,
        moveCard,
        createCard,
        copyCard,
        updateCard,
        deleteCard,
        updateCardPositionsOptimistic,
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,
        clearFilters,
        searchArchivedCards,
    } = useKanban();

    // Use board ID from context; avoid invalid fallbacks that break API validation
    const boardId = board?.id || board?._id || null;

    // UI State
    const [searchQuery, setSearchQuery] = useState(searchTerm || "");
    const [isMoving, setIsMoving] = useState(false);
    const [isReordering, setIsReordering] = useState(false);

    // Search modal (server search with debounce)
    const [searchInputValue, setSearchInputValue] = useState("");
    const [searchResults, setSearchResults] = useState(null); // null = not searched, [] = no results, [...] = results
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchMode, setSearchMode] = useState("all"); // 'all' | 'customer'
    const searchDebounceRef = useRef(null);
    const searchAbortRef = useRef(false);

    // Card Modal State
    const [selectedCard, setSelectedCard] = useState(null);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isEditingCard, setIsEditingCard] = useState(false);
    const [cardToMove, setCardToMove] = useState(null);
    const [cardToCopy, setCardToCopy] = useState(null);

    // Archived column: search-only; debounced search term
    const [archivedSearchTerm, setArchivedSearchTerm] = useState("");
    const archivedSearchDebounceRef = useRef(null);

    // Debounced search for archived column: call searchArchivedCards(boardId, term); empty term clears list
    useEffect(() => {
        if (archivedSearchDebounceRef.current) {
            clearTimeout(archivedSearchDebounceRef.current);
            archivedSearchDebounceRef.current = null;
        }
        const term = (archivedSearchTerm || "").trim();
        if (!boardId) {
            searchArchivedCards(null, "");
            return;
        }
        archivedSearchDebounceRef.current = setTimeout(() => {
            searchArchivedCards(boardId, term);
        }, 350);
        return () => {
            if (archivedSearchDebounceRef.current) {
                clearTimeout(archivedSearchDebounceRef.current);
            }
        };
    }, [archivedSearchTerm, boardId, searchArchivedCards]);

    // Open card modal when returning from CreateFormula with newFormulaId (to attach formula to production item)
    useEffect(() => {
        const state = location.state;
        const cardId = state?.cardId;
        const newFormulaId = state?.newFormulaId;
        const productionItemIndex = state?.productionItemIndex;
        if (!cardId || newFormulaId == null || productionItemIndex == null) return;

        let cancelled = false;
        (async () => {
            try {
                const result = await kanbanService.getTask(cardId);
                if (cancelled) return;
                if (result?.status === "success") {
                    const taskData = result.data?.task || result.data;
                    const fullCard = kanbanService.transformCardData(taskData);
                    setSelectedCard(fullCard);
                    setIsCardModalOpen(true);
                }
            } catch (err) {
                if (!cancelled) console.error("Error opening card after formula create:", err);
            }
        })();
        return () => { cancelled = true; };
    }, [location.state]);

    // Refs
    const boardRef = useRef(null);
    const columnRefs = useRef(new Map());
    const boardScrollRef = useRef(null);
    const boardPanAreaRef = useRef(null);
    const panRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });

    // Pan (click-and-drag) to scroll board horizontally; start on any board area except on cards (cards use DnD)
    useEffect(() => {
        const el = boardScrollRef.current;
        const panArea = boardPanAreaRef.current;
        if (!el || !panArea) return;

        let rafId = null;
        const scrollBehaviorOrig = el.style.scrollBehavior;

        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            if (e.target.closest("[data-kanban-card]")) return;
            if (rafId != null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            panRef.current = {
                active: true,
                startX: e.clientX,
                startScrollLeft: el.scrollLeft,
            };
            el.style.cursor = "grabbing";
            el.style.userSelect = "none";
            el.style.scrollBehavior = "auto";
        };

        const handleMouseMove = (e) => {
            const { active, startX, startScrollLeft } = panRef.current;
            if (!active) return;
            const dx = startX - e.clientX;
            const nextScrollLeft = Math.max(
                0,
                Math.min(
                    el.scrollWidth - el.clientWidth,
                    startScrollLeft + dx,
                ),
            );
            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                el.scrollLeft = nextScrollLeft;
                rafId = null;
            });
        };

        const handleMouseUp = () => {
            if (!panRef.current.active) return;
            panRef.current.active = false;
            if (rafId != null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (el) {
                el.style.cursor = "";
                el.style.userSelect = "";
                el.style.scrollBehavior = scrollBehaviorOrig || "";
            }
        };

        el.addEventListener("mousedown", handleMouseDown, { passive: true });
        document.addEventListener("mousemove", handleMouseMove, {
            passive: true,
        });
        document.addEventListener("mouseup", handleMouseUp, { passive: true });

        return () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            el.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    // Get active columns
    const activeColumns = useMemo(() => {
        return columns.filter((column) => column.isActive !== false);
    }, [columns]);

    // Get cards by column
    const getCardsByColumn = useCallback(
        (columnId) => {
            const columnCards = cards.filter((card) => {
                // Prioritize columnId (primary field), but check others for compatibility
                // This ensures cards only match one column even if fields are temporarily out of sync
                const cardColumnId =
                    card.columnId || card.listId || card.column_id;
                return String(cardColumnId) === String(columnId);
            });

            // Sort by position, then by creation date as fallback
            return columnCards.sort((a, b) => {
                const posA = a.position ?? 0;
                const posB = b.position ?? 0;
                if (posA !== posB) return posA - posB;
                // Fallback to creation date if positions are equal
                const dateA = new Date(a.createdAt || a.created_at || 0);
                const dateB = new Date(b.createdAt || b.created_at || 0);
                return dateA - dateB;
            });
        },
        [cards],
    );

    // Get cards by subcolumn
    const getCardsBySubcolumn = useCallback(
        (columnId, subcolumnId) => {
            const subcolumnCards = cards.filter(
                (card) =>
                    card.columnId === columnId &&
                    card.subcolumnId === subcolumnId,
            );

            // Sort by position, then by creation date as fallback
            return subcolumnCards.sort((a, b) => {
                const posA = a.position ?? 0;
                const posB = b.position ?? 0;
                if (posA !== posB) return posA - posB;
                // Fallback to creation date if positions are equal
                const dateA = new Date(a.createdAt || a.created_at || 0);
                const dateB = new Date(b.createdAt || b.created_at || 0);
                return dateA - dateB;
            });
        },
        [cards],
    );

    // Get filtered cards
    const getFilteredCards = useCallback(
        (cardsToFilter) => {
            if (!cardsToFilter) return [];

            let filtered = [...cardsToFilter];

            // Apply search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                filtered = filtered.filter(
                    (card) =>
                        card.title?.toLowerCase().includes(searchLower) ||
                        card.description?.toLowerCase().includes(searchLower),
                );
            }

            // Apply other filters
            if (filters.priority) {
                filtered = filtered.filter(
                    (card) => card.priority === filters.priority,
                );
            }

            if (filters.labels && filters.labels.length > 0) {
                filtered = filtered.filter((card) =>
                    card.labels?.some((label) =>
                        filters.labels.includes(label.id),
                    ),
                );
            }

            return filtered;
        },
        [searchTerm, filters],
    );

    // Check if move is allowed based on DnD rules
    const isMoveAllowed = useCallback(
        (fromColumn, toColumn, fromSubColumn = null, toSubColumn = null) => {
            // Done column rules:
            // - Cards can be moved into Done Today (done-today)
            // - Cards cannot be moved out of Done Today
            // - Derived buckets (done-less-7, done-more-7) are read-only (no DnD in/out)
            const restrictedDestinations = ["done-less-7", "done-more-7"];
            const restrictedSources = [
                "done-today",
                "done-less-7",
                "done-more-7",
            ];

            if (fromSubColumn && restrictedSources.includes(fromSubColumn)) {
                return false;
            }

            if (toSubColumn && restrictedDestinations.includes(toSubColumn)) {
                return false;
            }

            return true;
        },
        [],
    );

    // Calculate dynamic column width for grouped columns
    const getColumnWidth = useCallback((column) => {
        if (!column.isGrouped || !column.subcolumns?.length) {
            return "w-56";
        }

        const subcolumnCount = column.subcolumns.length;
        const gapWidth = 8; // gap-2 = 8px
        const subcolumnWidth = 224; // w-56 = 224px
        const totalWidth =
            subcolumnCount * subcolumnWidth + (subcolumnCount - 1) * gapWidth;

        return { width: `${totalWidth}px` };
    }, []);

    // Handle card click - fetch full card data if needed
    const handleCardClick = useCallback(async (card) => {
        try {
            // If card has minimal data, fetch full card details
            let fullCard = card;
            if (card && (card.id || card._id)) {
                // Always fetch fresh card data to ensure we have latest comments, attachments, etc.
                const result = await kanbanService.getTask(card.id || card._id);
                if (result && result.status === "success") {
                    const taskData = result.data?.task || result.data;
                    fullCard = kanbanService.transformCardData(taskData);
                }
            }
            setSelectedCard(fullCard);
            setIsEditingCard(false);
            setIsCardModalOpen(true);
        } catch (error) {
            console.error("Error loading card details:", error);
            // Still open modal with available card data
            setSelectedCard(card);
            setIsCardModalOpen(true);
        }
    }, []);

    // Handle create card
    const handleCreateCard = useCallback(
        async (cardData) => {
            try {
                const createdCard = await createCard(cardData);
                return createdCard;
            } catch (error) {
                console.error(
                    "🔴 Error in KanbanBoard.handleCreateCard",
                    error,
                );
                // Re-throw error so it can be caught by CreateCardButton
                throw error;
            }
        },
        [createCard],
    );

    // Handle save card - supports both new cards and updates
    const handleSaveCard = useCallback(
        async (cardIdOrData, updates) => {
            try {
                // If two arguments, it's (cardId, updates) for existing cards
                if (updates !== undefined) {
                    await updateCard(cardIdOrData, updates);
                }
                // If one argument, check if it's a new card or full card data
                else if (cardIdOrData) {
                    const cardData = cardIdOrData;
                    // Check if it's an existing card (has id/_id) or new card
                    if (cardData.id || cardData._id) {
                        await updateCard(cardData.id || cardData._id, cardData);
                    } else {
                        await createCard(cardData);
                    }
                }
                // Don't close modal automatically - let the modal handle it
                // The modal will close itself after successful save
            } catch (error) {
                console.error("Error saving card:", error);
                throw error; // Re-throw so modal can handle the error
            }
        },
        [updateCard, createCard],
    );

    // Handle delete card
    const handleDeleteCard = useCallback(
        async (cardId) => {
            try {
                const id = cardId ?? selectedCard?.id ?? selectedCard?._id;
                if (id) {
                    await deleteCard(id);
                    setIsCardModalOpen(false);
                    setSelectedCard(null);
                }
            } catch (error) {
                toast.error(error?.message || "Failed to delete card");
            }
        },
        [selectedCard, deleteCard],
    );

    // Handle search
    const handleSearch = (query) => {
        setSearchQuery(query);
        setSearchTerm(query);
    };

    // Debounced server search for modal (include archived, single API call)
    useEffect(() => {
        const trimmed = (searchInputValue || "").trim();
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
        if (!trimmed) {
            setSearchResults(null);
            setSearchLoading(false);
            return;
        }
        searchDebounceRef.current = setTimeout(async () => {
            if (!boardId) {
                setSearchResults([]);
                setSearchLoading(false);
                return;
            }
            searchAbortRef.current = false;
            setSearchLoading(true);
            setSearchResults(null);
            try {
                const result = await kanbanService.searchTasks(trimmed, {
                    board_id: boardId,
                    search_mode: searchMode,
                    include_archived: true,
                });
                if (searchAbortRef.current) return;
                const tasks = result?.data?.tasks ?? [];
                setSearchResults(Array.isArray(tasks) ? tasks : []);
            } catch (err) {
                if (!searchAbortRef.current) {
                    setSearchResults([]);
                    toast.error(err?.message || "Search failed");
                }
            } finally {
                if (!searchAbortRef.current) setSearchLoading(false);
            }
        }, 350);
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
            searchAbortRef.current = true;
        };
    }, [searchInputValue, searchMode, boardId]);

    // Close search modal and optionally open card
    const handleSearchResultSelect = useCallback(
        (card) => {
            setSearchInputValue("");
            setSearchResults(null);
            handleCardClick(card);
        },
        [handleCardClick],
    );

    const closeSearchModal = useCallback(() => {
        setSearchInputValue("");
        setSearchResults(null);
    }, []);

    const showSearchModal =
        (searchInputValue || "").trim() !== "" &&
        (searchLoading || searchResults !== null);

    // Handle close modal
    const handleCloseModal = useCallback(() => {
        setIsCardModalOpen(false);
        setSelectedCard(null);
        setIsEditingCard(false);
    }, []);

    // Handle move card from modal: open MoveCardModal, then on destination pick call moveCard
    const handleMoveCard = useCallback(
        async (cardId, moveData) => {
            try {
                await moveCard(cardId, moveData);
                setCardToMove(null);
                if (
                    selectedCard &&
                    (String(selectedCard.id) === String(cardId) ||
                        String(selectedCard._id) === String(cardId))
                ) {
                    const result = await kanbanService.getTask(cardId);
                    if (result?.status === "success") {
                        const taskData = result.data?.task || result.data;
                        setSelectedCard(
                            kanbanService.transformCardData(taskData),
                        );
                    }
                }
                toast.success("Card moved");
            } catch (err) {
                toast.error(err?.message || "Failed to move card");
            }
        },
        [moveCard, selectedCard],
    );

    // Handle card move with DnD rules
    const handleCardMove = async (
        cardId,
        fromColumn,
        toColumn,
        toSubcolumn = null,
        position = null,
    ) => {
        setIsMoving(true);
        try {
            const card = cards.find((c) => c.id === cardId);
            const fromCol = columns.find((c) => c.id === fromColumn);
            const toCol = columns.find((c) => c.id === toColumn);

            // Check if move is allowed based on DnD rules
            if (
                !isMoveAllowed(fromCol, toCol, card?.subcolumnId, toSubcolumn)
            ) {
                return;
            }

            const moveData = {
                toColumnId: toColumn,
                toSubColumnId: toSubcolumn,
                position: position || 0,
            };

            await moveCard(cardId, moveData);
        } catch (error) {
            // Error moving card
        } finally {
            setIsMoving(false);
        }
    };

    // Handle card reorder
    const handleCardReorder = async (
        cardId,
        fromColumn,
        toColumn,
        toSubColumnId,
        newIndex,
    ) => {
        setIsReordering(true);

        try {
            const card = cards.find((c) => c.id === cardId);
            if (!card) {
                console.error("Card not found:", cardId);
                return;
            }

            // Get all cards in the target column/subcolumn, sorted by position
            let columnCards;
            if (toSubColumnId) {
                columnCards = getCardsBySubcolumn(toColumn, toSubColumnId);
            } else {
                columnCards = getCardsByColumn(toColumn);
            }

            const reorderedCards = Array.from(columnCards);

            // Remove card from current position
            const currentIndex = reorderedCards.findIndex(
                (c) => c.id === cardId,
            );
            if (currentIndex === -1) {
                console.error("Card not found in column:", cardId, toColumn);
                return;
            }

            const [movedCard] = reorderedCards.splice(currentIndex, 1);

            // Insert at new position
            reorderedCards.splice(newIndex, 0, movedCard);

            // Calculate new positions for ALL cards in the column
            // This ensures positions are always sequential (0, 1000, 2000, etc.)
            // and fixes the glitch where only some cards were updated
            const updates = [];
            for (let i = 0; i < reorderedCards.length; i++) {
                const cardToUpdate = reorderedCards[i];
                const newPosition = i * 1000;

                // Only update if position actually changed
                if (cardToUpdate.position !== newPosition) {
                    updates.push({
                        cardId: cardToUpdate.id,
                        position: newPosition,
                    });
                }
            }

            // OPTIMISTIC UPDATE: Update state immediately for instant UI feedback
            // This prevents the visual glitch where cards snap back or don't update immediately
            if (updates.length > 0 && updateCardPositionsOptimistic) {
                updateCardPositionsOptimistic(updates);
            }

            // SYNC WITH BACKEND: Update sequentially to avoid race conditions
            // Sequential updates ensure state consistency and prevent glitches
            for (const update of updates) {
                try {
                    await moveCard(update.cardId, {
                        toColumnId: toColumn,
                        toSubColumnId: toSubColumnId,
                        position: update.position,
                    });
                } catch (error) {
                    console.error(
                        `Failed to update card ${update.cardId} position:`,
                        error,
                    );
                    // Continue with other updates even if one fails
                }
            }
        } catch (error) {
            console.error("Error reordering card:", error);
            toast.error("Failed to reorder card");
        } finally {
            setIsReordering(false);
        }
    };

    // Handle drag end with @hello-pangea/dnd
    const handleDragEnd = useCallback(
        (result) => {
            const { destination, source, draggableId } = result;

            // If no destination, do nothing
            if (!destination) {
                return;
            }

            // If dropped in the same position, do nothing
            if (
                destination.droppableId === source.droppableId &&
                destination.index === source.index
            ) {
                return;
            }

            // MongoDB ObjectId validation regex (24 hex characters)
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;

            // Parse droppableId to determine target column/sub-column
            // Format: "column-{columnId}" or "subcolumn-{subcolumnId}"
            const isSubColumn =
                destination.droppableId.startsWith("subcolumn-");
            const isColumn = destination.droppableId.startsWith("column-");

            let toColumnId = null;
            let toSubColumnId = null;

            if (isSubColumn) {
                toSubColumnId = destination.droppableId.replace(
                    "subcolumn-",
                    "",
                );
                // Find which column this sub-column belongs to
                let targetColumn = activeColumns.find((col) =>
                    col.subcolumns?.some((sub) => sub.id === toSubColumnId),
                );
                // Fallback: Done Today is rendered with fixed droppableId "subcolumn-done-today"
                // even when the backend doesn't return that subcolumn (e.g. older boards). Resolve
                // by column name so moves to Done Today always work.
                if (!targetColumn && toSubColumnId === "done-today") {
                    targetColumn = activeColumns.find(
                        (col) =>
                            String(col.name || col.title || "")
                                .trim()
                                .toLowerCase() === "done",
                    );
                }
                if (targetColumn) {
                    toColumnId = targetColumn.id;
                }
            } else if (isColumn) {
                toColumnId = destination.droppableId.replace("column-", "");
            }

            // Parse source to get from column/sub-column
            const sourceIsSubColumn =
                source.droppableId.startsWith("subcolumn-");
            const sourceIsColumn = source.droppableId.startsWith("column-");

            let fromColumnId = null;
            if (sourceIsSubColumn) {
                const subColumnId = source.droppableId.replace(
                    "subcolumn-",
                    "",
                );
                const sourceColumn = activeColumns.find((col) =>
                    col.subcolumns?.some((sub) => sub.id === subColumnId),
                );
                if (sourceColumn) {
                    fromColumnId = sourceColumn.id;
                }
            } else if (sourceIsColumn) {
                fromColumnId = source.droppableId.replace("column-", "");
            }

            // Validate column IDs are valid MongoDB ObjectIds before attempting move
            if (toColumnId && !objectIdRegex.test(toColumnId)) {
                console.error(
                    "❌ Invalid target column ID format:",
                    toColumnId,
                );
                toast.error(
                    "Cannot move card: Invalid column ID. Please refresh the page.",
                );
                return;
            }

            if (fromColumnId && !objectIdRegex.test(fromColumnId)) {
                console.error(
                    "❌ Invalid source column ID format:",
                    fromColumnId,
                );
                // Still allow move if source is invalid (might be from a deleted column)
            }

            // Handle reordering within same column/subcolumn
            if (
                destination.droppableId === source.droppableId &&
                toColumnId &&
                draggableId
            ) {
                // Same column/subcolumn, just reordering
                handleCardReorder(
                    draggableId,
                    fromColumnId,
                    toColumnId,
                    toSubColumnId,
                    destination.index,
                );
                return;
            }

            // Move the card between different columns/subcolumns
            if (toColumnId && draggableId) {
                handleCardMove(
                    draggableId,
                    fromColumnId,
                    toColumnId,
                    toSubColumnId,
                    destination.index,
                );
            } else {
                console.error(
                    "❌ Cannot move card: Missing required column ID",
                );
                toast.error("Cannot move card: Column information is missing.");
            }
        },
        [
            handleCardMove,
            handleCardReorder,
            activeColumns,
            getCardsByColumn,
            getCardsBySubcolumn,
            cards,
            moveCard,
        ],
    );

    // Handle card select
    const handleCardSelect = (cardId, isMultiSelect) => {
        if (isMultiSelect) {
            setSelectedCards((prev) =>
                prev.includes(cardId)
                    ? prev.filter((id) => id !== cardId)
                    : [...prev, cardId],
            );
        } else {
            setSelectedCards([cardId]);
        }
    };

    if (loading) {
        return <LoadingOverlay message="Loading Kanban Board..." />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-red-500 text-lg font-medium mb-2">
                        Error Loading Board
                    </div>
                    <div className="text-gray-600">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Loading Overlays for card operations */}
            {isMoving && <LoadingOverlay message="Moving card..." />}
            {isReordering && <LoadingOverlay message="Reordering cards..." />}

            <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {/* Single header: Board title + customer actions + search */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex-shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                            <h1 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
                                Board
                            </h1>
                            <div className="text-sm text-gray-600 dark:text-gray-300 flex-shrink-0 hidden sm:inline">
                                {cards.length} cards across{" "}
                                {activeColumns.length} columns
                            </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-2 sm:gap-3 flex-shrink-0">
                            <CustomerManagementButton
                                user={currentUser}
                                className="flex-shrink-0"
                            />
                            {/* Search (server search → results in modal) */}
                            <div className="relative flex items-center gap-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search cards..."
                                        value={searchInputValue}
                                        onChange={(e) =>
                                            setSearchInputValue(e.target.value)
                                        }
                                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-56"
                                    />
                                </div>
                                <select
                                    value={searchMode}
                                    onChange={(e) =>
                                        setSearchMode(e.target.value)
                                    }
                                    className="py-2 pl-3 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                    title="Search mode"
                                >
                                    <option value="all">All cards</option>
                                    <option value="customer">
                                        Customer name
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Board Content */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 overflow-hidden">
                        <div
                            ref={boardScrollRef}
                            className="board-horizontal-scroll h-full overflow-x-auto overflow-y-hidden scroll-smooth cursor-grab"
                        >
                            <div
                                ref={boardPanAreaRef}
                                className="flex gap-2 p-3 pr-8"
                            >
                                {activeColumns.map((column) => {
                                    const columnCards = getCardsByColumn(
                                        column.id,
                                    );
                                    const filteredCards =
                                        getFilteredCards(columnCards);
                                    const hasSubcolumns =
                                        column.subcolumns &&
                                        column.subcolumns.length > 0;
                                    const subcolumnCount = column.subcolumns
                                        ? column.subcolumns.length
                                        : 0;

                                    const subcolumnWidth = 224; // matches w-56
                                    const gapWidth = 8; // matches gap-2
                                    const groupedWidthPx =
                                        subcolumnCount * subcolumnWidth +
                                        gapWidth *
                                            Math.max(0, subcolumnCount - 1);
                                    const columnClassName = hasSubcolumns
                                        ? "flex-shrink-0"
                                        : "flex-shrink-0 w-56";
                                    const columnStyle = hasSubcolumns
                                        ? { width: `${groupedWidthPx}px` }
                                        : undefined;

                                    return (
                                        <motion.div
                                            key={column.id}
                                            ref={(el) => {
                                                if (el) {
                                                    columnRefs.current.set(
                                                        column.id,
                                                        el,
                                                    );
                                                }
                                            }}
                                            className={columnClassName}
                                            style={columnStyle}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <KanbanColumn
                                                column={column}
                                                cards={getCardsByColumn(
                                                    column.id,
                                                )}
                                                onCardClick={handleCardClick}
                                                onCreateCard={handleCreateCard}
                                                CardComponent={
                                                    PragmaticKanbanCard
                                                }
                                                onDragEnd={handleDragEnd}
                                                boardId={boardId}
                                            />
                                                </motion.div>
                                            );
                                        })}
                                {/* Archived column: always visible, search-only */}
                                <motion.div
                                    key="archived"
                                    className="flex-shrink-0 w-56"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Archived
                                            </h3>
                                        </div>
                                        <div className="p-2 space-y-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">
                                                Search to show cards
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Search archived..."
                                                value={archivedSearchTerm}
                                                onChange={(e) =>
                                                    setArchivedSearchTerm(e.target.value)
                                                }
                                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2 min-h-[120px] p-2 overflow-y-auto overflow-x-hidden scroll-smooth max-h-[calc(100vh-280px)]">
                                            {archivedCards.length === 0 ? (
                                                <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-6">
                                                    {archivedSearchTerm.trim()
                                                        ? "No matching archived cards"
                                                        : "Search to show cards"}
                                                </div>
                                            ) : (
                                                archivedCards.map((card) => (
                                                    <div
                                                        key={card.id || card._id}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() =>
                                                            handleCardClick(card)
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    "Enter" ||
                                                                e.key === " "
                                                            ) {
                                                                e.preventDefault();
                                                                handleCardClick(
                                                                    card,
                                                                );
                                                            }
                                                        }}
                                                        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500 rounded-lg"
                                                    >
                                                        <PragmaticKanbanCard
                                                            card={card}
                                                            onCardClick={() =>
                                                                handleCardClick(
                                                                    card,
                                                                )
                                                            }
                                                            isDragging={false}
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </DragDropContext>

                {/* Search Results Modal */}
                <AnimatePresence>
                    {showSearchModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 pb-10 px-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeSearchModal}
                        >
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[70vh] flex flex-col"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Search results
                                        {searchMode === "customer" && (
                                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                                                (by customer name)
                                            </span>
                                        )}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={closeSearchModal}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2">
                                    {searchLoading ? (
                                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                                            Searching...
                                        </div>
                                    ) : searchResults !== null &&
                                      searchResults.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                                            No cards found
                                        </div>
                                    ) : searchResults !== null &&
                                      searchResults.length > 0 ? (
                                        <ul className="space-y-1">
                                            {searchResults.map((card) => {
                                                const columnTitle =
                                                    columns.find(
                                                        (c) =>
                                                            c.id ===
                                                            (card.columnId ||
                                                                card.column_id),
                                                    )?.title ||
                                                    card.columnId ||
                                                    "—";
                                                return (
                                                    <li key={card.id || card._id}>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSearchResultSelect(
                                                                    card,
                                                                )
                                                            }
                                                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                                        >
                                                            <span className="font-medium text-gray-900 dark:text-white truncate flex-1">
                                                                {card.title ||
                                                                    "Untitled"}
                                                            </span>
                                                            {card.identifier && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                                    {
                                                                        card.identifier
                                                                    }
                                                                </span>
                                                            )}
                                                            <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                                                {columnTitle}
                                                            </span>
                                                            {(card.customerName ||
                                                                (card.customer &&
                                                                    typeof card
                                                                        .customer ===
                                                                        "object" &&
                                                                    card.customer
                                                                        .name)) && (
                                                                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                                                                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                                                                    {card.customerName ||
                                                                        (card.customer &&
                                                                            card
                                                                                .customer
                                                                                .name)}
                                                                </span>
                                                            )}
                                                            {card.is_archived && (
                                                                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 flex-shrink-0">
                                                                    Archived
                                                                </span>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                            Type to search (includes archived
                                            cards)
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Card Modal */}
                <TrelloCardModal
                    card={selectedCard}
                    isOpen={isCardModalOpen}
                    onClose={handleCloseModal}
                    onUpdate={handleSaveCard}
                    onDelete={handleDeleteCard}
                    onMove={(card) => setCardToMove(card)}
                    onCopy={(card) => setCardToCopy(card)}
                    isNewCard={false}
                    pendingNewFormula={
                        location.state?.newFormulaId != null
                            ? {
                                  newFormulaId: location.state.newFormulaId,
                                  productionItemIndex:
                                      location.state.productionItemIndex,
                              }
                            : null
                    }
                    onClearPendingFormula={() => {
                        navigate(location.pathname, {
                            replace: true,
                            state: {},
                        });
                    }}
                />
                {cardToMove && (
                    <MoveCardModal
                        card={cardToMove}
                        columns={columns}
                        onMove={handleMoveCard}
                        onClose={() => setCardToMove(null)}
                        getCardsByColumn={getCardsByColumn}
                        getCardsBySubcolumn={getCardsBySubcolumn}
                        isMoveAllowed={isMoveAllowed}
                    />
                )}
                {cardToCopy && (
                    <CopyCardModal
                        card={cardToCopy}
                        columns={columns}
                        boardId={boardId}
                        onConfirm={(created) => {
                            setCardToCopy(null);
                            if (created) {
                                setSelectedCard(created);
                                setIsCardModalOpen(true);
                                toast.success("Card copied");
                            }
                        }}
                        onClose={() => setCardToCopy(null)}
                        getCardsByColumn={getCardsByColumn}
                        createCard={createCard}
                        copyCard={copyCard}
                    />
                )}
            </div>
        </>
    );
};

export default KanbanBoard;
