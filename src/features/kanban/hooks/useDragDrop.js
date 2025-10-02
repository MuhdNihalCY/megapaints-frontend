/**
 * useDragDrop Hook
 * Hook for managing drag and drop functionality
 */

import { useState, useCallback, useRef } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import { useKanban } from './useKanban';
import { usePermissions } from './usePermissions';
import { validateDragStart, validateDrop, handleDragEnd } from '../utils/dragDropRules';

export const useDragDrop = () => {
  const { moveCard } = useKanban();
  const { user } = usePermissions();
  const [dragData, setDragData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  const rollbackDataRef = useRef(null);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const cardId = active.id;
    
    // Get card data from context
    const card = dragData?.cards?.find(c => c._id === cardId);
    if (!card) return;

    // Validate drag start
    const validation = validateDragStart(card, user);
    if (!validation.canDrag) {
      console.warn('Drag not allowed:', validation.reason);
      return;
    }

    setIsDragging(true);
    setDragPreview({
      id: cardId,
      title: card.title,
      priority: card.priority,
      labels: card.labels,
      assignees: card.assignees
    });

    // Store rollback data
    rollbackDataRef.current = {
      cardId,
      fromColumnId: card.columnId,
      fromPosition: card.position,
      fromSubColumnId: card.subcolumnId
    };
  }, [user, dragData]);

  // Handle drag over
  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    
    if (!over) return;

    const cardId = active.id;
    const targetColumnId = over.id;
    
    // Get card data
    const card = dragData?.cards?.find(c => c._id === cardId);
    if (!card) return;

    // Validate drop
    const validation = validateDrop(card, targetColumnId, null, user);
    
    // Update visual feedback
    if (validation.canDrop) {
      // Add visual feedback for valid drop
      document.body.style.cursor = 'grabbing';
    } else {
      // Add visual feedback for invalid drop
      document.body.style.cursor = 'not-allowed';
    }
  }, [user, dragData]);

  // Handle drag end
  const handleDragEndEvent = useCallback(async (event) => {
    const { active, over } = event;
    
    setIsDragging(false);
    setDragPreview(null);
    document.body.style.cursor = '';

    if (!over || !rollbackDataRef.current) {
      return;
    }

    const cardId = active.id;
    const targetColumnId = over.id;
    
    // Get card data
    const card = dragData?.cards?.find(c => c._id === cardId);
    if (!card) return;

    // Calculate new position
    const targetCards = dragData?.cards?.filter(c => c.columnId === targetColumnId) || [];
    const newPosition = targetCards.length * 1000;

    // Handle drag end with validation
    const result = handleDragEnd(card, targetColumnId, newPosition, user);
    
    if (result.success) {
      try {
        await moveCard(cardId, targetColumnId, newPosition);
      } catch (error) {
        console.error('Error moving card:', error);
        // Rollback will be handled by the context
      }
    } else {
      console.warn('Move not allowed:', result.error);
    }

    rollbackDataRef.current = null;
  }, [user, dragData, moveCard]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setDragPreview(null);
    document.body.style.cursor = '';
    rollbackDataRef.current = null;
  }, []);

  // Monitor drag and drop events
  useDndMonitor({
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEndEvent,
    onDragCancel: handleDragCancel
  });

  // Get drag constraints
  const getDragConstraints = useCallback(() => {
    return {
      canDrag: true,
      canDrop: true,
      restrictedColumns: ['done-less-7', 'done-more-7'],
      userPermissions: {
        canMoveCards: true,
        canReorderCards: true
      }
    };
  }, []);

  // Check if move is allowed
  const isMoveAllowed = useCallback((fromColumnId, toColumnId) => {
    if (!dragData?.cards) return false;
    
    const card = dragData.cards.find(c => c.columnId === fromColumnId);
    if (!card) return false;

    return validateDrop(card, toColumnId, null, user).canDrop;
  }, [user, dragData]);

  // Get valid drop targets
  const getValidDropTargets = useCallback((cardId) => {
    if (!dragData?.cards) return [];
    
    const card = dragData.cards.find(c => c._id === cardId);
    if (!card) return [];

    const validTargets = [];
    const columns = dragData.columns || [];

    columns.forEach(column => {
      if (validateDrop(card, column._id, null, user).canDrop) {
        validTargets.push({
          columnId: column._id,
          columnName: column.name,
          reason: 'Valid move target'
        });
      }
    });

    return validTargets;
  }, [user, dragData]);

  return {
    isDragging,
    dragPreview,
    dragData,
    setDragData,
    getDragConstraints,
    isMoveAllowed,
    getValidDropTargets,
    handleDragStart,
    handleDragEnd: handleDragEndEvent,
    handleDragCancel
  };
};

export default useDragDrop;
