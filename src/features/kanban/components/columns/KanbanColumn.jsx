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

    // Check if this is a grouped column (has sub-columns)
    // Support both subcolumns (frontend format) and sub_columns (backend format)
    const subColumns = column.subcolumns || column.sub_columns || [];
    const isGrouped =
        column.isGrouped || column.has_sub_columns || subColumns.length > 0;

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
                {isGrouped ? renderSubcolumns() : renderSimpleColumn()}
            </div>
        </div>
    );
};

export default KanbanColumn;
