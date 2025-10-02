/**
 * FiltersPanel Component
 * Advanced filtering panel for the Kanban board
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useKanban } from '../../contexts/KanbanContext';

const FiltersPanel = ({
  onFilterChange,
  onClearFilters,
  users,
  labels
}) => {
  const { filters } = useKanban();
  const [localFilters, setLocalFilters] = useState(filters);

  // Update local filters when context filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);

  // Handle text filter change
  const handleTextFilterChange = useCallback((e) => {
    handleFilterChange('text', e.target.value);
  }, [handleFilterChange]);

  // Handle label filter toggle
  const handleLabelToggle = useCallback((labelId) => {
    const currentLabels = localFilters.labels || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    handleFilterChange('labels', newLabels);
  }, [localFilters.labels, handleFilterChange]);

  // Handle assignee filter toggle
  const handleAssigneeToggle = useCallback((userId) => {
    const currentAssignees = localFilters.assignees || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];
    handleFilterChange('assignees', newAssignees);
  }, [localFilters.assignees, handleFilterChange]);

  // Handle priority filter toggle
  const handlePriorityToggle = useCallback((priority) => {
    const currentPriorities = localFilters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    handleFilterChange('priority', newPriorities);
  }, [localFilters.priority, handleFilterChange]);

  // Handle due date range change
  const handleDueDateChange = useCallback((field, value) => {
    const newRange = {
      ...localFilters.dueDateRange,
      [field]: value
    };
    handleFilterChange('dueDateRange', newRange);
  }, [localFilters.dueDateRange, handleFilterChange]);

  // Handle column filter toggle
  const handleColumnToggle = useCallback((columnId) => {
    const currentColumns = localFilters.columns || [];
    const newColumns = currentColumns.includes(columnId)
      ? currentColumns.filter(id => id !== columnId)
      : [...currentColumns, columnId];
    handleFilterChange('columns', newColumns);
  }, [localFilters.columns, handleFilterChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    const clearedFilters = {
      text: '',
      labels: [],
      assignees: [],
      dueDateRange: { start: null, end: null },
      priority: [],
      columns: []
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  }, [onClearFilters]);

  // Check if any filters are active
  const hasActiveFilters = 
    localFilters.text ||
    (localFilters.labels && localFilters.labels.length > 0) ||
    (localFilters.assignees && localFilters.assignees.length > 0) ||
    (localFilters.priority && localFilters.priority.length > 0) ||
    (localFilters.columns && localFilters.columns.length > 0) ||
    localFilters.dueDateRange?.start ||
    localFilters.dueDateRange?.end;

  return (
    <div className="filters-panel bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {[
                localFilters.text && 'Text',
                localFilters.labels?.length && 'Labels',
                localFilters.assignees?.length && 'Assignees',
                localFilters.priority?.length && 'Priority',
                localFilters.columns?.length && 'Columns',
                (localFilters.dueDateRange?.start || localFilters.dueDateRange?.end) && 'Due Date'
              ].filter(Boolean).join(', ')} active
            </span>
          )}
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            disabled={!hasActiveFilters}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Text Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Text Search
          </label>
          <input
            type="text"
            value={localFilters.text || ''}
            onChange={handleTextFilterChange}
            placeholder="Search in cards..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Priority
          </label>
          <div className="space-y-1">
            {['low', 'medium', 'high', 'urgent'].map((priority) => (
              <label key={priority} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.priority?.includes(priority) || false}
                  onChange={() => handlePriorityToggle(priority)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {priority}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Labels Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Labels
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {labels && labels.length > 0 ? (
              labels.map((label) => (
                <label key={label._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.labels?.includes(label._id) || false}
                    onChange={() => handleLabelToggle(label._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span 
                    className="ml-2 text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No labels available</p>
            )}
          </div>
        </div>

        {/* Assignees Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assignees
          </label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {users && users.length > 0 ? (
              users.map((user) => (
                <label key={user._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.assignees?.includes(user._id) || false}
                    onChange={() => handleAssigneeToggle(user._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {user.first_name} {user.last_name}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No users available</p>
            )}
          </div>
        </div>
      </div>

      {/* Due Date Range Filter */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Due Date From
          </label>
          <input
            type="date"
            value={localFilters.dueDateRange?.start || ''}
            onChange={(e) => handleDueDateChange('start', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Due Date To
          </label>
          <input
            type="date"
            value={localFilters.dueDateRange?.end || ''}
            onChange={(e) => handleDueDateChange('end', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              handleDueDateChange('start', today);
              handleDueDateChange('end', today);
            }}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800"
          >
            Due Today
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              handleDueDateChange('start', today.toISOString().split('T')[0]);
              handleDueDateChange('end', tomorrow.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800"
          >
            Due Soon
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const overdue = new Date(today);
              overdue.setDate(overdue.getDate() - 1);
              handleDueDateChange('start', '1900-01-01');
              handleDueDateChange('end', overdue.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
          >
            Overdue
          </button>
          <button
            onClick={() => handlePriorityToggle('urgent')}
            className="px-3 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
          >
            Urgent Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel;
