/**
 * CardModal Component
 * Comprehensive card modal with all required fields according to specifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  User, 
  Tag, 
  Paperclip, 
  CheckSquare, 
  MessageSquare, 
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  Upload
} from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';
import LoadingSpinner from '../common/LoadingSpinner';
import CommentsSection from '../comments/CommentsSection';
import ActivityLog from '../activity/ActivityLog';

const CardModal = ({ 
  card, 
  isOpen, 
  onClose, 
  isEditing = false, 
  onSave, 
  onDelete 
}) => {
  const { users, labels, canPerformAction, addComment, updateComment, deleteComment } = useKanban();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignees: [],
    labels: [],
    contacts: [],
    readyProducts: [],
    checklists: [],
    customFields: [],
    attachments: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '' });

  // Initialize form data when card changes
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || '',
        description: card.description || '',
        priority: card.priority || 'medium',
        dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '',
        assignees: card.assignees || [],
        labels: card.labels || [],
        contacts: card.contacts || [],
        readyProducts: card.readyProducts || [],
        checklists: card.checklists || [],
        customFields: card.customFields || [],
        attachments: card.attachments || []
      });
    }
  }, [card]);

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (field, itemId, isSelected) => {
    setFormData(prev => ({
      ...prev,
      [field]: isSelected 
        ? [...prev[field], itemId]
        : prev[field].filter(id => id !== itemId)
    }));
  };

  // Add checklist item
  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false
      };
      setFormData(prev => ({
        ...prev,
        checklists: [...prev.checklists, newItem]
      }));
      setNewChecklistItem('');
    }
  };

  // Toggle checklist item
  const toggleChecklistItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      checklists: prev.checklists.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  // Remove checklist item
  const removeChecklistItem = (itemId) => {
    setFormData(prev => ({
      ...prev,
      checklists: prev.checklists.filter(item => item.id !== itemId)
    }));
  };

  // Add custom field
  const addCustomField = () => {
    if (newCustomField.name.trim() && newCustomField.value.trim()) {
      const field = {
        id: Date.now().toString(),
        name: newCustomField.name.trim(),
        value: newCustomField.value.trim()
      };
      setFormData(prev => ({
        ...prev,
        customFields: [...prev.customFields, field]
      }));
      setNewCustomField({ name: '', value: '' });
    }
  };

  // Remove custom field
  const removeCustomField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== fieldId)
    }));
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file) // In real app, upload to server
    }));
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  // Remove attachment
  const removeAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
  };

  // Handle save
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const cardData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      };
      
      await onSave(cardData);
      onClose();
    } catch (error) {
      console.error('Error saving card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      setIsLoading(true);
      try {
        await onDelete();
        onClose();
      } catch (error) {
        console.error('Error deleting card:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle comment operations
  const handleCommentAdd = useCallback(async (commentData) => {
    try {
      await addComment(card.id, commentData);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [card?.id, addComment]);

  const handleCommentUpdate = useCallback(async (commentId, updates) => {
    try {
      await updateComment(commentId, updates);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  }, [updateComment]);

  const handleCommentDelete = useCallback(async (commentId) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, [deleteComment]);

  // Check permissions
  const canEdit = canPerformAction('EDIT_CARD', card);
  const canDelete = canPerformAction('DELETE_CARD', card);
  const canComment = canPerformAction('COMMENT', card);
  const canAssign = canPerformAction('ASSIGN_USERS', card);
  const canChangeDue = canPerformAction('CHANGE_DUE', card);
  const canChangeLabels = canPerformAction('CHANGE_LABELS', card);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      // Close modal with Escape
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Save with Ctrl+S
      if (e.ctrlKey && e.key === 's' && canEdit) {
        e.preventDefault();
        handleSave();
      }
      
      // Delete with Ctrl+Delete
      if (e.ctrlKey && e.key === 'Delete' && canDelete) {
        e.preventDefault();
        handleDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canEdit, canDelete, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-modal="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  formData.priority === 'urgent' ? 'bg-red-500' :
                  formData.priority === 'high' ? 'bg-orange-500' :
                  formData.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {formData.priority} priority
                </span>
              </div>
              {formData.dueDate && (
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span className={`${
                    new Date(formData.dueDate) < new Date() ? 'text-red-500' :
                    new Date(formData.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? 'text-orange-500' :
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {new Date(formData.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  title="Save (Ctrl+S)"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  title="Delete (Ctrl+Delete)"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                data-close="true"
                aria-label="Close modal"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-80px)]">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Card Title - Trello-like */}
              <div className="mb-4">
                <textarea
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  disabled={!canEdit}
                  className="w-full text-xl font-semibold bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded px-2 py-1 text-gray-900 dark:text-white disabled:opacity-50"
                  placeholder="Card title"
                  rows={1}
                  style={{ minHeight: '32px' }}
                />
              </div>

              {/* Quick Actions - Trello-like */}
              <div className="flex flex-wrap gap-2 mb-6">
                {canAssign && (
                  <button
                    onClick={() => setActiveTab('assignees')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <User className="w-4 h-4" />
                    Members
                  </button>
                )}
                
                {canChangeLabels && (
                  <button
                    onClick={() => setActiveTab('labels')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Tag className="w-4 h-4" />
                    Labels
                  </button>
                )}
                
                {canChangeDue && (
                  <button
                    onClick={() => setActiveTab('due')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </button>
                )}
                
                <button
                  onClick={() => setActiveTab('attachments')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <Paperclip className="w-4 h-4" />
                  Attachments
                </button>
                
                <button
                  onClick={() => setActiveTab('checklist')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  Checklist
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                {['details', 'assignees', 'labels', 'due', 'attachments', 'checklist', 'comments', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      disabled={!canEdit}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="Add a more detailed description..."
                    />
                  </div>

                  {/* Assignees */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assignees
                    </label>
                    <div className="space-y-2">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.assignees.includes(user.id)}
                            onChange={(e) => handleMultiSelectChange('assignees', user.id, e.target.checked)}
                            disabled={!canEdit}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {user.name || user.email}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Labels */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => (
                        <label key={label.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.labels.some(l => l.id === label.id)}
                            onChange={(e) => handleMultiSelectChange('labels', label.id, e.target.checked)}
                            disabled={!canEdit}
                            className="mr-2"
                          />
                          <span 
                            className="px-2 py-1 text-xs rounded-full text-white"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Checklists */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Checklist
                    </label>
                    <div className="space-y-2">
                      {formData.checklists.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(item.id)}
                            disabled={!canEdit}
                            className="mr-2"
                          />
                          <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {item.text}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => removeChecklistItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newChecklistItem}
                            onChange={(e) => setNewChecklistItem(e.target.value)}
                            placeholder="Add checklist item"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                          />
                          <button
                            onClick={addChecklistItem}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Custom Fields
                    </label>
                    <div className="space-y-2">
                      {formData.customFields.map((field) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                            {field.name}:
                          </span>
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            {field.value}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => removeCustomField(field.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCustomField.name}
                            onChange={(e) => setNewCustomField(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Field name"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            value={newCustomField.value}
                            onChange={(e) => setNewCustomField(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="Field value"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={addCustomField}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attachments
                    </label>
                    <div className="space-y-2">
                      {formData.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                            {attachment.name}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => removeAttachment(attachment.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            Upload Files
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assignees' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Members</h3>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.assignees.includes(user.id)}
                          onChange={(e) => handleMultiSelectChange('assignees', user.id, e.target.checked)}
                          disabled={!canAssign}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {user.name || user.email}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'labels' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Labels</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {labels.map((label) => (
                      <label key={label.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.labels.includes(label.id)}
                          onChange={(e) => handleMultiSelectChange('labels', label.id, e.target.checked)}
                          disabled={!canChangeLabels}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: label.color || '#gray' }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {label.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'due' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Due Date</h3>
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                      disabled={!canChangeDue}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                    {formData.dueDate && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Due: {new Date(formData.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attachments</h3>
                  <div className="space-y-2">
                    {formData.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Paperclip className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Files
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'checklist' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Checklist</h3>
                  <div className="space-y-2">
                    {formData.checklists.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(item.id)}
                          disabled={!canEdit}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.text}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => removeChecklistItem(item.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                          placeholder="Add checklist item..."
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={addChecklistItem}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <CommentsSection
                  card={card}
                  onCommentAdd={handleCommentAdd}
                  onCommentUpdate={handleCommentUpdate}
                  onCommentDelete={handleCommentDelete}
                />
              )}

              {activeTab === 'activity' && (
                <ActivityLog card={card} />
              )}
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CardModal;