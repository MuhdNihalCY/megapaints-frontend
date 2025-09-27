/**
 * Create Card Button Component
 * Simple button that triggers the card creation modal
 */

import { Plus } from 'lucide-react';
import clsx from 'clsx';

/**
 * Create Card Button Component
 */
const CreateCardButton = ({ columnId, subcolumnId = null, onCreateCard }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onCreateCard(columnId, subcolumnId);
  };

  return (
    <button
      onClick={handleClick}
      title="Add new card"
      className={clsx(
        'w-full p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100',
        'dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700',
        'border-2 border-dashed border-gray-300 hover:border-gray-400',
        'dark:border-gray-600 dark:hover:border-gray-500',
        'rounded-lg transition-all duration-200 flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-800',
        'font-medium'
      )}
    >
      <Plus size={18} className="mr-2" />
      <span className="text-sm font-medium">Add Card</span>
    </button>
  );
};

export default CreateCardButton;

