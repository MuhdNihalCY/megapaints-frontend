/**
 * Column Header Component
 * Displays column title, card count, and management options
 */

import { Settings, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';

/**
 * Column Header Component
 */
const ColumnHeader = ({ column, cardCount }) => {
  const { canManageColumn } = useKanban();

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    // TODO: Implement column settings modal
  };

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    // TODO: Implement column options menu
  };

  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-t-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-800 dark:text-white">{column.title}</h3>
          <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
            {cardCount}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {canManageColumn(column.id) && (
            <button
              onClick={handleSettingsClick}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Column settings"
            >
              <Settings size={16} />
            </button>
          )}
          
          <button
            onClick={handleOptionsClick}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="More options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnHeader;


