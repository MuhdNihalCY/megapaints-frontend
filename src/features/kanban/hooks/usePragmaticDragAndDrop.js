/**
 * Pragmatic Drag and Drop Hook
 * Using Atlassian's Pragmatic Drag and Drop for better DND experience
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  draggable, 
  dropTargetForElements,
  monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

/**
 * Pragmatic Drag and Drop Hook
 * Provides natural, fluid drag and drop with better performance
 */
export const usePragmaticDragAndDrop = () => {
  const [draggedCard, setDraggedCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const dragStartTime = useRef(null);
  const dragElementRef = useRef(null);
  const cardRefs = useRef(new Map());
  const columnRefs = useRef(new Map());

  // Start drag operation
  const startDrag = useCallback((card, event = null) => {
    setDraggedCard(card);
    setIsDragging(true);
    setDragStartTime(Date.now());
    
    // Set up drag preview
    setDragPreview({
      ...card,
      isDragging: true,
      position: 'fixed',
      zIndex: 1000,
      pointerEvents: 'none',
      transform: 'rotate(5deg)',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      opacity: 0.9
    });

    console.log('Pragmatic DND: Started dragging card', card.title);
  }, []);

  // End drag operation
  const endDrag = useCallback(() => {
    setDraggedCard(null);
    setIsDragging(false);
    setDragOver(null);
    setDragPreview(null);
    setDropZone(null);
    setDragOffset({ x: 0, y: 0 });
    
    console.log('Pragmatic DND: Ended drag operation');
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((target) => {
    setDragOver(target);
    setDropZone(target);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOver(null);
    setDropZone(null);
  }, []);

  // Setup draggable element
  const setupDraggable = useCallback((element, card, onDragEnd) => {
    if (!element) return;

    const cleanup = draggable({
      element,
      getInitialData: () => ({
        type: 'card',
        cardId: card.id,
        card: card
      }),
      onDragStart: (args) => {
        console.log('Pragmatic DND: Drag started', card.title);
        startDrag(card, args);
      },
      onDrop: (args) => {
        console.log('Pragmatic DND: Card dropped', args);
        if (onDragEnd) {
          onDragEnd(args);
        }
        endDrag();
      }
    });

    cardRefs.current.set(card.id, { element, cleanup });
    return cleanup;
  }, [startDrag, endDrag]);

  // Setup drop target
  const setupDropTarget = useCallback((element, column, onCardMove) => {
    if (!element) return;

    const cleanup = dropTargetForElements({
      element,
      getData: ({ input, element }) => {
        return {
          type: 'column',
          columnId: column.id,
          column: column
        };
      },
      onDragEnter: (args) => {
        console.log('Pragmatic DND: Drag entered column', column.title);
        handleDragOver(column);
      },
      onDragLeave: (args) => {
        console.log('Pragmatic DND: Drag left column', column.title);
        handleDragLeave();
      },
      onDrop: (args) => {
        const { source } = args;
        if (source.data.type === 'card') {
          console.log('Pragmatic DND: Card dropped on column', column.id, 'from', source.data.cardId);
          
          // Handle the move operation
          if (onCardMove && source.data.card) {
            const card = source.data.card;
            const fromColumn = card.columnId;
            const toColumn = column.id;
            
            if (fromColumn !== toColumn) {
              console.log('Pragmatic DND: Moving card from', fromColumn, 'to', toColumn);
              onCardMove(card.id, fromColumn, toColumn);
            }
          }
          
          endDrag();
        }
      }
    });

    columnRefs.current.set(column.id, { element, cleanup });
    return cleanup;
  }, [handleDragOver, handleDragLeave, endDrag]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Cleanup all card draggables
    cardRefs.current.forEach(({ cleanup }) => {
      if (cleanup) cleanup();
    });
    cardRefs.current.clear();

    // Cleanup all column drop targets
    columnRefs.current.forEach(({ cleanup }) => {
      if (cleanup) cleanup();
    });
    columnRefs.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    draggedCard,
    isDragging,
    dragOver,
    dragPreview,
    dropZone,
    isMultiSelect,
    selectedCards,
    dragOffset,
    
    // Actions
    startDrag,
    endDrag,
    handleDragOver,
    handleDragLeave,
    setupDraggable,
    setupDropTarget,
    cleanup,
    
    // Refs
    cardRefs: cardRefs.current,
    columnRefs: columnRefs.current
  };
};

/**
 * Hook for monitoring drag operations
 */
export const useDragMonitor = () => {
  const [dragData, setDragData] = useState(null);

  useEffect(() => {
    const cleanup = monitorForElements({
      onDragStart: (args) => {
        setDragData(args.source.data);
      },
      onDrop: (args) => {
        setDragData(null);
      }
    });

    return cleanup;
  }, []);

  return dragData;
};
