/**
 * useCardModal Hook
 * Hook for managing card modal state and operations
 */

import { useState, useCallback } from 'react';
import { useKanban } from '../contexts/KanbanContext';
import { usePermissions } from './usePermissions';

export const useCardModal = () => {
  const { createCard, updateCard, deleteCard } = useKanban();
  const { user } = usePermissions();
  
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'view', // 'create', 'edit', 'view'
    cardId: null,
    columnId: null,
    data: null
  });

  // Open modal for creating a new card
  const openCreateModal = useCallback((columnId) => {
    setModalState({
      isOpen: true,
      mode: 'create',
      cardId: null,
      columnId,
      data: {
        title: '',
        description: '',
        priority: 'medium',
        labels: [],
        assignees: [],
        dueDate: null
      }
    });
  }, []);

  // Open modal for editing an existing card
  const openEditModal = useCallback((card) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      cardId: card._id,
      columnId: card.columnId,
      data: {
        title: card.title,
        description: card.description || '',
        priority: card.priority,
        labels: card.labels || [],
        assignees: card.assignees || [],
        dueDate: card.dueDate || null
      }
    });
  }, []);

  // Open modal for viewing a card
  const openViewModal = useCallback((card) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      cardId: card._id,
      columnId: card.columnId,
      data: {
        title: card.title,
        description: card.description || '',
        priority: card.priority,
        labels: card.labels || [],
        assignees: card.assignees || [],
        dueDate: card.dueDate || null
      }
    });
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: 'view',
      cardId: null,
      columnId: null,
      data: null
    });
  }, []);

  // Save card (create or update)
  const saveCard = useCallback(async (cardData) => {
    try {
      if (modalState.mode === 'create') {
        await createCard({
          ...cardData,
          columnId: modalState.columnId
        });
      } else if (modalState.mode === 'edit') {
        await updateCard(modalState.cardId, cardData);
      }
      
      closeModal();
      return true;
    } catch (error) {
      return false;
    }
  }, [modalState, createCard, updateCard, closeModal]);

  // Delete card
  const deleteCardAndClose = useCallback(async () => {
    if (!modalState.cardId) return false;

    try {
      await deleteCard(modalState.cardId);
      closeModal();
      return true;
    } catch (error) {
      return false;
    }
  }, [modalState.cardId, deleteCard, closeModal]);

  // Update modal data
  const updateModalData = useCallback((updates) => {
    setModalState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        ...updates
      }
    }));
  }, []);

  // Check if user can edit the current card
  const canEdit = useCallback(() => {
    if (modalState.mode === 'create') return true;
    if (modalState.mode === 'view') return false;
    
    // For edit mode, check permissions
    // This would need the actual card data to check permissions properly
    return true; // Simplified for now
  }, [modalState.mode]);

  // Check if user can delete the current card
  const canDelete = useCallback(() => {
    if (modalState.mode === 'create') return false;
    if (modalState.mode === 'view') return false;
    
    // For edit mode, check permissions
    return true; // Simplified for now
  }, [modalState.mode]);

  return {
    // State
    modalState,
    isOpen: modalState.isOpen,
    mode: modalState.mode,
    cardId: modalState.cardId,
    columnId: modalState.columnId,
    data: modalState.data,
    
    // Actions
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    saveCard,
    deleteCardAndClose,
    updateModalData,
    
    // Permissions
    canEdit: canEdit(),
    canDelete: canDelete()
  };
};

export default useCardModal;
