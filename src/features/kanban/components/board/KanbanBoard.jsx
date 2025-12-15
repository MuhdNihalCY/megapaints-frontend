/**
 * KanbanBoard Component
 * Main container for the Kanban board system with enhanced drag and drop
 * Consolidated from PragmaticKanbanBoard for better organization
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, HelpCircle, Settings } from 'lucide-react';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useKanban } from '../../contexts/KanbanContext';
import PragmaticKanbanCard from '../cards/PragmaticKanbanCard';
import KanbanColumn from '../columns/KanbanColumn';
import FiltersPanel from '../ui/FiltersPanel';
import HelpPanel from '../ui/HelpPanel';
import KeyboardShortcuts from '../ui/KeyboardShortcuts';
import TrelloCardModal from '../cards/TrelloCardModal';
import { kanbanService } from '../../services/kanbanService';
import toast from 'react-hot-toast';

import { LoadingOverlay, CustomerManagementButton } from '../../../../components';

/**
 * Kanban Board Component with Enhanced Drag and Drop
 */
const KanbanBoard = ({ onCardClick, onCreateCard }) => {
  const {
    loading,
    error,
    columns,
    cards,
    board,
    user: currentUser,
    moveCard,
    createCard,
    updateCard,
    deleteCard,
    updateCardPositionsOptimistic,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters
  } = useKanban();

  // Use board ID from context; avoid invalid fallbacks that break API validation
  const boardId = board?.id || board?._id || null;

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchTerm || '');
  const [isMoving, setIsMoving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  // Card Modal State
  const [selectedCard, setSelectedCard] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);

  // Refs
  const boardRef = useRef(null);
  const columnRefs = useRef(new Map());

  // Get active columns
  const activeColumns = useMemo(() => {
    return columns.filter(column => column.isActive !== false);
  }, [columns]);

  // Get cards by column
  const getCardsByColumn = useCallback((columnId) => {
    const columnCards = cards.filter(card => {
      // Prioritize columnId (primary field), but check others for compatibility
      // This ensures cards only match one column even if fields are temporarily out of sync
      const cardColumnId = card.columnId || card.listId || card.column_id;
      return String(cardColumnId) === String(columnId);
    });
    
    // Sort by position, then by creation date as fallback
    return columnCards.sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      if (posA !== posB) return posA - posB;
      // Fallback to creation date if positions are equal
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateA - dateB;
    });
  }, [cards]);

  // Get cards by subcolumn
  const getCardsBySubcolumn = useCallback((columnId, subcolumnId) => {
    const subcolumnCards = cards.filter(card => card.columnId === columnId && card.subcolumnId === subcolumnId);
    
    // Sort by position, then by creation date as fallback
    return subcolumnCards.sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      if (posA !== posB) return posA - posB;
      // Fallback to creation date if positions are equal
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateA - dateB;
    });
  }, [cards]);

  // Get filtered cards
  const getFilteredCards = useCallback((cardsToFilter) => {
    if (!cardsToFilter) return [];
    
    let filtered = [...cardsToFilter];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(card => 
        card.title?.toLowerCase().includes(searchLower) ||
        card.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply other filters
    if (filters.priority) {
      filtered = filtered.filter(card => card.priority === filters.priority);
    }
    
    if (filters.labels && filters.labels.length > 0) {
      filtered = filtered.filter(card => 
        card.labels?.some(label => filters.labels.includes(label.id))
      );
    }
    
    return filtered;
  }, [searchTerm, filters]);

  // Check if move is allowed based on DnD rules
  const isMoveAllowed = useCallback((fromColumn, toColumn, fromSubColumn = null, toSubColumn = null) => {
    // Restrict moves to/from < 7 Days and > 7 Days columns
    const restrictedSubColumns = ['less-than-7-days', 'more-than-7-days'];
    
    if (fromSubColumn && restrictedSubColumns.includes(fromSubColumn)) {
      return false;
    }
    
    if (toSubColumn && restrictedSubColumns.includes(toSubColumn)) {
      return false;
    }
    
    return true;
  }, []);

  // Calculate dynamic column width for grouped columns
  const getColumnWidth = useCallback((column) => {
    if (!column.isGrouped || !column.subcolumns?.length) {
      return 'w-80';
    }
    
    const subcolumnCount = column.subcolumns.length;
    const gapWidth = 24; // gap-6 = 24px
    const subcolumnWidth = 320; // w-80 = 320px
    const totalWidth = (subcolumnCount * subcolumnWidth) + ((subcolumnCount - 1) * gapWidth);
    
    return { width: `${totalWidth}px` };
  }, []);

  // Handle card click - fetch full card data if needed
  const handleCardClick = useCallback(async (card) => {
    try {
      // If card has minimal data, fetch full card details
      let fullCard = card;
      if (card && (card.id || card._id)) {
        // Always fetch fresh card data to ensure we have latest comments, attachments, etc.
        const result = await kanbanService.getTask(card.id || card._id);
        if (result && result.status === 'success') {
          const taskData = result.data?.task || result.data;
          fullCard = kanbanService.transformCardData(taskData);
        }
      }
      setSelectedCard(fullCard);
      setIsEditingCard(false);
      setIsCardModalOpen(true);
    } catch (error) {
      console.error('Error loading card details:', error);
      // Still open modal with available card data
      setSelectedCard(card);
      setIsCardModalOpen(true);
    }
  }, []);

  // Handle create card
  const handleCreateCard = useCallback(async (cardData) => {
    try {
      const createdCard = await createCard(cardData);
      return createdCard;
    } catch (error) {
      console.error('🔴 Error in KanbanBoard.handleCreateCard', error);
      // Re-throw error so it can be caught by CreateCardButton
      throw error;
    }
  }, [createCard]);

  // Handle save card - supports both new cards and updates
  const handleSaveCard = useCallback(async (cardIdOrData, updates) => {
    try {
      // If two arguments, it's (cardId, updates) for existing cards
      if (updates !== undefined) {
        await updateCard(cardIdOrData, updates);
      } 
      // If one argument, check if it's a new card or full card data
      else if (cardIdOrData) {
        const cardData = cardIdOrData;
        // Check if it's an existing card (has id/_id) or new card
        if (cardData.id || cardData._id) {
          await updateCard(cardData.id || cardData._id, cardData);
        } else {
          await createCard(cardData);
        }
      }
      // Don't close modal automatically - let the modal handle it
      // The modal will close itself after successful save
    } catch (error) {
      console.error('Error saving card:', error);
      throw error; // Re-throw so modal can handle the error
    }
  }, [updateCard, createCard]);

  // Handle delete card
  const handleDeleteCard = useCallback(async () => {
    try {
      if (selectedCard) {
        await deleteCard(selectedCard.id);
        setIsCardModalOpen(false);
        setSelectedCard(null);
      }
    } catch (error) {
      // Error deleting card
    }
  }, [selectedCard, deleteCard]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setSearchTerm(query);
  };

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    setIsCardModalOpen(false);
    setSelectedCard(null);
    setIsEditingCard(false);
  }, []);

  // Handle card move with DnD rules
  const handleCardMove = async (cardId, fromColumn, toColumn, toSubcolumn = null, position = null) => {
    setIsMoving(true);
    try {
      const card = cards.find(c => c.id === cardId);
      const fromCol = columns.find(c => c.id === fromColumn);
      const toCol = columns.find(c => c.id === toColumn);
      
      // Check if move is allowed based on DnD rules
      if (!isMoveAllowed(fromCol, toCol, card?.subcolumnId, toSubcolumn)) {
        return;
      }

      const moveData = {
        toColumnId: toColumn,
        toSubColumnId: toSubcolumn,
        position: position || 0
      };
      
      await moveCard(cardId, moveData);
    } catch (error) {
      // Error moving card
    } finally {
      setIsMoving(false);
    }
  };

  // Handle card reorder
  const handleCardReorder = async (cardId, fromColumn, toColumn, toSubColumnId, newIndex) => {
    setIsReordering(true);
    
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        console.error('Card not found:', cardId);
        return;
      }
      
      // Get all cards in the target column/subcolumn, sorted by position
      let columnCards;
      if (toSubColumnId) {
        columnCards = getCardsBySubcolumn(toColumn, toSubColumnId);
      } else {
        columnCards = getCardsByColumn(toColumn);
      }
      
      const reorderedCards = Array.from(columnCards);
      
      // Remove card from current position
      const currentIndex = reorderedCards.findIndex(c => c.id === cardId);
      if (currentIndex === -1) {
        console.error('Card not found in column:', cardId, toColumn);
        return;
      }
      
      const [movedCard] = reorderedCards.splice(currentIndex, 1);
      
      // Insert at new position
      reorderedCards.splice(newIndex, 0, movedCard);
      
      // Calculate new positions for ALL cards in the column
      // This ensures positions are always sequential (0, 1000, 2000, etc.)
      // and fixes the glitch where only some cards were updated
      const updates = [];
      for (let i = 0; i < reorderedCards.length; i++) {
        const cardToUpdate = reorderedCards[i];
        const newPosition = i * 1000;
        
        // Only update if position actually changed
        if (cardToUpdate.position !== newPosition) {
          updates.push({
            cardId: cardToUpdate.id,
            position: newPosition
          });
        }
      }
      
      // OPTIMISTIC UPDATE: Update state immediately for instant UI feedback
      // This prevents the visual glitch where cards snap back or don't update immediately
      if (updates.length > 0 && updateCardPositionsOptimistic) {
        updateCardPositionsOptimistic(updates);
      }
      
      // SYNC WITH BACKEND: Update sequentially to avoid race conditions
      // Sequential updates ensure state consistency and prevent glitches
      for (const update of updates) {
        try {
          await moveCard(update.cardId, {
            toColumnId: toColumn,
            toSubColumnId: toSubColumnId,
            position: update.position
          });
        } catch (error) {
          console.error(`Failed to update card ${update.cardId} position:`, error);
          // Continue with other updates even if one fails
        }
      }
    } catch (error) {
      console.error('Error reordering card:', error);
      toast.error('Failed to reorder card');
    } finally {
      setIsReordering(false);
    }
  };

  // Handle drag end with @hello-pangea/dnd
  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;

    // If no destination, do nothing
    if (!destination) {
      return;
    }

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // MongoDB ObjectId validation regex (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    // Parse droppableId to determine target column/sub-column
    // Format: "column-{columnId}" or "subcolumn-{subcolumnId}"
    const isSubColumn = destination.droppableId.startsWith('subcolumn-');
    const isColumn = destination.droppableId.startsWith('column-');
    
    let toColumnId = null;
    let toSubColumnId = null;

    if (isSubColumn) {
      toSubColumnId = destination.droppableId.replace('subcolumn-', '');
      // Find which column this sub-column belongs to
      const targetColumn = activeColumns.find(col => 
        col.subcolumns?.some(sub => sub.id === toSubColumnId)
      );
      if (targetColumn) {
        toColumnId = targetColumn.id;
      }
    } else if (isColumn) {
      toColumnId = destination.droppableId.replace('column-', '');
    }

    // Parse source to get from column/sub-column
    const sourceIsSubColumn = source.droppableId.startsWith('subcolumn-');
    const sourceIsColumn = source.droppableId.startsWith('column-');
    
    let fromColumnId = null;
    if (sourceIsSubColumn) {
      const subColumnId = source.droppableId.replace('subcolumn-', '');
      const sourceColumn = activeColumns.find(col => 
        col.subcolumns?.some(sub => sub.id === subColumnId)
      );
      if (sourceColumn) {
        fromColumnId = sourceColumn.id;
      }
    } else if (sourceIsColumn) {
      fromColumnId = source.droppableId.replace('column-', '');
    }

    // Validate column IDs are valid MongoDB ObjectIds before attempting move
    if (toColumnId && !objectIdRegex.test(toColumnId)) {
      console.error('❌ Invalid target column ID format:', toColumnId);
      toast.error('Cannot move card: Invalid column ID. Please refresh the page.');
      return;
    }

    if (fromColumnId && !objectIdRegex.test(fromColumnId)) {
      console.error('❌ Invalid source column ID format:', fromColumnId);
      // Still allow move if source is invalid (might be from a deleted column)
    }

    // Handle reordering within same column/subcolumn
    if (destination.droppableId === source.droppableId && toColumnId && draggableId) {
      // Same column/subcolumn, just reordering
      handleCardReorder(draggableId, fromColumnId, toColumnId, toSubColumnId, destination.index);
      return;
    }

    // Move the card between different columns/subcolumns
    if (toColumnId && draggableId) {
      handleCardMove(draggableId, fromColumnId, toColumnId, toSubColumnId, destination.index);
    } else {
      console.error('❌ Cannot move card: Missing required column ID');
      toast.error('Cannot move card: Column information is missing.');
    }
  }, [handleCardMove, handleCardReorder, activeColumns, getCardsByColumn, getCardsBySubcolumn, cards, moveCard]);


  // Handle card select
  const handleCardSelect = (cardId, isMultiSelect) => {
    if (isMultiSelect) {
      setSelectedCards(prev => 
        prev.includes(cardId) 
          ? prev.filter(id => id !== cardId)
          : [...prev, cardId]
      );
    } else {
      setSelectedCards([cardId]);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading Kanban Board..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Board</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlays for card operations */}
      {isMoving && <LoadingOverlay message="Moving card..." />}
      {isReordering && <LoadingOverlay message="Reordering cards..." />}
      
      <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Customer Management Actions */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Customer Management</h2>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Quick actions for customer and follow-up management
              </div>
            </div>
            
            <CustomerManagementButton 
              user={currentUser} 
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Kanban Board Controls */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Kanban Board</h1>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {cards.length} cards across {activeColumns.length} columns
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Help */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto">
            <div className="flex gap-6 lg:gap-10 p-4 lg:p-6 h-full ">
              {activeColumns.map((column) => {
              const columnCards = getCardsByColumn(column.id);
              const filteredCards = getFilteredCards(columnCards);
              const hasSubcolumns = column.subcolumns && column.subcolumns.length > 0;
              const subcolumnCount = column.subcolumns ? column.subcolumns.length : 0;
              
              // Calculate width based on subcolumn count - each subcolumn is w-80 (320px) + gap (32px)
              const columnWidth = hasSubcolumns ? `w-[${320 * subcolumnCount + 32 * Math.max(0, subcolumnCount - 1)}px]` : 'w-80';
              
              return (
                <motion.div
                  key={column.id}
                  ref={(el) => {
                    if (el) {
                      columnRefs.current.set(column.id, el);
                    }
                  }}
                  className={`flex-shrink-0 ${columnWidth}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <KanbanColumn
                    column={column}
                    cards={getCardsByColumn(column.id)}
                    onCardClick={handleCardClick}
                    onCreateCard={handleCreateCard}
                    CardComponent={PragmaticKanbanCard}
                    onDragEnd={handleDragEnd}
                    boardId={boardId}
                  />
                </motion.div>
              );
              })}
            </div>
          </div>
        </div>
      </DragDropContext>


      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <FiltersPanel
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={clearFilters}
                onClose={() => setShowFilters(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpPanel onClose={() => setShowHelp(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />

      {/* Card Modal */}
      <TrelloCardModal
        card={selectedCard}
        isOpen={isCardModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleSaveCard}
        onDelete={handleDeleteCard}
        onMove={(card) => {}}
        onCopy={(card) => {}}
        isNewCard={false}
      />
    </div>
    </>
  );
};

export default KanbanBoard;
