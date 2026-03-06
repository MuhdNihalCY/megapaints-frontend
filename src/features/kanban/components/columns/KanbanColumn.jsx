/**
 * KanbanColumn Component
 * Individual column in the Kanban board with proper structure according to specifications
 */

import React, { useState, useCallback, useEffect } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import KanbanCard from "../cards/KanbanCard";
import ColumnHeader from "./ColumnHeader";
import CreateCardButton from "../ui/CreateCardButton";
import ColumnSearch from "../search/ColumnSearch";
import SubColumnUserToggle from "./SubColumnUserToggle";
import { useKanban } from "../../contexts/KanbanContext";
import { kanbanService } from "../../services/kanbanService";

const KanbanColumn = ({
    column,
    cards = [],
    onCardClick,
    onCreateCard,
    CardComponent = KanbanCard,
    onDragEnd,
    boardId,
}) => {
    const {
        toggleColumnActivation,
        canPerformAction,
        user: currentUser,
        labels,
    } = useKanban();
    const [isHovered, setIsHovered] = useState(false);
    const [doneMore7Query, setDoneMore7Query] = useState("");
    const [doneMore7Loading, setDoneMore7Loading] = useState(false);
    const [doneMore7Results, setDoneMore7Results] = useState(null); // null = not searched yet
    const [doneMore7Error, setDoneMore7Error] = useState(null);

    // Check if this is a grouped column (has sub-columns)
    // Support both subcolumns (frontend format) and sub_columns (backend format)
    const subColumns = column.subcolumns || column.sub_columns || [];
    const isGrouped =
        column.isGrouped || column.has_sub_columns || subColumns.length > 0;
    const isDoneColumn = String(column.name || column.title || "")
        .trim()
        .toLowerCase() === "done";

    // Debug logging for sub-columns
    useEffect(() => {
        console.log("[SUB-COL] KanbanColumn received column data", {
            columnId: column.id,
            columnName: column.name || column.title,
            hasSubColumns: column.has_sub_columns,
            isGrouped: column.isGrouped,
            subcolumns: column.subcolumns,
            sub_columns: column.sub_columns,
            extractedSubColumns: subColumns,
            extractedSubColumnsCount: subColumns.length,
            isGroupedResult: isGrouped,
        });
    }, [
        column.id,
        column.name,
        column.has_sub_columns,
        column.subcolumns,
        column.sub_columns,
        subColumns.length,
        isGrouped,
    ]);

    // Check if this column allows card creation
    // Backend columns: allow creation in first column (typically "To Do")
    // Frontend columns: allow creation in "Sales" column
    const isFirstColumn = column.position === 0;
    const isSalesColumn =
        column.id === "sales" ||
        column.name?.toLowerCase() === "sales" ||
        column.title?.toLowerCase() === "sales";
    const canCreateCard =
        (isFirstColumn || isSalesColumn) && canPerformAction("CREATE_CARD");

    // Check if this column allows toggling (Production and Drivers)
    const canToggleColumn =
        (column.groupType === "production" || column.groupType === "drivers") &&
        canPerformAction("MANAGE_COLUMNS");

    // Handle column toggle
    const handleColumnToggle = useCallback(
        async (isActive) => {
            try {
                await toggleColumnActivation(column.id, isActive);
            } catch (error) {
                // Error toggling column
            }
        },
        [column.id, toggleColumnActivation],
    );

    // Handle card creation (new cards go on top of column; position 0)
    const handleCreateCard = useCallback(
        async (cardData) => {
            if (canCreateCard && onCreateCard) {
                const enhancedCardData = {
                    ...cardData,
                    columnId: column.id,
                    position: 0,
                };
                const result = await onCreateCard(enhancedCardData);
                return result;
            }

            return null;
        },
        [canCreateCard, onCreateCard, column.id],
    );

    // Render subcolumns for grouped columns
    const renderSubcolumns = () => {
        console.log("[SUB-COL] renderSubcolumns called", {
            columnId: column.id,
            columnName: column.name || column.title,
            isGrouped: isGrouped,
            subColumnsCount: subColumns.length,
            subColumns: subColumns.map((sc) => ({
                id: sc.id,
                name: sc.name,
                is_user_based: sc.is_user_based,
                user_id: sc.user_id,
                is_disabled: sc.is_disabled,
                is_enabled: sc.is_enabled,
            })),
        });

        if (!isGrouped || subColumns.length === 0) {
            console.log("[SUB-COL] Not rendering sub-columns", {
                columnId: column.id,
                columnName: column.name || column.title,
                reason: !isGrouped ? "not grouped" : "no sub-columns",
                isGrouped: isGrouped,
                subColumnsCount: subColumns.length,
            });
            return null;
        }

        // Determine if current user is Office or Sales (can see disabled users)
        const isOfficeOrSales =
            currentUser &&
            (currentUser.designation === "Office" ||
                currentUser.designation === "Sales" ||
                (currentUser.roles &&
                    (currentUser.roles.includes("admin") ||
                        currentUser.roles.includes("super_admin"))));

        console.log("[SUB-COL] Current user permissions", {
            columnId: column.id,
            columnName: column.name || column.title,
            currentUserDesignation: currentUser?.designation,
            currentUserRoles: currentUser?.roles,
            isOfficeOrSales: !!isOfficeOrSales,
        });

        const renderedSubColumns = [];

        return (
            <div className="flex gap-2">
                {subColumns.map((subcolumn) => {
                    // Check if this sub-column is disabled (for user-based sub-columns)
                    const isDisabled =
                        subcolumn.is_disabled || subcolumn.is_enabled === false;
                    const isUserBased =
                        subcolumn.is_user_based || subcolumn.user_id;

                    // Filter logic: hide disabled users from non-Office/Sales users
                    if (isDisabled && !isOfficeOrSales && isUserBased) {
                        console.log(
                            "[SUB-COL] Filtering out disabled sub-column",
                            {
                                columnId: column.id,
                                columnName: column.name || column.title,
                                subColumnId: subcolumn.id,
                                subColumnName: subcolumn.name,
                                isDisabled: true,
                                isUserBased: true,
                                isOfficeOrSales: false,
                            },
                        );
                        return null; // Don't render disabled user sub-columns for non-Office/Sales
                    }

                    const subcolumnCards = cards.filter(
                        (card) => card.subcolumnId === subcolumn.id,
                    );

                    console.log("[SUB-COL] Rendering sub-column", {
                        columnId: column.id,
                        columnName: column.name || column.title,
                        subColumnId: subcolumn.id,
                        subColumnName: subcolumn.name,
                        isUserBased: isUserBased,
                        isDisabled: isDisabled,
                        cardsCount: subcolumnCards.length,
                    });

                    return (
                        <div
                            key={subcolumn.id}
                            className={`flex flex-col w-56 ${isDisabled && isOfficeOrSales ? "opacity-50" : ""}`}
                        >
                            {/* Subcolumn Header */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                            {subcolumn.name || subcolumn.title}
                                        </h3>
                                        {isUserBased && (
                                            <SubColumnUserToggle
                                                boardId={boardId}
                                                userId={subcolumn.user_id}
                                                columnId={column.id}
                                                isEnabled={!isDisabled}
                                                userDesignation={
                                                    subcolumn.designation
                                                }
                                                currentUserDesignation={
                                                    currentUser?.designation
                                                }
                                                onToggle={(
                                                    userId,
                                                    colId,
                                                    enabled,
                                                ) => {
                                                    // Refresh the board/columns to update sub-column visibility
                                                    // This will be handled by the parent component or context
                                                }}
                                            />
                                        )}
                                    </div>
                                    {subcolumn.hasSearch && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Search enabled
                                        </div>
                                    )}
                                </div>

                                {/* Search for > 7 Days column */}
                                {subcolumn.hasSearch && (
                                    <div className="mt-2">
                                        <ColumnSearch
                                            column={column}
                                            onSearchResults={(results) => {
                                                // Filter cards based on search results
                                                // This would be handled by the parent component
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Subcolumn Cards - Droppable for sub-column */}
                            <Droppable
                                droppableId={`subcolumn-${subcolumn.id}`}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`space-y-2 min-h-[160px] ${snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                                    >
                                        {subcolumnCards.map((card, index) => (
                                            <Draggable
                                                key={card.id}
                                                draggableId={card.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            ...provided
                                                                .draggableProps
                                                                .style,
                                                            opacity:
                                                                snapshot.isDragging
                                                                    ? 0.5
                                                                    : 1,
                                                        }}
                                                    >
                                                        <CardComponent
                                                            card={card}
                                                            labels={labels}
                                                            onCardClick={
                                                                onCardClick
                                                            }
                                                            onClick={() =>
                                                                onCardClick?.(
                                                                    card,
                                                                )
                                                            }
                                                            onDragEnd={
                                                                onDragEnd
                                                            }
                                                            index={index}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {/* Empty state */}
                                        {subcolumnCards.length === 0 && (
                                            <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                                No cards
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDoneColumn = () => {
        // Bucket cards by when they entered Done Today (doneTodayAt) using local timezone boundaries.
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

        // < 7 days = 1–6 days ago (calendar days, local timezone)
        const startOfLess7Window = new Date(startOfToday);
        startOfLess7Window.setDate(startOfLess7Window.getDate() - 6);

        const parseDoneAt = (card) => {
            const raw = card?.doneTodayAt || card?.done_today_at;
            if (raw) {
                const d = new Date(raw);
                if (!isNaN(d.getTime())) return d;
            }
            // Backward-compatible fallback: if card is stored as done-today but has no doneTodayAt yet,
            // prefer updatedAt as the likely move time.
            if (card?.subcolumnId === "done-today") {
                const fallback = card?.updatedAt || card?.updated_at || card?.createdAt || card?.created_at;
                const d = fallback ? new Date(fallback) : null;
                if (d && !isNaN(d.getTime())) return d;
            }
            return null;
        };

        const eligible = (cards || [])
            .filter((c) => (c?.subcolumnId === "done-today" || c?.doneTodayAt || c?.done_today_at))
            .map((c) => ({ card: c, doneAt: parseDoneAt(c) }))
            .filter((x) => x.doneAt);

        const doneTodayCards = eligible
            .filter((x) => x.doneAt >= startOfToday && x.doneAt < startOfTomorrow)
            .sort((a, b) => b.doneAt - a.doneAt)
            .map((x) => x.card);

        const less7Cards = eligible
            .filter((x) => x.doneAt >= startOfLess7Window && x.doneAt < startOfToday)
            .sort((a, b) => b.doneAt - a.doneAt)
            .map((x) => x.card);

        const more7CutoffISO = startOfLess7Window.toISOString();

        return (
            <div className="flex gap-2">
                {/* Done Today (droppable, but cards are not draggable out) */}
                <div className="flex flex-col w-56">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                Done Today
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {doneTodayCards.length}
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                            Cards added today (can’t be moved out)
                        </div>
                    </div>

                    <Droppable droppableId="subcolumn-done-today">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`space-y-2 min-h-[160px] ${snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                            >
                                {doneTodayCards.map((card, index) => (
                                    <CardComponent
                                        key={card.id || card._id}
                                        card={card}
                                        labels={labels}
                                        onCardClick={onCardClick}
                                        onClick={() => onCardClick?.(card)}
                                        onDragEnd={onDragEnd}
                                        index={index}
                                    />
                                ))}
                                {provided.placeholder}

                                {doneTodayCards.length === 0 && (
                                    <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                        No cards
                                    </div>
                                )}
                            </div>
                        )}
                    </Droppable>
                </div>

                {/* < 7 Days (read-only, no DnD) */}
                <div className="flex flex-col w-56">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                &lt; 7 Days
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {less7Cards.length}
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                            Done 1–6 days ago (read-only)
                        </div>
                    </div>

                    <div className="space-y-2 min-h-[160px]">
                        {less7Cards.map((card, index) => (
                            <CardComponent
                                key={card.id || card._id}
                                card={card}
                                labels={labels}
                                onCardClick={onCardClick}
                                onClick={() => onCardClick?.(card)}
                                onDragEnd={onDragEnd}
                                index={index}
                            />
                        ))}

                        {less7Cards.length === 0 && (
                            <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                No cards
                            </div>
                        )}
                    </div>
                </div>

                {/* > 7 Days (search-only, read-only results) */}
                <div className="flex flex-col w-56">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                                &gt; 7 Days
                            </h3>
                        </div>
                        <div className="mt-2">
                            <input
                                type="text"
                                value={doneMore7Query}
                                onChange={(e) => setDoneMore7Query(e.target.value)}
                                placeholder="Search older Done cards…"
                                className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                            />
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                            Search results only (7+ days old)
                        </div>
                    </div>

                    <div className="space-y-2 min-h-[160px]">
                        {doneMore7Loading && (
                            <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                Searching…
                            </div>
                        )}

                        {!doneMore7Loading && doneMore7Error && (
                            <div className="text-center text-red-500 text-sm py-6">
                                {doneMore7Error}
                            </div>
                        )}

                        {!doneMore7Loading &&
                            !doneMore7Error &&
                            Array.isArray(doneMore7Results) &&
                            doneMore7Results.length > 0 &&
                            doneMore7Results.map((card, index) => (
                                <CardComponent
                                    key={card.id || card._id}
                                    card={card}
                                    labels={labels}
                                    onCardClick={onCardClick}
                                    onClick={() => onCardClick?.(card)}
                                    onDragEnd={onDragEnd}
                                    index={index}
                                />
                            ))}

                        {!doneMore7Loading &&
                            !doneMore7Error &&
                            Array.isArray(doneMore7Results) &&
                            doneMore7Results.length === 0 && (
                                <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                    No results
                                </div>
                            )}

                        {!doneMore7Loading &&
                            !doneMore7Error &&
                            doneMore7Results === null && (
                                <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                    No cards shown
                                </div>
                            )}
                    </div>
                </div>
            </div>
        );
    };

    // Debounced search for > 7 days Done cards (search-only bucket)
    useEffect(() => {
        if (!isDoneColumn) return;
        const trimmed = (doneMore7Query || "").trim();
        let cancelled = false;
        setDoneMore7Error(null);

        if (!trimmed) {
            setDoneMore7Loading(false);
            setDoneMore7Results(null);
            return;
        }

        setDoneMore7Loading(true);
        const t = setTimeout(async () => {
            try {
                // Compute cutoff at search time (local timezone)
                const now = new Date();
                const startOfToday = new Date(now);
                startOfToday.setHours(0, 0, 0, 0);
                const startOfLess7Window = new Date(startOfToday);
                startOfLess7Window.setDate(startOfLess7Window.getDate() - 6);

                const result = await kanbanService.searchTasks(trimmed, {
                    board_id: boardId,
                    search_mode: "all",
                    include_archived: true,
                    column_id: column.id,
                    subcolumn_id: "done-today",
                    done_today_before: startOfLess7Window.toISOString(),
                });

                if (cancelled) return;
                const tasks = result?.data?.tasks ?? [];
                const transformed = Array.isArray(tasks)
                    ? tasks.map((t) => kanbanService.transformTaskData(t))
                    : [];
                setDoneMore7Results(transformed);
            } catch (err) {
                if (!cancelled) {
                    setDoneMore7Error(err?.message || "Search failed");
                    setDoneMore7Results([]);
                }
            } finally {
                if (!cancelled) setDoneMore7Loading(false);
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [doneMore7Query, isDoneColumn, boardId, column.id]);

    // Render simple column (non-grouped) - Droppable for column
    const renderSimpleColumn = () => {
        return (
            <Droppable droppableId={`column-${column.id}`}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[160px] ${snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                    >
                        {cards.map((card, index) => (
                            <Draggable
                                key={card.id}
                                draggableId={card.id}
                                index={index}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{
                                            ...provided.draggableProps.style,
                                            opacity: snapshot.isDragging
                                                ? 0.5
                                                : 1,
                                        }}
                                    >
                                        <CardComponent
                                            card={card}
                                            labels={labels}
                                            onCardClick={onCardClick}
                                            onClick={() => onCardClick?.(card)}
                                            onDragEnd={onDragEnd}
                                            index={index}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Empty state */}
                        {cards.length === 0 && (
                            <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                                No cards
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        );
    };

    // Don't render if column is inactive
    if (!column.isActive) return null;

    return (
        <div
            className="flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <ColumnHeader
                    column={column}
                    canToggle={canToggleColumn}
                    onToggle={handleColumnToggle}
                    cardCount={cards.length}
                />

                {/* Add Card Button for Sales Column */}
                {canCreateCard && (
                    <div className="mt-3 mb-2">
                        <CreateCardButton
                            columnId={column.id}
                            onCreateCard={handleCreateCard}
                            boardId={boardId}
                        />
                    </div>
                )}
            </div>

            {/* Column Content */}
            <div className="p-3 flex-1">
                {isGrouped
                    ? isDoneColumn
                        ? renderDoneColumn()
                        : renderSubcolumns()
                    : renderSimpleColumn()}
            </div>
        </div>
    );
};

export default KanbanColumn;
