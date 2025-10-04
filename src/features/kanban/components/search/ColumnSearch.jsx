/**
 * ColumnSearch Component
 * Search functionality for specific columns (especially > 7 Days)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Filter, 
  Calendar, 
  User, 
  Tag,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';

const ColumnSearch = ({ column, onSearchResults }) => {
  const { searchCardsInColumn, users, labels } = useKanban();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: '',
    assignee: '',
    label: '',
    dateRange: {
      start: '',
      end: ''
    }
  });
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        performSearch();
      }, 300);
      setDebounceTimer(timer);
    } else {
      setSearchResults([]);
      onSearchResults?.([]);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchQuery, filters]);

  // Perform search
  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const searchParams = {
        q: searchQuery.trim(),
        ...filters
      };

      const results = await searchCardsInColumn(column.id, searchQuery.trim(), searchParams);
      setSearchResults(results || []);
      onSearchResults?.(results || []);
    } catch (error) {
      console.error('Error searching cards:', error);
      setSearchResults([]);
      onSearchResults?.([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setFilters({
      priority: '',
      assignee: '',
      label: '',
      dateRange: { start: '', end: '' }
    });
    onSearchResults?.([]);
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  // Get search result count
  const getResultCount = () => {
    if (!searchQuery.trim()) return 0;
    return searchResults.length;
  };

  // Format search result
  const formatSearchResult = (card) => {
    const matches = [];
    
    if (card.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      matches.push('title');
    }
    if (card.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      matches.push('description');
    }
    if (card.comments?.some(comment => 
      comment.text?.toLowerCase().includes(searchQuery.toLowerCase())
    )) {
      matches.push('comments');
    }

    return matches;
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${column.title}...`}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Status */}
        {searchQuery && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  <span>{getResultCount()} result{getResultCount() !== 1 ? 's' : ''} found</span>
                </>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Filter className="w-3 h-3" />
              Filters
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assignee
                </label>
                <select
                  value={filters.assignee}
                  onChange={(e) => handleFilterChange('assignee', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Assignees</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Label Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label
                </label>
                <select
                  value={filters.label}
                  onChange={(e) => handleFilterChange('label', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Labels</option>
                  {labels.map(label => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <div className="space-y-1">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Search Results:
          </div>
          {searchResults.map((card) => (
            <div
              key={card.id}
              className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    {card.title}
                  </h4>
                  {card.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {card.description.substring(0, 100)}
                      {card.description.length > 100 && '...'}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(card.createdAt).toLocaleDateString()}
                    </span>
                    {card.priority && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        card.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        card.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        card.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {card.priority}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Matches: {formatSearchResult(card).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* No Results */}
      {searchQuery && !isSearching && searchResults.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4 text-gray-500 dark:text-gray-400"
        >
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No results found for "{searchQuery}"</p>
        </motion.div>
      )}
    </div>
  );
};

export default ColumnSearch;
