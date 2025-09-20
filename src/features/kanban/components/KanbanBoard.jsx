/**
 * Kanban Board Component
 * Main component that renders the entire Kanban board with drag and drop
 */

import { useMemo, useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';

import { useKanban } from '../contexts/KanbanContext';
import { useDragAndDrop } from '../hooks/useKanban';
import { COLUMN_TYPES } from '../utils/constants';
import { kanbanService } from '../services/kanbanService';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import EnhancedKanbanCard from './EnhancedKanbanCard';
import FiltersPanel from './FiltersPanel';
import KeyboardShortcuts from './KeyboardShortcuts';
import HelpPanel from './HelpPanel';

import { LoadingOverlay } from '../../../components';

/**
 * Main Kanban Board Component
 */
const KanbanBoard = ({ onCardClick, onCreateCard }) => {
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
  


  const {
    draggedCard,
    isDragging,
    startDrag,
    endDrag,
    setDragOver
  } = useDragAndDrop();

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Get active columns
  const activeColumns = useMemo(() => getActiveColumns(), [getActiveColumns]);

  // Helper function to find the target container
  const findTargetContainer = (id) => {
    // Check if it's a main column
    const column = columns.find(col => col.id === id);
    if (column) return { type: 'column', id: column.id };

    // Check if it's a subcolumn
    for (const col of columns) {
      if (col.subcolumns) {
        const subcolumn = col.subcolumns.find(sub => sub.id === id);
        if (subcolumn) return { type: 'subcolumn', id: subcolumn.id, parentColumn: col.id };
      }
    }

    return null;
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

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
      // In this case, we need to find the container of the target card
      const targetCard = cards.find(c => c.id === targetId);
      if (targetCard) {
        // Dropping on another card - find the container of the target card
        if (targetCard.subcolumnId) {
          // Target card is in a subcolumn
          targetContainer = { 
            type: 'subcolumn', 
            id: targetCard.subcolumnId, 
            parentColumn: targetCard.columnId 
          };
        } else {
          // Target card is in a main column
          targetContainer = { type: 'column', id: targetCard.columnId };
        }
      } else {
        endDrag();
        return;
      }
    }

    // Handle reordering within the same container
    if (targetContainer.type === 'subcolumn' && card.subcolumnId === targetContainer.id) {
      // Reordering within the same subcolumn
      const subcolumnCards = getCardsBySubcolumn(targetContainer.id);
      const oldIndex = subcolumnCards.findIndex(c => c.id === draggedCardId);
      const newIndex = subcolumnCards.findIndex(c => c.id === targetId);
      
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        // Reorder within the same subcolumn
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
      // Reordering within the same column (non-grouped)
      const columnCards = getCardsByColumn(targetContainer.id);
      const oldIndex = columnCards.findIndex(c => c.id === draggedCardId);
      const newIndex = columnCards.findIndex(c => c.id === targetId);
      
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        // Reorder within the same column
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
      toSubcolumn = null; // Moving to main column
    } else if (targetContainer.type === 'subcolumn') {
      toColumn = targetContainer.parentColumn;
      toSubcolumn = targetContainer.id; // Moving to subcolumn
    } else {
      console.error('Unknown target container type:', targetContainer);
      endDrag();
      return;
    }

    // Debug logging
    console.log('Card move details:', {
      cardId: draggedCardId,
      cardTitle: card.title,
      fromColumn,
      fromSubcolumn,
      toColumn,
      toSubcolumn,
      targetContainer,
      targetContainerType: targetContainer.type,
      targetContainerId: targetContainer.id,
      parentColumn: targetContainer.parentColumn,
      cardData: {
        id: card.id,
        columnId: card.columnId,
        subcolumnId: card.subcolumnId,
        _originalData: card._originalData
      }
    });

    // Handle case where card doesn't have a columnId
    if (!fromColumn) {
      console.warn('Card has no columnId, determining fallback column');
      
      // Try to determine from original data
      let fallbackColumn = 'sales';
      if (card._originalData?.determinedCurrentList) {
        fallbackColumn = kanbanService.mapListToColumn(card._originalData.determinedCurrentList);
      } else if (card._originalData?.CurrentList) {
        fallbackColumn = kanbanService.mapListToColumn(card._originalData.CurrentList);
      }
      
      console.log('Using fallback column:', fallbackColumn, 'from:', card._originalData);
      
      // Check permissions with fallback
      if (!canMoveCard(fallbackColumn, toColumn)) {
        console.warn('Cannot move card from fallback column');
        endDrag();
        return;
      }

      try {
        // Calculate position for fallback move too
        let position = null;
        if (toSubcolumn) {
          const subcolumnCards = getCardsBySubcolumn(toSubcolumn);
          position = subcolumnCards.length;
        } else {
          const columnCards = getCardsByColumn(toColumn).filter(card => !card.subcolumnId);
          position = columnCards.length;
        }
        
        console.log('Fallback calculated position:', position);
        
        await moveCard(draggedCardId, fallbackColumn, toColumn, toSubcolumn, position);
      } catch (error) {
        console.error('Error moving card with fallback column:', error);
      } finally {
        endDrag();
      }
      return;
    }

    // Check permissions
    if (!canMoveCard(fromColumn, toColumn)) {
      console.warn('Cannot move card due to permissions');
      endDrag();
      return;
    }

    try {
      // Calculate position - add to end of target column/subcolumn
      let position = null;
      if (toSubcolumn) {
        // Moving to subcolumn - get count of cards in that subcolumn
        const subcolumnCards = getCardsBySubcolumn(toSubcolumn);
        position = subcolumnCards.length;
      } else {
        // Moving to main column - get count of cards in that column (excluding subcolumn cards)
        const columnCards = getCardsByColumn(toColumn).filter(card => !card.subcolumnId);
        position = columnCards.length;
      }
      
      console.log('Calculated position:', position, 'for', toSubcolumn ? 'subcolumn' : 'column', toColumn);
      
      await moveCard(draggedCardId, fromColumn, toColumn, toSubcolumn, position);
    } catch (error) {
      console.error('Error moving card:', error);
    } finally {
      endDrag();
    }
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    const card = cards.find(c => c.id === active.id);
    if (card) {
      startDrag(card);
    }
  };

  // Handle drag over
  const handleDragOver = (event) => {
    const { over } = event;
    if (over) {
      setDragOver(over.id);
    }
  };

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
    <div className="h-full flex flex-col">
      {/* Header with Filters */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700">
        <FiltersPanel />
      </div>
      
      {/* Board Container */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          {/* Board Content */}
          <div className="h-full overflow-x-auto">
            <div className="flex gap-4 p-4 min-w-max">
              {activeColumns.map((column) => {
                // Debug logging for column rendering
                // if (process.env.NODE_ENV === 'development') {
                //   console.log('Rendering column:', {
                //     id: column.id,
                //     type: column.type,
                //     title: column.title,
                //     isGrouped: column.subcolumns && column.subcolumns.length > 0,
                //     subcolumnsCount: column.subcolumns ? column.subcolumns.length : 0
                //   });
                // }
                
                return (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={getCardsByColumn(column.id)}
                    onCardClick={onCardClick}
                    onCreateCard={onCreateCard}
                  />
                );
              })}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {isDragging && draggedCard ? (
              <EnhancedKanbanCard 
                card={draggedCard} 
                isDragging 
                getDragStyles={() => ({
                  transform: 'rotate(5deg) scale(1.05)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  opacity: 0.9
                })}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
      
      {/* Help Panel */}
      <HelpPanel />
      

    </div>
  );
};

export default KanbanBoard;

