/**
 * CreateCardButton Component
 * Trello-like card creation experience for Sales column
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, User, Tag, Paperclip, CheckSquare } from 'lucide-react';

const CreateCardButton = ({ columnId, onCreateCard }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignees: [],
    labels: []
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef(null);

  // Auto-focus and resize textarea
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isExpanded]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onCreateCard(formData);
      setFormData({ 
        title: '', 
        description: '', 
        priority: 'medium',
        dueDate: '',
        assignees: [],
        labels: []
      });
      setIsExpanded(false);
      setIsQuickAdd(false);
      setShowAdvanced(false);
    }
  };

  const handleCancel = () => {
    setFormData({ 
      title: '', 
      description: '', 
      priority: 'medium',
      dueDate: '',
      assignees: [],
      labels: []
    });
    setIsExpanded(false);
    setIsQuickAdd(false);
    setShowAdvanced(false);
  };

  const handleQuickAdd = () => {
    if (formData.title.trim()) {
      onCreateCard(formData);
      setFormData({ 
        title: '', 
        description: '', 
        priority: 'medium',
        dueDate: '',
        assignees: [],
        labels: []
      });
      setIsExpanded(false);
      setIsQuickAdd(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isQuickAdd) {
        handleQuickAdd();
      } else {
        handleSubmit(e);
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence>
        {!isExpanded ? (
          <motion.button
            key="add-button"
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add a card</span>
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Main input area */}
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a title for this card..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none min-h-[60px]"
                  required
                />
                
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add a more detailed description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Advanced</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Card
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateCardButton;