/**
 * KanbanCard Component
 * Individual card in the Kanban board - Updated to use Trello-style components
 */

import React, { useState, useCallback } from 'react';
import TrelloCardFront from './TrelloCardFront';
import TrelloCardModal from './TrelloCardModal';
import { usePermissions } from '../../contexts/PermissionContext';
import { canPerformAction } from '../../utils/permissions';

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
    onUpdate(card._id || card.id, updates);
  }, [card, onUpdate]);

  // Handle card delete
  const handleCardDelete = useCallback(() => {
    if (canDelete && window.confirm('Are you sure you want to delete this card?')) {
      onDelete(card._id || card.id);
    }
  }, [canDelete, card, onDelete]);

  return (
    <>
      <div
        data-testid="kanban-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <TrelloCardFront
          card={card}
          users={users}
          labels={labels}
          isDragging={false}
          isHovered={isHovered}
          onClick={handleCardClick}
          dragHandleProps={{}}
        />
      </div>
      
      {/* Card Modal */}
      <TrelloCardModal
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleCardUpdate}
        onDelete={canDelete ? handleCardDelete : undefined}
        onMove={onMove}
        onCopy={null}
      />
    </>
  );
};

export default KanbanCard;
