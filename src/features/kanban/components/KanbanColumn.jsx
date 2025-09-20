/**
 * Kanban Column Component
 * Renders a single Kanban column with support for grouped and non-grouped layouts
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Settings, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';
import { COLUMN_TYPES } from '../utils/constants';
import KanbanCard from './KanbanCard';
import CreateCardButton from './CreateCardButton';
import ColumnHeader from './ColumnHeader';
import ColumnSearch from './ColumnSearch';

/**
 * Subcolumn Component for grouped columns
 */
const Subcolumn = ({ subcolumn, cards, onCardClick, onCreateCard, canManageColumn, isActivating, toggleColumnActivation, columnType, canCreateCard, canToggleColumnActivation }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: subcolumn.id,
  });

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
      ref={isSubcolumnActive ? setNodeRef : null}
      className={clsx(
        'flex flex-col bg-white dark:bg-gray-800 rounded border-2 border-dashed min-w-[280px] max-w-[400px] min-h-[200px]',
        isOver && isSubcolumnActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600',
        !isSubcolumnActive && 'opacity-50',
        isUserSubcolumn && 'border-green-300 dark:border-green-600'
      )}
    >
      {/* Subcolumn Header */}
      <div className={clsx(
        'p-2 border-b border-gray-200 dark:border-gray-600 rounded-t',
        isUserSubcolumn ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              {console.log('Subcolumn____:', subcolumn)}
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
                {isSubcolumnActive ? (
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
        <div className="flex-1 p-2 space-y-2">
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
          
          <SortableContext 
            items={cards.map(card => card.id)} 
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} onCardClick={onCardClick} />
            ))}
          </SortableContext>
          
          {/* Create Card Button for Production/Drivers and User Subcolumns */}
          {(columnType === COLUMN_TYPES.PRODUCTION || columnType === COLUMN_TYPES.DRIVERS) && 
           canCreateCard(subcolumn.id, subcolumn) && (
            <CreateCardButton 
              columnId={subcolumn.id} 
              subcolumnId={subcolumn.id}
              onCreateCard={onCreateCard}
            />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Kanban Column Component
 */
const KanbanColumn = ({ column, cards, onCardClick, onCreateCard }) => {
  const {
    toggleColumnActivation,
    canCreateCard,
    canManageColumn,
    canToggleColumnActivation,
    isActivating,
    getCardsBySubcolumn
  } = useKanban();





  // Set up droppable for non-grouped columns
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Check if this is a grouped column
  const isGrouped = column.subcolumns && column.subcolumns.length > 0;

  // Get subcolumns for grouped columns
  const subcolumns = isGrouped ? column.subcolumns : [];

  // Debug logging for column structure
  if (process.env.NODE_ENV === 'development' && (column.type === 'production' || column.type === 'drivers')) {
    console.log(`Column ${column.title}:`, {
      type: column.type,
      isGrouped,
      subcolumnsCount: subcolumns.length,
      subcolumns: subcolumns
    });
  }

  // Get cards for a specific subcolumn
  const getCardsForSubcolumn = (subcolumnId) => {
    return getCardsBySubcolumn(subcolumnId);
  };

  // Render non-grouped column
  if (!isGrouped) {
    return (
      <div
        ref={setNodeRef}
        data-column-id={column.id}
        className={clsx(
          'flex flex-col bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed min-w-[280px] max-w-[400px] kanban-column',
          isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600',
          column.isActive === false && 'opacity-50'
        )}
      >
        {/* Column Header */}
        <ColumnHeader column={column} cardCount={cards.length} />
        
        {/* Column Content */}
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          <SortableContext items={cards.map(card => card.id)} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} onCardClick={onCardClick} />
            ))}
          </SortableContext>
          
          {/* Create Card Button */}
          {((typeof canCreateCard === 'function' && canCreateCard(column.id)) || column.type === 'sales') && (
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
    <div className="flex flex-col bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-w-[600px] max-w-[1200px]">
      {/* Group Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-white">{column.title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{cards.length} cards</span>
            {typeof canManageColumn === 'function' && canManageColumn(column.id) && (
              <button className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subcolumns */}
      <div className="flex-1 p-2 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;

