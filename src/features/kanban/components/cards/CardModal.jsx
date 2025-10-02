/**
 * CardModal Component - Trello-like Card Interface
 * Comprehensive card modal with Trello-style features and UX
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Upload,
  Archive,
  Copy,
  Move,
  Star,
  Eye,
  EyeOff,
  MoreHorizontal,
  CheckCircle,
  Circle,
  Image,
  FileText,
  Link,
  Zap,
  Filter,
  Search
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
    attachments: [],
    coverImage: null,
    isWatching: false,
    isArchived: false,
    isTemplate: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '' });
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  
  // Refs for auto-resize
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);

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
        attachments: card.attachments || [],
        coverImage: card.coverImage || null,
        isWatching: card.isWatching || false,
        isArchived: card.isArchived || false,
        isTemplate: card.isTemplate || false
      });
    }
  }, [card]);

  // Auto-resize textarea
  const autoResize = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  // Handle title editing
  const handleTitleEdit = () => {
    setIsTitleEditing(true);
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.focus();
        titleRef.current.select();
      }
    }, 0);
  };

  // Handle description editing
  const handleDescriptionEdit = () => {
    setIsDescriptionEditing(true);
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.focus();
      }
    }, 0);
  };

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
        if (isTitleEditing) {
          setIsTitleEditing(false);
          return;
        }
        if (isDescriptionEditing) {
          setIsDescriptionEditing(false);
          return;
        }
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

      // Enter to save title
      if (e.key === 'Enter' && isTitleEditing && !e.shiftKey) {
        e.preventDefault();
        setIsTitleEditing(false);
      }

      // Enter to save description (with Shift for new line)
      if (e.key === 'Enter' && isDescriptionEditing && !e.shiftKey) {
        e.preventDefault();
        setIsDescriptionEditing(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canEdit, canDelete, onClose, isTitleEditing, isDescriptionEditing]);

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
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Cover Image */}
          {formData.coverImage && (
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              <img 
                src={formData.coverImage} 
                alt="Card cover" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleFieldChange('coverImage', null)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
                title="Remove cover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {/* Priority Indicator */}
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

              {/* Due Date */}
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

              {/* Labels */}
              {formData.labels && formData.labels.length > 0 && (
                <div className="flex items-center gap-1">
                  {formData.labels.slice(0, 3).map((labelId) => {
                    const label = labels.find(l => l.id === labelId);
                    return label ? (
                      <span
                        key={labelId}
                        className="px-2 py-0.5 text-xs rounded text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    ) : null;
                  })}
                  {formData.labels.length > 3 && (
                    <span className="text-xs text-gray-500">+{formData.labels.length - 3}</span>
                  )}
                </div>
              )}

              {/* Assignees */}
              {formData.assignees && formData.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  {formData.assignees.slice(0, 3).map((userId) => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div
                        key={userId}
                        className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center"
                        title={user.name || user.email}
                      >
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                    ) : null;
                  })}
                  {formData.assignees.length > 3 && (
                    <span className="text-xs text-gray-500">+{formData.assignees.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Watch Button */}
              <button
                onClick={() => handleFieldChange('isWatching', !formData.isWatching)}
                className={`p-2 rounded-lg transition-colors ${
                  formData.isWatching 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title={formData.isWatching ? 'Stop watching' : 'Watch'}
              >
                {formData.isWatching ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Archive Button */}
              <button
                onClick={() => handleFieldChange('isArchived', !formData.isArchived)}
                className={`p-2 rounded-lg transition-colors ${
                  formData.isArchived 
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                title={formData.isArchived ? 'Unarchive' : 'Archive'}
              >
                <Archive className="w-4 h-4" />
              </button>

              {/* More Actions */}
              <div className="relative">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* Quick Actions Dropdown */}
                <AnimatePresence>
                  {showQuickActions && (
                    <motion.div
                      className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(formData.title);
                            setShowQuickActions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy title
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement move functionality
                            setShowQuickActions(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Move className="w-4 h-4" />
                          Move
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => {
                              handleDelete();
                              setShowQuickActions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
          <div className="flex h-[calc(95vh-120px)]">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Card Title - Trello-like */}
              <div className="mb-6">
                {isTitleEditing ? (
                  <textarea
                    ref={titleRef}
                    value={formData.title}
                    onChange={(e) => {
                      handleFieldChange('title', e.target.value);
                      autoResize(e.target);
                    }}
                    onBlur={() => setIsTitleEditing(false)}
                    className="w-full text-2xl font-bold bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded px-2 py-1 text-gray-900 dark:text-white"
                    placeholder="Card title"
                    rows={1}
                    style={{ minHeight: '40px' }}
                  />
                ) : (
                  <div
                    onClick={canEdit ? handleTitleEdit : undefined}
                    className={`text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors ${
                      canEdit ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'cursor-default'
                    }`}
                    title={canEdit ? "Click to edit title" : ""}
                  >
                    {formData.title || "Untitled Card"}
                  </div>
                )}
              </div>

              {/* Quick Actions - Trello-like */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {canAssign && (
                    <button
                      onClick={() => setActiveTab('assignees')}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      <User className="w-4 h-4" />
                      Members
                    </button>
                  )}
                  
                  {canChangeLabels && (
                    <button
                      onClick={() => setActiveTab('labels')}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      <Tag className="w-4 h-4" />
                      Labels
                    </button>
                  )}
                  
                  {canChangeDue && (
                    <button
                      onClick={() => setActiveTab('due')}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      Due Date
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveTab('attachments')}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attachments
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('checklist')}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Checklist
                  </button>

                  <button
                    onClick={() => setActiveTab('cover')}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <Image className="w-4 h-4" />
                    Cover
                  </button>
                </div>
              </div>

              {/* Description Section - Trello-like */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </h3>
                  {!isDescriptionEditing && canEdit && (
                    <button
                      onClick={handleDescriptionEdit}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {isDescriptionEditing ? (
                  <textarea
                    ref={descriptionRef}
                    value={formData.description}
                    onChange={(e) => {
                      handleFieldChange('description', e.target.value);
                      autoResize(e.target);
                    }}
                    onBlur={() => setIsDescriptionEditing(false)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Add a more detailed description..."
                    rows={3}
                    style={{ minHeight: '80px' }}
                  />
                ) : (
                  <div
                    onClick={canEdit ? handleDescriptionEdit : undefined}
                    className={`min-h-[80px] px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 ${
                      canEdit ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : 'cursor-default'
                    } transition-colors`}
                    title={canEdit ? "Click to edit description" : ""}
                  >
                    {formData.description ? (
                      <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {formData.description}
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 italic">
                        {canEdit ? "Click to add a description..." : "No description"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                {['details', 'assignees', 'labels', 'due', 'attachments', 'checklist', 'cover', 'comments', 'activity'].map((tab) => (
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
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleFieldChange('priority', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'assignees' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h3>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.assignees.includes(user.id)}
                          onChange={(e) => handleMultiSelectChange('assignees', user.id, e.target.checked)}
                          disabled={!canEdit}
                          className="mr-3"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || user.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'labels' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Labels</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {labels.map((label) => (
                      <label key={label.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.labels.includes(label.id)}
                          onChange={(e) => handleMultiSelectChange('labels', label.id, e.target.checked)}
                          disabled={!canEdit}
                          className="mr-2"
                        />
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {label.name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'due' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Due Date</h3>
                  <div>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                  {formData.dueDate && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Due: {new Date(formData.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'cover' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cover</h3>
                  <div className="space-y-4">
                    {/* Color Covers */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Covers</h4>
                      <div className="grid grid-cols-6 gap-2">
                        {['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91'].map((color) => (
                          <button
                            key={color}
                            onClick={() => handleFieldChange('coverImage', color)}
                            className={`w-12 h-8 rounded ${
                              formData.coverImage === color ? 'ring-2 ring-blue-500' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            title={`Set cover to ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Upload Cover */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Image</h4>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              handleFieldChange('coverImage', e.target.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Remove Cover */}
                    {formData.coverImage && (
                      <button
                        onClick={() => handleFieldChange('coverImage', null)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove Cover
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attachments</h3>
                  <div className="space-y-4">
                    {/* Upload Files */}
                    <div>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Attachments List */}
                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        {formData.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {attachment.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {(attachment.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAttachment(attachment.id)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'checklist' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Checklist</h3>
                  <div className="space-y-4">
                    {/* Add Checklist Item */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                        placeholder="Add checklist item..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={addChecklistItem}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {/* Checklist Items */}
                    {formData.checklists.length > 0 && (
                      <div className="space-y-2">
                        {formData.checklists.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                            <button
                              onClick={() => toggleChecklistItem(item.id)}
                              className="flex-shrink-0"
                            >
                              {item.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            <span className={`flex-1 text-sm ${
                              item.completed 
                                ? 'line-through text-gray-500 dark:text-gray-400' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {item.text}
                            </span>
                            <button
                              onClick={() => removeChecklistItem(item.id)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h3>
                  <CommentsSection
                    cardId={card?.id}
                    onAddComment={handleCommentAdd}
                    onUpdateComment={handleCommentUpdate}
                    onDeleteComment={handleCommentDelete}
                  />
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h3>
                  <ActivityLog cardId={card?.id} />
                </div>
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