/**
 * Kanban Column Component
 * Renders a single Kanban column with support for grouped and non-grouped layouts
 */

// Removed @dnd-kit dependencies - using Pragmatic DND instead
import { Settings, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';
import { COLUMN_TYPES } from '../utils/constants';
import KanbanCard from './KanbanCard';
import CreateCardButton from './CreateCardButton';
import ColumnHeader from './ColumnHeader';
import ColumnSearch from './ColumnSearch';
import { LoadingOverlay } from '../../../components';

/**
 * Subcolumn Component for grouped columns
 */
const Subcolumn = ({ subcolumn, cards, onCardClick, onCreateCard, canManageColumn, isActivating, toggleColumnActivation, columnType, canCreateCard, canToggleColumnActivation, isDragging, dragOver, selectedCards, onCardSelect, getDragStyles, getDropZoneStyles, CardComponent = KanbanCard, onDragEnd = null }) => {
  // Removed @dnd-kit useDroppable - using Pragmatic DND instead

  const isSubcolumnActive = subcolumn.isActive !== false;
  const isActivatingSubcolumn = isActivating(subcolumn.id);
  const isUserSubcolumn = subcolumn.type === 'user';
  const isMoreThan7DaysColumn = subcolumn.id === 'more-than-7-days';

  const handleToggleActivation = async (subcolumnId, isActive) => {
    try {
      await toggleColumnActivation(subcolumnId, isActive);
    } catch (error) {
      console.error('Error toggling column activation:', error);
    }
  };

  return (
    <div
      // Removed @dnd-kit ref - using Pragmatic DND instead
      className={clsx(
        'flex flex-col bg-white dark:bg-gray-800 rounded-lg border-2 border-solid w-80 min-h-[200px] h-fit shadow-lg hover:shadow-xl transition-all duration-200',
        'border-blue-300 dark:border-gray-600',
        !isSubcolumnActive && 'opacity-50',
        isUserSubcolumn && 'border-green-400 dark:border-green-500'
      )}
    >
      {/* Subcolumn Header */}
      <div className={clsx(
        'p-3 border-b border-blue-200 dark:border-gray-600 rounded-t-lg',
        isUserSubcolumn ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-gray-700'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              {/* {console.log('Subcolumn____:', subcolumn)} */}
              {subcolumn.title}
            </h4>
            {isUserSubcolumn && (
              <span className="px-1 py-0.5 text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                User
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {cards.length}
            </span>
            
            {/* Activation Toggle - Only for Production and Drivers user subcolumns */}
            {isUserSubcolumn && canToggleColumnActivation && canToggleColumnActivation(columnType) && (
              <button
                onClick={() => handleToggleActivation(subcolumn.id, !isSubcolumnActive)}
                disabled={isActivatingSubcolumn}
                className={clsx(
                  'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
                  isActivatingSubcolumn && 'opacity-50 cursor-not-allowed'
                )}
                title={isSubcolumnActive ? 'Hide column' : 'Show column'}
              >
                {isActivatingSubcolumn ? (
                  <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                ) : isSubcolumnActive ? (
                  <Eye size={14} className="text-gray-600 dark:text-gray-300" />
                ) : (
                  <EyeOff size={14} className="text-gray-400 dark:text-gray-500" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subcolumn Content */}
      {isSubcolumnActive && (
        <div className="flex-1 p-3 space-y-3">
          {/* Search Bar for > 7 Days column */}
          {isMoreThan7DaysColumn && (
            <div className="mb-3">
              <ColumnSearch
                columnId={subcolumn.id}
                placeholder="Search completed cards..."
                onSearch={(results) => {
                  // Handle search results if needed
                  console.log('Search results:', results);
                }}
                onClear={() => {
                  // Handle search clear if needed
                  console.log('Search cleared');
                }}
              />
            </div>
          )}
          
          <div className="space-y-2">
            {cards.map((card) => (
              <CardComponent 
                key={card.id} 
                card={card} 
                onCardClick={onCardClick}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
          
          {/* Create Card Button - Only for Sales column (removed from subcolumns) */}
        </div>
      )}
    </div>
  );
};

/**
 * Kanban Column Component
 */
const KanbanColumn = ({ column, cards, onCardClick, onCreateCard, isDragging, dragOver, selectedCards, onCardSelect, getDragStyles, getDropZoneStyles, CardComponent = KanbanCard, onDragEnd = null }) => {
  const {
    toggleColumnActivation,
    canCreateCard,
    canManageColumn,
    canToggleColumnActivation,
    isActivating,
    getCardsByColumn,
    getCardsBySubcolumn
  } = useKanban();





  // Removed @dnd-kit useDroppable - using Pragmatic DND instead

  // Check if this is a grouped column
  const isGrouped = column.subcolumns && column.subcolumns.length > 0;

  // Get subcolumns for grouped columns
  const subcolumns = isGrouped ? column.subcolumns : [];

  // Get cards for a specific subcolumn (sorted)
  const getCardsForSubcolumn = (subcolumnId) => {
    return getCardsBySubcolumn(subcolumnId);
  };

  // Get cards for non-grouped columns
  const sortedCards = getCardsByColumn(column.id);

  // Render non-grouped column
  if (!isGrouped) {
    return (
      <div
        // Removed @dnd-kit ref - using Pragmatic DND instead
        data-column-id={column.id}
        className={clsx(
          'flex flex-col bg-white dark:bg-gray-800 rounded-xl border-2 border-solid w-full kanban-column shadow-lg hover:shadow-xl transition-all duration-200',
          'border-blue-300 dark:border-gray-600',
          column.isActive === false && 'opacity-50'
        )}
      >
        {/* Column Header with Sort */}
        <div className="p-4 border-b border-blue-200 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-t-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-white">{column.title}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-600/50 px-2 py-1 rounded-full">{sortedCards.length} cards</span>
              {typeof canManageColumn === 'function' && canManageColumn(column.id) && (
                <button className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <Settings size={16} />
                </button>
              )}
            </div>
          </div>
          
          {/* Add Card Button for Sales Column */}
          {column.type === 'sales' && (
            <div className="mt-3 mb-2">
              <CreateCardButton columnId={column.id} onCreateCard={onCreateCard} />
            </div>
          )}
          
          {/* Search */}
          <div className="flex items-center justify-end">
            <ColumnSearch columnId={column.id} />
          </div>
        </div>
        
        {/* Column Content */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          <div className="space-y-2">
            {sortedCards.map((card) => (
              <CardComponent 
                key={card.id} 
                card={card} 
                onCardClick={onCardClick}
                isSelected={selectedCards?.includes(card.id)}
                onCardSelect={onCardSelect}
                getDragStyles={getDragStyles}
                isDragging={isDragging}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
          
          {/* Create Card Button - Only for Sales column */}
          {column.type === 'sales' && (
            <div className="create-card-button">
              <CreateCardButton columnId={column.id} onCreateCard={onCreateCard} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render grouped column
  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl border-2 border-solid border-blue-300 dark:border-gray-600 w-full shadow-lg hover:shadow-xl transition-all duration-200">
      {/* Group Header with Sort */}
      <div className="p-4 border-b border-blue-200 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-t-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800 dark:text-white">{column.title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{cards.length} cards</span>
            {typeof canManageColumn === 'function' && canManageColumn(column.id) && (
              <button className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <Settings size={16} />
              </button>
            )}
          </div>
          
          {/* Add Card Button for Sales Column */}
          {column.type === 'sales' && (
            <div className="mt-3 mb-2">
              <CreateCardButton columnId={column.id} onCreateCard={onCreateCard} />
            </div>
          )}
        </div>
        
      </div>

      {/* Subcolumns */}
      <div className="flex-1 p-4">
        <div className="flex gap-4 h-full">
          {subcolumns.map((subcolumn) => {
            const subcolumnCards = getCardsForSubcolumn(subcolumn.id);
            
            return (
              <Subcolumn
                key={subcolumn.id}
                subcolumn={subcolumn}
                cards={subcolumnCards}
                onCardClick={onCardClick}
                onCreateCard={onCreateCard}
                canManageColumn={typeof canManageColumn === 'function' && canManageColumn(column.id)}
                isActivating={isActivating}
                toggleColumnActivation={toggleColumnActivation}
                columnType={column.type}
                canCreateCard={canCreateCard}
                canToggleColumnActivation={canToggleColumnActivation}
                isDragging={isDragging}
                dragOver={dragOver}
                selectedCards={selectedCards}
                onCardSelect={onCardSelect}
                getDragStyles={getDragStyles}
                getDropZoneStyles={getDropZoneStyles}
                CardComponent={CardComponent}
                onDragEnd={onDragEnd}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;

