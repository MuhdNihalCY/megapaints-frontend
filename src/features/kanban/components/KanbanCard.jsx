/**
 * Kanban Card Component
 * Renders a single card with drag and drop support
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Calendar, User, Tag, Paperclip } from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';
import { useDueDateStatus, usePriorityDisplay, useLabelsDisplay } from '../hooks/useKanban';
import { CARD_PRIORITIES } from '../utils/constants';

/**
 * Kanban Card Component
 */
const KanbanCard = ({ card, isDragging = false, onCardClick }) => {
  const { users } = useKanban();

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
    // TODO: Implement options menu
  };

  // Card style for drag and drop
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCardDragging ? 0.5 : 1,
    zIndex: isCardDragging ? 1000 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isDragging && 'shadow-lg rotate-2',
        isCardDragging && 'opacity-50'
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 mr-2">
          {card.title}
        </h4>
        <button
          onClick={handleOptionsClick}
          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Card Description */}
      {card.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
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
            <span className="px-2 py-1 text-xs text-gray-500">
              +{labelInfo.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Card Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Priority */}
          {card.priority && card.priority !== CARD_PRIORITIES.LOW && (
            <div className="flex items-center space-x-1">
              <span className={priorityInfo.textColor}>
                {priorityInfo.icon}
              </span>
              <span className={priorityInfo.textColor}>
                {priorityInfo.label}
              </span>
            </div>
          )}

          {/* Due Date */}
          {card.dueDate && (
            <div className={clsx('flex items-center space-x-1', dueDateStatus.color)}>
              <Calendar size={12} />
              <span>{dueDateStatus.formattedDate}</span>
            </div>
          )}

          {/* Attachments */}
          {card.attachments && card.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip size={12} />
              <span>{card.attachments.length}</span>
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
                  className="w-5 h-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs font-medium"
                  title={assignee.name || assignee.username}
                >
                  {(assignee.name || assignee.username).charAt(0).toUpperCase()}
                </div>
              ))}
              {assignees.length > 2 && (
                <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs">
                  +{assignees.length - 2}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card ID */}
      <div className="mt-2 text-xs text-gray-400">
        #{card.id.slice(-6)}
      </div>
    </div>
  );
};

export default KanbanCard;

