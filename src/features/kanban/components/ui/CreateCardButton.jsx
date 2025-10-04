/**
 * CreateCardButton Component - Simple Button to Create Cards
 * Opens TrelloCardModal in creation mode for new cards
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';
import TrelloCardModal from '../cards/TrelloCardModal';
import { createEmptyCard } from '../../types/cardModel';

const CreateCardButton = ({ columnId, onCreateCard }) => {
  const { currentUser } = useKanban();
  const [showModal, setShowModal] = useState(false);
  const [newCard, setNewCard] = useState(null);

  // Handle button click - create a new empty card and open modal
  const handleClick = () => {
    const defaultCard = createEmptyCard({
      listId: columnId,
      createdBy: currentUser?.id || currentUser?._id,
      author: {
        id: currentUser?.id || currentUser?._id,
        name: currentUser?.name || currentUser?.username,
        email: currentUser?.email,
        designation: currentUser?.designation
      }
    });
    
    setNewCard(defaultCard);
    setShowModal(true);
  };

  // Handle card save - create the card
  const handleSave = (cardData) => {
    if (cardData.title && cardData.title.trim()) {
      onCreateCard({
        ...cardData,
        listId: columnId,
        columnId: columnId
      });
      setShowModal(false);
      setNewCard(null);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setShowModal(false);
    setNewCard(null);
  };

  return (
    <>
      {/* Add Card Button */}
      <motion.button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add a card</span>
      </motion.button>

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
        />
      )}
    </>
  );
};

export default CreateCardButton;
