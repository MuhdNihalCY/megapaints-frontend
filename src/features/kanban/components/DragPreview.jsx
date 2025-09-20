/**
 * Drag Preview Component
 * Enhanced drag preview with Trello-like animations and effects
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, Clock, Users, Tag } from 'lucide-react';
import clsx from 'clsx';

const DragPreview = memo(({ 
  card, 
  isKeyboardDragging = false, 
  dragDuration = 0, 
  isLongDrag = false,
  selectedCount = 0 
}) => {
  const getPreviewStyles = () => {
    const baseStyles = {
      transform: 'rotate(5deg) scale(1.05)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      opacity: 0.95
    };

    if (isLongDrag) {
      return {
        ...baseStyles,
        transform: 'rotate(8deg) scale(1.1)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)'
      };
    }

    if (isKeyboardDragging) {
      return {
        ...baseStyles,
        transform: 'scale(1.02)',
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25)',
        border: '2px solid #3b82f6'
      };
    }

    return baseStyles;
  };

  const getAnimationVariants = () => ({
    initial: { 
      scale: 1, 
      rotate: 0,
      opacity: 1
    },
    animate: {
      scale: isLongDrag ? 1.1 : 1.05,
      rotate: isLongDrag ? 8 : 5,
      opacity: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  });

  return (
    <motion.div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600',
        'shadow-lg cursor-grabbing select-none',
        'min-w-[280px] max-w-[320px]',
        isKeyboardDragging && 'ring-2 ring-blue-500 ring-opacity-50'
      )}
      style={getPreviewStyles()}
      variants={getAnimationVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
    >
      {/* Card Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
            {card.title}
          </h3>
          {selectedCount > 1 && (
            <div className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              +{selectedCount - 1}
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-2">
        {/* Description */}
        {card.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.labels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded text-white"
                style={{ backgroundColor: label.color || '#6b7280' }}
              >
                {label.name || label}
              </span>
            ))}
            {card.labels.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                +{card.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {/* Due Date */}
            {card.dueDate && (
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{new Date(card.dueDate).toLocaleDateString()}</span>
              </div>
            )}

            {/* Assignees */}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users size={12} />
                <span>{card.assignees.length}</span>
              </div>
            )}

            {/* Comments */}
            {card.comments && card.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag size={12} />
                <span>{card.comments.length}</span>
              </div>
            )}
          </div>

          {/* Priority */}
          {card.priority && card.priority !== 'medium' && (
            <div className={clsx(
              'px-2 py-1 rounded text-xs font-medium',
              {
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': card.priority === 'urgent',
                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': card.priority === 'high',
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': card.priority === 'low'
              }
            )}>
              {card.priority}
            </div>
          )}
        </div>
      </div>

      {/* Drag Indicator */}
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>

      {/* Long Drag Effect */}
      {isLongDrag && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none" />
      )}

      {/* Keyboard Drag Indicator */}
      {isKeyboardDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none" />
      )}
    </motion.div>
  );
});

DragPreview.displayName = 'DragPreview';

export default DragPreview;
