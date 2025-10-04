/**
 * ColumnHeader Component
 * Header for Kanban columns with activation toggles
 */

import React from 'react';

const ColumnHeader = ({
  column,
  canToggle = false,
  onToggle,
  cardCount = 0
}) => {
  const handleToggle = (e) => {
    e.stopPropagation();
    if (canToggle && onToggle) {
      onToggle(!column.isActive);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
          {column.title}
        </h2>
        
        {/* Card count badge */}
        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
          {cardCount}
        </span>
      </div>

      {/* Activation toggle for Production and Drivers */}
      {canToggle && (
        <div className="flex items-center gap-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={column.isActive}
              onChange={handleToggle}
              className="sr-only"
            />
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              column.isActive 
                ? 'bg-blue-600 dark:bg-blue-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                column.isActive ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
              {column.isActive ? 'Active' : 'Inactive'}
            </span>
          </label>
        </div>
      )}
    </div>
  );
};

export default ColumnHeader;