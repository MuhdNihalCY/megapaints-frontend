/**
 * Enhanced Kanban Card Component
 * Trello-like card with advanced drag and drop features
 */

import { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreHorizontal, 
  Calendar, 
  User, 
  Tag, 
  Paperclip, 
  MessageCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  GripVertical,
  Copy,
  Archive,
  Trash2
} from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';
import { useDueDateStatus, usePriorityDisplay, useLabelsDisplay } from '../hooks/useKanban';
import { CARD_PRIORITIES } from '../utils/constants';

/**
 * Enhanced Kanban Card Component
 */
const EnhancedKanbanCard = ({ 
  card, 
  isDragging = false, 
  onCardClick,
  isSelected = false,
  onCardSelect,
  getDragStyles,
  showQuickActions = true
}) => {
  const { users } = useKanban();
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Set up sortable for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCardDragging,
    isOver
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card
    }
  });

  // Get card display information
  const dueDateStatus = useDueDateStatus(card.dueDate);
  const priorityDisplay = usePriorityDisplay(card.priority);
  const labelsDisplay = useLabelsDisplay(card.labels);

  // Handle card click
  const handleCardClick = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select mode
      event.preventDefault();
      if (onCardSelect) {
        onCardSelect(card.id);
      }
    } else if (event.shiftKey) {
      // Range select
      event.preventDefault();
      if (onCardSelect) {
        onCardSelect(card.id);
      }
    } else {
      // Single select
      if (onCardClick) {
        onCardClick(card, event);
      }
    }
  }, [card, onCardClick, onCardSelect]);

  // Handle card hover
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowActions(false);
  }, []);

  // Handle quick actions
  const handleQuickAction = useCallback((action, event) => {
    event.stopPropagation();
    console.log(`Quick action: ${action}`, card);
    // Implement quick actions here
  }, [card]);

  // Get card styles
  const getCardStyles = () => {
    const baseStyles = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    if (getDragStyles) {
      return {
        ...baseStyles,
        ...getDragStyles(isCardDragging, isOver)
      };
    }

    return baseStyles;
  };

  // Animation variants
  const cardVariants = {
    initial: { 
      scale: 1, 
      opacity: 1,
      y: 0
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    drag: {
      scale: 1.05,
      rotate: 5,
      opacity: 0.9,
      transition: {
        duration: 0.1,
        ease: 'easeOut'
      }
    },
    selected: {
      scale: 1.01,
      boxShadow: '0 0 0 2px #3b82f6',
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  const actionVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: 10
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 10,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={getCardStyles()}
      className={clsx(
        'group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        'cursor-pointer select-none',
        isCardDragging && 'z-50',
        isSelected && 'ring-2 ring-blue-500 ring-opacity-50',
        isOver && 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
      )}
      variants={cardVariants}
      initial="initial"
      animate={isCardDragging ? 'drag' : isSelected ? 'selected' : isHovered ? 'hover' : 'initial'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      {...attributes}
    >
      {/* Drag Handle */}
      <div
        className={clsx(
          'absolute left-2 top-2 w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'cursor-grab active:cursor-grabbing'
        )}
        {...listeners}
      >
        <GripVertical size={14} />
      </div>

      {/* Card Content */}
      <div className="p-3 pt-6">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight flex-1 pr-2">
            {card.title}
          </h3>
          
          {/* Priority Indicator */}
          {priorityDisplay.level !== 'medium' && (
            <div
              className={clsx(
                'w-3 h-3 rounded-full flex-shrink-0 mt-1',
                {
                  'bg-red-500': priorityDisplay.level === 'urgent',
                  'bg-orange-500': priorityDisplay.level === 'high',
                  'bg-gray-400': priorityDisplay.level === 'low'
                }
              )}
              title={`Priority: ${priorityDisplay.label}`}
            />
          )}
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Labels */}
        {labelsDisplay.hasLabels && (
          <div className="flex flex-wrap gap-1 mb-3">
            {labelsDisplay.labels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded text-white font-medium"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {labelsDisplay.labelCount > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                +{labelsDisplay.labelCount - 3}
              </span>
            )}
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            {/* Due Date */}
            {card.dueDate && (
              <div className={clsx(
                'flex items-center space-x-1 px-2 py-1 rounded',
                {
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': dueDateStatus.isOverdue,
                  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': dueDateStatus.isDueToday,
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': dueDateStatus.isUpcoming
                }
              )}>
                <Clock size={12} />
                <span>{dueDateStatus.formattedDate}</span>
              </div>
            )}

            {/* Assignees */}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex items-center space-x-1">
                <User size={12} />
                <span>{card.assignees.length}</span>
              </div>
            )}

            {/* Comments */}
            {card.comments && card.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle size={12} />
                <span>{card.comments.length}</span>
              </div>
            )}

            {/* Attachments */}
            {card.isAttachments && (
              <div className="flex items-center space-x-1">
                <Paperclip size={12} />
              </div>
            )}
          </div>

          {/* Quick Actions Button */}
          {showQuickActions && (
            <button
              className={clsx(
                'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50"
            variants={actionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="py-1">
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                onClick={(e) => handleQuickAction('copy', e)}
              >
                <Copy size={14} />
                <span>Copy card</span>
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                onClick={(e) => handleQuickAction('archive', e)}
              >
                <Archive size={14} />
                <span>Archive</span>
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                onClick={(e) => handleQuickAction('delete', e)}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <CheckCircle size={12} className="text-white" />
        </div>
      )}

      {/* Drag Overlay Effect */}
      {isCardDragging && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none" />
      )}
    </motion.div>
  );
};

export default EnhancedKanbanCard;
