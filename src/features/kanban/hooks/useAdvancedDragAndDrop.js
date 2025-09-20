/**
 * Advanced Drag and Drop Hooks
 * Comprehensive Trello-like drag and drop functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  closestCenter, 
  closestCorners, 
  rectIntersection,
  pointerWithin,
  getFirstCollision
} from '@dnd-kit/core';

/**
 * Enhanced drag and drop hook with Trello-like features
 */
export const useAdvancedDragAndDrop = () => {
  const [draggedCard, setDraggedCard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isKeyboardDragging, setIsKeyboardDragging] = useState(false);
  
  const dragStartTime = useRef(null);
  const dragElementRef = useRef(null);

  // Start drag operation
  const startDrag = useCallback((card, event = null) => {
    setDraggedCard(card);
    setIsDragging(true);
    setDragStartTime(Date.now());
    
    // Calculate drag offset for smooth positioning
    if (event && event.active) {
      const rect = event.active.rect.current.translated;
      setDragOffset({
        x: event.delta.x,
        y: event.delta.y
      });
    }

    // Set up drag preview
    setDragPreview({
      ...card,
      isDragging: true,
      dragStartTime: Date.now()
    });
  }, []);

  // End drag operation
  const endDrag = useCallback(() => {
    setDraggedCard(null);
    setIsDragging(false);
    setDragOver(null);
    setDropZone(null);
    setDragPreview(null);
    setDragOffset({ x: 0, y: 0 });
    setIsKeyboardDragging(false);
    setDragStartTime(null);
  }, []);

  // Set drag over target
  const setDragOverTarget = useCallback((target) => {
    setDragOver(target);
  }, []);

  // Set drop zone indicator
  const setDropZoneIndicator = useCallback((zone) => {
    setDropZone(zone);
  }, []);

  // Multi-select functionality
  const toggleCardSelection = useCallback((cardId) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCards([]);
    setIsMultiSelect(false);
  }, []);

  const selectAllCards = useCallback((cards) => {
    setSelectedCards(cards.map(card => card.id));
    setIsMultiSelect(true);
  }, []);

  // Keyboard drag operations
  const startKeyboardDrag = useCallback((card) => {
    setDraggedCard(card);
    setIsDragging(true);
    setIsKeyboardDragging(true);
    setDragPreview({
      ...card,
      isDragging: true,
      isKeyboardDrag: true
    });
  }, []);

  // Get drag duration for animations
  const getDragDuration = useCallback(() => {
    if (!dragStartTime) return 0;
    return Date.now() - dragStartTime;
  }, [dragStartTime]);

  // Check if drag is long enough for special effects
  const isLongDrag = useCallback(() => {
    return getDragDuration() > 500; // 500ms threshold
  }, [getDragDuration]);

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
    isKeyboardDragging,
    
    // Actions
    startDrag,
    endDrag,
    setDragOverTarget,
    setDropZoneIndicator,
    toggleCardSelection,
    clearSelection,
    selectAllCards,
    startKeyboardDrag,
    
    // Utilities
    getDragDuration,
    isLongDrag,
    dragElementRef
  };
};

/**
 * Advanced collision detection strategies
 */
export const useCollisionDetection = () => {
  const [strategy, setStrategy] = useState('closestCorners');

  const strategies = {
    closestCorners,
    closestCenter,
    rectIntersection,
    pointerWithin,
    custom: (args) => {
      // Custom collision detection that combines multiple strategies
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      
      const rectCollisions = rectIntersection(args);
      if (rectCollisions.length > 0) {
        return rectCollisions;
      }
      
      return closestCorners(args);
    }
  };

  const getCollisionDetection = useCallback(() => {
    return strategies[strategy] || strategies.closestCorners;
  }, [strategy]);

  const setCollisionStrategy = useCallback((newStrategy) => {
    setStrategy(newStrategy);
  }, []);

  return {
    collisionDetection: getCollisionDetection(),
    setCollisionStrategy,
    availableStrategies: Object.keys(strategies)
  };
};

/**
 * Drag and drop animations and transitions
 */
export const useDragAnimations = () => {
  const [animations, setAnimations] = useState({
    enabled: true,
    duration: 200,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    scale: 1.05,
    rotation: 2,
    shadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
  });

  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const endAnimation = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const updateAnimationSettings = useCallback((newSettings) => {
    setAnimations(prev => ({ ...prev, ...newSettings }));
  }, []);

  const getDragStyles = useCallback((isDragging, isOver) => {
    if (!animations.enabled) return {};

    return {
      transform: isDragging 
        ? `scale(${animations.scale}) rotate(${animations.rotation}deg)` 
        : 'scale(1) rotate(0deg)',
      transition: isAnimating 
        ? `all ${animations.duration}ms ${animations.easing}` 
        : 'none',
      boxShadow: isDragging 
        ? animations.shadow 
        : 'none',
      zIndex: isDragging ? 1000 : 'auto',
      opacity: isDragging ? 0.9 : 1
    };
  }, [animations, isAnimating]);

  const getDropZoneStyles = useCallback((isOver, isActive) => {
    if (!animations.enabled) return {};

    return {
      transform: isOver 
        ? 'scale(1.02)' 
        : 'scale(1)',
      transition: `all ${animations.duration}ms ${animations.easing}`,
      backgroundColor: isOver 
        ? 'rgba(59, 130, 246, 0.1)' 
        : 'transparent',
      borderColor: isOver 
        ? 'rgb(59, 130, 246)' 
        : 'transparent',
      borderWidth: isOver ? '2px' : '0px',
      borderStyle: 'dashed'
    };
  }, [animations]);

  return {
    animations,
    isAnimating,
    startAnimation,
    endAnimation,
    updateAnimationSettings,
    getDragStyles,
    getDropZoneStyles
  };
};

