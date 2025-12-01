/**
 * TrelloCardModal Component
 * Complete Trello-style card modal matching exact specifications
 * - 768px width modal with 552px left column + 168px sidebar
 * - Full feature set: members, labels, dates, attachments, checklists, custom fields
 * - Activity log and comments system
 * - Sidebar actions menu
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  User,
  Tag,
  Clock,
  Paperclip,
  Image as ImageIcon,
  CheckSquare,
  AlignLeft,
  Plus,
  Eye,
  EyeOff,
  Archive,
  Copy,
  Move,
  Share2,
  Trash2,
  MoreHorizontal,
  Calendar,
  Upload,
  Link as LinkIcon,
  Edit3,
  Save,
  Hash
} from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';
import { useAuth } from '../../../../contexts/AuthContext';
import LabelManager from '../ui/LabelManager';
import { calculateCardBadges, addActivity } from '../../types/cardModel';
import CommentsSection from '../comments/CommentsSection';
import ActivityLog from '../activity/ActivityLog';
import TrelloChecklist from './TrelloChecklist';
import TrelloAttachments from './TrelloAttachments';
import CustomFieldsManager from './CustomFieldsManager';
import ReadyProductsManager from './ReadyProductsManager';
import { DEFAULT_CUSTOM_FIELDS } from '../../types/customFields';
import CustomerDropdown from '../../../../components/customer/CustomerDropdown';
import CustomerManagementModal from '../../../../components/customer/CustomerManagementModal';
import { 
  generateCardTitle, 
  parseCardTitle, 
  formatCardTitleForDisplay,
  formatIdentifierForDisplay,
  getCardTitleComponents
} from '../../utils/cardTitleUtils';
import { kanbanService } from '../../services/kanbanService';

const TrelloCardModal = ({
  card,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onMove,
  onCopy,
  isNewCard = false,
  reservation = null
}) => {
  const { 
    users, 
    labels, 
    columns, 
    user: currentUser,
    updateCard: contextUpdateCard,
    addAttachment: contextAddAttachment,
    deleteAttachment: contextDeleteAttachment,
    setCardCover: contextSetCardCover,
    addChecklist: contextAddChecklist,
    updateChecklist: contextUpdateChecklist,
    deleteChecklist: contextDeleteChecklist,
    watchCard: contextWatchCard,
    unwatchCard: contextUnwatchCard,
    addComment: contextAddComment,
    updateComment: contextUpdateComment,
    deleteComment: contextDeleteComment,
    fetchLabelsByBranch
  } = useKanban();
  
  // State
  const [formData, setFormData] = useState(card || null);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLabelManager, setShowLabelManager] = useState(false);
  
  // Card Title System State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [titleComponents, setTitleComponents] = useState({ identifier: '', customerName: '', customerSlug: '' });
  
  // Helper: Extract card ID
  const getCardId = () => {
    const cardId = card?._id || card?.id;
    if (!cardId && isNewCard) {
      // For new cards, return null - they need to be saved first
      return null;
    }
    return cardId;
  };
  
  // Helper: Check if card is new (not saved yet)
  const isCardNew = () => {
    return isNewCard || !card?._id && !card?.id;
  };
  
  // Helper: Extract only changed fields between old and new card
  const extractUpdates = (oldCard, newCard) => {
    const updates = {};
    const fieldsToCheck = [
      'title', 'description', 'priority', 'dueDate', 'due_date', 
      'startDate', 'start_date', 'members', 'labels', 'customer',
      'readyProducts', 'ready_products', 'customFields', 'closed', 'is_archived', 'column_id', 'listId'
    ];
    
    fieldsToCheck.forEach(field => {
      const oldValue = oldCard[field];
      const newValue = newCard[field];
      
      // Deep comparison for objects/arrays
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        updates[field] = newValue;
      }
    });
    
    return updates;
  };
  
  // Helper: Transform frontend card format to backend API format
  const transformCardToBackendFormat = (cardData) => {
    const transformed = {};
    
    // Basic fields
    if (cardData.title !== undefined) transformed.title = cardData.title;
    if (cardData.description !== undefined) transformed.description = cardData.description;
    if (cardData.priority !== undefined) transformed.priority = cardData.priority;
    
    // Date fields
    if (cardData.dueDate !== undefined) {
      transformed.due_date = cardData.dueDate?.date || cardData.dueDate || null;
    }
    if (cardData.due_date !== undefined) {
      transformed.due_date = cardData.due_date;
    }
    if (cardData.startDate !== undefined) {
      transformed.start_date = cardData.startDate?.date || cardData.startDate || null;
    }
    if (cardData.start_date !== undefined) {
      transformed.start_date = cardData.start_date;
    }
    
    // Column/List ID
    if (cardData.column_id !== undefined) transformed.column_id = cardData.column_id;
    if (cardData.listId !== undefined) transformed.column_id = cardData.listId;
    
    // Members to Assignees conversion
    if (cardData.members !== undefined) {
      transformed.assignees = (cardData.members || []).map(memberId => ({
        user_id: memberId
      }));
    }
    
    // Labels - keep as array of IDs or objects
    if (cardData.labels !== undefined) {
      transformed.labels = (cardData.labels || []).map(labelId => {
        // If it's already an object, use it; otherwise create object
        if (typeof labelId === 'object') {
          return labelId;
        }
        return { label_id: labelId };
      });
    }
    
    // Customer field
    if (cardData.customer !== undefined) {
      if (cardData.customer && typeof cardData.customer === 'object') {
        transformed.customer = cardData.customer._id || cardData.customer.id;
      } else {
        transformed.customer = cardData.customer;
      }
    }
    
    // Ready products
    if (cardData.readyProducts !== undefined || cardData.ready_products !== undefined) {
      transformed.ready_products = cardData.readyProducts || cardData.ready_products || [];
    }
    
    // Custom fields
    if (cardData.customFields !== undefined) {
      transformed.customFields = cardData.customFields;
    }
    
    // Archive status
    if (cardData.closed !== undefined) {
      transformed.is_archived = cardData.closed;
    }
    if (cardData.is_archived !== undefined) {
      transformed.is_archived = cardData.is_archived;
    }
    
    return transformed;
  };
  
  // Helper: Handle card update with proper error handling
  const handleCardUpdate = async (updates, options = {}) => {
    const cardId = getCardId();
    
    // For new cards, we need to create them first
    if (!cardId && isCardNew()) {
      // If this is a new card, we should create it first
      // But for now, we'll just update local state and let the parent handle creation
      if (options.updateLocalState !== false) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
      // Don't log warning - this is expected behavior for new cards
      return;
    }
    
    if (!cardId) {
      console.error('Cannot update: Card ID is missing');
      setError('Cannot update: Card ID is missing. Please save the card first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Transform updates to backend format
      const backendUpdates = transformCardToBackendFormat(updates);
      
      // Call onUpdate callback (which should call contextUpdateCard)
      if (onUpdate && typeof onUpdate === 'function') {
        // Check if onUpdate expects (cardId, updates) or (updates)
        if (onUpdate.length === 2) {
          await onUpdate(cardId, backendUpdates);
        } else {
          // Fallback for old signature
          await onUpdate({ ...formData, ...updates, id: cardId, _id: cardId });
        }
      } else if (contextUpdateCard) {
        // Use context directly if onUpdate not provided
        await contextUpdateCard(cardId, backendUpdates);
      }
      
      // Update local state after successful update
      if (options.updateLocalState !== false) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
      
      // Log activity if specified
      if (options.logActivity && currentUser) {
        try {
          const activity = {
            type: options.activityType || 'card_updated',
            card_id: cardId,
            user_id: currentUser.id || currentUser._id,
            description: options.activityDescription || 'Card updated',
            metadata: options.activityMetadata || {},
            timestamp: new Date().toISOString()
          };
          await kanbanService.logActivity(activity);
        } catch (activityError) {
          console.warn('Failed to log activity:', activityError);
        }
      }
    } catch (error) {
      console.error('Failed to update card:', error);
      setError(error.message || 'Failed to update card');
      
      // Revert local state on error if we updated it optimistically
      if (options.revertOnError && options.previousState) {
        setFormData(options.previousState);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Don't render if no card data
  if (!isOpen || !card) {
    return null;
  }
  
  // Refs
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const modalRef = useRef(null);
  
  // Update form data when card changes
  useEffect(() => {
    if (card) {
      setFormData(card);
      
      // Initialize customer if present
      if (card.customer) {
        setSelectedCustomer(card.customer);
      }
      
      // Initialize card title system
      if (card.title) {
        const components = getCardTitleComponents(card.title);
        setTitleComponents(components);
        
        // If this is a new card with just an identifier, start title editing
        if (isNewCard && components.identifier && !components.customerName) {
          setIsTitleEditing(true);
        }
      }
    }
  }, [card, isNewCard]);
  
  // Monitor activeSection changes
  useEffect(() => {
    // activeSection changed
  }, [activeSection]);
  
  // Load labels by branch when modal opens
  useEffect(() => {
    if (isOpen && currentUser?.branches && currentUser.branches.length > 0 && fetchLabelsByBranch) {
      const firstBranch = currentUser.branches[0];
      const branchId = typeof firstBranch === 'string' 
        ? firstBranch 
        : (firstBranch?._id || firstBranch?.id || firstBranch);
      if (branchId) {
        fetchLabelsByBranch(branchId).catch(err => {
          console.error('Failed to fetch labels by branch:', err);
        });
      }
    }
  }, [isOpen, currentUser, fetchLabelsByBranch]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  // Handle customer selection
  const handleCustomerSelect = async (customer) => {
    try {
      setSelectedCustomer(customer);
      
      // Generate complete card title
      const completeTitle = generateCardTitle(titleComponents.identifier, customer.name);
      
      // Save previous state for rollback
      const previousState = { ...formData };
      
      // Update local state optimistically
      const updatedFormData = {
        ...formData,
        title: completeTitle,
        customer: customer
      };
      setFormData(updatedFormData);
      
      // Update title components
      const newComponents = getCardTitleComponents(completeTitle);
      setTitleComponents(newComponents);
      
      // Update backend
      await handleCardUpdate(
        { title: completeTitle, customer: customer },
        {
          updateLocalState: false, // Already updated above
          logActivity: true,
          activityType: 'customer_assigned',
          activityDescription: `assigned customer "${customer.name}" to this card`,
          activityMetadata: { customer_id: customer._id || customer.id, customer_name: customer.name },
          revertOnError: true,
          previousState
        }
      );
    } catch (error) {
      console.error('Failed to update customer:', error);
      // State will be reverted by handleCardUpdate if revertOnError is true
    }
  };

  const handleCustomerCreate = (newCustomer) => {
    // The CustomerDropdown will automatically select the new customer
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
  
  const handleTitleSave = async () => {
    setIsTitleEditing(false);
    
    // Always enforce format: DD-MM-YY-XXX-customername
    let finalTitle = formData.title;
    
    // If we have both identifier and customer, ensure format is correct
    if (selectedCustomer && titleComponents.identifier) {
      finalTitle = generateCardTitle(titleComponents.identifier, selectedCustomer.name);
    } else if (titleComponents.identifier && titleComponents.customerName) {
      // If we have identifier and customer name from title components, regenerate
      finalTitle = generateCardTitle(titleComponents.identifier, titleComponents.customerName);
    } else if (titleComponents.identifier) {
      // If only identifier, keep it as is (will be updated when customer is selected)
      finalTitle = titleComponents.identifier;
    }
    
    // Only update if title actually changed
    if (finalTitle.trim() !== card.title) {
      try {
        await handleCardUpdate(
          { title: finalTitle },
          {
            logActivity: true,
            activityType: 'title_updated',
            activityDescription: `changed title from "${card.title}" to "${finalTitle}"`,
            activityMetadata: { field: 'title', from: card.title, to: finalTitle }
          }
        );
      } catch (error) {
        console.error('Failed to update title:', error);
        // Revert title in form
        setFormData(prev => ({ ...prev, title: card.title }));
      }
    }
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
  
  const handleDescriptionSave = async () => {
    setIsDescriptionEditing(false);
    if (formData.description !== card.description) {
      try {
        await handleCardUpdate(
          { description: formData.description },
          {
            logActivity: true,
            activityType: 'description_updated',
            activityDescription: 'updated the description',
            activityMetadata: { field: 'description' }
          }
        );
      } catch (error) {
        console.error('Failed to update description:', error);
        // Revert description in form
        setFormData(prev => ({ ...prev, description: card.description }));
      }
    }
  };
  
  // Handle field updates
  const handleFieldUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle member toggle
  const handleMemberToggle = async (userId) => {
    try {
      const cardId = getCardId();
      const currentMembers = formData.members || [];
      const isMember = currentMembers.includes(userId);
      const user = users.find(u => u.id === userId || u._id === userId);
      const action = isMember ? 'removed' : 'added';
      
      // Update local state optimistically
      const newMembers = isMember
        ? currentMembers.filter(id => id !== userId)
        : [...currentMembers, userId];
      setFormData(prev => ({ ...prev, members: newMembers }));
      
      // For new cards, just update local state (no API call)
      if (!cardId || isCardNew()) {
        setActiveSection(null);
        return;
      }
      
      // For existing cards, use backend assign/unassign endpoints
      try {
        if (isMember) {
          // Unassign member
          await kanbanService.unassignTask(cardId, userId);
        } else {
          // Assign member
          await kanbanService.assignTask(cardId, userId);
        }
      } catch (apiError) {
        // Fallback to update endpoint if assign/unassign not available
        await handleCardUpdate(
          { members: newMembers },
          {
            updateLocalState: false, // Already updated above
            logActivity: true,
            activityType: 'member_toggled',
            activityDescription: `${action} ${user?.name || user?.email || 'member'} ${action === 'added' ? 'to' : 'from'} this card`,
            activityMetadata: { userId, action, user_name: user?.name || user?.email }
          }
        );
      }
      
      setActiveSection(null);
    } catch (error) {
      console.error('Failed to toggle member:', error);
      // Revert state on error
      setFormData(prev => ({ ...prev, members: formData.members || [] }));
      setError('Failed to update member: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Handle label toggle
  const handleLabelToggle = async (labelId) => {
    try {
      const cardId = getCardId();
      const currentLabels = formData.labels || [];
      
      // Normalize label IDs for comparison (handle both string and object formats)
      const normalizeLabelId = (id) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id) return id.id || id._id || id.label_id;
        return String(id);
      };
      
      const normalizedLabelId = normalizeLabelId(labelId);
      const isLabelApplied = currentLabels.some(l => normalizeLabelId(l) === normalizedLabelId);
      const label = labels.find(l => {
        const lId = l.id || l._id;
        return normalizeLabelId(lId) === normalizedLabelId;
      });
      const action = isLabelApplied ? 'removed' : 'added';
      
      // Update local state optimistically
      const newLabels = isLabelApplied
        ? currentLabels.filter(l => normalizeLabelId(l) !== normalizedLabelId)
        : [...currentLabels, normalizedLabelId];
      setFormData(prev => ({ ...prev, labels: newLabels }));
      
      // For new cards, just update local state (no API call)
      if (!cardId || isCardNew()) {
        return;
      }
      
      // Update backend
      await handleCardUpdate(
        { labels: newLabels },
        {
          updateLocalState: false, // Already updated above
          logActivity: true,
          activityType: 'label_toggled',
          activityDescription: `${action} ${label?.name || 'label'}`,
          activityMetadata: { labelId: normalizedLabelId, action, label_name: label?.name }
        }
      );
    } catch (error) {
      console.error('Failed to toggle label:', error);
      // Revert state
      setFormData(prev => ({ ...prev, labels: formData.labels || [] }));
      setError('Failed to update label: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Handle due date change
  const handleDueDateChange = async (date) => {
    try {
      const dueDateData = date ? { date, completed: false } : null;
      
      await handleCardUpdate(
        { dueDate: dueDateData },
        {
          logActivity: true,
          activityType: 'due_date_updated',
          activityDescription: date 
            ? `set due date to ${new Date(date).toLocaleDateString()}` 
            : 'removed due date',
          activityMetadata: { date: date || null }
        }
      );
      
      setActiveSection(null);
    } catch (error) {
      console.error('Failed to update due date:', error);
    }
  };
  
  // Handle archive
  const handleArchive = async () => {
    try {
      const newClosedState = !formData.closed;
      
      await handleCardUpdate(
        { closed: newClosedState },
        {
          logActivity: true,
          activityType: newClosedState ? 'archive' : 'unarchive',
          activityDescription: newClosedState ? 'archived this card' : 'unarchived this card',
          activityMetadata: {}
        }
      );
      
      setActiveSection(null);
    } catch (error) {
      console.error('Failed to archive/unarchive card:', error);
    }
  };
  
  // Handle watch/unwatch
  const handleWatch = async () => {
    const currentSubscriptions = formData.subscriptions || formData.watchers || [];
    const isWatching = currentSubscriptions.includes(currentUser?.id);
    
    try {
      const cardId = getCardId();
      if (isWatching) {
        // Unwatch card
        await contextUnwatchCard(cardId);
        setFormData(prev => ({
          ...prev,
          subscriptions: currentSubscriptions.filter(id => id !== currentUser?.id),
          watchers: currentSubscriptions.filter(id => id !== currentUser?.id)
        }));
      } else {
        // Watch card
        await contextWatchCard(cardId);
        setFormData(prev => ({
          ...prev,
          subscriptions: [...currentSubscriptions, currentUser?.id],
          watchers: [...currentSubscriptions, currentUser?.id]
        }));
      }
      setActiveSection(null);
    } catch (error) {
      console.error('Failed to toggle watch status:', error);
      setError('Failed to toggle watch status: ' + (error.message || 'Unknown error'));
    }
  };
  
  const badges = calculateCardBadges(formData);
  const currentColumn = columns?.find(col => col.id === formData.listId || col._id === formData.listId);
  const cardMembers = (formData.members || [])
    .map(id => users.find(u => u.id === id || u._id === id))
    .filter(Boolean);
  // Map label IDs to label objects, handling different ID formats
  const cardLabels = (formData.labels || [])
    .map(labelId => {
      // Normalize label ID for comparison
      const normalizeId = (id) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id) return id.id || id._id || id.label_id;
        return String(id);
      };
      
      const normalizedId = normalizeId(labelId);
      return labels.find(l => {
        const lId = l.id || l._id;
        return normalizeId(lId) === normalizedId;
      });
    })
    .filter(Boolean);
  
  const isWatching = (formData.subscriptions || formData.watchers || []).includes(currentUser?.id);
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="trello-card-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-64 z-50 flex items-center justify-center overflow-y-auto p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-[868px] bg-white dark:bg-gray-900 rounded-none md:rounded-lg shadow-2xl my-0 md:my-8 flex flex-col h-full md:h-auto max-h-screen md:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cover Image */}
          {formData.coverImage && (formData.coverImage.url || formData.coverImage.color) && (
            <div
              className="w-full rounded-t-lg"
              style={{
                height: formData.coverImage.size === 'full' ? '260px' : '116px',
                backgroundColor: formData.coverImage.color || undefined,
                backgroundImage: formData.coverImage.url ? `url(${formData.coverImage.url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}
          
          {/* Header */}
          <div className="p-6 pb-2 flex-shrink-0">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">Updating card...</p>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1" />
              <div className="flex-1">
                {/* Card Title System */}
                <div className="space-y-3">
                  {/* Primary Identifier (Read-only) */}
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {formatIdentifierForDisplay(titleComponents.identifier)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">(Auto-generated)</span>
                  </div>
                  
                  {/* Customer Selection */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <CustomerDropdown
                        selectedCustomer={selectedCustomer}
                        onCustomerSelect={handleCustomerSelect}
                        onCustomerCreate={handleCustomerCreate}
                        onRequestCreateCustomer={() => setShowCustomerModal(true)}
                        placeholder="Select customer..."
                        className="max-w-md"
                      />
                    </div>
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                  
                  {/* Complete Title Display */}
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      {isTitleEditing ? (
                        <textarea
                          ref={titleRef}
                          value={formData.title}
                          onChange={(e) => handleFieldUpdate('title', e.target.value)}
                          onBlur={handleTitleSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleTitleSave();
                            }
                          }}
                          className="w-full px-2 py-1 text-lg font-semibold border-2 border-blue-500 rounded focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                          rows={1}
                          placeholder="Complete card title..."
                        />
                      ) : (
                        <h2
                          onClick={handleTitleEdit}
                          className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded -ml-2"
                        >
                          {formatCardTitleForDisplay(formData.title, selectedCustomer)}
                        </h2>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Subtitle */}
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 px-2">
                  in list <span className="font-medium">{currentColumn?.name || 'Unknown'}</span>
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex flex-col md:flex-row gap-4 p-6 overflow-y-auto flex-1 min-h-0">
            {/* Left Column - 552px on desktop, full width on mobile */}
            <div className="flex-1 md:max-w-[614px] min-w-0">
              {/* Members Section */}
              {cardMembers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">MEMBERS</h3>
                  <div className="flex flex-wrap gap-2">
                    {cardMembers.map((member, index) => (
                      <div
                        key={member.id || member._id || `member-${index}`}
                        className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                        title={member.name || member.email}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">{member.name || member.email}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => setActiveSection('members')}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Labels Section */}
              {cardLabels.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">LABELS</h3>
                  <div className="flex flex-wrap gap-2">
                    {cardLabels.map((label, index) => (
                      <div
                        key={label.id || label._id || `label-${index}`}
                        className="px-3 py-1.5 rounded text-sm font-medium"
                        style={{
                          backgroundColor: label.color,
                          color: label.color === '#FFFFFF' || label.color === 'white' ? '#000' : '#FFF'
                        }}
                      >
                        {label.name}
                      </div>
                    ))}
                    <button
                      onClick={() => setActiveSection('labels')}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Due Date Section */}
              {formData.dueDate && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">DUE DATE</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.dueDate.completed || false}
                      onChange={async (e) => {
                        try {
                          const updatedDueDate = { ...formData.dueDate, completed: e.target.checked };
                          await handleCardUpdate(
                            { dueDate: updatedDueDate },
                            {
                              logActivity: true,
                              activityType: 'due_date_completed',
                              activityDescription: e.target.checked 
                                ? 'marked due date as complete' 
                                : 'marked due date as incomplete',
                              activityMetadata: { completed: e.target.checked }
                            }
                          );
                        } catch (error) {
                          console.error('Failed to update due date completion:', error);
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <button
                      onClick={() => setActiveSection('dates')}
                      className={`px-3 py-1.5 rounded text-sm font-medium ${
                        badges.dueDate?.isComplete
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : badges.dueDate?.isOverdue
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : badges.dueDate?.isDueSoon
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {new Date(formData.dueDate.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </button>
                    {badges.dueDate?.isComplete && (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        Complete
                      </span>
                    )}
                    {badges.dueDate?.isOverdue && !badges.dueDate?.isComplete && (
                      <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Description Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Description</h3>
                  </div>
                  {!isDescriptionEditing && formData.description && (
                    <button
                      onClick={handleDescriptionEdit}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {isDescriptionEditing ? (
                  <div>
                    <textarea
                      ref={descriptionRef}
                      value={formData.description}
                      onChange={(e) => handleFieldUpdate('description', e.target.value)}
                      placeholder="Add a more detailed description..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[100px]"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleDescriptionSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsDescriptionEditing(false);
                          handleFieldUpdate('description', card.description);
                        }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleDescriptionEdit}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[60px]"
                  >
                    {formData.description ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {formData.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Add a more detailed description...
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Attachments Section */}
              <TrelloAttachments
                attachments={formData.attachments || []}
                onAdd={async (attachment) => {
                  try {
                    const cardId = getCardId();
                    
                    if (!cardId) {
                      // For new cards, store attachment locally until card is saved
                      setFormData(prev => ({
                        ...prev,
                        attachments: [...(prev.attachments || []), attachment]
                      }));
                      // Show info message (not error) - attachments will be uploaded when card is saved
                      // Clear any previous errors
                      setError(null);
                      return;
                    }
                    
                    // Call backend API via context
                    await contextAddAttachment(cardId, attachment);
                    // Update local state
                    setFormData(prev => ({
                      ...prev,
                      attachments: [...(prev.attachments || []), attachment]
                    }));
                  } catch (error) {
                    console.error('Failed to add attachment:', error);
                    setError('Failed to add attachment: ' + (error.message || 'Unknown error'));
                  }
                }}
                onDelete={async (attachmentId) => {
                  try {
                    const cardId = getCardId();
                    
                    if (!cardId) {
                      // For new cards, just remove from local state
                      setFormData(prev => ({
                        ...prev,
                        attachments: (prev.attachments || []).filter(a => a.id !== attachmentId)
                      }));
                      return;
                    }
                    
                    // Call backend API via context
                    await contextDeleteAttachment(cardId, attachmentId);
                    // Update local state
                    setFormData(prev => ({
                      ...prev,
                      attachments: (prev.attachments || []).filter(a => a.id !== attachmentId)
                    }));
                  } catch (error) {
                    console.error('Failed to delete attachment:', error);
                    setError('Failed to delete attachment: ' + (error.message || 'Unknown error'));
                  }
                }}
                onMakeCover={async (attachment) => {
                  try {
                    const cardId = getCardId();
                    
                    if (!cardId) {
                      // For new cards, just update local state
                      const coverData = {
                        attachmentId: attachment.id,
                        url: attachment.url,
                        color: null,
                        size: 'normal'
                      };
                      setFormData(prev => ({
                        ...prev,
                        coverImage: coverData
                      }));
                      // Clear any previous errors - cover will be set when card is saved
                      setError(null);
                      return;
                    }
                    
                    const coverData = {
                      attachmentId: attachment.id,
                      url: attachment.url,
                      color: null,
                      size: 'normal'
                    };
                    // Call backend API via context
                    await contextSetCardCover(cardId, coverData);
                    // Update local state
                    setFormData(prev => ({
                      ...prev,
                      coverImage: coverData
                    }));
                  } catch (error) {
                    console.error('Failed to set card cover:', error);
                    setError('Failed to set card cover: ' + (error.message || 'Unknown error'));
                  }
                }}
              />
              
              {/* Checklists Section */}
              {(formData.checklists || []).map((checklist, index) => (
                <TrelloChecklist
                  key={checklist.id || `checklist-${index}`}
                  checklist={checklist}
                  onUpdate={async (updatedChecklist) => {
                    try {
                      const cardId = getCardId();
                      
                      if (!cardId) {
                        // For new cards, just update local state
                        setFormData(prev => ({
                          ...prev,
                          checklists: (prev.checklists || []).map(c =>
                            c.id === updatedChecklist.id ? updatedChecklist : c
                          )
                        }));
                        return;
                      }
                      
                      // Call backend API via context
                      await contextUpdateChecklist(cardId, checklist.id, updatedChecklist);
                      // Update local state
                      setFormData(prev => ({
                        ...prev,
                        checklists: (prev.checklists || []).map(c =>
                          c.id === updatedChecklist.id ? updatedChecklist : c
                        )
                      }));
                    } catch (error) {
                      console.error('Failed to update checklist:', error);
                      setError('Failed to update checklist: ' + (error.message || 'Unknown error'));
                    }
                  }}
                  onDelete={async (checklistId) => {
                    try {
                      const cardId = getCardId();
                      
                      if (!cardId) {
                        // For new cards, just update local state
                        setFormData(prev => ({
                          ...prev,
                          checklists: (prev.checklists || []).filter(c => c.id !== checklistId)
                        }));
                        return;
                      }
                      
                      // Call backend API via context
                      await contextDeleteChecklist(cardId, checklistId);
                      // Update local state
                      setFormData(prev => ({
                        ...prev,
                        checklists: (prev.checklists || []).filter(c => c.id !== checklistId)
                      }));
                    } catch (error) {
                      console.error('Failed to delete checklist:', error);
                      setError('Failed to delete checklist: ' + (error.message || 'Unknown error'));
                    }
                  }}
                />
              ))}
              
              {/* Ready Products Section */}
              <ReadyProductsManager
                card={formData}
                onUpdate={async (readyProducts) => {
                  try {
                    // Update local state optimistically
                    setFormData(prev => ({
                      ...prev,
                      readyProducts,
                      ready_products: readyProducts // Also set backend format
                    }));
                    
                    // Update backend
                    const cardId = getCardId();
                    if (cardId) {
                      await handleCardUpdate(
                        { ready_products: readyProducts },
                        {
                          updateLocalState: false, // Already updated above
                          logActivity: true,
                          activityType: 'ready_products_updated',
                          activityDescription: `updated ready products`,
                          activityMetadata: { count: readyProducts.length }
                        }
                      );
                    }
                    // For new cards, readyProducts will be saved when card is created
                  } catch (error) {
                    console.error('Failed to update ready products:', error);
                    setError('Failed to update ready products: ' + (error.message || 'Unknown error'));
                  }
                }}
                currentUser={currentUser}
              />
              
              {/* Custom Fields Section */}
              <CustomFieldsManager
                card={formData}
                customFieldDefinitions={DEFAULT_CUSTOM_FIELDS}
                onUpdate={async (fieldId, value) => {
                  try {
                    // Update custom field value
                    const existingFields = formData.customFields || [];
                    const existingIndex = existingFields.findIndex(cf => cf.fieldId === fieldId);
                    
                    let updatedFields;
                    if (existingIndex >= 0) {
                      updatedFields = [...existingFields];
                      updatedFields[existingIndex] = {
                        fieldId,
                        value,
                        updatedAt: new Date().toISOString(),
                        updatedBy: currentUser?.id
                      };
                    } else {
                      updatedFields = [...existingFields, {
                        fieldId,
                        value,
                        updatedAt: new Date().toISOString(),
                        updatedBy: currentUser?.id
                      }];
                    }
                    
                    // Update local state optimistically
                    setFormData(prev => ({
                      ...prev,
                      customFields: updatedFields
                    }));
                    
                    // Update backend
                    await handleCardUpdate(
                      { customFields: updatedFields },
                      {
                        updateLocalState: false, // Already updated above
                        logActivity: true,
                        activityType: 'custom_field_updated',
                        activityDescription: `updated custom field ${fieldId}`,
                        activityMetadata: { fieldId, value }
                      }
                    );
                  } catch (error) {
                    console.error('Failed to update custom field:', error);
                    // Revert state on error
                    setFormData(prev => ({
                      ...prev,
                      customFields: formData.customFields || []
                    }));
                  }
                }}
                currentUser={currentUser}
              />
              
              {/* Activity Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity</h3>
                  </div>
                  <button
                    onClick={() => setShowActivityDetails(!showActivityDetails)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    {showActivityDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                
                {/* Comments Section */}
                <CommentsSection card={formData} onUpdate={onUpdate} />
                
                {/* Activity Log */}
                {showActivityDetails && (
                  <ActivityLog activities={formData.activityLog || []} users={users} />
                )}
              </div>
            </div>
            
            {/* Right Sidebar - 168px on desktop, full width on mobile */}
            <div className="w-full md:w-[200px] flex-shrink-0 md:overflow-y-auto md:max-h-[calc(90vh-200px)]">
              {/* Add to Card */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">ADD TO CARD</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveSection('members');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Members
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('labels');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    Labels
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('checklist');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Checklist
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('dates');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Dates
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('attachment');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attachment
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('cover');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Cover
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('custom-fields');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Hash className="w-4 h-4" />
                    Custom Fields
                  </button>
                </div>
              </div>
              
              {/* Actions */}
              <div>
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">ACTIONS</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (onMove) {
                        onMove(formData);
                      } else {
                        console.warn('⚠️ onMove callback not provided');
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Move className="w-4 h-4" />
                    Move
                  </button>
                  <button
                    onClick={() => {
                      if (onCopy) {
                        onCopy(formData);
                      } else {
                        console.warn('⚠️ onCopy callback not provided');
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      handleWatch();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    {isWatching ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isWatching ? 'Unwatch' : 'Watch'}
                  </button>
                  <button
                    onClick={() => {
                      handleArchive();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    {formData.closed ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('share');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  {formData.closed && onDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to permanently delete this card?')) {
                          onDelete(formData.id || formData._id);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-sm text-left transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Popup Menus - Positioned relative to modal */}
          <AnimatePresence>
            {activeSection === 'members' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed md:absolute right-4 md:right-4 top-20 md:top-auto md:bottom-auto w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 md:z-10 p-4 max-h-[calc(100vh-120px)] md:max-h-96 overflow-y-auto"
                style={{ 
                  top: '80px',
                  right: '16px'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Members</h3>
                  <button onClick={() => setActiveSection(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((user, index) => (
                    <label
                      key={user.id || user._id || `user-${index}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(formData.members || []).includes(user.id || user._id)}
                        onChange={() => handleMemberToggle(user.id || user._id)}
                        className="w-4 h-4"
                      />
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{user.name || user.email}</div>
                        <div className="text-xs text-gray-500">{user.designation}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
            
            {activeSection === 'labels' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed md:absolute right-4 md:right-4 top-20 md:top-auto md:bottom-auto w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 md:z-10 p-4 max-h-[calc(100vh-120px)] md:max-h-96 overflow-y-auto"
                style={{ 
                  top: '80px',
                  right: '16px'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Labels</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowLabelManager(true);
                        setActiveSection(null);
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      title="Manage Labels"
                    >
                      Manage
                    </button>
                    <button onClick={() => setActiveSection(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {labels.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                      No labels available. Click "Manage" to create labels.
                    </div>
                  ) : (
                    labels.map((label, index) => {
                      const labelId = label.id || label._id;
                      const isChecked = (formData.labels || []).some(l => {
                        const lId = typeof l === 'string' ? l : (l?.id || l?._id || l);
                        return String(lId) === String(labelId);
                      });
                      
                      return (
                        <label
                          key={labelId || `label-${index}`}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleLabelToggle(labelId)}
                            className="w-4 h-4"
                          />
                      <div
                        className="w-full px-3 py-2 rounded font-medium"
                        style={{
                          backgroundColor: label.color,
                          color: label.color === '#FFFFFF' || label.color === 'white' ? '#000' : '#FFF'
                        }}
                      >
                          {label.name}
                        </div>
                      </label>
                    );
                  })
                  )}
                </div>
              </motion.div>
            )}
            
            {activeSection === 'checklist' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed md:absolute right-4 md:right-4 top-20 md:top-auto md:bottom-auto w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 md:z-10 p-4 max-h-[calc(100vh-120px)] md:max-h-96 overflow-y-auto"
                style={{ 
                  top: '80px',
                  right: '16px'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Add Checklist</h3>
                  <button onClick={() => setActiveSection(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Checklist"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          try {
                            const title = e.target.value.trim() || 'Checklist';
                            const cardId = getCardId();
                            
                            if (!cardId) {
                              // For new cards, create checklist locally
                              const newChecklist = {
                                id: `checklist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                title,
                                position: (formData.checklists || []).length,
                                items: []
                              };
                              setFormData(prev => ({
                                ...prev,
                                checklists: [...(prev.checklists || []), newChecklist]
                              }));
                              e.target.value = '';
                              setActiveSection(null);
                              return;
                            }
                            
                            // Create checklist via backend
                            const newChecklist = await contextAddChecklist(cardId, {
                              title,
                              position: (formData.checklists || []).length,
                              items: []
                            });
                            
                            // Update local state
                            setFormData(prev => ({
                              ...prev,
                              checklists: [...(prev.checklists || []), newChecklist]
                            }));
                            
                            // Clear input
                            e.target.value = '';
                            setActiveSection(null);
                          } catch (error) {
                            console.error('Failed to add checklist:', error);
                          }
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={async (e) => {
                      try {
                        const input = e.target.parentElement.parentElement.querySelector('input');
                        const title = input.value.trim() || 'Checklist';
                        const cardId = getCardId();
                        
                        if (!cardId) {
                          // For new cards, create checklist locally
                          const newChecklist = {
                            id: `checklist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            title,
                            position: (formData.checklists || []).length,
                            items: []
                          };
                          setFormData(prev => ({
                            ...prev,
                            checklists: [...(prev.checklists || []), newChecklist]
                          }));
                          input.value = '';
                          setActiveSection(null);
                          return;
                        }
                        
                        // Create checklist via backend
                        const newChecklist = await contextAddChecklist(cardId, {
                          title,
                          position: (formData.checklists || []).length,
                          items: []
                        });
                        
                        // Update local state
                        setFormData(prev => ({
                          ...prev,
                          checklists: [...(prev.checklists || []), newChecklist]
                        }));
                        
                        // Clear input
                        input.value = '';
                        setActiveSection(null);
                      } catch (error) {
                        console.error('Failed to add checklist:', error);
                      }
                    }}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </motion.div>
            )}
            
            {activeSection === 'dates' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed md:absolute right-4 md:right-4 top-20 md:top-auto md:bottom-auto w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 md:z-10 p-4 max-h-[calc(100vh-120px)] md:max-h-96 overflow-y-auto"
                style={{ 
                  top: '80px',
                  right: '16px'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Due Date</h3>
                  <button onClick={() => setActiveSection(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={formData.dueDate?.date ? new Date(formData.dueDate.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
                {formData.dueDate && (
                  <button
                    onClick={() => handleDueDateChange(null)}
                    className="w-full mt-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      )}
      
      {/* Customer Management Modal */}
      {showCustomerModal && (
        <CustomerManagementModal
          key="customer-management-modal"
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          onCustomerSelect={handleCustomerSelect}
        />
      )}
      
      {/* Label Manager Modal */}
      <LabelManager
        isOpen={showLabelManager}
        onClose={() => {
          setShowLabelManager(false);
          // Refresh labels after closing manager (in case new labels were created)
          if (currentUser?.branches && currentUser.branches.length > 0 && fetchLabelsByBranch) {
            const firstBranch = currentUser.branches[0];
            const branchId = typeof firstBranch === 'string' 
              ? firstBranch 
              : (firstBranch?._id || firstBranch?.id || firstBranch);
            if (branchId) {
              fetchLabelsByBranch(branchId).catch(err => {
                console.error('Failed to refresh labels:', err);
              });
            }
          }
        }}
        onLabelSelect={(label) => {
          handleLabelToggle(label.id || label._id);
          setShowLabelManager(false);
        }}
      />
    </AnimatePresence>
  );
};

export default TrelloCardModal;

