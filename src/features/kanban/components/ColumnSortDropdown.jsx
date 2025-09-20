/**
 * Column Sort Dropdown Component
 * Provides sorting options for each column
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  ChevronDown, 
  Check, 
  RotateCcw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import clsx from 'clsx';

import { 
  SORT_OPTIONS, 
  getSortDirections, 
  getDefaultSortOption 
} from '../utils/sorting';

/**
 * Column Sort Dropdown Component
 */
const ColumnSortDropdown = ({ 
  columnId, 
  columnType, 
  currentSort, 
  onSortChange, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef({});

  // Initialize with current sort or default
  useEffect(() => {
    if (currentSort) {
      setSelectedOption(currentSort);
    } else {
      setSelectedOption(getDefaultSortOption(columnType));
    }
  }, [currentSort, columnType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowDirections(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle sort option selection
  const handleOptionSelect = (optionId) => {
    const option = Object.values(SORT_OPTIONS).find(opt => opt.id === optionId);
    if (!option) return;

    setSelectedOption(optionId);
    
    // If it's custom order, apply immediately
    if (optionId === SORT_OPTIONS.CUSTOM.id) {
      onSortChange({
        columnId,
        sortOption: optionId,
        direction: 'asc'
      });
      setIsOpen(false);
      return;
    }

    // For other options, show direction selection
    setShowDirections(true);
  };

  // Handle direction selection
  const handleDirectionSelect = (direction) => {
    onSortChange({
      columnId,
      sortOption: selectedOption,
      direction
    });
    setIsOpen(false);
    setShowDirections(false);
  };

  // Reset to default sort
  const handleReset = () => {
    const defaultOption = getDefaultSortOption(columnType);
    setSelectedOption(defaultOption);
    onSortChange({
      columnId,
      sortOption: defaultOption,
      direction: 'desc'
    });
    setIsOpen(false);
    setShowDirections(false);
  };

  // Get current sort info
  const currentSortOption = Object.values(SORT_OPTIONS).find(
    opt => opt.id === selectedOption
  );
  const availableDirections = getSortDirections(selectedOption);

  // Animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { duration: 0.15 }
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  const directionVariants = {
    hidden: { 
      opacity: 0, 
      x: -10,
      transition: { duration: 0.15 }
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Sort Button */}
      <button
        className={clsx(
          'flex items-center space-x-1 px-2 py-1 text-xs rounded-md',
          'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
          'text-gray-600 dark:text-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'bg-gray-100 dark:bg-gray-700'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={currentSortOption?.description || 'Sort cards'}
      >
        <ArrowUpDown size={12} />
        <span className="hidden sm:inline">
          {currentSortOption?.label || 'Sort'}
        </span>
        <ChevronDown 
          size={10} 
          className={clsx(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {!showDirections ? (
              // Sort Options
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                  Sort by
                </div>
                
                {Object.values(SORT_OPTIONS).map((option) => (
                  <button
                    key={option.id}
                    ref={(el) => optionRefs.current[option.id] = el}
                    className={clsx(
                      'w-full px-3 py-2 text-left text-sm flex items-center space-x-3',
                      'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                      selectedOption === option.id && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    )}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <span className="text-base">{option.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                    {selectedOption === option.id && (
                      <Check size={14} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}

                {/* Reset Button */}
                <div className="border-t border-gray-200 dark:border-gray-600 mt-1">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    onClick={handleReset}
                  >
                    <RotateCcw size={14} />
                    <span>Reset to Default</span>
                  </button>
                </div>
              </div>
            ) : (
              // Direction Selection
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                  Sort Direction
                </div>
                
                <motion.div
                  variants={directionVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {availableDirections.map((direction) => (
                    <button
                      key={direction.id}
                      className={clsx(
                        'w-full px-3 py-2 text-left text-sm flex items-center space-x-3',
                        'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                      )}
                      onClick={() => handleDirectionSelect(direction.id)}
                    >
                      <span className="text-base">{direction.icon}</span>
                      <span className="font-medium">{direction.label}</span>
                    </button>
                  ))}
                </motion.div>

                {/* Back Button */}
                <div className="border-t border-gray-200 dark:border-gray-600 mt-1">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    onClick={() => setShowDirections(false)}
                  >
                    <ArrowUp size={14} />
                    <span>Back to Options</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColumnSortDropdown;
