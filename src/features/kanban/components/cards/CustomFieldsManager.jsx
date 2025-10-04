/**
 * CustomFieldsManager Component
 * Manage custom fields on Trello-style cards
 */

import React, { useState } from 'react';
import { Hash, ChevronDown, Check, X, Calendar, Type, Hash as HashIcon, ToggleLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CUSTOM_FIELD_TYPES,
  formatCustomFieldValue,
  getCustomFieldValue,
  validateCustomFieldValue
} from '../../types/customFields';

const CustomFieldsManager = ({ card, customFieldDefinitions = [], onUpdate, currentUser }) => {
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');

  // Filter enabled fields
  const enabledFields = customFieldDefinitions.filter(def => def.enabled);

  if (enabledFields.length === 0) {
    return null;
  }

  // Handle start editing
  const handleStartEdit = (fieldDef) => {
    const currentValue = getCustomFieldValue(card, fieldDef.id);
    setEditingFieldId(fieldDef.id);
    
    if (fieldDef.type === CUSTOM_FIELD_TYPES.CHECKBOX) {
      // Checkbox toggles immediately
      handleSave(fieldDef, !currentValue);
      return;
    }
    
    setEditValue(currentValue !== null ? currentValue : '');
    setError('');
  };

  // Handle save
  const handleSave = (fieldDef, value = editValue) => {
    // Validate
    const validation = validateCustomFieldValue(fieldDef, value);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Update card
    onUpdate(fieldDef.id, value);
    
    // Reset state
    setEditingFieldId(null);
    setEditValue('');
    setError('');
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingFieldId(null);
    setEditValue('');
    setError('');
  };

  // Render field input based on type
  const renderFieldInput = (fieldDef) => {
    const { type, options } = fieldDef;

    switch (type) {
      case CUSTOM_FIELD_TYPES.TEXT:
        return options.multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave(fieldDef);
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            placeholder={options.placeholder}
            maxLength={options.maxLength}
            className="w-full px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
            rows={3}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave(fieldDef);
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            placeholder={options.placeholder}
            maxLength={options.maxLength}
            className="w-full px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            autoFocus
          />
        );

      case CUSTOM_FIELD_TYPES.NUMBER:
        return (
          <div className="flex items-center gap-2">
            {options.prefix && <span className="text-sm text-gray-600 dark:text-gray-400">{options.prefix}</span>}
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave(fieldDef);
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              placeholder={options.placeholder}
              min={options.min}
              max={options.max}
              step={options.step}
              className="flex-1 px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              autoFocus
            />
            {options.suffix && <span className="text-sm text-gray-600 dark:text-gray-400">{options.suffix}</span>}
          </div>
        );

      case CUSTOM_FIELD_TYPES.DATE:
        return (
          <input
            type={options.includeTime ? 'datetime-local' : 'date'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave(fieldDef);
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            min={options.minDate}
            max={options.maxDate}
            className="w-full px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            autoFocus
          />
        );

      case CUSTOM_FIELD_TYPES.DROPDOWN:
        return (
          <select
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              handleSave(fieldDef, e.target.value);
            }}
            className="w-full px-3 py-2 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            autoFocus
          >
            <option value="">Select...</option>
            {options.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  // Get icon for field type
  const getFieldIcon = (type) => {
    switch (type) {
      case CUSTOM_FIELD_TYPES.TEXT:
        return <Type className="w-4 h-4" />;
      case CUSTOM_FIELD_TYPES.NUMBER:
        return <HashIcon className="w-4 h-4" />;
      case CUSTOM_FIELD_TYPES.DATE:
        return <Calendar className="w-4 h-4" />;
      case CUSTOM_FIELD_TYPES.CHECKBOX:
        return <ToggleLeft className="w-4 h-4" />;
      case CUSTOM_FIELD_TYPES.DROPDOWN:
        return <ChevronDown className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Hash className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Custom Fields</h3>
      </div>

      <div className="space-y-3">
        {enabledFields.map(fieldDef => {
          const currentValue = getCustomFieldValue(card, fieldDef.id);
          const isEditing = editingFieldId === fieldDef.id;
          const displayValue = formatCustomFieldValue(fieldDef, currentValue);

          return (
            <div key={fieldDef.id} className="group">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getFieldIcon(fieldDef.type)}
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {fieldDef.name}
                  </label>
                </div>
              </div>

              {isEditing && fieldDef.type !== CUSTOM_FIELD_TYPES.CHECKBOX ? (
                <div className="space-y-2">
                  {renderFieldInput(fieldDef)}
                  
                  {error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  )}

                  {fieldDef.type !== CUSTOM_FIELD_TYPES.DROPDOWN && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(fieldDef)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleStartEdit(fieldDef)}
                  className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-colors group-hover:border-gray-400 dark:group-hover:border-gray-500"
                  style={
                    fieldDef.type === CUSTOM_FIELD_TYPES.DROPDOWN && currentValue
                      ? {
                          borderLeftWidth: '4px',
                          borderLeftColor: fieldDef.options.options.find(opt => opt.value === currentValue)?.color || 'transparent'
                        }
                      : {}
                  }
                >
                  {displayValue}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomFieldsManager;

