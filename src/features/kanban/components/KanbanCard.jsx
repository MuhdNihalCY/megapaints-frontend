/**
 * Kanban Card Component
 * Enhanced Trello-like card with quick actions and better interactions
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Star
} from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';
import { useDueDateStatus, usePriorityDisplay, useLabelsDisplay } from '../hooks/useKanban';
import { CARD_PRIORITIES } from '../utils/constants';

/**
 * Kanban Card Component
 */
const KanbanCard = ({ card, isDragging = false, onCardClick }) => {
  const { users } = useKanban();
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Set up sortable for drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCardDragging
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card
    }
  });

  // Get card display information
  const dueDateStatus = useDueDateStatus(card.dueDate);
  const priorityInfo = usePriorityDisplay(card.priority);
  const labelInfo = useLabelsDisplay(card.labels);

  // Get assignee information
  const assignees = card.assignees?.map(assigneeId => 
    users.find(user => user.id === assigneeId)
  ).filter(Boolean) || [];

  // Handle card click
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(card);
    }
  };

  // Handle options menu click
  const handleOptionsClick = (e) => {
    e.stopPropagation();
    setShowQuickActions(!showQuickActions);
  };

  // Handle quick action
  const handleQuickAction = (action) => {
    // TODO: Implement quick actions
    console.log('Quick action:', action, 'for card:', card.id);
    setShowQuickActions(false);
  };

  // Card style for drag and drop
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCardDragging ? 0.5 : 1,
    zIndex: isCardDragging ? 1000 : 1
  };

  // Check if card is overdue
  const isOverdue = dueDateStatus.isOverdue;
  const isDueSoon = dueDateStatus.isDueSoon;
  const hasComments = card.comments && card.comments.length > 0;
  const hasAttachments = card.attachments && card.attachments.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      data-card-id={card.id}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-all duration-200 group kanban-card',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
        isDragging && 'shadow-lg rotate-2',
        isCardDragging && 'opacity-50',
        isOverdue && 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20',
        isDueSoon && !isOverdue && 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      )}
    >
      {/* Priority Indicator */}
      {card.priority && card.priority !== CARD_PRIORITIES.LOW && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <span className={clsx('text-xs font-medium', priorityInfo.textColor)}>
              {priorityInfo.icon}
            </span>
            <span className={clsx('text-xs', priorityInfo.textColor)}>
              {priorityInfo.label}
            </span>
          </div>
          
          {/* Quick Actions Button */}
          <button
            onClick={handleOptionsClick}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      )}

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <div className="absolute top-0 right-0 mt-8 mr-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[150px] z-20">
          <div className="space-y-1">
            <button
              onClick={() => handleQuickAction('edit')}
              className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Edit card
            </button>
            <button
              onClick={() => handleQuickAction('duplicate')}
              className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Duplicate
            </button>
            <button
              onClick={() => handleQuickAction('archive')}
              className="w-full text-left px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Archive
            </button>
            <hr className="border-gray-200 dark:border-gray-600" />
            <button
              onClick={() => handleQuickAction('delete')}
              className="w-full text-left px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight flex-1 mr-2">
          {card.title}
        </h4>
        
        {/* Show quick actions button if no priority indicator */}
        {(!card.priority || card.priority === CARD_PRIORITIES.LOW) && (
          <button
            onClick={handleOptionsClick}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>

      {/* Card Description */}
      {card.description && (
        <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Card Labels */}
      {labelInfo.hasLabels && (
        <div className="flex flex-wrap gap-1 mb-3">
          {labelInfo.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
          {labelInfo.labels.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
              +{labelInfo.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Card Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-3">
          {/* Due Date with Status Indicator */}
          {card.dueDate && (
            <div className={clsx(
              'flex items-center space-x-1',
              isOverdue && 'text-red-600 dark:text-red-400',
              isDueSoon && !isOverdue && 'text-yellow-600 dark:text-yellow-400',
              !isDueSoon && !isOverdue && 'text-gray-500 dark:text-gray-400'
            )}>
              {isOverdue ? (
                <AlertTriangle size={12} />
              ) : isDueSoon ? (
                <Clock size={12} />
              ) : (
                <Calendar size={12} />
              )}
              <span>{dueDateStatus.formattedDate}</span>
            </div>
          )}

          {/* Comments Count */}
          {hasComments && (
            <div className="flex items-center space-x-1">
              <MessageCircle size={12} />
              <span>{card.comments.length}</span>
            </div>
          )}

          {/* Attachments Count */}
          {hasAttachments && (
            <div className="flex items-center space-x-1">
              <Paperclip size={12} />
              <span>{card.attachments.length}</span>
            </div>
          )}

          {/* Checkbox/Checklist Progress */}
          {card.checklist && card.checklist.length > 0 && (
            <div className="flex items-center space-x-1">
              <CheckCircle size={12} />
              <span>
                {card.checklist.filter(item => item.completed).length}/{card.checklist.length}
              </span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {assignees.length > 0 && (
          <div className="flex items-center space-x-1">
            <User size={12} />
            <div className="flex -space-x-1">
              {assignees.slice(0, 2).map((assignee, index) => (
                <div
                  key={assignee.id}
                  className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 border border-white dark:border-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300"
                  title={assignee.name || assignee.username}
                >
                  {(assignee.name || assignee.username).charAt(0).toUpperCase()}
                </div>
              ))}
              {assignees.length > 2 && (
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 border border-white dark:border-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                  +{assignees.length - 2}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card ID */}
      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        #{card.id.slice(-6)}
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
          ⚠️ This card is overdue
        </div>
      )}
    </div>
  );
};

export default KanbanCard;

