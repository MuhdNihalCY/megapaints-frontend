/**
 * Enhanced Card Modal Component
 * Comprehensive modal for creating, viewing, and editing cards with customer details, products, and production items
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Tag, 
  Paperclip, 
  Send, 
  Edit3, 
  Trash2, 
  CheckSquare, 
  Settings,
  Phone,
  MessageCircle,
  Search,
  Plus,
  Copy,
  Archive,
  Move,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useKanban } from '../contexts/KanbanContext';
import { useDueDateStatus, usePriorityDisplay, useLabelsDisplay } from '../hooks/useKanban';
import { CARD_PRIORITIES, COLUMN_TYPES } from '../utils/constants';
import CardChecklist from './CardChecklist';
import LabelManager from './LabelManager';

/**
 * Enhanced Card Modal Component
 */
const CardModal = ({ isOpen, card, mode, onClose }) => {
  const { 
    createCard, 
    updateCard, 
    addComment, 
    users, 
    labels, 
    canEditCard, 
    canAssignUsers, 
    canChangeDue, 
    canChangeLabels 
  } = useKanban();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  
  // Enhanced state for all features
  const [customerContact, setCustomerContact] = useState({
    person: '',
    mobile: '',
    whatsapp: ''
  });
  const [readyProducts, setReadyProducts] = useState([]);
  const [productionItems, setProductionItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedProductionItems, setSelectedProductionItems] = useState(new Set());
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'Liter' });
  const [newProductionItem, setNewProductionItem] = useState({ 
    name: '', 
    quantity: 0, 
    unit: 'Liter',
    gloss: '',
    color: '',
    formula: '',
    identifier: ''
  });

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
  const labelInfo = useLabelsDisplay(watchedValues.labels, labels);

  // Generate unique card ID
  const generateCardId = () => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${day}-${month}-${year}-${random}`;
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
        setCustomerContact({ person: '', mobile: '+91 8891303280', whatsapp: '+91 8891303280' });
        setReadyProducts([
          { id: 1, name: 'Mipa ProMix Industry Pigments PMI 460 white', quantity: 3, unit: 'Liter' },
          { id: 2, name: 'Mipa ProMix Industry Pigments PMI 410 transparent oxide red', quantity: 32, unit: 'Liter' }
        ]);
        setProductionItems([
          { 
            id: 1, 
            name: 'Rosner_PU', 
            identifier: 'fg',
            gloss: '4', 
            quantity: 3, 
            unit: 'Kilogram', 
            color: 'red', 
            formula: 'ral 3000 Mipa_2K_PMI',
            isExpanded: false 
          },
          { 
            id: 2, 
            name: 'Mipa_2K_PMI', 
            identifier: 'wer',
            gloss: 'Matt/Gloss', 
            quantity: 2, 
            unit: 'Liter', 
            color: 'beige', 
            formula: 'BR 10000 Mipa_2K_PMI',
            isExpanded: false 
          }
        ]);
        setSelectedCustomer('Customer 2');
        setSelectedLabels([
          { id: 'sample', name: 'Sample Label', color: '#000000' }
        ]);
        setNewProduct({ name: '', quantity: 0, unit: 'Liter' });
        setNewProductionItem({ 
          name: '', 
          quantity: 0, 
          unit: 'Liter',
          gloss: '',
          color: '',
          formula: '',
          identifier: ''
        });
        setSearchTerm('');
        setExpandedItems(new Set());
        setSelectedProductionItems(new Set());
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
        setIsEditing(mode === 'edit');
        
        // Load card data for enhanced features
        if (card) {
          setCustomerContact(card.customerContact || { person: '', mobile: '+91 8891303280', whatsapp: '+91 8891303280' });
          setReadyProducts(card.readyProducts || [
            { id: 1, name: 'Mipa ProMix Industry Pigments PMI 460 white', quantity: 3, unit: 'Liter' },
            { id: 2, name: 'Mipa ProMix Industry Pigments PMI 410 transparent oxide red', quantity: 32, unit: 'Liter' }
          ]);
          setProductionItems(card.productionItems || [
            { 
              id: 1, 
              name: 'Rosner_PU', 
              identifier: 'fg',
              gloss: '4', 
              quantity: 3, 
              unit: 'Kilogram', 
              color: 'red', 
              formula: 'ral 3000 Mipa_2K_PMI',
              isExpanded: false 
            },
            { 
              id: 2, 
              name: 'Mipa_2K_PMI', 
              identifier: 'wer',
              gloss: 'Matt/Gloss', 
              quantity: 2, 
              unit: 'Liter', 
              color: 'beige', 
              formula: 'BR 10000 Mipa_2K_PMI',
              isExpanded: false 
            }
          ]);
          setSelectedCustomer(card.customer || 'Customer 2');
          setSelectedLabels(card.selectedLabels || [
            { id: 'sample', name: 'Sample Label', color: '#000000' }
          ]);
          setSearchTerm('');
          setExpandedItems(new Set());
          setSelectedProductionItems(new Set());
        }
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
      const cardData = {
        ...data,
        customerContact,
        readyProducts,
        productionItems,
        customer: selectedCustomer,
        selectedLabels,
        cardId: card?.cardId || generateCardId()
      };

      if (mode === 'create') {
        await createCard(cardData);
        toast.success('Card created successfully');
      } else {
        await updateCard(card.id, cardData);
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
    
    if (!card?.id) {
      toast.error('Cannot add comment to unsaved card');
      return;
    }

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

  // Ready Products Management
  const addReadyProduct = () => {
    if (!newProduct.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (newProduct.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    
    const product = {
      id: Date.now(),
      name: newProduct.name,
      quantity: newProduct.quantity,
      unit: newProduct.unit
    };
    setReadyProducts([...readyProducts, product]);
    setNewProduct({ name: '', quantity: 0, unit: 'Liter' });
    toast.success('Product added successfully');
  };

  const updateReadyProduct = (id, field, value) => {
    setReadyProducts(products =>
      products.map(product =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  };

  const deleteReadyProduct = (id) => {
    setReadyProducts(products => products.filter(product => product.id !== id));
    toast.success('Product removed');
  };

  // Production Items Management
  const addProductionItem = () => {
    if (!newProductionItem.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (newProductionItem.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    
    const item = {
      id: Date.now(),
      name: newProductionItem.name,
      identifier: newProductionItem.identifier,
      gloss: newProductionItem.gloss,
      quantity: newProductionItem.quantity,
      unit: newProductionItem.unit,
      color: newProductionItem.color,
      formula: newProductionItem.formula,
      isExpanded: false
    };
    setProductionItems([...productionItems, item]);
    setNewProductionItem({ 
      name: '', 
      quantity: 0, 
      unit: 'Liter',
      gloss: '',
      color: '',
      formula: '',
      identifier: ''
    });
    toast.success('Production item added successfully');
  };

  const updateProductionItem = (id, field, value) => {
    setProductionItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteProductionItem = (id) => {
    setProductionItems(items => items.filter(item => item.id !== id));
    toast.success('Production item removed');
  };

  const toggleItemExpansion = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const placeOrder = (itemId) => {
    toast.success('Order placed successfully');
    // Here you would typically call an API to place the order
  };

  const createNewFormula = () => {
    toast.info('Create New Formula feature coming soon');
    // Here you would typically open a formula creation modal
  };

  // Label management
  const addLabel = (label) => {
    if (!selectedLabels.find(l => l.id === label.id)) {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const removeLabel = (labelId) => {
    setSelectedLabels(selectedLabels.filter(label => label.id !== labelId));
  };

  // Handle label selection from LabelManager
  const handleLabelSelect = (label) => {
    addLabel(label);
    setIsLabelManagerOpen(false);
  };

  // Handle production item selection
  const toggleProductionItemSelection = (itemId) => {
    setSelectedProductionItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Filter production items based on search
  const filteredProductionItems = productionItems.filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.formula || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = mode === 'create' || (card && canEditCard(card));

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-neutral-900/90 via-gray-900/80 to-neutral-800/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-4">
            {/* Card ID Display */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                {card?.cardId || generateCardId()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                disabled={!isEditing}
                className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 disabled:opacity-50"
              >
                <option value="">Select Customer</option>
                <option value="Customer 1">Customer 1</option>
                <option value="Customer 2">Customer 2</option>
                <option value="Customer 3">Customer 3</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              in list {card?.columnId || 'SALES'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Action Buttons */}
            {mode === 'view' && (
              <>
                <button 
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Move Card"
                >
                  <Move size={16} />
                </button>
                <button 
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Copy Card"
                >
                  <Copy size={16} />
                </button>
                <button 
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Archive Card"
                >
                  <Archive size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter card title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Enhanced Customer Contact Details */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Customer Contact
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Customer contact:</span>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        {customerContact.person || 'Cust Person'}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Mobile no:</span>
                      <input
                        type="tel"
                        value={customerContact.mobile}
                        onChange={(e) => setCustomerContact(prev => ({ ...prev, mobile: e.target.value }))}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="+91 8891303280"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare size={16} className="text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">WhatsApp no:</span>
                      <input
                        type="tel"
                        value={customerContact.whatsapp}
                        onChange={(e) => setCustomerContact(prev => ({ ...prev, whatsapp: e.target.value }))}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="+91 8891303280"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Labels Section */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Labels
                  </h3>
                  <div className="space-y-3">
                    {/* Selected Labels */}
                    <div className="flex flex-wrap gap-2">
                      {selectedLabels.map((label) => (
                        <div key={label.id} className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-600 rounded-lg px-2 py-1">
                          <span className="text-xs text-gray-800 dark:text-gray-200">{label.name}</span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeLabel(label.id)}
                              className="text-gray-500 hover:text-red-600"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Label Button */}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsLabelManagerOpen(true)}
                        className="flex items-center justify-center w-8 h-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Enhanced Ready Products Section */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Ready Products
                  </h3>
                  <div className="space-y-3">
                    {/* Existing Products */}
                    {readyProducts.map((product) => (
                      <div key={product.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="flex-1 text-sm text-gray-900 dark:text-white">
                          {product.name || 'Product Name'}
                        </span>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateReadyProduct(product.id, 'quantity', parseFloat(e.target.value) || 0)}
                          disabled={!isEditing}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.unit}
                        </span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => deleteReadyProduct(product.id)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add New Product */}
                    {isEditing && (
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <input
                          type="text"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Product Name"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <input
                          type="number"
                          value={newProduct.quantity}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <select
                          value={newProduct.unit}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="Liter">Liter</option>
                          <option value="Kilogram">Kilogram</option>
                        </select>
                        <button
                          type="button"
                          onClick={addReadyProduct}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Production Items Section */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Production Items
                  </h3>
                  
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Existing Production Items */}
                    {filteredProductionItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedProductionItems.has(item.id)}
                              onChange={() => toggleProductionItemSelection(item.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.identifier && <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">{item.identifier}</span>}
                              {item.name || 'Product Name'}
                            </span>
                            {item.gloss && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Gloss: {item.gloss}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => toggleItemExpansion(item.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {expandedItems.has(item.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => deleteProductionItem(item.id)}
                                className="p-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedItems.has(item.id) && (
                          <div className="space-y-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateProductionItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                disabled={!isEditing}
                                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                              />
                              <select
                                value={item.unit}
                                onChange={(e) => updateProductionItem(item.id, 'unit', e.target.value)}
                                disabled={!isEditing}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                              >
                                <option value="Liter">Liter</option>
                                <option value="Kilogram">Kilogram</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => placeOrder(item.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Place Order
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{item.color}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{item.formula}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add New Production Item */}
                    {isEditing && (
                      <div className="space-y-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newProductionItem.name}
                            onChange={(e) => setNewProductionItem(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Product Name"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <input
                            type="number"
                            value={newProductionItem.quantity}
                            onChange={(e) => setNewProductionItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <select
                            value={newProductionItem.unit}
                            onChange={(e) => setNewProductionItem(prev => ({ ...prev, unit: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="Liter">Liter</option>
                            <option value="Kilogram">Kilogram</option>
                          </select>
                          <button
                            type="button"
                            onClick={addProductionItem}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={createNewFormula}
                          className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors"
                        >
                          Create New Formula
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Comments Section */}
                {mode !== 'create' && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Comments
                    </h3>
                    
                    {/* Existing Comments */}
                    <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
                      {card?.comments?.map((comment) => (
                        <div key={comment.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {comment.authorName}
                          </span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            {comment.text}
                          </span>
                        </div>
                      ))}
                      {/* Sample comment for demo */}
                      {(!card?.comments || card.comments.length === 0) && (
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-900 dark:text-white">
                            Bihas
                          </span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            fd
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Add Comment */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add Comments
                      </h4>
                      <form onSubmit={handleCommentSubmit} className="flex space-x-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add your comments"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    {...register('priority')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    disabled={!isEditing || !canChangeDue}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {watchedValues.dueDate && (
                    <p className={`mt-1 text-xs ${dueDateStatus.color}`}>
                      {dueDateStatus.label}
                    </p>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Labels
                  </label>
                  <div className="space-y-2">
                    {labels.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No labels available</p>
                    ) : (
                      labels.map((label) => (
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
                      ))
                    )}
                  </div>
                  {canChangeLabels && (
                    <button
                      type="button"
                      onClick={() => setIsLabelManagerOpen(true)}
                      className="mt-3 flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Settings size={14} />
                      <span>Manage Labels</span>
                    </button>
                  )}
                </div>

                {/* Assignees */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        <span className="text-sm text-gray-700 dark:text-gray-300">
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
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {mode === 'view' && canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 px-3 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Edit3 size={16} />
                <span>Edit Card</span>
              </button>
            )}
            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X size={16} />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
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

      <LabelManager
        isOpen={isLabelManagerOpen}
        onClose={() => setIsLabelManagerOpen(false)}
        onLabelSelect={handleLabelSelect}
      />
    </div>
  );
};

export default CardModal;

