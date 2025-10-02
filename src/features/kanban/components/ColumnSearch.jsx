/**
 * DEPRECATED: Column Search Component
 * This component has been consolidated into components/search/ColumnSearch.jsx
 * Specialized search component for specific columns like "> 7 Days"
 * 
 * @deprecated Use components/search/ColumnSearch.jsx instead
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';
import { UI_CONSTANTS } from '../utils/constants';
import { LoadingOverlay } from '../../../components';

/**
 * Column Search Component
 * @param {Object} props
 * @param {string} props.columnId - The column ID to search within
 * @param {string} props.placeholder - Placeholder text for the search input
 * @param {Function} props.onSearch - Callback function when search is performed
 * @param {Function} props.onClear - Callback function when search is cleared
 */
const ColumnSearch = ({ 
  columnId, 
  placeholder = "Search cards...", 
  onSearch, 
  onClear 
}) => {
  const { searchCards } = useKanban();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim()) {
        setSearchResults([]);
        onClear?.();
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchCards(columnId, term);
        setSearchResults(results);
        onSearch?.(results);
      } catch (error) {
        console.error('Error searching cards:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, UI_CONSTANTS.SEARCH_DEBOUNCE_MS),
    [columnId, onSearch, onClear]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    onClear?.();
  };

  return (
    <>
      {/* Loading Overlay for search operations */}
      {isSearching && <LoadingOverlay message="Searching cards..." />}
      
      <div className="relative">
        <div className="relative">
          <Search 
            className={clsx(
              "absolute left-3 top-1/2 transform -translate-y-1/2",
              isSearching ? "text-blue-500" : "text-gray-400"
            )} 
            size={16} 
          />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={isSearching}
            className={clsx(
              "w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
              "border-gray-300 dark:border-gray-600",
              "placeholder-gray-500 dark:placeholder-gray-400",
              isSearching && "opacity-50 cursor-not-allowed"
            )}
          />
          {searchTerm && !isSearching && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {/* Search Results Indicator */}
        {searchTerm && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isSearching ? (
              <span className="text-blue-500">Searching...</span>
            ) : (
              <span>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

/**
 * Debounce utility function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ColumnSearch;
