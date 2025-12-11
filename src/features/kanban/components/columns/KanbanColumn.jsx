/**
 * KanbanColumn Component
 * Individual column in the Kanban board with proper structure according to specifications
 */

import React, { useState, useCallback } from 'react';
import KanbanCard from '../cards/KanbanCard';
import ColumnHeader from './ColumnHeader';
import CreateCardButton from '../ui/CreateCardButton';
import ColumnSearch from '../search/ColumnSearch';
import { useKanban } from '../../contexts/KanbanContext';

const KanbanColumn = ({
  column,
  cards = [],
  onCardClick,
  onCreateCard,
  CardComponent = KanbanCard,
  onDragEnd,
  boardId
}) => {
  const { toggleColumnActivation, canPerformAction } = useKanban();
  const [isHovered, setIsHovered] = useState(false);

  // Check if this is a grouped column
  const isGrouped = column.isGrouped || column.subcolumns?.length > 0;
  
  // Check if this column allows card creation
  // Backend columns: allow creation in first column (typically "To Do")
  // Frontend columns: allow creation in "Sales" column
  const isFirstColumn = column.position === 0;
  const isSalesColumn = column.id === 'sales' || column.name?.toLowerCase() === 'sales' || column.title?.toLowerCase() === 'sales';
  const canCreateCard = (isFirstColumn || isSalesColumn) && canPerformAction('CREATE_CARD');
  
  // Check if this column allows toggling (Production and Drivers)
  const canToggleColumn = (column.groupType === 'production' || column.groupType === 'drivers') && 
                         canPerformAction('MANAGE_COLUMNS');

  // Handle column toggle
  const handleColumnToggle = useCallback(async (isActive) => {
    try {
      await toggleColumnActivation(column.id, isActive);
    } catch (error) {
      // Error toggling column
    }
  }, [column.id, toggleColumnActivation]);

  // Handle card creation
  const handleCreateCard = useCallback(async (cardData) => {
    console.log('🔵 KanbanColumn.handleCreateCard called', { 
      canCreateCard, 
      hasOnCreateCard: !!onCreateCard,
      cardData 
    });
    
    if (canCreateCard && onCreateCard) {
      const enhancedCardData = {
        ...cardData,
        columnId: column.id,
        position: cards.length * 1000
      };
      console.log('🔵 Calling parent onCreateCard with', enhancedCardData);
      const result = await onCreateCard(enhancedCardData);
      console.log('🔵 Parent onCreateCard returned', result);
      return result;
    }
    
    console.log('🔴 Cannot create card:', { canCreateCard, hasOnCreateCard: !!onCreateCard });
    return null;
  }, [canCreateCard, onCreateCard, column.id, cards.length]);

  // Render subcolumns for grouped columns
  const renderSubcolumns = () => {
    if (!isGrouped || !column.subcolumns?.length) return null;

    return (
      <div className="flex gap-6">
        {column.subcolumns.map((subcolumn) => {
          const subcolumnCards = cards.filter(card => card.subcolumnId === subcolumn.id);
          
          return (
            <div
              key={subcolumn.id}
              className="flex flex-col w-80"
            >
              {/* Subcolumn Header */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {subcolumn.title}
                  </h3>
                  {subcolumn.hasSearch && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Search enabled
                    </div>
                  )}
                </div>
                
                {/* Search for > 7 Days column */}
                {subcolumn.hasSearch && (
                  <div className="mt-2">
                    <ColumnSearch 
                      column={column} 
                      onSearchResults={(results) => {
                        // Filter cards based on search results
                        // This would be handled by the parent component
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Subcolumn Cards */}
              <div className="space-y-3 min-h-[200px]">
                {subcolumnCards.map((card, index) => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    onClick={() => onCardClick?.(card)}
                    onDragEnd={onDragEnd}
                    index={index}
                  />
                ))}
                
                {/* Empty state */}
                {subcolumnCards.length === 0 && (
                  <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
                    No cards
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render simple column (non-grouped)
  const renderSimpleColumn = () => {
    return (
      <div className="space-y-3 min-h-[200px]">
        {cards.map((card, index) => (
          <CardComponent
            key={card.id}
            card={card}
            onClick={() => onCardClick?.(card)}
            onDragEnd={onDragEnd}
            index={index}
          />
        ))}
        
        {/* Empty state */}
        {cards.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8">
            No cards
          </div>
        )}
      </div>
    );
  };

  // Don't render if column is inactive
  if (!column.isActive) return null;

  return (
    <div
      className="flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <ColumnHeader
          column={column}
          canToggle={canToggleColumn}
          onToggle={handleColumnToggle}
          cardCount={cards.length}
        />
        
        {/* Add Card Button for Sales Column */}
        {canCreateCard && (
          <div className="mt-3 mb-2">
            <CreateCardButton 
              columnId={column.id} 
              onCreateCard={handleCreateCard}
              boardId={boardId}
            />
          </div>
        )}
      </div>

      {/* Column Content */}
      <div className="p-4 flex-1">
        {isGrouped ? renderSubcolumns() : renderSimpleColumn()}
      </div>
    </div>
  );
};

export default KanbanColumn;