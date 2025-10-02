/**
 * KanbanCard Component
 * Individual card in the Kanban board
 */

import React, { useState, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CardModal from './CardModal';
import { usePermissions } from '../../contexts/PermissionContext';
import { canPerformAction } from '../../utils/permissions';
import { formatDistanceToNow } from 'date-fns';

const KanbanCard = ({
  card,
  users,
  labels,
  onUpdate,
  onMove,
  onDelete
}) => {
  const { user } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card._id,
    disabled: !canEditCard(user, card)
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Check permissions
  const canEdit = canPerformAction(user, 'EDIT_CARD', card);
  const canDelete = canPerformAction(user, 'DELETE_CARD', card);

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (canEdit) {
      setIsModalOpen(true);
    }
  }, [canEdit]);

  // Handle card update
  const handleCardUpdate = useCallback((updates) => {
    onUpdate(card._id, updates);
    setIsModalOpen(false);
  }, [card._id, onUpdate]);

  // Handle card delete
  const handleCardDelete = useCallback(() => {
    if (canDelete && window.confirm('Are you sure you want to delete this card?')) {
      onDelete(card._id);
    }
  }, [canDelete, card._id, onDelete]);

  // Format due date
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Overdue', className: 'text-red-500' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'text-orange-500' };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} days`, className: 'text-yellow-500' };
    } else {
      return { text: `Due ${formatDistanceToNow(date)}`, className: 'text-gray-500' };
    }
  };

  const dueDateInfo = formatDueDate(card.dueDate);

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`kanban-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-shadow ${
          isHovered ? 'shadow-md' : ''
        } ${!canEdit ? 'cursor-not-allowed opacity-75' : ''}`}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid="kanban-card"
      >
        {/* Card Header */}
        <div className="card-header mb-2">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {card.title}
            </h3>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardDelete();
                }}
                className="text-gray-400 hover:text-red-500 ml-2"
                title="Delete card"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Card Description */}
        {card.description && (
          <div className="card-description mb-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {card.description}
            </p>
          </div>
        )}

        {/* Card Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="card-labels mb-2">
            <div className="flex flex-wrap gap-1">
              {card.labels.map((label) => (
                <span
                  key={label._id}
                  className="inline-block px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: label.color,
                    color: label.textColor || '#FFFFFF'
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="card-footer flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Priority */}
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPriorityColor(card.priority)}`}>
              {card.priority}
            </span>

            {/* Due Date */}
            {dueDateInfo && (
              <span className={`text-xs ${dueDateInfo.className}`}>
                {dueDateInfo.text}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Assignees */}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex -space-x-1">
                {card.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee._id}
                    className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                    title={assignee.username}
                  >
                    {assignee.first_name?.[0]}{assignee.last_name?.[0]}
                  </div>
                ))}
                {card.assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800">
                    +{card.assignees.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Comments Count */}
            {card.comments && card.comments.length > 0 && (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs">{card.comments.length}</span>
              </div>
            )}

            {/* Attachments Count */}
            {card.attachments && card.attachments.length > 0 && (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-xs">{card.attachments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card ID */}
        {card.cardId && (
          <div className="card-id mt-2 text-xs text-gray-400 dark:text-gray-500">
            #{card.cardId}
          </div>
        )}
      </div>

      {/* Card Modal */}
      {isModalOpen && (
        <CardModal
          card={card}
          users={users}
          labels={labels}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </>
  );
};

export default KanbanCard;