/**
 * Keyboard navigation for drag and drop
 */
export const useKeyboardDragAndDrop = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [targets, setTargets] = useState([]);
  const [targetIndex, setTargetIndex] = useState(0);

  const registerTargets = useCallback((newTargets) => {
    setTargets(newTargets);
    setTargetIndex(0);
  }, []);

  const navigateToNext = useCallback(() => {
    setTargetIndex(prev => (prev + 1) % targets.length);
  }, [targets.length]);

  const navigateToPrevious = useCallback(() => {
    setTargetIndex(prev => (prev - 1 + targets.length) % targets.length);
  }, [targets.length]);

  const getCurrentTarget = useCallback(() => {
    return targets[targetIndex] || null;
  }, [targets, targetIndex]);

  const handleKeyboardDrag = useCallback((event, card) => {
    if (!isEnabled) return;

    const { key, ctrlKey, metaKey } = event;
    const modifierKey = ctrlKey || metaKey;

    switch (key) {
      case 'Enter':
        if (modifierKey) {
          event.preventDefault();
          // Start keyboard drag
          return { action: 'startDrag', card };
        }
        break;
      case 'Escape':
        event.preventDefault();
        return { action: 'cancelDrag' };
      case 'ArrowRight':
        event.preventDefault();
        navigateToNext();
        return { action: 'navigate', direction: 'next' };
      case 'ArrowLeft':
        event.preventDefault();
        navigateToPrevious();
        return { action: 'navigate', direction: 'previous' };
      case ' ':
        if (modifierKey) {
          event.preventDefault();
          return { action: 'drop' };
        }
        break;
    }

    return null;
  }, [isEnabled, navigateToNext, navigateToPrevious]);

  return {
    isEnabled,
    currentTarget: getCurrentTarget(),
    targets,
    targetIndex,
    registerTargets,
    navigateToNext,
    navigateToPrevious,
    handleKeyboardDrag,
    setIsEnabled
  };
};

/**
 * Multi-select drag and drop
 */
export const useMultiSelectDrag = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMultiDragging, setIsMultiDragging] = useState(false);
  const [dragGroup, setDragGroup] = useState(null);

  const toggleSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const selectRange = useCallback((startId, endId, allItems) => {
    const startIndex = allItems.findIndex(item => item.id === startId);
    const endIndex = allItems.findIndex(item => item.id === endId);
    
    if (startIndex === -1 || endIndex === -1) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    const rangeItems = allItems.slice(minIndex, maxIndex + 1);
    setSelectedItems(rangeItems.map(item => item.id));
  }, []);

  const selectAll = useCallback((allItems) => {
    setSelectedItems(allItems.map(item => item.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setIsMultiDragging(false);
    setDragGroup(null);
  }, []);

  const startMultiDrag = useCallback((items) => {
    setDragGroup(items);
    setIsMultiDragging(true);
  }, []);

  const endMultiDrag = useCallback(() => {
    setIsMultiDragging(false);
    setDragGroup(null);
  }, []);

  const isSelected = useCallback((itemId) => {
    return selectedItems.includes(itemId);
  }, [selectedItems]);

  const getSelectedCount = useCallback(() => {
    return selectedItems.length;
  }, [selectedItems]);

  return {
    selectedItems,
    isMultiDragging,
    dragGroup,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    startMultiDrag,
    endMultiDrag,
    isSelected,
    getSelectedCount
  };
};

/**
 * Drag and drop constraints and validation
 */
export const useDragConstraints = () => {
  const [constraints, setConstraints] = useState({
    allowCrossColumn: true,
    allowCrossSubcolumn: true,
    allowReorder: true,
    maxCardsPerColumn: null,
    restrictedColumns: [],
    restrictedSubcolumns: [],
    allowDropOnCards: true,
    allowDropOnEmpty: true
  });

  const canDrop = useCallback((source, target, card) => {
    // Check if cross-column movement is allowed
    if (!constraints.allowCrossColumn && source.columnId !== target.columnId) {
      return false;
    }

    // Check if cross-subcolumn movement is allowed
    if (!constraints.allowCrossSubcolumn && 
        source.subcolumnId !== target.subcolumnId) {
      return false;
    }

    // Check restricted columns
    if (constraints.restrictedColumns.includes(target.columnId)) {
      return false;
    }

    // Check restricted subcolumns
    if (target.subcolumnId && 
        constraints.restrictedSubcolumns.includes(target.subcolumnId)) {
      return false;
    }

    // Check max cards per column
    if (constraints.maxCardsPerColumn && 
        target.cardCount >= constraints.maxCardsPerColumn) {
      return false;
    }

    return true;
  }, [constraints]);

  const canReorder = useCallback((source, target) => {
    return constraints.allowReorder;
  }, [constraints.allowReorder]);

  const updateConstraints = useCallback((newConstraints) => {
    setConstraints(prev => ({ ...prev, ...newConstraints }));
  }, []);

  return {
    constraints,
    canDrop,
    canReorder,
    updateConstraints
  };
};
