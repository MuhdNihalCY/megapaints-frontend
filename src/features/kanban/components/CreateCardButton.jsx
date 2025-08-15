/**
 * Create Card Button Component
 * Button to create new cards in a column
 */

import { Plus } from 'lucide-react';
import clsx from 'clsx';

/**
 * Create Card Button Component
 */
const CreateCardButton = ({ columnId, subcolumnId = null, onCreateCard }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onCreateCard) {
      onCreateCard(columnId, subcolumnId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        'border-2 border-dashed border-gray-300 hover:border-gray-400',
        'rounded-lg transition-all duration-200 flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      )}
    >
      <Plus size={16} className="mr-1" />
      <span className="text-sm font-medium">Add card</span>
    </button>
  );
};

export default CreateCardButton;

