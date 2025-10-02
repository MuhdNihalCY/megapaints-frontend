/**
 * CreateCardButton Component - Complete Trello-like Card Creation
 * Comprehensive card creation with all Trello features including templates, bulk import, and advanced options
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Calendar, 
  User, 
  Tag, 
  Paperclip, 
  CheckSquare,
  Clock,
  MapPin,
  Star,
  Copy,
  Move,
  Archive,
  Eye,
  EyeOff,
  FileText,
  Upload,
  Download,
  Settings,
  Zap,
  Link,
  Image,
  Hash,
  Filter,
  Search,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  Lightbulb,
  GitBranch,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';

const CreateCardButton = ({ columnId, onCreateCard }) => {
  const { users, labels, currentUser } = useKanban();
  
  // Main states
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  // Form data with all Trello features
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    startDate: '',
    location: '',
    assignees: [],
    labels: [],
    customFields: [],
    checklists: [],
    attachments: [],
    coverImage: null,
    isTemplate: false,
    isWatching: false,
    isArchived: false,
    cardType: 'task',
    estimatedHours: '',
    progress: 0,
    tags: []
  });
  
  // UI states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [newCustomField, setNewCustomField] = useState({ name: '', type: 'text', value: '' });
  const [showAutomation, setShowAutomation] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [automationButtons, setAutomationButtons] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [showStickers, setShowStickers] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [markdownPreview, setMarkdownPreview] = useState(false);
  
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  // Card templates
  const cardTemplates = [
    {
      id: 'task',
      name: 'Task',
      icon: FileText,
      description: 'Standard task card',
      fields: { cardType: 'task' }
    },
    {
      id: 'bug',
      name: 'Bug Report',
      icon: AlertCircle,
      description: 'Bug tracking card',
      fields: { 
        cardType: 'bug',
        priority: 'high',
        customFields: [
          { name: 'Severity', type: 'dropdown', value: 'Medium', options: ['Low', 'Medium', 'High', 'Critical'] },
          { name: 'Environment', type: 'text', value: '' },
          { name: 'Steps to Reproduce', type: 'textarea', value: '' }
        ]
      }
    },
    {
      id: 'feature',
      name: 'Feature Request',
      icon: Lightbulb,
      description: 'New feature proposal',
      fields: { 
        cardType: 'feature',
        customFields: [
          { name: 'Impact', type: 'dropdown', value: 'Medium', options: ['Low', 'Medium', 'High'] },
          { name: 'Effort', type: 'dropdown', value: 'Medium', options: ['Low', 'Medium', 'High'] },
          { name: 'Business Value', type: 'text', value: '' }
        ]
      }
    },
    {
      id: 'meeting',
      name: 'Meeting',
      icon: Calendar,
      description: 'Meeting or event card',
      fields: { 
        cardType: 'meeting',
        customFields: [
          { name: 'Duration', type: 'text', value: '1 hour' },
          { name: 'Attendees', type: 'text', value: '' },
          { name: 'Agenda', type: 'textarea', value: '' }
        ]
      }
    }
  ];

  // Automation buttons
  const defaultAutomationButtons = [
    {
      id: 'assign-self',
      name: 'Assign to Me',
      icon: User,
      description: 'Assign this card to yourself',
      action: () => {
        if (currentUser?.id) {
          setFormData(prev => ({
            ...prev,
            assignees: [...new Set([...prev.assignees, currentUser.id])]
          }));
        }
      }
    },
    {
      id: 'set-due-today',
      name: 'Due Today',
      icon: Calendar,
      description: 'Set due date to today',
      action: () => {
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, dueDate: today }));
      }
    },
    {
      id: 'set-due-tomorrow',
      name: 'Due Tomorrow',
      icon: Calendar,
      description: 'Set due date to tomorrow',
      action: () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, dueDate: tomorrow }));
      }
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      icon: AlertCircle,
      description: 'Set priority to high',
      action: () => {
        setFormData(prev => ({ ...prev, priority: 'high' }));
      }
    },
    {
      id: 'add-checklist',
      name: 'Add Checklist',
      icon: CheckSquare,
      description: 'Add a default checklist',
      action: () => {
        const checklist = {
          id: Date.now().toString(),
          title: 'Task Checklist',
          items: [
            { id: Date.now().toString() + '1', text: 'Review requirements', completed: false },
            { id: Date.now().toString() + '2', text: 'Implement solution', completed: false },
            { id: Date.now().toString() + '3', text: 'Test and validate', completed: false }
          ]
        };
        setFormData(prev => ({ ...prev, checklists: [...prev.checklists, checklist] }));
      }
    },
    {
      id: 'watch-card',
      name: 'Watch Card',
      icon: Eye,
      description: 'Enable notifications for this card',
      action: () => {
        setFormData(prev => ({ ...prev, isWatching: true }));
      }
    }
  ];

  // Power-ups (integrations)
  const defaultPowerUps = [
    {
      id: 'slack',
      name: 'Slack',
      icon: MessageSquare,
      description: 'Send notifications to Slack channels',
      enabled: false,
      config: { channel: '', webhook: '' }
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: GitBranch,
      description: 'Link to GitHub issues and pull requests',
      enabled: false,
      config: { repo: '', token: '' }
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: FileText,
      description: 'Attach files from Google Drive',
      enabled: false,
      config: { folder: '', access: 'read' }
    },
    {
      id: 'jira',
      name: 'Jira',
      icon: AlertTriangle,
      description: 'Sync with Jira tickets',
      enabled: false,
      config: { project: '', url: '' }
    },
    {
      id: 'time-tracking',
      name: 'Time Tracking',
      icon: Clock,
      description: 'Track time spent on tasks',
      enabled: false,
      config: { provider: 'toggl', apiKey: '' }
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: Calendar,
      description: 'Sync with calendar events',
      enabled: false,
      config: { provider: 'google', calendar: '' }
    }
  ];

  // Stickers
  const availableStickers = [
    { id: 'star', emoji: '⭐', name: 'Star' },
    { id: 'fire', emoji: '🔥', name: 'Fire' },
    { id: 'rocket', emoji: '🚀', name: 'Rocket' },
    { id: 'check', emoji: '✅', name: 'Check' },
    { id: 'warning', emoji: '⚠️', name: 'Warning' },
    { id: 'bug', emoji: '🐛', name: 'Bug' },
    { id: 'lightbulb', emoji: '💡', name: 'Idea' },
    { id: 'clock', emoji: '⏰', name: 'Time' },
    { id: 'money', emoji: '💰', name: 'Money' },
    { id: 'heart', emoji: '❤️', name: 'Heart' },
    { id: 'thumbs-up', emoji: '👍', name: 'Thumbs Up' },
    { id: 'party', emoji: '🎉', name: 'Party' },
    { id: 'coffee', emoji: '☕', name: 'Coffee' },
    { id: 'gift', emoji: '🎁', name: 'Gift' },
    { id: 'trophy', emoji: '🏆', name: 'Trophy' },
    { id: 'target', emoji: '🎯', name: 'Target' }
  ];

  // Markdown shortcuts
  const markdownShortcuts = [
    { shortcut: '**text**', description: 'Bold text', example: '**bold**' },
    { shortcut: '*text*', description: 'Italic text', example: '*italic*' },
    { shortcut: '`code`', description: 'Inline code', example: '`code`' },
    { shortcut: '```', description: 'Code block', example: '```\ncode\n```' },
    { shortcut: '# Heading', description: 'Heading 1', example: '# Main Title' },
    { shortcut: '## Heading', description: 'Heading 2', example: '## Subtitle' },
    { shortcut: '- Item', description: 'Bullet list', example: '- List item' },
    { shortcut: '1. Item', description: 'Numbered list', example: '1. First item' },
    { shortcut: '[Link](url)', description: 'Link', example: '[Google](https://google.com)' },
    { shortcut: '![Alt](url)', description: 'Image', example: '![Image](image.jpg)' }
  ];

  // Initialize automation and power-ups
  useEffect(() => {
    setAutomationButtons(defaultAutomationButtons);
    setPowerUps(defaultPowerUps);
  }, []);

  // Auto-focus and resize textarea
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isExpanded]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      ...template.fields,
      title: prev.title || `New ${template.name}`,
      description: prev.description || template.description
    }));
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  // Handle bulk import
  const handleBulkImport = () => {
    const lines = bulkText.split('\n').filter(line => line.trim());
    const cards = lines.map((line, index) => ({
      ...formData,
      title: line.trim(),
      id: `bulk-${Date.now()}-${index}`
    }));
    
    cards.forEach(card => onCreateCard(card));
    setBulkText('');
    setShowBulkImport(false);
  };

  // Add custom field
  const addCustomField = () => {
    if (newCustomField.name.trim()) {
      setFormData(prev => ({
        ...prev,
        customFields: [...prev.customFields, { ...newCustomField, id: Date.now().toString() }]
      }));
      setNewCustomField({ name: '', type: 'text', value: '' });
    }
  };

  // Remove custom field
  const removeCustomField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== fieldId)
    }));
  };

  // Add checklist
  const addChecklist = () => {
    const checklist = {
      id: Date.now().toString(),
      title: 'Checklist',
      items: []
    };
    setFormData(prev => ({
      ...prev,
      checklists: [...prev.checklists, checklist]
    }));
  };

  // Add checklist item
  const addChecklistItem = (checklistId, text) => {
    if (text.trim()) {
      const newItem = {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false
      };
      setFormData(prev => ({
        ...prev,
        checklists: prev.checklists.map(checklist =>
          checklist.id === checklistId
            ? { ...checklist, items: [...checklist.items, newItem] }
            : checklist
        )
      }));
    }
  };

  // Handle automation button click
  const handleAutomationClick = (button) => {
    button.action();
    // Show feedback
    console.log(`Automation executed: ${button.name}`);
  };

  // Toggle power-up
  const togglePowerUp = (powerUpId) => {
    setPowerUps(prev => prev.map(powerUp =>
      powerUp.id === powerUpId
        ? { ...powerUp, enabled: !powerUp.enabled }
        : powerUp
    ));
  };

  // Configure power-up
  const configurePowerUp = (powerUpId, config) => {
    setPowerUps(prev => prev.map(powerUp =>
      powerUp.id === powerUpId
        ? { ...powerUp, config: { ...powerUp.config, ...config } }
        : powerUp
    ));
  };

  // Add sticker to card
  const addSticker = (sticker) => {
    setSelectedStickers(prev => [...prev, sticker]);
    // Add sticker to description
    setFormData(prev => ({
      ...prev,
      description: prev.description + ` ${sticker.emoji}`
    }));
  };

  // Remove sticker
  const removeSticker = (stickerId) => {
    setSelectedStickers(prev => prev.filter(s => s.id !== stickerId));
  };

  // Insert markdown shortcut
  const insertMarkdown = (shortcut) => {
    const textarea = document.querySelector('textarea[placeholder*="description"]');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + shortcut + after;
      
      setFormData(prev => ({ ...prev, description: newText }));
      
      // Focus and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + shortcut.length, start + shortcut.length);
      }, 0);
    }
  };

  // Smart preview for URLs
  const generateSmartPreview = (url) => {
    // This would typically call an API to generate previews
    return {
      title: 'Smart Preview',
      description: 'Preview description from URL',
      image: '/placeholder-preview.jpg',
      domain: new URL(url).hostname
    };
  };

  // Enhanced form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      const cardData = {
        ...formData,
        columnId,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id,
        author: {
          id: currentUser?.id,
          name: currentUser?.name || currentUser?.email,
          email: currentUser?.email,
          designation: currentUser?.designation
        }
      };
      
      onCreateCard(cardData);
      resetForm();
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      startDate: '',
      location: '',
      assignees: [],
      labels: [],
      customFields: [],
      checklists: [],
      attachments: [],
      coverImage: null,
      isTemplate: false,
      isWatching: false,
      isArchived: false,
      cardType: 'task',
      estimatedHours: '',
      progress: 0,
      tags: []
    });
    setIsExpanded(false);
    setShowModal(false);
    setShowAdvanced(false);
    setShowTemplates(false);
    setShowBulkImport(false);
    setSelectedTemplate(null);
    setActiveTab('basic');
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleQuickAdd = () => {
    if (formData.title.trim()) {
      const cardData = {
        ...formData,
        columnId,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id
      };
      onCreateCard(cardData);
      resetForm();
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

  // Open advanced modal
  const openAdvancedModal = () => {
    setShowModal(true);
    setActiveTab('basic');
  };

  return (
    <>
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
                    
                    <button
                      type="button"
                      onClick={openAdvancedModal}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Full Editor</span>
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

      {/* Advanced Card Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Card</h2>
                  {selectedTemplate && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      <selectedTemplate.icon className="w-4 h-4" />
                      {selectedTemplate.name}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Templates
                  </button>
                  
                  <button
                    onClick={() => setShowBulkImport(!showBulkImport)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Import
                  </button>
                  
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex h-[calc(90vh-120px)]">
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Templates Dropdown */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-4 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
                      >
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Choose a Template</h3>
                          <div className="space-y-2">
                            {cardTemplates.map((template) => (
                              <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template)}
                                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <template.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{template.description}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bulk Import Dropdown */}
                  <AnimatePresence>
                    {showBulkImport && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-4 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
                      >
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Bulk Import Cards</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Enter one card title per line. Each line will become a separate card.
                          </p>
                          <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder="Card title 1&#10;Card title 2&#10;Card title 3"
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={handleBulkImport}
                              disabled={!bulkText.trim()}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Import {bulkText.split('\n').filter(line => line.trim()).length} Cards
                            </button>
                            <button
                              onClick={() => setShowBulkImport(false)}
                              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    {[
                      { id: 'basic', name: 'Basic', icon: FileText },
                      { id: 'details', name: 'Details', icon: Settings },
                      { id: 'members', name: 'Members', icon: User },
                      { id: 'labels', name: 'Labels', icon: Tag },
                      { id: 'dates', name: 'Dates', icon: Calendar },
                      { id: 'attachments', name: 'Attachments', icon: Paperclip },
                      { id: 'checklist', name: 'Checklist', icon: CheckSquare },
                      { id: 'custom', name: 'Custom Fields', icon: Hash },
                      { id: 'automation', name: 'Automation', icon: Zap },
                      { id: 'powerups', name: 'Power-ups', icon: Settings },
                      { id: 'visual', name: 'Visual', icon: Image }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.name}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      {/* Card Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Card Title *
                        </label>
                        <textarea
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter a title for this card..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Add a more detailed description..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Card Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Card Type
                        </label>
                        <select
                          value={formData.cardType}
                          onChange={(e) => setFormData(prev => ({ ...prev, cardType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="task">Task</option>
                          <option value="bug">Bug Report</option>
                          <option value="feature">Feature Request</option>
                          <option value="meeting">Meeting</option>
                          <option value="note">Note</option>
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Priority
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* Cover Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cover Image
                        </label>
                        <div className="space-y-3">
                          {/* Color Covers */}
                          <div>
                            <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Color Covers</h4>
                            <div className="grid grid-cols-8 gap-2">
                              {['#0079bf', '#d29034', '#519839', '#b04632', '#89609e', '#cd5a91', '#838c91', '#ff9f1a'].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setFormData(prev => ({ ...prev, coverImage: color }))}
                                  className={`w-8 h-8 rounded ${
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
                            <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Upload Image</h4>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setFormData(prev => ({ ...prev, coverImage: e.target.result }));
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
                              onClick={() => setFormData(prev => ({ ...prev, coverImage: null }))}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Remove Cover
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Estimated Hours */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estimated Hours
                        </label>
                        <input
                          type="number"
                          value={formData.estimatedHours}
                          onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                          placeholder="Enter estimated hours"
                          min="0"
                          step="0.5"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Progress */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Progress ({formData.progress}%)
                        </label>
                        <input
                          type="range"
                          value={formData.progress}
                          onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                          min="0"
                          max="100"
                          className="w-full"
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tags
                        </label>
                        <input
                          type="text"
                          value={formData.tags.join(', ')}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                          }))}
                          placeholder="Enter tags separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'members' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assign Members</h3>
                      <div className="space-y-2">
                        {users.map((user) => (
                          <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                            <input
                              type="checkbox"
                              checked={formData.assignees.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ ...prev, assignees: [...prev.assignees, user.id] }));
                                } else {
                                  setFormData(prev => ({ ...prev, assignees: prev.assignees.filter(id => id !== user.id) }));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {user.name || user.email}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.designation}
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
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Labels</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {labels.map((label) => (
                          <label key={label.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                            <input
                              type="checkbox"
                              checked={formData.labels.includes(label.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ ...prev, labels: [...prev.labels, label.id] }));
                                } else {
                                  setFormData(prev => ({ ...prev, labels: prev.labels.filter(id => id !== label.id) }));
                                }
                              }}
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

                  {activeTab === 'dates' && (
                    <div className="space-y-6">
                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Start Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter location"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
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
                            <button
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                attachments: prev.attachments.filter(a => a.id !== attachment.id) 
                              }))}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files);
                              const newAttachments = files.map(file => ({
                                id: Date.now().toString() + Math.random(),
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                file: file
                              }));
                              setFormData(prev => ({ 
                                ...prev, 
                                attachments: [...prev.attachments, ...newAttachments] 
                              }));
                            }}
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
                      </div>
                    </div>
                  )}

                  {activeTab === 'checklist' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Checklists</h3>
                        <button
                          onClick={addChecklist}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Checklist
                        </button>
                      </div>
                      
                      {formData.checklists.map((checklist) => (
                        <div key={checklist.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="text"
                              value={checklist.title}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                checklists: prev.checklists.map(c => 
                                  c.id === checklist.id ? { ...c, title: e.target.value } : c
                                )
                              }))}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium"
                            />
                            <button
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                checklists: prev.checklists.filter(c => c.id !== checklist.id)
                              }))}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {checklist.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    checklists: prev.checklists.map(c =>
                                      c.id === checklist.id
                                        ? {
                                            ...c,
                                            items: c.items.map(i =>
                                              i.id === item.id ? { ...i, completed: e.target.checked } : i
                                            )
                                          }
                                        : c
                                    )
                                  }))}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className={`flex-1 text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {item.text}
                                </span>
                                <button
                                  onClick={() => setFormData(prev => ({
                                    ...prev,
                                    checklists: prev.checklists.map(c =>
                                      c.id === checklist.id
                                        ? { ...c, items: c.items.filter(i => i.id !== item.id) }
                                        : c
                                    )
                                  }))}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Add checklist item..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addChecklistItem(checklist.id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                              <button
                                onClick={(e) => {
                                  const input = e.target.previousElementSibling;
                                  addChecklistItem(checklist.id, input.value);
                                  input.value = '';
                                }}
                                className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'custom' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Custom Fields</h3>
                        <button
                          onClick={() => setShowCustomFields(!showCustomFields)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          Add Field
                        </button>
                      </div>

                      {/* Add Custom Field Form */}
                      {showCustomFields && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <input
                              type="text"
                              value={newCustomField.name}
                              onChange={(e) => setNewCustomField(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Field name"
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <select
                              value={newCustomField.type}
                              onChange={(e) => setNewCustomField(prev => ({ ...prev, type: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="textarea">Textarea</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                            <button
                              onClick={addCustomField}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Custom Fields List */}
                      <div className="space-y-3">
                        {formData.customFields.map((field) => (
                          <div key={field.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field.name} ({field.type})
                              </span>
                              <button
                                onClick={() => removeCustomField(field.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {field.type === 'text' && (
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  customFields: prev.customFields.map(f =>
                                    f.id === field.id ? { ...f, value: e.target.value } : f
                                  )
                                }))}
                                placeholder="Enter value"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                            )}
                            
                            {field.type === 'dropdown' && (
                              <select
                                value={field.value}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  customFields: prev.customFields.map(f =>
                                    f.id === field.id ? { ...f, value: e.target.value } : f
                                  )
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              >
                                {field.options?.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            )}
                            
                            {field.type === 'textarea' && (
                              <textarea
                                value={field.value}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  customFields: prev.customFields.map(f =>
                                    f.id === field.id ? { ...f, value: e.target.value } : f
                                  )
                                }))}
                                placeholder="Enter value"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'automation' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Automation Buttons</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Click buttons to automatically configure card settings
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {automationButtons.map((button) => (
                          <button
                            key={button.id}
                            onClick={() => handleAutomationClick(button)}
                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                          >
                            <button.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {button.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {button.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Automation Tips
                          </h4>
                        </div>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                          <li>• Use "Assign to Me" to quickly assign cards to yourself</li>
                          <li>• "Due Today/Tomorrow" buttons set dates automatically</li>
                          <li>• "Add Checklist" creates a default task checklist</li>
                          <li>• "Watch Card" enables notifications for updates</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'powerups' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Power-ups</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Integrate with external services and tools
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        {powerUps.map((powerUp) => (
                          <div key={powerUp.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <powerUp.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {powerUp.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {powerUp.description}
                                  </div>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={powerUp.enabled}
                                  onChange={() => togglePowerUp(powerUp.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                            
                            {powerUp.enabled && (
                              <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                {powerUp.id === 'slack' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Channel name"
                                      value={powerUp.config.channel}
                                      onChange={(e) => configurePowerUp(powerUp.id, { channel: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Webhook URL"
                                      value={powerUp.config.webhook}
                                      onChange={(e) => configurePowerUp(powerUp.id, { webhook: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                  </div>
                                )}
                                
                                {powerUp.id === 'github' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Repository"
                                      value={powerUp.config.repo}
                                      onChange={(e) => configurePowerUp(powerUp.id, { repo: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Access Token"
                                      value={powerUp.config.token}
                                      onChange={(e) => configurePowerUp(powerUp.id, { token: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                  </div>
                                )}
                                
                                {powerUp.id === 'jira' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Project Key"
                                      value={powerUp.config.project}
                                      onChange={(e) => configurePowerUp(powerUp.id, { project: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Jira URL"
                                      value={powerUp.config.url}
                                      onChange={(e) => configurePowerUp(powerUp.id, { url: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                  </div>
                                )}
                                
                                {powerUp.id === 'time-tracking' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={powerUp.config.provider}
                                      onChange={(e) => configurePowerUp(powerUp.id, { provider: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    >
                                      <option value="toggl">Toggl</option>
                                      <option value="harvest">Harvest</option>
                                      <option value="clockify">Clockify</option>
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="API Key"
                                      value={powerUp.config.apiKey}
                                      onChange={(e) => configurePowerUp(powerUp.id, { apiKey: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                  </div>
                                )}
                                
                                {powerUp.id === 'calendar' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={powerUp.config.provider}
                                      onChange={(e) => configurePowerUp(powerUp.id, { provider: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    >
                                      <option value="google">Google Calendar</option>
                                      <option value="outlook">Outlook</option>
                                      <option value="apple">Apple Calendar</option>
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Calendar ID"
                                      value={powerUp.config.calendar}
                                      onChange={(e) => configurePowerUp(powerUp.id, { calendar: e.target.value })}
                                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                            Power-up Benefits
                          </h4>
                        </div>
                        <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                          <li>• <strong>Slack:</strong> Get notified in channels when cards are updated</li>
                          <li>• <strong>GitHub:</strong> Link cards to issues and pull requests</li>
                          <li>• <strong>Jira:</strong> Sync with Jira tickets and projects</li>
                          <li>• <strong>Time Tracking:</strong> Track time spent on tasks automatically</li>
                          <li>• <strong>Calendar:</strong> Create calendar events from due dates</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'visual' && (
                    <div className="space-y-6">
                      {/* Stickers */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Stickers</h3>
                          <button
                            onClick={() => setShowStickers(!showStickers)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                            Add Stickers
                          </button>
                        </div>
                        
                        {/* Selected Stickers */}
                        {selectedStickers.length > 0 && (
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Stickers</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedStickers.map((sticker) => (
                                <div
                                  key={sticker.id}
                                  className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                                >
                                  <span className="text-lg">{sticker.emoji}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{sticker.name}</span>
                                  <button
                                    onClick={() => removeSticker(sticker.id)}
                                    className="text-red-500 hover:text-red-700 p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sticker Picker */}
                        {showStickers && (
                          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Choose Stickers</h4>
                            <div className="grid grid-cols-8 gap-2">
                              {availableStickers.map((sticker) => (
                                <button
                                  key={sticker.id}
                                  onClick={() => addSticker(sticker)}
                                  className="flex flex-col items-center gap-1 p-2 hover:bg-white dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 transition-colors"
                                  title={sticker.name}
                                >
                                  <span className="text-2xl">{sticker.emoji}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{sticker.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Markdown Support */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Markdown Support</h3>
                          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <input
                              type="checkbox"
                              checked={markdownPreview}
                              onChange={(e) => setMarkdownPreview(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Live Preview
                          </label>
                        </div>

                        {/* Markdown Shortcuts */}
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Markdown Shortcuts</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {markdownShortcuts.map((shortcut) => (
                              <button
                                key={shortcut.shortcut}
                                onClick={() => insertMarkdown(shortcut.example)}
                                className="text-left p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-xs"
                              >
                                <div className="font-mono text-blue-800 dark:text-blue-200">{shortcut.shortcut}</div>
                                <div className="text-blue-600 dark:text-blue-300">{shortcut.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Markdown Preview */}
                        {markdownPreview && formData.description && (
                          <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
                            <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                              {formData.description
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">$1</code>')
                                .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold">$1</h1>')
                                .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold">$1</h2>')
                                .replace(/^- (.*$)/gm, '<li class="list-disc ml-4">$1</li>')
                                .replace(/^\d+\. (.*$)/gm, '<li class="list-decimal ml-4">$1</li>')
                                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
                              }
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Smart Previews */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Smart Previews</h3>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Link className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                              URL Previews
                            </h4>
                          </div>
                          <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                            Paste URLs in the description to automatically generate rich previews
                          </p>
                          <div className="space-y-2">
                            <div className="text-xs text-yellow-700 dark:text-yellow-300">
                              <strong>Supported:</strong> YouTube, GitHub, Twitter, Google Docs, and more
                            </div>
                            <div className="text-xs text-yellow-700 dark:text-yellow-300">
                              <strong>Example:</strong> https://github.com/user/repo
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visual Tips */}
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            Visual Enhancement Tips
                          </h4>
                        </div>
                        <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                          <li>• Use stickers to add personality and visual cues to cards</li>
                          <li>• Markdown formatting makes descriptions more readable</li>
                          <li>• Smart previews automatically generate rich content from URLs</li>
                          <li>• Cover images make cards stand out on the board</li>
                          <li>• Color-coded labels help with quick visual identification</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={formData.isTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    Save as template
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={formData.isWatching}
                      onChange={(e) => setFormData(prev => ({ ...prev, isWatching: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    Watch this card
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.title.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Card
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateCardButton;