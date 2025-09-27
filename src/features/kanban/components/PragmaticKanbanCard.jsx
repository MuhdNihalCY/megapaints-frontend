/**
 * Pragmatic Drag and Drop Kanban Card
 * Enhanced card component using Pragmatic DND for better drag experience
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  MoreHorizontal, 
  CheckCircle2,
  AlertCircle,
  Circle,
  Square,
  Star,
  Tag
} from 'lucide-react';

import { usePragmaticDragAndDrop } from '../hooks/usePragmaticDragAndDrop';
import { usePriorityDisplay, useLabelsDisplay } from '../hooks/useKanban';

/**
 * Pragmatic Drag and Drop Kanban Card Component
 */
const PragmaticKanbanCard = ({ 
  card, 
  onCardClick, 
  isDragging = false,
  isSelected = false,
  onSelect = null,
  getDragStyles = () => ({}),
  getDropZoneStyles = () => ({}),
  onDragEnd = null
}) => {
  const cardRef = useRef(null);
  const { setupDraggable } = usePragmaticDragAndDrop();
  const { getPriorityConfig } = usePriorityDisplay();
  const { getLabelsConfig } = useLabelsDisplay(card.labels || []);
  
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Setup draggable when card changes
  useEffect(() => {
    if (cardRef.current && card) {
      console.log('Setting up draggable for card:', card.title);
      const cleanup = setupDraggable(cardRef.current, card, onDragEnd);
      return () => {
        console.log('Cleaning up draggable for card:', card.title);
        if (cleanup) cleanup();
      };
    }
  }, [card, setupDraggable, onDragEnd]);

  // Get priority configuration
  const priorityConfig = usePriorityDisplay(card.priority);
  
  // Get label configurations
  const labelConfigs = useLabelsDisplay(card.labels || []);

  // Handle card click
  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onCardClick) {
      onCardClick(card);
    }
  };

  // Handle card select
  const handleSelect = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(card.id, e.ctrlKey || e.metaKey);
    }
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowActions(false);
  };

  // Handle actions toggle
  const handleActionsToggle = (e) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  // Get drag styles
  const dragStyles = getDragStyles(card.id);
  const dropZoneStyles = getDropZoneStyles(card.id);

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-100 dark:border-gray-600
        cursor-pointer transition-all duration-200 ease-in-out
        hover:shadow-md hover:border-blue-200 dark:hover:border-gray-500 hover:bg-white dark:hover:bg-gray-700
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-50 dark:ring-blue-500' : ''}
        ${isHovered ? 'shadow-lg shadow-blue-100 dark:shadow-gray-800' : ''}
      `}
      style={{
        ...dragStyles,
        ...dropZoneStyles
      }}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ 
        y: -2,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      layout
    >
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2 flex-1">
            {card.title}
          </h3>
          
          {/* Actions Button */}
          <button
            className={`
              ml-2 p-1 rounded hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors
              ${showActions ? 'bg-blue-50 dark:bg-gray-600' : ''}
            `}
            onClick={handleActionsToggle}
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
            {card.description}
          </p>
        )}

        {/* Labels */}
        {labelConfigs.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labelConfigs.labels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: label.color + '20',
                  color: label.color,
                  border: `1px solid ${label.color}40`
                }}
              >
                <Tag className="w-3 h-3 mr-1" />
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Priority */}
        {card.priority && priorityConfig && (
          <div className="flex items-center mb-2">
            <div
              className="flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
              style={{
                backgroundColor: priorityConfig.color + '15',
                color: priorityConfig.color,
                border: `1px solid ${priorityConfig.color}30`,
                boxShadow: `0 1px 3px ${priorityConfig.color}20`
              }}
            >
              {priorityConfig.icon && (
                <span className="mr-1.5">{priorityConfig.icon}</span>
              )}
              {priorityConfig.label}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 pb-4 pt-0">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {/* Due Date */}
          {card.dueDate && (
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              <span>
                {new Date(card.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Assignee */}
          {card.assignee && (
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span className="truncate max-w-20">
                {card.assignee.name || card.assignee.username || 'Unknown'}
              </span>
            </div>
          )}

          {/* Checklist Progress */}
          {card.checklist && card.checklist.length > 0 && (
            <div className="flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              <span>
                {card.checklist.filter(item => item.completed).length}/
                {card.checklist.length}
              </span>
            </div>
          )}
        </div>

        {/* Comments Count */}
        {card.comments && card.comments.length > 0 && (
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1">
                <span className="text-xs font-medium">
                  {card.comments.length}
                </span>
              </div>
              <span>Comments</span>
            </div>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Drag Indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center justify-center">
          <div className="text-blue-600 text-sm font-medium">
            Moving...
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PragmaticKanbanCard;
