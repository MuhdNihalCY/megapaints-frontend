/**
 * ProductionItemsManager Component
 * Manage production items on Trello-style cards with checklist functionality
 * Horizontal form layout: Product Name | Quantity | Unit | Add Button
 * Each item has a checkbox for completion tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check, Trash2, Edit2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import productSearchService from '../../services/productSearchService';
import { useAuth } from '../../../../contexts/AuthContext';
import { format } from 'date-fns';

const UNITS = ['kg', 'g', 'L', 'mL', 'Liter', 'piece', 'set', 'box', 'unit'];

const ProductionItemsManager = ({ card, onUpdate, currentUser }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    const productionItems = card?.productionItems || card?.production_items || [];
    return Array.isArray(productionItems) ? productionItems : [];
  });
  
  // Form state
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('0.00');
  const [unit, setUnit] = useState('Liter');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Edit state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync items when card changes
  useEffect(() => {
    const productionItems = card?.productionItems || card?.production_items || [];
    if (Array.isArray(productionItems)) {
      setItems(productionItems);
    }
  }, [card]);

  // Get branch ID from user
  const getBranchId = () => {
    if (user?.branches && user.branches.length > 0) {
      const firstBranch = user.branches[0];
      return typeof firstBranch === 'string' 
        ? firstBranch 
        : (firstBranch?._id || firstBranch?.id || firstBranch);
    }
    return null;
  };

  // Debounced search for product name
  useEffect(() => {
    if (!productName.trim()) {
      setSearchResults([]);
      setSelectedProduct(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const branchId = getBranchId();
        const results = await productSearchService.searchProducts(productName, branchId, { limit: 10 });
        setSearchResults(results || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Product search error:', error);
        setSearchResults([]);
        if (isInputFocused) {
          setShowDropdown(true);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productName, user, isInputFocused]);

  // Handle product selection from dropdown
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setQuantity((product.standard_quantity || 1).toFixed(2));
    setUnit(product.unit || product.standard_quantity_unit || 'Liter');
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Handle add item
  const handleAddItem = () => {
    if (!selectedProduct) {
      alert('Please select a product from the dropdown');
      return;
    }

    // Check if product is already added
    const isAlreadyAdded = items.some(item => 
      (item.product_id || item._id) === selectedProduct._id
    );
    
    if (isAlreadyAdded) {
      alert('This product is already added. Please edit the existing entry.');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid quantity (>= 0)');
      return;
    }

    const newItem = {
      product_id: selectedProduct._id,
      product_name: selectedProduct.name,
      product_code: selectedProduct.code,
      quantity: qty,
      unit: unit,
      is_completed: false,
      added_at: new Date().toISOString(),
      added_by: currentUser?.id || currentUser?._id
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onUpdate(updatedItems);
    
    // Reset form
    setProductName('');
    setQuantity('0.00');
    setUnit('Liter');
    setSelectedProduct(null);
  };

  // Handle toggle completion
  const handleToggleCompletion = (index) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    const isCompleted = !item.is_completed;
    
    updatedItems[index] = {
      ...item,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? (currentUser?.id || currentUser?._id) : null
    };

    setItems(updatedItems);
    onUpdate(updatedItems);
  };

  // Handle remove item
  const handleRemoveItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onUpdate(updatedItems);
  };

  // Handle start edit
  const handleStartEdit = (index) => {
    const item = items[index];
    setEditingIndex(index);
    setEditQuantity(item.quantity.toString());
    setEditUnit(item.unit);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const qty = parseFloat(editQuantity);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid quantity (>= 0)');
      return;
    }

    if (!editUnit.trim()) {
      alert('Please enter a unit');
      return;
    }

    const updatedItems = [...items];
    updatedItems[editingIndex] = {
      ...updatedItems[editingIndex],
      quantity: qty,
      unit: editUnit.trim()
    };

    setItems(updatedItems);
    onUpdate(updatedItems);
    setEditingIndex(null);
    setEditQuantity('');
    setEditUnit('');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditQuantity('');
    setEditUnit('');
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsInputFocused(true);
    setShowDropdown(true);
  };

  // Handle input blur
  const handleInputBlur = () => {
    setIsInputFocused(false);
    setTimeout(() => {
      if (!isInputFocused) {
        setShowDropdown(false);
      }
    }, 200);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-6">
      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Production Items</h3>
      
      {/* Horizontal Form */}
      <div className="flex items-center gap-2 mb-4" ref={searchRef}>
        {/* Product Name Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              setSelectedProduct(null);
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Product Name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {productName.trim() ? 'No products found' : 'Start typing to search products'}
                  </div>
                ) : (
                  searchResults.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {product.code} • {product.unit}
                      </div>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quantity Input */}
        <div className="w-24">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="0.00"
          />
        </div>

        {/* Unit Dropdown */}
        <div className="w-32 relative">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm appearance-none pr-8"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddItem}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No production items added yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const itemKey = item.product_id || item._id || `item-${index}`;
            const isCompleted = item.is_completed || false;
            const completedDate = item.completed_at ? new Date(item.completed_at) : null;
            
            return (
              <div
                key={itemKey}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCompleted 
                    ? 'bg-gray-100 dark:bg-gray-800/50 opacity-75' 
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                {editingIndex === index ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Qty"
                    />
                    <div className="w-32 relative">
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none pr-8"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleCompletion(index)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 bg-white dark:bg-gray-700'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isCompleted && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </button>
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        isCompleted
                          ? 'line-through text-gray-500 dark:text-gray-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {item.product_name || item.name || 'Unknown Product'}
                      </div>
                      <div className={`text-xs ${
                        isCompleted
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {item.product_code || item.code || 'N/A'} • {item.quantity || 0} {item.unit || 'unit'}
                        {completedDate && (
                          <span className="ml-2">
                            • Completed {format(completedDate, 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(index)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductionItemsManager;
