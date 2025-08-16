/**
 * Create Card Button Component
 * Trello-like inline card creation with form
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, Calendar, User, Tag } from 'lucide-react';
import clsx from 'clsx';

import { useKanban } from '../contexts/KanbanContext';
import { CARD_PRIORITIES } from '../utils/constants';

/**
 * Create Card Button Component
 */
const CreateCardButton = ({ columnId, subcolumnId = null, onCreateCard }) => {
  const { labels } = useKanban();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: CARD_PRIORITIES.MEDIUM,
    labels: [],
    assignees: [],
    dueDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { users, createCard } = useKanban();
  const formRef = useRef(null);
  const titleInputRef = useRef(null);

  // Focus title input when form opens
  useEffect(() => {
    if (isCreating && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isCreating]);

  // Handle click outside to close form
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    if (isCreating) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCreating]);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setFormData({
      title: '',
      description: '',
      priority: CARD_PRIORITIES.MEDIUM,
      labels: [],
      assignees: [],
      dueDate: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      titleInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await createCard({
        ...formData,
        columnId: columnId,
        subcolumnId: subcolumnId
      });
      handleCancel();
    } catch (error) {
      console.error('Error creating card:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLabelToggle = (labelId) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(labelId)
        ? prev.labels.filter(id => id !== labelId)
        : [...prev.labels, labelId]
    }));
  };

  const handleAssigneeToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  if (isCreating) {
    return (
      <div ref={formRef} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title Input */}
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a title for this card..."
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              maxLength={100}
            />
          </div>

          {/* Description Input */}
          <div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a more detailed description..."
              rows={2}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              maxLength={500}
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Priority */}
            <div className="relative">
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(CARD_PRIORITIES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="relative">
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Labels Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-1"
              >
                <Tag size={12} />
                <span>Labels</span>
              </button>
              
              {/* Labels Dropdown Menu */}
              <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg p-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Labels</div>
                <div className="space-y-1">
                  {labels.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No labels available</p>
                  ) : (
                    labels.map((label) => (
                      <label key={label.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.labels.includes(label.id)}
                          onChange={() => handleLabelToggle(label.id)}
                          className="rounded"
                        />
                        <span
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Assignees Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-1"
              >
                <User size={12} />
                <span>Assign</span>
              </button>
              
              {/* Assignees Dropdown Menu */}
              <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg p-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignees.includes(user.id)}
                        onChange={() => handleAssigneeToggle(user.id)}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-900 dark:text-white">
                        {user.name || user.username}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Labels Display */}
          {formData.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.labels.map((labelId) => {
                const label = labels.find(l => l.id === labelId);
                return label ? (
                  <span
                    key={label.id}
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Selected Assignees Display */}
          {formData.assignees.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.assignees.map((userId) => {
                const user = users.find(u => u.id === userId);
                return user ? (
                  <span
                    key={user.id}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    {user.name || user.username}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors flex items-center space-x-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Add Card</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            </div>

            {/* Character Count */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formData.title.length}/100
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100',
        'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700',
        'border-2 border-dashed border-gray-300 hover:border-gray-400',
        'dark:border-gray-600 dark:hover:border-gray-500',
        'rounded-lg transition-all duration-200 flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-800'
      )}
    >
      <Plus size={16} className="mr-1" />
      <span className="text-sm font-medium">Add card</span>
    </button>
  );
};

export default CreateCardButton;

