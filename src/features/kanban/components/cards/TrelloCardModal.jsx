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
  Edit2,
  Save,
  Hash
} from 'lucide-react';
import { useKanban } from '../../contexts/KanbanContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { calculateCardBadges, addActivity } from '../../types/cardModel';
import toast from 'react-hot-toast';
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
  getCardTitleComponents,
  generateCustomerSlug
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
    cards: contextCards,
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
    fetchLabelsByBranch,
    createLabel,
    updateLabel,
    deleteLabel
  } = useKanban();
  
  // Initialize identifier from card/reservation props
  const getInitialIdentifier = () => {
    if (card?.identifier) return card.identifier;
    if (card?._identifier) return card._identifier;
    if (reservation?.identifier) return reservation.identifier;
    // If title exists and looks like an identifier, use it
    if (card?.title && /^\d{2}-\d{2}-\d{2}-\d{3}/.test(card.title)) {
      return card.title.split('-').slice(0, 4).join('-');
    }
    return '';
  };

  // State
  const [formData, setFormData] = useState(() => {
    if (card) {
      const identifier = getInitialIdentifier();
      const reservationId = card.reservationId || card.reservation_id || reservation?.id;
      return {
        ...card,
        identifier: identifier,
        reservationId: reservationId,
        reservation_id: reservationId
      };
    }
    return null;
  });
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelFormData, setLabelFormData] = useState({ name: '', color: '#3b82f6', description: '' });
  
  // Card Title System State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const customerFetchRef = useRef(false);
  const [titleComponents, setTitleComponents] = useState(() => {
    const identifier = getInitialIdentifier();
    return {
      identifier: identifier,
      customerName: '',
      customerSlug: ''
    };
  });
  
  // Refs - MUST be called before any conditional returns
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const modalRef = useRef(null);
  
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
  // Only include fields that are explicitly allowed to be updated
  const transformCardToBackendFormat = (cardData) => {
    const transformed = {};
    
    // List of allowed fields that can be updated
    const allowedFields = [
      'title', 'description', 'priority', 'due_date', 'start_date',
      'column_id', 'assignees', 'labels', 'customer', 'ready_products',
      'custom_fields', 'is_archived', 'estimated_hours', 'actual_hours'
    ];
    
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
    
    // Column/List ID - only update if explicitly provided
    if (cardData.column_id !== undefined) transformed.column_id = cardData.column_id;
    if (cardData.listId !== undefined && cardData.column_id === undefined) {
      transformed.column_id = cardData.listId;
    }
    
    // Members to Assignees conversion
    if (cardData.members !== undefined) {
      transformed.assignees = (cardData.members || []).map(memberId => ({
        user_id: memberId
      }));
    }
    
    // Labels - transform to backend format with name and color
    if (cardData.labels !== undefined) {
      transformed.labels = (cardData.labels || []).map(labelId => {
        // Normalize label ID for lookup
        const normalizeId = (id) => {
          if (typeof id === 'string') return id;
          if (typeof id === 'object' && id) return id.id || id._id || id.label_id;
          return String(id);
        };
        
        const normalizedId = normalizeId(labelId);
        
        // If it's already an object with all required fields, use it
        if (typeof labelId === 'object' && labelId.label_id && labelId.name && labelId.color) {
          return {
            label_id: labelId.label_id || labelId.id || labelId._id,
            name: labelId.name,
            color: labelId.color
          };
        }
        
        // If it's an object but might be missing some fields, try to complete it
        if (typeof labelId === 'object' && (labelId.label_id || labelId.id || labelId._id)) {
          const labelObjId = labelId.label_id || labelId.id || labelId._id;
          // Look up label details from labels context
          const label = labels.find(l => {
            const lId = l.id || l._id;
            return normalizeId(lId) === normalizeId(labelObjId);
          });
          
          if (label) {
            return {
              label_id: label.id || label._id,
              name: label.name || labelId.name || '',
              color: label.color || labelId.color || '#6b7280'
            };
          }
          
          // If label not found but we have name/color in the object, use them
          if (labelId.name && labelId.color) {
            return {
              label_id: labelObjId,
              name: labelId.name,
              color: labelId.color
            };
          }
        }
        
        // Look up label details from labels context (for string IDs or incomplete objects)
        const label = labels.find(l => {
          const lId = l.id || l._id;
          return normalizeId(lId) === normalizedId;
        });
        
        if (label) {
          return {
            label_id: label.id || label._id,
            name: label.name,
            color: label.color || '#6b7280'
          };
        }
        
        // Fallback: just label_id if label not found in context
        // Backend will handle this, but it's better to have at least the ID
        return { label_id: normalizedId };
      }).filter(label => label && label.label_id); // Remove any null/undefined entries
    }
    
    // Customer field - convert to ID if object
    if (cardData.customer !== undefined) {
      if (cardData.customer && typeof cardData.customer === 'object') {
        transformed.customer = cardData.customer._id || cardData.customer.id;
      } else if (cardData.customer !== null) {
        transformed.customer = cardData.customer;
      }
    }
    
    // Ready products
    if (cardData.readyProducts !== undefined || cardData.ready_products !== undefined) {
      transformed.ready_products = cardData.readyProducts || cardData.ready_products || [];
    }
    
    // Custom fields - use custom_fields (snake_case) for backend
    if (cardData.customFields !== undefined || cardData.custom_fields !== undefined) {
      transformed.custom_fields = cardData.customFields || cardData.custom_fields || [];
    }
    
    // Archive status
    if (cardData.closed !== undefined) {
      transformed.is_archived = cardData.closed;
    }
    if (cardData.is_archived !== undefined) {
      transformed.is_archived = cardData.is_archived;
    }
    
    // Estimated/Actual hours
    if (cardData.estimated_hours !== undefined) {
      transformed.estimated_hours = cardData.estimated_hours;
    }
    if (cardData.actual_hours !== undefined) {
      transformed.actual_hours = cardData.actual_hours;
    }
    
    // Filter out any fields that shouldn't be sent to backend
    // Remove internal fields, read-only fields, and fields that aren't in the allowed list
    const readOnlyFields = ['_id', 'id', 'created_at', 'createdAt', 'updated_at', 'updatedAt', 
                            'created_by', 'createdBy', 'identifier', 'board_id', 'activity_log',
                            'watchers', 'subscriptions', '_originalData', 'cardId', 'listId',
                            'columnId', 'subcolumnId', 'assignees', 'labelObjects', 'dueDate',
                            'startDate', 'closed', 'isArchived', 'isDeleted', 'branchId'];
    
    const filtered = {};
    Object.keys(transformed).forEach(key => {
      // Skip read-only fields
      if (readOnlyFields.includes(key)) {
        return;
      }
      // Only include fields that are explicitly allowed
      if (allowedFields.includes(key)) {
        // Skip null/undefined values unless they're explicitly being cleared
        if (transformed[key] !== undefined && transformed[key] !== null) {
          filtered[key] = transformed[key];
        } else if (key === 'customer' || key === 'due_date' || key === 'start_date') {
          // Allow null for these fields to clear them
          filtered[key] = transformed[key];
        }
      }
    });
    
    return filtered;
  };
  
  // Helper: Handle card update with proper error handling
  // Handle saving new card - collects all formData and calls onUpdate
  const handleSaveNewCard = async () => {
    // Get the current title from the title input or formData
    const currentTitle = formData?.title?.trim() || titleComponents?.identifier || reservation?.identifier || '';
    
    if (!currentTitle) {
      setError('Card title is required. Please enter a title.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Collect all card data from formData
      const cardDataToSave = {
        ...formData,
        // Ensure identifier is included
        identifier: formData?.identifier || reservation?.identifier || titleComponents.identifier,
        // Ensure reservationId is included
        reservationId: formData?.reservationId || reservation?.id,
        reservation_id: formData?.reservationId || reservation?.id,
        // Include customer if selected
        customer: selectedCustomer || formData?.customer,
        // Ensure title is properly formatted and not empty
        title: currentTitle,
        // Preserve column/list IDs from original card
        listId: formData?.listId || formData?.columnId || card?.listId || card?.columnId,
        columnId: formData?.columnId || formData?.listId || card?.columnId || card?.listId
      };

      // Call onUpdate with the complete card data (for new cards, onUpdate is handleSave from CreateCardButton)
      if (onUpdate && typeof onUpdate === 'function') {
        try {
          await onUpdate(cardDataToSave);
          // onUpdate (handleSave) will close the modal and reset state if successful
        } catch (saveError) {
          console.error('🔴 Error in onUpdate call', saveError);
          // Re-throw to be caught by outer catch block
          throw saveError;
        }
      } else {
        console.error('🔴 onUpdate is not a function', { onUpdate, type: typeof onUpdate });
        throw new Error('Save handler not available. Please refresh the page.');
      }
    } catch (error) {
      // Extract detailed error message
      let errorMessage = 'Failed to save card. ';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (Array.isArray(errorData.details)) {
          errorMessage += errorData.details.join('. ');
        } else if (errorData.details) {
          errorMessage += errorData.details;
        } else if (errorData.message) {
          errorMessage += errorData.message;
        }
      } else if (error?.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
      // Transform updates to backend format (pass labels context for label lookup)
      const updatesWithLabels = { ...updates, _availableLabels: labels };
      const backendUpdates = transformCardToBackendFormat(updatesWithLabels);
      
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
  
  // Update form data when card changes or modal opens
  useEffect(() => {
    // Only initialize when modal is open
    if (!isOpen) return;
    
    if (card) {
      // Determine the identifier from multiple sources - prioritize direct sources before parsing
      // Priority: card.identifier > card._identifier > reservation.identifier > parsed from title
      const identifier = card.identifier || 
                        card._identifier || 
                        reservation?.identifier || 
                        (card.title ? getCardTitleComponents(card.title).identifier : null);
      
      // Determine reservation ID
      const reservationId = card.reservationId || 
                           card.reservation_id || 
                           reservation?.id;
      
      // Explicitly map all fields to ensure proper initialization
      // Extract members from assignees if needed
      const extractedMembers = card.members || 
        (card.assignees || []).map(assignee => {
          if (typeof assignee === 'object' && assignee.user_id) {
            return assignee.user_id._id || assignee.user_id.id || assignee.user_id;
          }
          return assignee._id || assignee.id || assignee;
        }) || [];
      
      // Extract labels - handle both ID arrays and object arrays
      const extractedLabels = card.labels || 
        (card.labelObjects || []).map(label => label.id || label._id || label.label_id) || [];
      
      // Format due date properly
      const formattedDueDate = card.dueDate || 
        (card.due_date ? { 
          date: card.due_date, 
          completed: card.due_date_completed || false 
        } : null);
      
      // Merge card data with formData to preserve any existing form state
      // Transform attachments from backend format to frontend format
      const transformedAttachments = (card.attachments || []).map(att => {
        // Backend format: _id, original_name, url, uploaded_at, mime_type, file_size
        // Frontend format: id, name, url, dateAdded, type, size, mimeType
        const baseURL = import.meta.env.DEV ? 'http://localhost:3000' : '';
        let url = att.url || '';
        
        // Ensure URL is properly formatted
        if (!url.startsWith('http')) {
          // If URL doesn't start with /, add it
          if (!url.startsWith('/')) {
            url = '/' + url;
          }
          // Construct full URL
          url = `${baseURL}${url}`;
        }
        
        // Handle date conversion - backend returns Date object or ISO string
        let dateAdded;
        if (att.uploaded_at) {
          if (att.uploaded_at instanceof Date) {
            dateAdded = att.uploaded_at.toISOString();
          } else if (typeof att.uploaded_at === 'string') {
            dateAdded = att.uploaded_at;
          } else {
            dateAdded = new Date(att.uploaded_at).toISOString();
          }
        } else if (att.uploadedAt) {
          dateAdded = att.uploadedAt instanceof Date ? att.uploadedAt.toISOString() : att.uploadedAt;
        } else if (att.dateAdded) {
          dateAdded = att.dateAdded instanceof Date ? att.dateAdded.toISOString() : att.dateAdded;
        } else {
          dateAdded = new Date().toISOString();
        }
        
        // Determine if it's an image based on mime_type or file extension
        const mimeType = att.mime_type || att.mimeType || '';
        const fileName = att.original_name || att.name || '';
        const isImage = mimeType.startsWith('image/') || 
                       /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName);
        
        // Debug: Log URL construction (after isImage is defined)
        console.log('🔗 Attachment URL transformation:', {
          original: att.url,
          transformed: url,
          baseURL: baseURL,
          isImage: isImage,
          fileName: fileName,
          mimeType: mimeType
        });
        
        return {
          id: att._id?.toString() || att.id?.toString() || `att-${Date.now()}-${Math.random()}`,
          name: att.original_name || att.name || 'Unknown file',
          url: url,
          dateAdded: dateAdded,
          type: isImage ? 'image' : 'file',
          size: att.file_size || att.size || 0,
          mimeType: mimeType || 'application/octet-stream',
          isUploadedToCard: true
        };
      });
      
      const updatedFormData = {
        ...card,
        // Ensure identifier and reservationId are preserved
        identifier: identifier,
        reservationId: reservationId,
        reservation_id: reservationId,
        // Explicitly ensure all fields are set
        members: extractedMembers,
        labels: extractedLabels,
        dueDate: formattedDueDate,
        attachments: transformedAttachments,
        checklists: card.checklists || [],
        customFields: card.customFields || card.custom_fields || [],
        readyProducts: card.readyProducts || card.ready_products || [],
        priority: card.priority || 'medium',
        customer: card.customer || null
      };
      
      setFormData(updatedFormData);
      
      // Initialize customer if present - handle both object and ID formats
      // Reset the ref when card changes to allow fetching again
      customerFetchRef.current = false;
      
      // First, try to extract customer name from title (in case we can't fetch it)
      const titleComponents = getCardTitleComponents(card.title || '');
      const customerNameFromTitle = titleComponents.customerName && 
        titleComponents.customerName.trim() !== '' &&
        titleComponents.customerName.toLowerCase() !== 'restricted' &&
        !titleComponents.customerName.toLowerCase().includes('restricted') &&
        titleComponents.customerName.toLowerCase() !== 'restricted access'
        ? titleComponents.customerName
        : null;
      
      if (card.customer) {
        // Check if customer is an object with _id/id and name
        if (typeof card.customer === 'object' && card.customer !== null && 
            (card.customer._id || card.customer.id) && card.customer.name) {
          // Full customer object - use directly
          setSelectedCustomer(card.customer);
        } else {
          // Just an ID (string or object with only ID) - try to fetch full customer object
          const customerId = typeof card.customer === 'string' 
            ? card.customer 
            : (card.customer?._id || card.customer?.id || null);
          
          if (customerId) {
            // First, set customer from title if available (for immediate display)
            if (customerNameFromTitle) {
              // We already have the customer name from title - no need to fetch
              // This avoids unnecessary 403 errors when user doesn't have access
              setSelectedCustomer({
                _id: customerId,
                id: customerId,
                name: customerNameFromTitle,
                _isRestricted: true // Mark as restricted since we can't fetch full details
              });
              // Keep the customer ID in formData
              setFormData(prev => ({ 
                ...prev, 
                customer: customerId // Keep as ID, not object
              }));
              customerFetchRef.current = false;
            } else {
              // No name from title - try to find customer in accessible list first
              // This avoids calling getCustomerById which might result in 403
              setSelectedCustomer(null);
              customerFetchRef.current = true;
              
              // First, try to find customer in accessible list (more efficient)
              kanbanService.getCustomers({ limit: 100 })
                .then(customersResponse => {
                  const customersList = customersResponse?.data?.customers || customersResponse?.customers || [];
                  const foundCustomer = customersList.find(c => {
                    const cId = c._id || c.id;
                    return cId && cId.toString() === customerId.toString();
                  });
                  
                  if (foundCustomer) {
                    // Found in accessible list - use it directly
                    setSelectedCustomer(foundCustomer);
                    setFormData(prev => ({ ...prev, customer: foundCustomer }));
                    customerFetchRef.current = false;
                  } else {
                    // Not in accessible list - try getCustomerById as last resort
                    // This might fail with 403, but we handle it gracefully
                    kanbanService.getCustomerById(customerId)
                      .then(result => {
                        if (result && result.status === 'success') {
                          const customerData = result.data?.customer || result.data;
                          if (customerData) {
                            setSelectedCustomer(customerData);
                            setFormData(prev => ({ ...prev, customer: customerData }));
                          } else {
                            setSelectedCustomer(null);
                          }
                        } else {
                          setSelectedCustomer(null);
                        }
                        customerFetchRef.current = false;
                      })
                      .catch(error => {
                        // Handle 403 Forbidden (permission denied) gracefully
                        if (error.status === 403 || error.message?.includes('assigned branches')) {
                          // User doesn't have access - keep as null
                          // The dropdown will show "Customer selected (not in accessible list)"
                          setSelectedCustomer(null);
                        } else {
                          console.error('Failed to fetch customer details:', error);
                          setSelectedCustomer(null);
                        }
                        // Keep the customer ID in formData so it can be saved if needed
                        setFormData(prev => ({ 
                          ...prev, 
                          customer: customerId // Keep as ID, not object
                        }));
                        customerFetchRef.current = false;
                      });
                  }
                })
                .catch(() => {
                  // Failed to load customers list - try getCustomerById as fallback
                  kanbanService.getCustomerById(customerId)
                    .then(result => {
                      if (result && result.status === 'success') {
                        const customerData = result.data?.customer || result.data;
                        if (customerData) {
                          setSelectedCustomer(customerData);
                          setFormData(prev => ({ ...prev, customer: customerData }));
                        } else {
                          setSelectedCustomer(null);
                        }
                      } else {
                        setSelectedCustomer(null);
                      }
                      customerFetchRef.current = false;
                    })
                    .catch(error => {
                      // Handle 403 Forbidden (permission denied) gracefully
                      if (error.status === 403 || error.message?.includes('assigned branches')) {
                        setSelectedCustomer(null);
                      } else {
                        console.error('Failed to fetch customer details:', error);
                        setSelectedCustomer(null);
                      }
                      setFormData(prev => ({ 
                        ...prev, 
                        customer: customerId
                      }));
                      customerFetchRef.current = false;
                    });
                });
            }
          } else {
            setSelectedCustomer(null);
          }
        }
      } else {
        // Reset customer selection if not present in card
        setSelectedCustomer(null);
        customerFetchRef.current = false;
      }
      
      // Initialize card title system
      // For new cards, prioritize reservation data if card data is incomplete
      const effectiveIdentifier = identifier || reservation?.identifier || '';
      const titleToParse = card.title || effectiveIdentifier || '';
      
      if (titleToParse) {
        const components = getCardTitleComponents(titleToParse);
        
        // Ensure identifier is set correctly - use direct identifier if available
        if (effectiveIdentifier) {
          // If we have a direct identifier, use it (more reliable than parsing)
          components.identifier = effectiveIdentifier;
        } else if (!components.identifier && titleToParse) {
          // If parsing didn't extract identifier but we have a title, use the title as identifier
          // This handles the case where title is just an identifier without customer
          components.identifier = titleToParse;
        }
        
        // Remove "restricted-access" or similar from customer name/slug if present
        if (components.customerSlug && 
            (components.customerSlug.toLowerCase() === 'restricted-access' || 
             components.customerSlug.toLowerCase() === 'restrictedaccess' ||
             components.customerSlug.toLowerCase().includes('restricted'))) {
          components.customerName = '';
          components.customerSlug = '';
        }
        
        // Ensure customerName and customerSlug are empty if not parsed
        if (!components.customerName) {
          components.customerName = '';
        }
        if (!components.customerSlug) {
          components.customerSlug = '';
        }
        
        setTitleComponents(components);
        
        // If this is a new card with just an identifier, start title editing
        if (isNewCard && components.identifier && !components.customerName) {
          setIsTitleEditing(true);
        }
      } else if (effectiveIdentifier) {
        // If we have identifier but no title, initialize titleComponents with just identifier
        setTitleComponents({
          identifier: effectiveIdentifier,
          customerName: '',
          customerSlug: ''
        });
      }
    } else if (isNewCard && reservation) {
      // Handle case where card is null but we have reservation data
      const identifier = reservation.identifier || '';
      if (identifier) {
        setFormData({
          identifier: identifier,
          reservationId: reservation.id,
          reservation_id: reservation.id,
          title: identifier
        });
        setTitleComponents({
          identifier: identifier,
          customerName: '',
          customerSlug: ''
        });
      }
    } else if (isNewCard && !card && !reservation) {
      // If it's a new card but no card or reservation data yet, initialize with empty state
      setTitleComponents({
        identifier: '',
        customerName: '',
        customerSlug: ''
      });
    }
    
    // Reset customer fetch flag when card changes
    return () => {
      customerFetchRef.current = false;
    };
  }, [card, isNewCard, reservation, isOpen]);
  
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
  
  // Don't render if modal is not open - MUST be after all hooks
  if (!isOpen) {
    return null;
  }
  
  // For new cards, allow rendering even without card data (will be created)
  // For existing cards, require card data
  if (!isNewCard && !card) {
    return null;
  }
  
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
    let finalTitle = formData?.title || '';
    
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
    if (formData?.description !== card?.description) {
      try {
        await handleCardUpdate(
          { description: formData?.description },
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
      const currentMembers = formData?.members || [];
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
      setFormData(prev => ({ ...prev, members: formData?.members || [] }));
      setError('Failed to update member: ' + (error.message || 'Unknown error'));
    }
  };
  
  // Handle label toggle
  const handleLabelToggle = async (labelId) => {
    try {
      const cardId = getCardId();
      const currentLabels = formData?.labels || [];
      
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
      
      // If adding a label and it's not found in context, try to fetch labels first
      if (!label && !isLabelApplied && labels.length === 0) {
        // Try to fetch labels if not loaded
        if (currentUser?.branches && currentUser.branches.length > 0 && fetchLabelsByBranch) {
          const firstBranch = currentUser.branches[0];
          const branchId = typeof firstBranch === 'string' 
            ? firstBranch 
            : (firstBranch?._id || firstBranch?.id || firstBranch);
          if (branchId) {
            try {
              await fetchLabelsByBranch(branchId);
              // Wait a bit for state to update, then retry
              setTimeout(() => {
                handleLabelToggle(labelId);
              }, 100);
              return;
            } catch (err) {
              console.error('Failed to fetch labels:', err);
            }
          }
        }
      }
      
      if (!label && !isLabelApplied) {
        setError('Label not found. Please refresh and try again.');
        return;
      }
      
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
      
      // Ensure labels are properly formatted with name and color before sending
      // Transform labels to include full label objects if we have them in context
      const formattedLabels = newLabels.map(labelIdOrObj => {
        const normalizedId = normalizeLabelId(labelIdOrObj);
        const foundLabel = labels.find(l => {
          const lId = l.id || l._id;
          return normalizeLabelId(lId) === normalizedId;
        });
        
        if (foundLabel) {
          return {
            label_id: foundLabel.id || foundLabel._id,
            name: foundLabel.name,
            color: foundLabel.color || '#6b7280'
          };
        }
        
        // If label not found in context but it's an object with required fields, use it
        if (typeof labelIdOrObj === 'object' && labelIdOrObj.label_id && labelIdOrObj.name && labelIdOrObj.color) {
          return {
            label_id: labelIdOrObj.label_id || labelIdOrObj.id || labelIdOrObj._id,
            name: labelIdOrObj.name,
            color: labelIdOrObj.color
          };
        }
        
        // If label not found in context, return as-is (will be looked up in transformCardToBackendFormat)
        return labelIdOrObj;
      }).filter(label => label); // Remove any null/undefined entries
      
      // Update backend with formatted labels
      await handleCardUpdate(
        { labels: formattedLabels },
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
      setFormData(prev => ({ ...prev, labels: formData?.labels || [] }));
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
      const newClosedState = !formData?.closed;
      
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
    const currentSubscriptions = formData?.subscriptions || formData?.watchers || [];
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
  // Find current column - check multiple possible ID fields
  const currentColumn = columns?.find(col => 
    col.id === formData?.listId || 
    col._id === formData?.listId ||
    col.id === formData?.columnId ||
    col._id === formData?.columnId ||
    col.id === card?.listId ||
    col._id === card?.listId ||
    col.id === card?.columnId ||
    col._id === card?.columnId
  );
  const cardMembers = (formData?.members || [])
    .map(id => users.find(u => u.id === id || u._id === id))
    .filter(Boolean);
  // Map label IDs to label objects, handling different ID formats
  const cardLabels = (formData?.labels || [])
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
  
  const isWatching = (formData?.subscriptions || formData?.watchers || []).includes(currentUser?.id);
  
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
          {formData?.coverImage && (formData?.coverImage?.url || formData?.coverImage?.color) && (
            <div
              className="w-full rounded-t-lg"
              style={{
                height: formData?.coverImage?.size === 'full' ? '260px' : '116px',
                backgroundColor: formData?.coverImage?.color || undefined,
                backgroundImage: formData?.coverImage?.url ? `url(${formData?.coverImage?.url})` : undefined,
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
                      {formatIdentifierForDisplay(
                        titleComponents.identifier || 
                        formData?.identifier || 
                        card?.identifier || 
                        reservation?.identifier || 
                        ''
                      )}
                    </span>
                    {isNewCard && (formData?.reservationId || reservation?.id) && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        (Reserved: {formData?.reservationId || reservation?.id})
                      </span>
                    )}
                    {!isNewCard && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">(Auto-generated)</span>
                    )}
                  </div>
                  
                  {/* Customer Selection */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <CustomerDropdown
                        selectedCustomer={selectedCustomer}
                        customerId={formData?.customer && typeof formData.customer === 'string' ? formData.customer : (formData?.customer?._id || formData?.customer?.id)}
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
                          value={formData?.title || ''}
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
                          {formatCardTitleForDisplay(formData?.title || '', selectedCustomer)}
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
              {formData?.dueDate && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">DUE DATE</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData?.dueDate?.completed || false}
                      onChange={async (e) => {
                        try {
                          const updatedDueDate = { ...formData?.dueDate, completed: e.target.checked };
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
                      {new Date(formData?.dueDate?.date).toLocaleDateString('en-US', {
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
                  {!isDescriptionEditing && formData?.description && (
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
                      value={formData?.description || ''}
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
                    {formData?.description ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {formData?.description}
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
                attachments={formData?.attachments || []}
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
                    
                    // Only upload file attachments (not links)
                    if (attachment.type !== 'link' && attachment.file) {
                      const uploadedAttachment = await contextAddAttachment(cardId, attachment);
                      
                      // Update local state with the uploaded attachment (has real MongoDB _id)
                      // contextAddAttachment now returns the attachment object directly with _id
                      if (uploadedAttachment && uploadedAttachment._id) {
                        // Replace the temporary attachment with the real one from backend
                        setFormData(prev => ({
                          ...prev,
                          attachments: [
                            ...(prev.attachments || []).filter(a => a.id !== attachment.id), // Remove temp attachment
                            {
                              ...attachment,
                              id: uploadedAttachment._id.toString(),
                              _id: uploadedAttachment._id,
                              url: uploadedAttachment.url || attachment.url,
                              original_name: uploadedAttachment.original_name || attachment.name,
                              file_size: uploadedAttachment.file_size || attachment.size,
                              mime_type: uploadedAttachment.mime_type || attachment.mimeType,
                              isUploadedToCard: true
                            }
                          ]
                        }));
                        return; // Exit early since we've updated state with real attachment
                      }
                    }
                    
                    // Update local state for links or if upload didn't return attachment
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
                    
                    // Get the real MongoDB ObjectId for the attachment
                    // Check if attachment.id is a valid MongoDB ObjectId (24 hex characters)
                    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(attachment.id);
                    
                    let attachmentId = attachment.id;
                    
                    // If not a valid ObjectId, try to find the attachment by URL or _id
                    if (!isValidObjectId) {
                      // Try to find the attachment in the context cards
                      const card = contextCards?.find(c => c.id === cardId);
                      if (card && card.attachments) {
                        const matchingAttachment = card.attachments.find(att => 
                          att.url === attachment.url || 
                          att._id?.toString() === attachment.id ||
                          (att.id && att.id === attachment.id && /^[0-9a-fA-F]{24}$/.test(att.id))
                        );
                        if (matchingAttachment) {
                          attachmentId = matchingAttachment._id?.toString() || matchingAttachment.id?.toString();
                        }
                      }
                      
                      // If still not valid, try to get from formData attachments
                      if (!/^[0-9a-fA-F]{24}$/.test(attachmentId)) {
                        const formAttachment = formData.attachments?.find(att => 
                          att.url === attachment.url || 
                          att._id?.toString() === attachment.id ||
                          (att.id && att.id === attachment.id && /^[0-9a-fA-F]{24}$/.test(att.id))
                        );
                        if (formAttachment) {
                          attachmentId = formAttachment._id?.toString() || formAttachment.id?.toString();
                        }
                      }
                    }
                    
                    // Validate we have a MongoDB ObjectId
                    if (!/^[0-9a-fA-F]{24}$/.test(attachmentId)) {
                      throw new Error('Invalid attachment ID. The attachment may not be fully uploaded yet. Please wait a moment and try again.');
                    }
                    
                    // Transform to backend format: attachment_id (snake_case) instead of attachmentId
                    const coverData = {
                      attachment_id: attachmentId, // Backend expects snake_case and valid MongoDB ObjectId
                      url: attachment.url,
                      color: null,
                      size: 'normal'
                    };
                    
                    console.log('📸 Setting card cover:', {
                      cardId: cardId,
                      coverData: coverData,
                      attachment: attachment,
                      originalAttachmentId: attachment.id,
                      resolvedAttachmentId: attachmentId
                    });
                    
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
              {(formData?.checklists || []).map((checklist, index) => (
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
                    const existingFields = formData?.customFields || [];
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
                      customFields: formData?.customFields || []
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
                  <ActivityLog activities={formData?.activityLog || []} users={users} />
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
                  {/* Save Button for New Cards - Must be first for new cards */}
                  {isNewCard && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveNewCard();
                      }}
                      disabled={isLoading || !(formData?.title?.trim() || titleComponents?.identifier || reservation?.identifier)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : 'Save Card'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onMove) {
                        onMove(formData);
                      }
                    }}
                    disabled={isNewCard}
                    className={`w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors ${
                      isNewCard ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Move className="w-4 h-4" />
                    Move
                  </button>
                  <button
                    onClick={() => {
                      if (onCopy) {
                        onCopy(formData);
                      }
                    }}
                    disabled={isNewCard}
                    className={`w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors ${
                      isNewCard ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      handleWatch();
                    }}
                    disabled={isNewCard}
                    className={`w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors ${
                      isNewCard ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isWatching ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isWatching ? 'Unwatch' : 'Watch'}
                  </button>
                  <button
                    onClick={() => {
                      handleArchive();
                    }}
                    disabled={isNewCard}
                    className={`w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors ${
                      isNewCard ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                    {formData?.closed ? 'Unarchive' : 'Archive'}
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to permanently delete this card? This action cannot be undone.')) {
                          onDelete(formData?.id || formData?._id);
                          onClose(); // Close modal after deletion
                        }
                      }}
                      disabled={isNewCard}
                      className={`w-full flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-sm text-left transition-colors ${
                        isNewCard ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveSection('share');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-left transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
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
                        checked={(formData?.members || []).includes(user.id || user._id)}
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
                  <button onClick={() => {
                    setActiveSection(null);
                    setIsCreatingLabel(false);
                    setEditingLabel(null);
                    setLabelFormData({ name: '', color: '#3b82f6', description: '' });
                  }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Create/Edit Label Form */}
                {(isCreatingLabel || editingLabel) && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                    <div>
                      <input
                        type="text"
                        value={labelFormData.name}
                        onChange={(e) => setLabelFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Label name"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                        maxLength={50}
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={labelFormData.color}
                        onChange={(e) => setLabelFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                      />
                      <button
                        onClick={async () => {
                          if (!labelFormData.name.trim()) {
                            toast.error('Label name is required');
                            return;
                          }
                          if (!currentUser?.branches?.[0]) {
                            toast.error('Branch ID is required');
                            return;
                          }
                          
                          const branchId = typeof currentUser.branches[0] === 'string' 
                            ? currentUser.branches[0] 
                            : (currentUser.branches[0]?._id || currentUser.branches[0]?.id);
                          
                          try {
                            if (editingLabel) {
                              await updateLabel(editingLabel.id || editingLabel._id, {
                                name: labelFormData.name.trim(),
                                color: labelFormData.color,
                                description: labelFormData.description.trim()
                              });
                              toast.success('Label updated successfully');
                            } else {
                              await createLabel({
                                name: labelFormData.name.trim(),
                                color: labelFormData.color,
                                description: labelFormData.description.trim(),
                                branch_id: branchId
                              });
                              toast.success('Label created successfully');
                            }
                            setLabelFormData({ name: '', color: '#3b82f6', description: '' });
                            setIsCreatingLabel(false);
                            setEditingLabel(null);
                            if (branchId) {
                              await fetchLabelsByBranch(branchId);
                            }
                          } catch (error) {
                            console.error('Failed to save label:', error);
                            // Extract error message with multiple fallbacks
                            let errorMessage = 'Failed to save label';
                            if (error.details && Array.isArray(error.details) && error.details.length > 0) {
                              errorMessage = error.details[0];
                            } else if (error.details && typeof error.details === 'string') {
                              errorMessage = error.details;
                            } else if (error.response?.data?.details) {
                              if (Array.isArray(error.response.data.details) && error.response.data.details.length > 0) {
                                errorMessage = error.response.data.details[0];
                              } else if (typeof error.response.data.details === 'string') {
                                errorMessage = error.response.data.details;
                              }
                            } else if (error.response?.data?.message) {
                              errorMessage = error.response.data.message;
                            } else if (error.message) {
                              errorMessage = error.message;
                            }
                            toast.error(errorMessage);
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {editingLabel ? 'Update' : 'Create'}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingLabel(false);
                          setEditingLabel(null);
                          setLabelFormData({ name: '', color: '#3b82f6', description: '' });
                        }}
                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Create New Label Button */}
                {!isCreatingLabel && !editingLabel && (
                  <button
                    onClick={() => setIsCreatingLabel(true)}
                    className="w-full mb-3 p-2 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Create Label
                  </button>
                )}
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {labels.length === 0 && !isCreatingLabel ? (
                    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                      No labels available
                    </div>
                  ) : (
                    labels.map((label, index) => {
                      const labelId = label.id || label._id;
                      const isChecked = (formData?.labels || []).some(l => {
                        const lId = typeof l === 'string' ? l : (l?.id || l?._id || l);
                        return String(lId) === String(labelId);
                      });
                      const isEditing = editingLabel && (editingLabel.id === labelId || editingLabel._id === labelId);
                      
                      return (
                        <div
                          key={labelId || `label-${index}`}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleLabelToggle(labelId)}
                            className="w-4 h-4"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div
                            className="flex-1 px-2 py-1 rounded text-sm font-medium cursor-pointer"
                            style={{
                              backgroundColor: label.color,
                              color: label.color === '#FFFFFF' || label.color === 'white' ? '#000' : '#FFF'
                            }}
                            onClick={() => handleLabelToggle(labelId)}
                          >
                            {label.name}
                          </div>
                          {!isEditing && (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingLabel(label);
                                  setLabelFormData({
                                    name: label.name,
                                    color: label.color,
                                    description: label.description || ''
                                  });
                                  setIsCreatingLabel(false);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Edit label"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this label?')) {
                                    try {
                                      await deleteLabel(labelId);
                                      toast.success('Label deleted successfully');
                                      const branchId = typeof currentUser?.branches?.[0] === 'string' 
                                        ? currentUser.branches[0] 
                                        : (currentUser?.branches?.[0]?._id || currentUser?.branches?.[0]?.id);
                                      if (branchId) {
                                        await fetchLabelsByBranch(branchId);
                                      }
                                    } catch (error) {
                                      console.error('Failed to delete label:', error);
                                      let errorMessage = 'Failed to delete label';
                                      if (error.details && Array.isArray(error.details) && error.details.length > 0) {
                                        errorMessage = error.details[0];
                                      } else if (error.response?.data?.message) {
                                        errorMessage = error.response.data.message;
                                      } else if (error.message) {
                                        errorMessage = error.message;
                                      }
                                      toast.error(errorMessage);
                                    }
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                title="Delete label"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
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
                                position: (formData?.checklists || []).length,
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
                  value={formData?.dueDate?.date ? new Date(formData?.dueDate?.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                />
                {formData?.dueDate && (
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
      
    </AnimatePresence>
  );
};

export default TrelloCardModal;

