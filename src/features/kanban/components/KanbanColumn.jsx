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

/**
 * Subcolumn Component for grouped columns
 */
const Subcolumn = ({ subcolumn, cards, onCardClick, onCreateCard, canManageColumn, isActivating, toggleColumnActivation, columnType, canCreateCard }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: subcolumn.id,
  });

  const isSubcolumnActive = subcolumn.isActive !== false;
  const isActivatingSubcolumn = isActivating(subcolumn.id);

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
        'flex flex-col bg-white rounded border-2 border-dashed min-w-[280px] max-w-[400px] min-h-[200px]',
        isOver && isSubcolumnActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
        !isSubcolumnActive && 'opacity-50'
      )}
    >
      {/* Subcolumn Header */}
      <div className="p-2 border-b border-gray-200 bg-gray-50 rounded-t">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-gray-700">
            {subcolumn.title}
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {cards.length}
            </span>
            
            {/* Activation Toggle */}
            {canManageColumn && (
              <button
                onClick={() => handleToggleActivation(subcolumn.id, !isSubcolumnActive)}
                disabled={isActivatingSubcolumn}
                className={clsx(
                  'p-1 rounded hover:bg-gray-200 transition-colors',
                  isActivatingSubcolumn && 'opacity-50 cursor-not-allowed'
                )}
                title={isSubcolumnActive ? 'Hide column' : 'Show column'}
              >
                {isSubcolumnActive ? (
                  <Eye size={14} className="text-gray-600" />
                ) : (
                  <EyeOff size={14} className="text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subcolumn Content */}
      {isSubcolumnActive && (
        <div className="flex-1 p-2 space-y-2">
          <SortableContext 
            items={cards.map(card => card.id)} 
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} onCardClick={onCardClick} />
            ))}
          </SortableContext>
          
          {/* Create Card Button for Production/Drivers */}
          {(columnType === COLUMN_TYPES.PRODUCTION || columnType === COLUMN_TYPES.DRIVERS) && 
           canCreateCard && (
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

  // Get cards for a specific subcolumn
  const getCardsForSubcolumn = (subcolumnId) => {
    return getCardsBySubcolumn(subcolumnId);
  };

  // Render non-grouped column
  if (!isGrouped) {
    return (
      <div
        ref={setNodeRef}
        className={clsx(
          'flex flex-col bg-gray-50 rounded-lg border-2 border-dashed min-w-[280px] max-w-[400px]',
          isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
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
          {canCreateCard(column.id) && (
            <CreateCardButton columnId={column.id} onCreateCard={onCreateCard} />
          )}
        </div>
      </div>
    );
  }

  // Render grouped column
  return (
    <div className="flex flex-col bg-gray-50 rounded-lg border border-gray-200 min-w-[600px] max-w-[1200px]">
      {/* Group Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-100 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{column.title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{cards.length} cards</span>
            {canManageColumn(column.id) && (
              <button className="p-1 text-gray-500 hover:text-gray-700">
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
                canManageColumn={canManageColumn(column.id)}
                isActivating={isActivating}
                toggleColumnActivation={toggleColumnActivation}
                columnType={column.type}
                canCreateCard={canCreateCard(column.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;

