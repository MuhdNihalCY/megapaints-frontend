/**
 * Card Modal Component
 * Modal for creating and editing cards
 */

import { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Paperclip, Send, Edit3, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useKanban } from '../contexts/KanbanContext';
import { useDueDateStatus, usePriorityDisplay, useLabelsDisplay } from '../hooks/useKanban';
import { CARD_PRIORITIES, CARD_LABELS, COLUMN_TYPES } from '../utils/constants';

/**
 * Card Modal Component
 */
const CardModal = ({ isOpen, card, mode, onClose }) => {
  const { createCard, updateCard, addComment, users, canEditCard, canAssignUsers, canChangeDue, canChangeLabels } = useKanban();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  // Watch form values
  const watchedValues = watch();

  // Get display information
  const dueDateStatus = useDueDateStatus(watchedValues.dueDate);
  const priorityInfo = usePriorityDisplay(watchedValues.priority);
  const labelInfo = useLabelsDisplay(watchedValues.labels);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        reset({
          title: '',
          description: '',
          priority: CARD_PRIORITIES.MEDIUM,
          labels: [],
          assignees: [],
          dueDate: '',
          columnId: COLUMN_TYPES.SALES
        });
        setIsEditing(true);
      } else {
        reset({
          title: card?.title || '',
          description: card?.description || '',
          priority: card?.priority || CARD_PRIORITIES.MEDIUM,
          labels: card?.labels || [],
          assignees: card?.assignees || [],
          dueDate: card?.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '',
          columnId: card?.columnId || COLUMN_TYPES.SALES
        });
        setIsEditing(false);
      }
    }
  }, [isOpen, mode, card, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    if (!data.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createCard({
          ...data,
          columnId: data.columnId
        });
        toast.success('Card created successfully');
      } else {
        await updateCard(card.id, data);
        toast.success('Card updated successfully');
        setIsEditing(false);
      }
      onClose();
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error(error.message || 'Error saving card');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment(card.id, newComment);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error adding comment');
    }
  };

  // Handle label toggle
  const handleLabelToggle = (labelId) => {
    if (!canChangeLabels) return;
    
    const currentLabels = watchedValues.labels || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    
    setValue('labels', newLabels);
  };

  // Handle assignee toggle
  const handleAssigneeToggle = (userId) => {
    if (!canAssignUsers) return;
    
    const currentAssignees = watchedValues.assignees || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];
    
    setValue('assignees', newAssignees);
  };

  if (!isOpen) return null;

  const canEdit = mode === 'create' || (card && canEditCard(card));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Card' : card?.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="Enter card title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="Enter card description"
                  />
                </div>

                {/* Column Selection (Create mode only) */}
                {mode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Column
                    </label>
                    <select
                      {...register('columnId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={COLUMN_TYPES.SALES}>Sales</option>
                      <option value={COLUMN_TYPES.OFFICE}>Office</option>
                    </select>
                  </div>
                )}

                {/* Comments Section */}
                {mode !== 'create' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
                    
                    {/* Comments List */}
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {card?.comments?.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {comment.authorName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    <form onSubmit={handleCommentSubmit} className="flex space-x-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    {...register('priority')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    {Object.entries(CARD_PRIORITIES).map(([key, value]) => (
                      <option key={key} value={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    disabled={!isEditing || !canChangeDue}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                  {watchedValues.dueDate && (
                    <p className={`mt-1 text-xs ${dueDateStatus.color}`}>
                      {dueDateStatus.label}
                    </p>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labels
                  </label>
                  <div className="space-y-2">
                    {Object.values(CARD_LABELS).map((label) => (
                      <label key={label.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={watchedValues.labels?.includes(label.id) || false}
                          onChange={() => handleLabelToggle(label.id)}
                          disabled={!isEditing || !canChangeLabels}
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

                {/* Assignees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignees
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={watchedValues.assignees?.includes(user.id) || false}
                          onChange={() => handleAssigneeToggle(user.id)}
                          disabled={!isEditing || !canAssignUsers}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {user.name || user.username}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {mode !== 'create' && canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800"
              >
                <Edit3 size={16} />
                <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Card' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;

