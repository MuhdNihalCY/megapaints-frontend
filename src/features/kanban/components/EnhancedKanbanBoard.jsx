/**
 * Enhanced Kanban Board Component
 * Trello-like drag and drop with advanced features
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { 
  restrictToHorizontalAxis, 
  restrictToVerticalAxis,
  restrictToWindowEdges
} from '@dnd-kit/modifiers';

import { useKanban } from '../contexts/KanbanContext';
import { 
  useAdvancedDragAndDrop,
  useCollisionDetection,
  useDragAnimations,
  useKeyboardDragAndDrop,
  useMultiSelectDrag,
  useDragConstraints
} from '../hooks/useAdvancedDragAndDrop';
import { COLUMN_TYPES } from '../utils/constants';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import FiltersPanel from './FiltersPanel';
import KeyboardShortcuts from './KeyboardShortcuts';
import HelpPanel from './HelpPanel';
import DragPreview from './DragPreview';
import DropZoneIndicator from './DropZoneIndicator';
import MultiSelectOverlay from './MultiSelectOverlay';

import { LoadingOverlay } from '../../../components';

/**
 * Enhanced Kanban Board with Trello-like features
 */
const EnhancedKanbanBoard = ({ onCardClick, onCreateCard }) => {
  const {
    loading,
    error,
    columns,
    cards,
    moveCard,
    reorderCards,
    getCardsByColumn,
    getCardsBySubcolumn,
    getActiveColumns,
    canMoveCard
  } = useKanban();

  // Advanced drag and drop hooks
  const {
    draggedCard,
    isDragging,
    dragOver,
    dragPreview,
    dropZone,
    isMultiSelect,
    selectedCards,
    dragOffset,
    isKeyboardDragging,
    startDrag,
    endDrag,
    setDragOverTarget,
    setDropZoneIndicator,
    toggleCardSelection,
    clearSelection,
    selectAllCards,
    startKeyboardDrag,
    getDragDuration,
    isLongDrag
  } = useAdvancedDragAndDrop();

  const { collisionDetection } = useCollisionDetection();
  const { 
    getDragStyles, 
    getDropZoneStyles, 
    startAnimation, 
    endAnimation 
  } = useDragAnimations();
  
  const { 
    handleKeyboardDrag, 
    registerTargets, 
    currentTarget 
  } = useKeyboardDragAndDrop();
  
  const {
    selectedItems,
    isMultiDragging,
    dragGroup,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection: clearMultiSelection,
    startMultiDrag,
    endMultiDrag,
    isSelected,
    getSelectedCount
  } = useMultiSelectDrag();

  const { canDrop, canReorder, constraints } = useDragConstraints();

  // Refs
  const boardRef = useRef(null);
  const dragOverlayRef = useRef(null);

  // Configure sensors for enhanced drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { context }) => {
        // Custom keyboard coordinate getter
        const activeElement = context.active?.current?.node;
        if (activeElement) {
          const rect = activeElement.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
        return { x: 0, y: 0 };
      }
    })
  );

  // Get active columns
  const activeColumns = useMemo(() => getActiveColumns(), [getActiveColumns]);

  // Register keyboard targets
  useEffect(() => {
    const targets = activeColumns.flatMap(column => {
      const columnTargets = [{ id: column.id, type: 'column', title: column.title }];
      if (column.subcolumns) {
        const subcolumnTargets = column.subcolumns.map(sub => ({
          id: sub.id,
          type: 'subcolumn',
          title: sub.title,
          parentColumn: column.id
        }));
        return [...columnTargets, ...subcolumnTargets];
      }
      return columnTargets;
    });
    registerTargets(targets);
  }, [activeColumns, registerTargets]);

  // Helper function to find the target container
  const findTargetContainer = useCallback((id) => {
    // Check if it's a main column
    const column = activeColumns.find(col => col.id === id);
    if (column) return { type: 'column', id: column.id, title: column.title };

    // Check if it's a subcolumn
    for (const col of activeColumns) {
      if (col.subcolumns) {
        const subcolumn = col.subcolumns.find(sub => sub.id === id);
        if (subcolumn) return { 
          type: 'subcolumn', 
          id: subcolumn.id, 
          title: subcolumn.title,
          parentColumn: col.id 
        };
      }
    }

    return null;
  }, [activeColumns]);

  // Enhanced drag start handler
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const card = cards.find(c => c.id === active.id);
    
    if (card) {
      startAnimation();
      startDrag(card, event);
      
      // Set up drag preview
      if (dragOverlayRef.current) {
        dragOverlayRef.current.style.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`;
      }
    }
  }, [cards, startDrag, startAnimation, dragOffset]);

  // Enhanced drag over handler
  const handleDragOver = useCallback((event) => {
    const { over, active } = event;
    
    if (over) {
      setDragOverTarget(over.id);
      
      // Find target container
      const targetContainer = findTargetContainer(over.id);
      if (targetContainer) {
        setDropZoneIndicator({
          ...targetContainer,
          isActive: true,
          cardCount: getCardsByColumn(targetContainer.id).length
        });
      }
    }
  }, [setDragOverTarget, findTargetContainer, getCardsByColumn, setDropZoneIndicator]);

  // Enhanced drag end handler
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    
    endAnimation();
    
    if (!over) {
      endDrag();
      return;
    }

    const draggedCardId = active.id;
    const targetId = over.id;

    // Find the dragged card
    const card = cards.find(c => c.id === draggedCardId);
    if (!card) {
      endDrag();
      return;
    }

    // Find target container
    let targetContainer = findTargetContainer(targetId);
    if (!targetContainer) {
      // If target is not a container, it might be another card
      const targetCard = cards.find(c => c.id === targetId);
      if (targetCard) {
        if (targetCard.subcolumnId) {
          targetContainer = { 
            type: 'subcolumn', 
            id: targetCard.subcolumnId, 
            parentColumn: targetCard.columnId 
          };
        } else {
          targetContainer = { type: 'column', id: targetCard.columnId };
        }
      } else {
        endDrag();
        return;
      }
    }

    // Check constraints
    const source = { columnId: card.columnId, subcolumnId: card.subcolumnId };
    const target = { 
      columnId: targetContainer.type === 'column' ? targetContainer.id : targetContainer.parentColumn,
      subcolumnId: targetContainer.type === 'subcolumn' ? targetContainer.id : null,
      cardCount: getCardsByColumn(targetContainer.id).length
    };

    if (!canDrop(source, target, card)) {
      endDrag();
      return;
    }

    // Handle reordering within the same container
    if (targetContainer.type === 'subcolumn' && card.subcolumnId === targetContainer.id) {
      const subcolumnCards = getCardsBySubcolumn(targetContainer.id);
      const oldIndex = subcolumnCards.findIndex(c => c.id === draggedCardId);
      const newIndex = subcolumnCards.findIndex(c => c.id === targetId);
      
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1 && canReorder(source, target)) {
        try {
          await reorderCards(targetContainer.id, oldIndex, newIndex);
        } catch (error) {
          console.error('Error reordering within subcolumn:', error);
        }
      }
      endDrag();
      return;
    }

    if (targetContainer.type === 'column' && card.columnId === targetContainer.id && !card.subcolumnId) {
      const columnCards = getCardsByColumn(targetContainer.id);
      const oldIndex = columnCards.findIndex(c => c.id === draggedCardId);
      const newIndex = columnCards.findIndex(c => c.id === targetId);
      
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1 && canReorder(source, target)) {
        try {
          await reorderCards(targetContainer.id, oldIndex, newIndex);
        } catch (error) {
          console.error('Error reordering within column:', error);
        }
      }
      endDrag();
      return;
    }

    // Handle moving between containers
    const fromColumn = card.columnId;
    const fromSubcolumn = card.subcolumnId;
    let toColumn, toSubcolumn;

    if (targetContainer.type === 'column') {
      toColumn = targetContainer.id;
      toSubcolumn = null;
    } else {
      toColumn = targetContainer.parentColumn;
      toSubcolumn = targetContainer.id;
    }

    // Check permissions
    if (!canMoveCard(fromColumn, toColumn)) {
      endDrag();
      return;
    }

    try {
      await moveCard(draggedCardId, fromColumn, toColumn, toSubcolumn);
    } catch (error) {
      console.error('Error moving card:', error);
    } finally {
      endDrag();
    }
  }, [
    endAnimation, 
    endDrag, 
    cards, 
    findTargetContainer, 
    canDrop, 
    canReorder, 
    getCardsBySubcolumn, 
    getCardsByColumn, 
    reorderCards, 
    canMoveCard, 
    moveCard
  ]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event) => {
    if (isDragging) {
      const result = handleKeyboardDrag(event, draggedCard);
      if (result) {
        event.preventDefault();
        switch (result.action) {
          case 'startDrag':
            startKeyboardDrag(result.card);
            break;
          case 'cancelDrag':
            endDrag();
            break;
          case 'drop':
            // Handle drop at current target
            if (currentTarget) {
              // Simulate drag end with current target
              handleDragEnd({ active: { id: draggedCard?.id }, over: { id: currentTarget.id } });
            }
            break;
        }
      }
    }
  }, [isDragging, draggedCard, handleKeyboardDrag, startKeyboardDrag, endDrag, currentTarget, handleDragEnd]);

  // Multi-select handlers
  const handleCardClick = useCallback((card, event) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select mode
      toggleCardSelection(card.id);
    } else if (event.shiftKey && selectedItems.length > 0) {
      // Range select
      const lastSelected = selectedItems[selectedItems.length - 1];
      selectRange(lastSelected, card.id, cards);
    } else {
      // Single select
      clearMultiSelection();
      if (onCardClick) {
        onCardClick(card);
      }
    }
  }, [toggleCardSelection, selectedItems, selectRange, cards, clearMultiSelection, onCardClick]);

  // Select all cards
  const handleSelectAll = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      selectAll(cards);
    }
  }, [selectAll, cards]);

  // Loading and error states
  if (loading) {
    return <LoadingOverlay />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Error loading Kanban board
          </div>
          <div className="text-gray-600">{error?.message || error?.toString() || 'Unknown error'}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={boardRef}
      className="h-full flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header with Filters and Multi-select Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <button
                onClick={clearMultiSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <FiltersPanel />
      </div>
      
      {/* Board Container */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[
            restrictToHorizontalAxis,
            restrictToWindowEdges
          ]}
        >
          {/* Board Content */}
          <div className="h-full overflow-x-auto">
            <div className="flex gap-4 p-4 min-w-max">
              {activeColumns.map((column) => {
                const columnCards = getCardsByColumn(column.id);
                
                return (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={columnCards}
                    onCardClick={handleCardClick}
                    onCreateCard={onCreateCard}
                    isDragging={isDragging}
                    dragOver={dragOver}
                    selectedCards={selectedItems}
                    onCardSelect={toggleCardSelection}
                    getDragStyles={getDragStyles}
                    getDropZoneStyles={getDropZoneStyles}
                  />
                );
              })}
            </div>
          </div>

          {/* Enhanced Drag Overlay */}
          <DragOverlay>
            {isDragging && dragPreview ? (
              <div ref={dragOverlayRef}>
                <DragPreview
                  card={dragPreview}
                  isKeyboardDragging={isKeyboardDragging}
                  dragDuration={getDragDuration()}
                  isLongDrag={isLongDrag()}
                  selectedCount={selectedItems.length}
                />
              </div>
            ) : null}
          </DragOverlay>

          {/* Drop Zone Indicator */}
          {dropZone && (
            <DropZoneIndicator
              target={dropZone}
              isActive={true}
              cardCount={dropZone.cardCount}
              getDropZoneStyles={getDropZoneStyles}
            />
          )}
        </DndContext>
      </div>

      {/* Multi-select Overlay */}
      {isMultiDragging && dragGroup && (
        <MultiSelectOverlay
          cards={dragGroup}
          count={getSelectedCount()}
        />
      )}

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
      
      {/* Help Panel */}
      <HelpPanel />
    </div>
  );
};

export default EnhancedKanbanBoard;
