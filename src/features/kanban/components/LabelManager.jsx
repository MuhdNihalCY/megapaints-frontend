/**
 * Label Manager Component
 * Allows users to create, edit, and delete custom labels
 */

import { useState } from 'react';
import { Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import { useKanban } from '../contexts/KanbanContext';
import toast from 'react-hot-toast';

const LabelManager = ({ isOpen, onClose, onLabelSelect }) => {
  const { labels, createLabel, updateLabel, deleteLabel } = useKanban();
  const [isCreating, setIsCreating] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6'
  });

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Label name is required');
      return;
    }

    try {
      await createLabel({
        name: formData.name.trim(),
        color: formData.color
      });
      
      setFormData({ name: '', color: '#3b82f6' });
      setIsCreating(false);
      toast.success('Label created successfully');
    } catch (error) {
      toast.error('Failed to create label');
    }
  };

  const handleUpdateLabel = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Label name is required');
      return;
    }

    try {
      await updateLabel(editingLabel.id, {
        name: formData.name.trim(),
        color: formData.color
      });
      
      setFormData({ name: '', color: '#3b82f6' });
      setEditingLabel(null);
      toast.success('Label updated successfully');
    } catch (error) {
      toast.error('Failed to update label');
    }
  };

  const handleDeleteLabel = async (labelId) => {
    if (!confirm('Are you sure you want to delete this label?')) {
      return;
    }

    try {
      await deleteLabel(labelId);
      toast.success('Label deleted successfully');
    } catch (error) {
      toast.error('Failed to delete label');
    }
  };

  const startEditing = (label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color
    });
  };

  const cancelEditing = () => {
    setEditingLabel(null);
    setFormData({ name: '', color: '#3b82f6' });
  };

  const handleLabelClick = (label) => {
    if (onLabelSelect) {
      onLabelSelect(label);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-neutral-900/90 via-gray-900/80 to-neutral-800/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Labels
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Label */}
          {!isCreating && !editingLabel && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus size={16} />
              <span>Create New Label</span>
            </button>
          )}

          {/* Create/Edit Form */}
          {(isCreating || editingLabel) && (
            <form onSubmit={editingLabel ? handleUpdateLabel : handleCreateLabel} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Label Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter label name"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>{editingLabel ? 'Update' : 'Create'}</span>
                </button>
                <button
                  type="button"
                  onClick={editingLabel ? cancelEditing : () => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Labels List */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Existing Labels</h3>
            {labels.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No labels created yet
              </p>
            ) : (
              labels.map((label) => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => handleLabelClick(label)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {label.name}
                    </span>
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => startEditing(label)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Edit label"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete label"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelManager;
