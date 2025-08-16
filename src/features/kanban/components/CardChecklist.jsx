/**
 * Card Checklist Component
 * Trello-like checklist functionality for cards
 */

import { useState } from 'react';
import { Check, Plus, Trash2, Edit3 } from 'lucide-react';
import clsx from 'clsx';

/**
 * Card Checklist Component
 */
const CardChecklist = ({ checklist = [], onUpdate, isEditing = false }) => {
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddItem = () => {
    if (newItem.trim() && onUpdate) {
      const newChecklist = [
        ...checklist,
        {
          id: Date.now().toString(),
          text: newItem.trim(),
          completed: false
        }
      ];
      onUpdate(newChecklist);
      setNewItem('');
    }
  };

  const handleToggleItem = (itemId) => {
    if (onUpdate) {
      const newChecklist = checklist.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      onUpdate(newChecklist);
    }
  };

  const handleDeleteItem = (itemId) => {
    if (onUpdate) {
      const newChecklist = checklist.filter(item => item.id !== itemId);
      onUpdate(newChecklist);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item.id);
    setEditText(item.text);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onUpdate) {
      const newChecklist = checklist.map(item =>
        item.id === editingItem ? { ...item, text: editText.trim() } : item
      );
      onUpdate(newChecklist);
      setEditingItem(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditText('');
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'add') {
        handleAddItem();
      } else if (action === 'edit') {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape' && action === 'edit') {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Checklist</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center space-x-2 group">
            {/* Checkbox */}
            <button
              onClick={() => handleToggleItem(item.id)}
              className={clsx(
                'flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                item.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              )}
            >
              {item.completed && <Check size={12} />}
            </button>

            {/* Item Text */}
            <div className="flex-1 min-w-0">
              {editingItem === item.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, 'edit')}
                  onBlur={handleSaveEdit}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              ) : (
                <span
                  className={clsx(
                    'text-sm cursor-pointer',
                    item.completed
                      ? 'line-through text-gray-500 dark:text-gray-400'
                      : 'text-gray-900 dark:text-white'
                  )}
                  onClick={() => handleToggleItem(item.id)}
                >
                  {item.text}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditItem(item)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Edit item"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete item"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Item */}
      {isEditing && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddItem}
            disabled={!newItem.trim()}
            className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Plus size={12} className="text-gray-500 dark:text-gray-400" />
          </button>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, 'add')}
            placeholder="Add an item..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
};

export default CardChecklist;
