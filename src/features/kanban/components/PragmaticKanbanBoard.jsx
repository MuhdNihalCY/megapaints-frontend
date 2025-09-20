/**
 * Pragmatic Drag and Drop Kanban Board
 * Enhanced board component using Pragmatic DND for better drag experience
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, HelpCircle, Settings } from 'lucide-react';

import { useKanban } from '../contexts/KanbanContext';
import { usePragmaticDragAndDrop, useDragMonitor } from '../hooks/usePragmaticDragAndDrop';
import PragmaticKanbanCard from './PragmaticKanbanCard';
import KanbanColumn from './KanbanColumn';
import FiltersPanel from './FiltersPanel';
import HelpPanel from './HelpPanel';
import KeyboardShortcuts from './KeyboardShortcuts';

import { LoadingOverlay } from '../../../components';

/**
 * Pragmatic Drag and Drop Kanban Board Component
 */
const PragmaticKanbanBoard = ({ onCardClick, onCreateCard }) => {
  const {
    loading,
    error,
    columns,
    cards,
    moveCard,
    reorderCards,
    getCardsByColumn,
    getCardsBySubcolumn,
    getActiveColumns,
    canMoveCard,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    clearFilters
  } = useKanban();

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

  // Refs
  const boardRef = useRef(null);
  const columnRefs = useRef(new Map());

  // Get active columns
  const activeColumns = useMemo(() => {
    return getActiveColumns();
  }, [getActiveColumns]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setSearchTerm(query);
  };

  // Handle card move
  const handleCardMove = async (cardId, fromColumn, toColumn, toSubcolumn = null, position = null) => {
    try {
      console.log('Pragmatic DND: Moving card', { cardId, fromColumn, toColumn, toSubcolumn, position });
      await moveCard(cardId, fromColumn, toColumn, toSubcolumn, position);
    } catch (error) {
      console.error('Pragmatic DND: Error moving card', error);
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
      console.log('Pragmatic DND: No valid drop target');
      return;
    }

    const cardId = source.data.cardId;
    const fromColumn = source.data.card?.columnId;
    const toColumn = destination.data.columnId;

    if (cardId && fromColumn && toColumn && fromColumn !== toColumn) {
      console.log('Pragmatic DND: Moving card from', fromColumn, 'to', toColumn);
      handleCardMove(cardId, fromColumn, toColumn);
    }
  }, [handleCardMove]);

  // Handle card reorder
  const handleCardReorder = async (cardId, fromColumn, toColumn, newIndex) => {
    try {
      console.log('Pragmatic DND: Reordering card', { cardId, fromColumn, toColumn, newIndex });
      await reorderCards(cardId, fromColumn, toColumn, newIndex);
    } catch (error) {
      console.error('Pragmatic DND: Error reordering card', error);
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
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
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
          <div className="flex gap-6 lg:gap-10 p-4 lg:p-6 h-full">
            {activeColumns.map((column) => {
              const columnCards = getCardsByColumn(column.id);
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
                    cards={columnCards}
                    onCardClick={onCardClick}
                    onCreateCard={onCreateCard}
                    isDragging={isDragging}
                    dragOver={dragOver}
                    selectedCards={selectedCards}
                    onCardSelect={handleCardSelect}
                    getDragStyles={getDragStyles}
                    getDropZoneStyles={getDropZoneStyles}
                    CardComponent={PragmaticKanbanCard}
                    onDragEnd={handleDragEnd}
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
    </div>
  );
};

export default PragmaticKanbanBoard;
