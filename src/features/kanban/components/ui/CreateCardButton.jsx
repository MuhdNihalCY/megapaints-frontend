/**
 * CreateCardButton Component - Card Creation with Fallback Support
 * Implements card creation with identifier system when backend APIs are available,
 * falls back to simple card creation when APIs are not implemented yet.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';
import TrelloCardModal from '../cards/TrelloCardModal';
import { createEmptyCard } from '../../types/cardModel';
import { kanbanService } from '../../services/kanbanService';

const CreateCardButton = ({ columnId, onCreateCard, boardId }) => {
  const { currentUser } = useKanban();
  const [showModal, setShowModal] = useState(false);
  const [newCard, setNewCard] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState(null);

  // Generate a simple identifier for fallback
  const generateFallbackIdentifier = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return `${dateStr}-${timeStr}`;
  };

  // Handle button click - reserve identifier and create card
  const handleClick = async () => {
    if (!boardId) {
      console.error('Board ID is required for identifier reservation');
      setError('Board ID is required');
      return;
    }

    setReserving(true);
    setError(null);

    try {
      console.log('🚀 Reserving identifier for board:', boardId);
      
      // Step 1: Reserve primary identifier
      const reservationResponse = await kanbanService.reserveIdentifier(boardId);
      const reservedIdentifier = reservationResponse.identifier;
      const reservationId = reservationResponse.reservation_id;
      
      console.log('✅ Identifier reserved:', reservedIdentifier);
      
      // Step 2: Create card with reserved identifier
      const defaultCard = createEmptyCard({
        listId: columnId,
        createdBy: currentUser?.id || currentUser?._id,
        author: {
          id: currentUser?.id || currentUser?._id,
          name: currentUser?.name || currentUser?.username,
          email: currentUser?.email,
          designation: currentUser?.designation
        },
        identifier: reservedIdentifier, // Add reserved identifier
        title: reservedIdentifier, // Set initial title to identifier
        isNewCard: true, // Flag to indicate this is a new card
        reservationId: reservationId // Store reservation ID for later use
      });
      
      setReservation({ id: reservationId, identifier: reservedIdentifier });
      setNewCard(defaultCard);
      setShowModal(true);
      
    } catch (err) {
      console.error('❌ Failed to reserve identifier:', err);
      setError('Failed to reserve card identifier. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  // Handle card save - create the card and use reservation (if available)
  const handleSave = async (cardData) => {
    if (!cardData.title || !cardData.title.trim()) {
      return;
    }

    try {
      // Create the card with the complete title
      const cardToCreate = {
        ...cardData,
        listId: columnId,
        columnId: columnId,
        identifier: cardData.identifier || reservation?.identifier,
        title: cardData.title // This should be the complete title (identifier + customer)
      };

      console.log('🚀 Creating card with title:', cardToCreate.title);
      
      // Call the parent's onCreateCard function
      const createdCard = await onCreateCard(cardToCreate);
      
      // Try to use the reservation (only if it exists and was successful)
      if (reservation && reservation.id && createdCard) {
        try {
          await kanbanService.useReservation(reservation.id, createdCard.id);
          console.log('✅ Reservation used for card:', createdCard.id);
        } catch (err) {
          console.warn('⚠️ Failed to mark reservation as used:', err);
          // Don't fail the card creation if reservation marking fails
        }
      }
      
      // Close modal and reset state
      setShowModal(false);
      setNewCard(null);
      setReservation(null);
      
    } catch (err) {
      console.error('❌ Failed to create card:', err);
      // Keep modal open so user can retry
    }
  };

  // Handle modal close - release reservation if not used (only if reservation exists)
  const handleClose = async () => {
    // Release reservation if it exists and wasn't used
    if (reservation && reservation.id) {
      try {
        await kanbanService.releaseReservation(reservation.id);
        console.log('✅ Reservation released:', reservation.id);
      } catch (err) {
        console.warn('⚠️ Failed to release reservation:', err);
      }
    }
    
    setShowModal(false);
    setNewCard(null);
    setReservation(null);
    setError(null);
  };

  return (
    <>
      {/* Add Card Button */}
      <motion.button
        onClick={handleClick}
        disabled={reserving}
        className={`w-full flex items-center justify-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors ${
          reserving ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        whileHover={!reserving ? { scale: 1.02 } : {}}
        whileTap={!reserving ? { scale: 0.98 } : {}}
      >
        {reserving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Reserving identifier...</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add a card</span>
          </>
        )}
      </motion.button>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      {/* Card Creation Modal */}
      {showModal && newCard && (
        <TrelloCardModal
          card={newCard}
          isOpen={showModal}
          onClose={handleClose}
          onUpdate={handleSave}
          onDelete={null}
          onMove={null}
          onCopy={null}
          isNewCard={true}
          reservation={reservation}
        />
      )}
    </>
  );
};

export default CreateCardButton;
