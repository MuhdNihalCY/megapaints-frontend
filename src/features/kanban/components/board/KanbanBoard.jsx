/**
 * KanbanBoard Component
 * Main container for the Kanban board system with enhanced drag and drop
 * Consolidated from PragmaticKanbanBoard for better organization
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, HelpCircle, Settings } from 'lucide-react';

import { useKanban } from '../../contexts/KanbanContext';
import { usePragmaticDragAndDrop, useDragMonitor } from '../../hooks/usePragmaticDragAndDrop';
import PragmaticKanbanCard from '../cards/PragmaticKanbanCard';
import KanbanColumn from '../columns/KanbanColumn';
import FiltersPanel from '../ui/FiltersPanel';
import HelpPanel from '../ui/HelpPanel';
import KeyboardShortcuts from '../ui/KeyboardShortcuts';
import TrelloCardModal from '../cards/TrelloCardModal';

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
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters
  } = useKanban();

  // Use board ID from context; avoid invalid fallbacks that break API validation
  const boardId = board?.id || board?._id || null;

  const {
    draggedCard,
    isDragging,
    dragOver,
    dragPreview,
    dropZone,
    isMultiSelect,
    selectedCards,
    setupDraggable,
    setupDropTarget,
    cleanup
  } = usePragmaticDragAndDrop();

  const dragData = useDragMonitor();

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
    return cards.filter(card => card.columnId === columnId);
  }, [cards]);

  // Get cards by subcolumn
  const getCardsBySubcolumn = useCallback((columnId, subcolumnId) => {
    return cards.filter(card => card.columnId === columnId && card.subcolumnId === subcolumnId);
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

  // Handle card click
  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
    setIsEditingCard(false);
    setIsCardModalOpen(true);
  }, []);

  // Handle create card
  const handleCreateCard = useCallback(async (cardData) => {
    try {
      await createCard(cardData);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  }, [createCard]);

  // Handle save card
  const handleSaveCard = useCallback(async (cardData) => {
    try {
      if (selectedCard) {
        await updateCard(selectedCard.id, cardData);
      } else {
        await createCard(cardData);
      }
      setIsCardModalOpen(false);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error saving card:', error);
    }
  }, [selectedCard, updateCard, createCard]);

  // Handle delete card
  const handleDeleteCard = useCallback(async () => {
    try {
      if (selectedCard) {
        await deleteCard(selectedCard.id);
        setIsCardModalOpen(false);
        setSelectedCard(null);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
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
        console.warn('Move not allowed: Cannot move cards to/from < 7 Days or > 7 Days columns');
        return;
      }

      console.log('Kanban Board: Moving card', { cardId, fromColumn, toColumn, toSubcolumn, position });
      
      const moveData = {
        toColumnId: toColumn,
        toSubColumnId: toSubcolumn,
        position: position || 0
      };
      
      await moveCard(cardId, moveData);
    } catch (error) {
      console.error('Kanban Board: Error moving card', error);
    } finally {
      setIsMoving(false);
    }
  };

  // Setup drop targets for columns
  useEffect(() => {
    const cleanupFunctions = [];
    
    activeColumns.forEach(column => {
      const element = columnRefs.current.get(column.id);
      if (element) {
        console.log('Setting up drop target for column:', column.title);
        const cleanup = setupDropTarget(element, column, handleCardMove);
        if (cleanup) {
          cleanupFunctions.push(cleanup);
        }
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [activeColumns, setupDropTarget, handleCardMove]);

  // Handle drag end with proper move logic
  const handleDragEnd = useCallback((source, destination) => {
    if (!source || !destination) {
      console.log('Kanban Board: No valid drop target');
      return;
    }

    const cardId = source.data.cardId;
    const fromColumn = source.data.card?.columnId;
    const toColumn = destination.data.columnId;

    if (cardId && fromColumn && toColumn && fromColumn !== toColumn) {
      console.log('Kanban Board: Moving card from', fromColumn, 'to', toColumn);
      handleCardMove(cardId, fromColumn, toColumn);
    }
  }, [handleCardMove]);

  // Handle card reorder
  const handleCardReorder = async (cardId, fromColumn, toColumn, newIndex) => {
    setIsReordering(true);
    try {
      console.log('Kanban Board: Reordering card', { cardId, fromColumn, toColumn, newIndex });
      // Note: reorderCards function needs to be implemented in the context
      // await reorderCards(cardId, fromColumn, toColumn, newIndex);
    } catch (error) {
      console.error('Kanban Board: Error reordering card', error);
    } finally {
      setIsReordering(false);
    }
  };

  // Get drag styles for cards
  const getDragStyles = (cardId) => {
    if (isDragging && draggedCard?.id === cardId) {
      return {
        transform: 'rotate(5deg)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        zIndex: 1000
      };
    }
    return {};
  };

  // Get drop zone styles
  const getDropZoneStyles = (cardId) => {
    if (dragOver === cardId) {
      return {
        backgroundColor: '#f0f9ff',
        borderColor: '#3b82f6',
        borderStyle: 'dashed'
      };
    }
    return {};
  };

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

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
              
              // Debug logging
              if (hasSubcolumns) {
                console.log(`Column ${column.title}: ${subcolumnCount} subcolumns, width: ${columnWidth}`);
              }
              
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
                    cards={filteredCards}
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

      {/* Drag Preview */}
      <AnimatePresence>
        {isDragging && draggedCard && (
          <motion.div
            className="fixed pointer-events-none z-50"
            style={{
              left: dragPreview?.x || 0,
              top: dragPreview?.y || 0,
              transform: 'rotate(5deg)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              opacity: 0.9
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <PragmaticKanbanCard
              card={draggedCard}
              isDragging={true}
              getDragStyles={() => ({})}
              getDropZoneStyles={() => ({})}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
        onMove={(card) => console.log('Move card:', card)}
        onCopy={(card) => console.log('Copy card:', card)}
      />
    </div>
    </>
  );
};

export default KanbanBoard;
