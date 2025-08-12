/**
 * CreateFormula Component
 * 
 * This component allows users to create paint formulas by:
 * - Selecting tinters (colorants) and their quantities
 * - Configuring binders and additives
 * - Calculating totals and quality metrics
 * - Saving formulas with attachments
 * 
 * @author Megapaints Team
 * @version 1.0.0
 */

// React hooks and core dependencies
import { useEffect, useMemo, useState } from 'react';

// Component imports
import Header from './components/Header';
import { LoadingOverlay } from '../../components';

// Service imports for API calls and data management
import { FormulaService } from '../../formula/services/formulaService';
import { fetchMastersFresh } from '../../formula/services/mastersService'; // Always fetches fresh data, no caching

// Calculation engine imports for formula computations
import { computeTinters, computeTinterRow } from '../../formula/calc/tinters';
import { computeBinders } from '../../formula/calc/binders';
import { computeAdditives } from '../../formula/calc/additives';
import { computeFinalTotals, computeQualityMetrics } from '../../formula/calc/metrics';

// Validation utilities
import { validateTinters, validateBinders, validateMetrics } from '../../utils/validation';

/**
 * Section identifiers for the CreateFormula component
 * Used for navigation and section management
 */
export const CreateFormulaSections = {
  HEADER_CONTROLS: 'header-controls',        // Top toolbar and controls
  LEFT_SIDEBAR: 'left-sidebar',              // Left sidebar with category selection
  TINTS_TABLE: 'tints-table',                // Main tinters selection table
  QUANTITY_GRID: 'quantity-grid',            // Quantity input grid
  TOTALS_BINDERS_ADDITIVES: 'totals-binders-additives', // Totals and binders section
  TOTAL_FOOTER: 'total-footer',              // Final totals display
  REMARKS: 'remarks',                         // Remarks and notes section
  ATTACHMENTS: 'attachments',                 // File attachment section
  METRICS: 'metrics',                         // Quality metrics display
  ACTIONS: 'actions',                         // Action buttons (save, clear, etc.)
};

/**
 * Generates a cryptographically secure random ID
 * Falls back to Math.random() if crypto API is not available
 * @returns {string} Random ID string
 */
function cryptoRandomId() {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

/**
 * Creates an empty tinter row with default values
 * @param {number} nextIndex - The next serial number
 * @returns {Object} Empty tinter object
 */
function createEmptyTint(nextIndex) {
  return { 
    _id: cryptoRandomId(),           // Unique identifier
    sl: nextIndex,                  // Serial number
    code: '',                       // Product code
    series: '',                     // Product series/abbreviation
    name: '',                       // Product name
    qty: [0, 0, 0, 0, 0, 0],      // Quantities for 6 different measurements
    grams: 0,                       // Calculated grams
    volume: 0                       // Calculated volume
  };
}

/**
 * CreateFormula Component
 * 
 * Main component for creating paint formulas with tinters, binders, and additives
 * Handles all state management, calculations, and user interactions
 */
const CreateFormula = () => {
  // ===== FORMULA HEADER STATE =====
  // Basic formula information
  const [category, setCategory] = useState('');                    // Paint category (e.g., "100 - Paints")
  const [subCategory, setSubCategory] = useState('');             // Subcategory (e.g., "Rosner_Acrylic")
  const [gloss, setGloss] = useState(0);                          // Gloss level (0-100)
  const [glossInput, setGlossInput] = useState('');               // Raw gloss input value

  // ===== MASTER DATA STATE =====
  // Options and configurations loaded from backend
  const [categoryOptions, setCategoryOptions] = useState([]);      // Available paint categories
  const [subCategoryOptions, setSubCategoryOptions] = useState([]); // Available subcategories
  const [subCategoriesByCategory, setSubCategoriesByCategory] = useState({}); // Subcategories grouped by category
  const [loadingMasters, setLoadingMasters] = useState(true);     // Loading state for master data
  const [mastersError, setMastersError] = useState('');           // Error message if master data fails to load
  
  // Product and configuration data
  const [products, setProducts] = useState([]);                   // All available products with metadata
  const [binderConfigBySubCategory, setBinderConfigBySubCategory] = useState({}); // Binder configurations by subcategory
  const [productsBySubCategory, setProductsBySubCategory] = useState({}); // Products filtered by subcategory
  const [filteredProducts, setFilteredProducts] = useState([]);   // Products filtered by search term
  
  // Additives selection state
  const [rawAdditives, setRawAdditives] = useState([]);          // Raw additives data from API
  const [selectedAdditiveId, setSelectedAdditiveId] = useState(''); // Currently selected additive ID
  const [additivePercentageInput, setAdditivePercentageInput] = useState(''); // Percentage input value

  // ===== UI STATE =====
  // Product search and dropdown management
  const [showProductList, setShowProductList] = useState({});     // { [tinterId]: boolean } - Controls dropdown visibility
  const [productSearchInput, setProductSearchInput] = useState({}); // { [tinterId]: string } - Search input values
  const [dropdownPosition, setDropdownPosition] = useState({});   // { [tinterId]: { top, left } } - Dropdown positioning
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState({}); // { [tinterId]: number } - Currently selected item in dropdown
  
  // Loading and processing states
  const [isSaving, setIsSaving] = useState(false);               // Formula save operation in progress
  const [isUploading, setIsUploading] = useState(false);         // File upload in progress

  // ===== FORMULA DATA STATE =====
  // Formula metadata (customer info, project details)
  const [meta, setMeta] = useState({
    date: new Date().toISOString().slice(0, 10),                 // Formula date
    fileNo: '',                                                   // File number
    customerName: '',                                             // Customer name
    colorCode: '',                                                // Color code
    colorName: '',                                                // Color name
    customerRef: '',                                              // Customer reference
    projectNo: '',                                                // Project number
  });

  // Core formula components
  const [tints, setTints] = useState([createEmptyTint(1)]);              // Tinters (colorants) array
  const [binders, setBinders] = useState([]);                     // Binders array
  const [additives, setAdditives] = useState([]);                 // Additives array
  
  // Additional formula data
  const [remarks, setRemarks] = useState('');                     // Formula remarks/notes
  const [attachment, setAttachment] = useState({ file: null, preview: '' }); // File attachment with preview
  const [uploadedAttachment, setUploadedAttachment] = useState(null); // Uploaded attachment data { _id, url, ... }
  
  // Input state management
  const [qtyInput, setQtyInput] = useState({});                   // { [tinterId]: string[] } - Quantity input values
  const [additiveInputById, setAdditiveInputById] = useState({}); // { [additiveId]: string } - Additive input values

  // ===== HELPER FUNCTIONS =====
  
  /**
   * Gets binder name by ID from master data
   * @param {string} binderId - Binder ID to look up
   * @returns {string} Binder name or fallback text
   */
  const getBinderName = (binderId) => {
    if (!binderId) return 'Unknown Binder';
    
    // Look up binder in master data (you may need to fetch binders separately)
    // For now, return a formatted ID
    return `Binder ${binderId}`;
  };

  // ===== INPUT VALIDATION & SANITIZATION =====
  
  /**
   * Sanitizes integer input by removing all non-digit characters
   * @param {string|any} raw - Raw input value
   * @returns {string} Sanitized integer string
   */
  function sanitizeIntegerInput(raw) {
    if (typeof raw !== 'string') raw = String(raw ?? '');
    // Allow only digits (no negatives by default)
    return raw.replace(/[^0-9]/g, '');
  }

  /**
   * Sanitizes float input by allowing only digits and a single decimal point
   * Handles edge cases like leading decimal points
   * @param {string|any} raw - Raw input value
   * @returns {string} Sanitized float string
   */
  function sanitizeFloatInput(raw) {
    if (typeof raw !== 'string') raw = String(raw ?? '');
    // Allow digits and a single dot; coerce leading dot to 0.
    const input = raw.replace(/[^0-9.]/g, '');
    let result = '';
    let dotSeen = false;
    
    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      if (ch === '.') {
        if (dotSeen) continue; // Skip additional decimal points
        dotSeen = true;
        if (result === '') result = '0'; // Coerce leading decimal to 0.
        result += '.';
      } else {
        result += ch;
      }
    }
    return result;
  }

  /**
   * Generic numeric input sanitizer that delegates to specific functions
   * @param {string|any} raw - Raw input value
   * @param {string} mode - Sanitization mode: 'int' or 'float'
   * @returns {string} Sanitized numeric string
   */
  function sanitizeNumericInput(raw, mode = 'float') {
    return mode === 'int' ? sanitizeIntegerInput(raw) : sanitizeFloatInput(raw);
  }

  /**
   * Normalizes and validates tinter data from various sources
   * Ensures consistent structure and calculates derived values
   * @param {Array} list - Array of tinter objects to normalize
   * @returns {Array} Normalized tinter array with consistent structure
   */
  function normalizeTints(list) {
    const safe = Array.isArray(list) ? list : [];
    const out = safe.map((t, idx) => {
      // Ensure quantity array has exactly 6 elements
      const qtyArr = Array.isArray(t.qty) ? t.qty.slice(0, 6) : [];
      while (qtyArr.length < 6) qtyArr.push(0);
      
      // Extract and validate numeric properties
      const productDensity = Number(t?.Product_Density || 0);
      const coefficient = Number(t?.coefficient || 0);
      const solids = Number(t?.SolidContent || 0);
      const voc = Number(t?.VOC || 0);
      
      // Calculate derived values (grams and volume) using the calculation engine
      const rowCalc = computeTinterRow({ 
        qty: qtyArr, 
        coefficient, 
        Product_Density: productDensity, 
        SolidContent: solids, 
        VOC: voc 
      });
      
      // Return normalized tinter object with consistent structure
      return {
        _id: t._id || cryptoRandomId(),           // Ensure unique identifier
        sl: t.sl || idx + 1,                      // Serial number
        code: t.code || '',                       // Product code
        series: t.series || '',                   // Product series
        name: t.name || '',                       // Product name
        productId: t.productId || null,           // Product ID reference
        coefficient: Number.isFinite(coefficient) && coefficient > 0 ? coefficient : 1, // Default to 1 if invalid
        Product_Density: Number.isFinite(productDensity) ? productDensity : 0,          // Product density
        SolidContent: Number.isFinite(solids) ? solids : 0,                            // Solid content percentage
        VOC: Number.isFinite(voc) ? voc : 0,                                          // VOC content
        qty: qtyArr,                              // Normalized quantity array
        grams: rowCalc.grams,                     // Calculated grams (stored for backward compatibility)
        volume: rowCalc.volumeL,                  // Calculated volume
      };
    });
    
    // Ensure at least one tinter row exists
    if (out.length === 0) out.push(createEmptyTint(1));
    return out;
  }

  // ===== DATA LOADING & INITIALIZATION =====
  
  /**
   * Loads fresh master data from server on component mount
   * Always fetches latest data (no caching) to ensure real-time updates
   * Fetches categories, subcategories, products, and configurations
   * Sets up initial form state with default values
   */
  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoadingMasters(true);
      setMastersError('');
      
              try {
          // Fetch fresh master data from server (no caching)
          // This ensures we always have the latest data from the database
          const data = await fetchMastersFresh();
          
          try {
            console.log('[CreateFormula] Fresh masters payload:', data);
          } catch (_) {}
        
        // ===== EXTRACT AND VALIDATE MASTER DATA =====
        
        // Parse categories (handle both string arrays and object arrays)
        const cats = Array.isArray(data?.categories)
          ? data.categories.map((c) => (typeof c === 'string' ? c : (c?.name || c?.label || ''))).filter(Boolean)
          : [];
        
        // Extract subcategory mappings and default values
        const subByCat = data?.subCategoriesByCategory && typeof data.subCategoriesByCategory === 'object' 
          ? data.subCategoriesByCategory 
          : {};
        const glossDefault = typeof data?.glossDefault === 'number' ? data.glossDefault : 0;

        // Extract additional configuration data
        const metaDefaults = data?.metaDefaults && typeof data.metaDefaults === 'object' ? data.metaDefaults : {};
        const prods = Array.isArray(data?.products) ? data.products : [];
        const binderCfgBySub = data?.binderConfigBySubCategory && typeof data.binderConfigBySubCategory === 'object' 
          ? data.binderConfigBySubCategory 
          : {};
        const productsBySub = data?.productsBySubCategory || {};
        const rawAdds = Array.isArray(data?.additives) ? data.additives : [];

        // ===== BUILD DEFAULT VALUES =====
        // Construct default values object with fallbacks for all required fields
        const defaults = {
          category: data?.defaultCategory || cats[0] || '100 - Paints',
          subCategory: data?.defaultSubCategory || (subByCat[cats[0]]?.[0]) || 'Rosner_Acrylic',
          gloss: glossDefault,
          tints: normalizeTints(data?.defaultTints),
          binders: Array.isArray(data?.defaultBinders) ? data.defaultBinders.map((b) => ({
            _id: b._id || cryptoRandomId(),
            name: b.name || '',
            grams: Number(b.grams || 0),
            volume: Number(b.volume || 0),
          })) : [],
          additives: Array.isArray(data?.defaultAdditives) ? data.defaultAdditives.map((a) => ({
            _id: a._id || cryptoRandomId(),
            name: a.name || '',
            percent: Number(a.percent || 0),
            grams: Number(a.grams || 0),
          })) : [],
          remarks: typeof data?.defaultRemarks === 'string' ? data.defaultRemarks : '',
        };

        if (!cancelled) {
          // ===== UPDATE OPTIONS AND CONFIGURATIONS =====
          // Set available categories and subcategories
          setCategoryOptions(cats.length ? cats : ['100 - Paints', '200 - Primers']);
          setSubCategoriesByCategory(subByCat);
          setProductsBySubCategory(productsBySub);
          
          // Debug logging for development
          try {
            console.log('[CreateFormula] categories:', cats);
            console.log('[CreateFormula] subCategoriesByCategory keys:', Object.keys(subByCat || {}));
            console.log('[CreateFormula] productsBySubCategory keys:', Object.keys(productsBySub || {}));
            console.log('[CreateFormula] productsBySubCategory details:', productsBySub);
            console.log('[CreateFormula] initial category:', defaults.category, 'initial subcategory:', defaults.subCategory);
          } catch (_) {}
          
          // Set subcategory options for the selected category
          const initialSubs = subByCat[defaults.category];
          setSubCategoryOptions(Array.isArray(initialSubs) && initialSubs.length ? initialSubs : ['Rosner_Acrylic', 'Rosner_PU']);
          
          // Set product and binder configurations
          setProducts(prods);
          setBinderConfigBySubCategory(binderCfgBySub);
          setRawAdditives(rawAdds);

          // ===== SET FORM DEFAULTS =====
          // Initialize form with default values from server
          setCategory(defaults.category);
          setSubCategory(defaults.subCategory);
          setGloss(defaults.gloss);
          setGlossInput(defaults.gloss ? String(defaults.gloss) : '');
          setTints(defaults.tints);
          setBinders(defaults.binders);
          setAdditives(defaults.additives);
          setRemarks(defaults.remarks);
          
          // Merge metadata defaults with existing meta state
          setMeta((m) => ({
            ...m,
            ...metaDefaults,
            date: metaDefaults.date || m.date,
          }));
        }
      } catch (err) {
        if (!cancelled) {
          // ===== ERROR HANDLING =====
          console.error('Failed to load masters', err);
          setMastersError('Failed to load data.');
          
          // Set fallback sensible defaults when server data fails to load
          setCategoryOptions(['100 - Paints', '200 - Primers']);
          setSubCategoryOptions(['Rosner_Acrylic', 'Rosner_PU']);
          setCategory('100 - Paints');
          setSubCategory('Rosner_Acrylic');
          setGloss(0);
          setGlossInput('');
          setTints(normalizeTints([createEmptyTint(1)]));
        }
      } finally {
        // Always clean up loading state unless component was unmounted
        if (!cancelled) setLoadingMasters(false);
      }
    })();
    // Cleanup function to prevent state updates after component unmount
    return () => { cancelled = true; };
  }, []); // Empty dependency array - only run on mount

  /**
   * Updates subcategory options when the main category changes
   * Ensures subcategory selection remains valid for the selected category
   */
  useEffect(() => {
    console.log('[CreateFormula] Category changed to:', category);
    console.log('[CreateFormula] Available subCategoriesByCategory:', subCategoriesByCategory);
    
    const subs = subCategoriesByCategory[category] || [];
    const nextOptions = Array.isArray(subs) ? subs : [];
    
    console.log('[CreateFormula] Found subcategories for category:', category, '->', nextOptions);
    
    setSubCategoryOptions(nextOptions);
    
    // Reset subcategory if current selection is no longer valid
    if (!nextOptions.includes(subCategory)) {
      console.log('[CreateFormula] Current subcategory not in new options, resetting to:', nextOptions[0] || '');
      setSubCategory(nextOptions[0] || '');
    }
  }, [category, subCategoriesByCategory]);

  /**
   * Updates filtered products when subcategory changes
   * Loads products specific to the selected subcategory for product search
   */
  useEffect(() => {
    console.log('[CreateFormula] Subcategory changed to:', subCategory);
    console.log('[CreateFormula] Available productsBySubCategory:', productsBySubCategory);
    
    if (subCategory && productsBySubCategory[subCategory]) {
      const productsForSubCategory = productsBySubCategory[subCategory];
      console.log('[CreateFormula] Products for subcategory:', subCategory, '->', productsForSubCategory.length, 'products');
      console.log('[CreateFormula] Sample products:', productsForSubCategory.slice(0, 3));
      setFilteredProducts(productsForSubCategory);
    } else {
      console.log('[CreateFormula] No products found for subcategory:', subCategory);
      console.log('[CreateFormula] Available subcategories with products:', Object.keys(productsBySubCategory).filter(key => productsBySubCategory[key].length > 0));
      setFilteredProducts([]);
    }
  }, [subCategory, productsBySubCategory]);

  // ===== PRODUCT SEARCH & SELECTION =====
  
  /**
   * Handles product search input and filters products based on search term
   * Searches across Product_Id, Abbreviation, and Product_Name fields
   * Filters out already selected products to prevent duplicates
   * @param {string} tintId - ID of the tinter row being searched
   * @param {string} searchTerm - Search term entered by user
   */
  const handleProductSearch = (tintId, searchTerm) => {
    setProductSearchInput(prev => ({ ...prev, [tintId]: searchTerm }));
    
    // Always show the product list when focusing on the input
    setShowProductList(prev => ({ ...prev, [tintId]: true }));
    
    // Reset dropdown selection when searching
    setSelectedDropdownIndex(prev => ({ ...prev, [tintId]: 0 }));
    
    if (!searchTerm.trim()) {
      // Show all products for the current subcategory when no search term
      const availableProducts = productsBySubCategory[subCategory] || [];
      // Filter out already selected products
      const filtered = availableProducts.filter(product => 
        !tints.some(tint => tint._id !== tintId && tint.code === product.Product_Id)
      );
      setFilteredProducts(filtered);
      console.log('[CreateFormula] No search term, showing available products:', filtered.length, 'products');
      return;
    }

    const availableProducts = productsBySubCategory[subCategory] || [];
    console.log('[CreateFormula] Searching for:', searchTerm, 'in', availableProducts.length, 'available products');
    
    // Filter products by search term (case-insensitive) and exclude already selected
    const filtered = availableProducts.filter(product => {
      const matchesSearch = product.Product_Id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.Abbreviation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.Product_Name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const notAlreadySelected = !tints.some(tint => tint._id !== tintId && tint.code === product.Product_Id);
      
      return matchesSearch && notAlreadySelected;
    });
    
    console.log('[CreateFormula] Search results:', filtered.length, 'products found');
    setFilteredProducts(filtered);
  };

  /**
   * Calculates the position for the product dropdown relative to the input field
   * Ensures dropdown appears below and aligned with the search input
   * @param {string} tintId - ID of the tinter row
   * @param {Event} event - Focus event from the input field
   */
  const calculateDropdownPosition = (tintId, event) => {
    const rect = event.target.getBoundingClientRect();
    const top = rect.bottom + window.scrollY;
    const left = rect.left + window.scrollX;
    
    setDropdownPosition(prev => ({
      ...prev,
      [tintId]: { top, left }
    }));
  };

  /**
   * Handles product selection from the dropdown
   * Updates the tinter row with selected product properties
   * @param {string} tintId - ID of the tinter row
   * @param {Object} product - Selected product object with metadata
   */
  const selectProduct = (tintId, product) => {
    // Update tinter row with product information
    updateTint(tintId, 'code', product.Product_Id || '');
    updateTint(tintId, 'series', product.Abbreviation || ''); // Map Abbreviation to series field
    updateTint(tintId, 'name', product.Product_Name || '');
    updateTint(tintId, 'coefficient', Number(product.coefficient || 1));
    updateTint(tintId, 'Product_Density', Number(product.Product_Density || 0));
    updateTint(tintId, 'SolidContent', Number(product.SolidContent || 0));
    updateTint(tintId, 'VOC', Number(product.VOC || 0));
    
    // Keep dropdown open and show selected product in search input
    setProductSearchInput(prev => ({ ...prev, [tintId]: product.Product_Id || '' }));
    
    // Hide dropdown after selection
    setShowProductList(prev => ({ ...prev, [tintId]: false }));
    
    // Focus on the first quantity input for this tinter
    setTimeout(() => {
      const quantityInput = document.querySelector(`input[data-tint-id="${tintId}"][data-qty-index="0"]`);
      if (quantityInput) {
        quantityInput.focus();
      }
    }, 100);
    
    console.log('[CreateFormula] Selected product for tint', tintId, ':', product);
  };

  /**
   * Handles keyboard navigation in the product dropdown
   * @param {string} tintId - ID of the tinter row
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleProductDropdownKeyDown = (tintId, event) => {
    const currentIndex = selectedDropdownIndex[tintId] || 0;
    const maxIndex = filteredProducts.length - 1;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, maxIndex);
        setSelectedDropdownIndex(prev => ({ ...prev, [tintId]: nextIndex }));
        // Auto-scroll to keep selected item visible
        setTimeout(() => scrollToSelectedItem(tintId, nextIndex), 0);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        setSelectedDropdownIndex(prev => ({ ...prev, [tintId]: prevIndex }));
        // Auto-scroll to keep selected item visible
        setTimeout(() => scrollToSelectedItem(tintId, prevIndex), 0);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (filteredProducts.length > 0 && currentIndex >= 0 && currentIndex < filteredProducts.length) {
          selectProduct(tintId, filteredProducts[currentIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setShowProductList(prev => ({ ...prev, [tintId]: false }));
        break;
    }
  };

  /**
   * Scrolls the dropdown to keep the selected item visible
   * @param {string} tintId - ID of the tinter row
   * @param {number} selectedIndex - Index of the selected item
   */
  const scrollToSelectedItem = (tintId, selectedIndex) => {
    const dropdown = document.querySelector(`[data-product-dropdown][data-tint-id="${tintId}"]`);
    if (!dropdown) return;
    
    const selectedElement = dropdown.querySelector(`[data-product-index="${selectedIndex}"]`);
    if (!selectedElement) return;
    
    // Use scrollIntoView with smooth behavior to keep the selected item visible
    selectedElement.scrollIntoView({ 
      block: 'nearest', 
      behavior: 'smooth',
      inline: 'nearest'
    });
  };

  /**
   * Checks if a product is already selected in another tinter row
   * @param {string} productId - Product ID to check
   * @param {string} currentTintId - Current tinter row ID (to exclude from check)
   * @returns {boolean} True if product is already selected elsewhere
   */
  const isProductAlreadySelected = (productId, currentTintId) => {
    return tints.some(tint => tint._id !== currentTintId && tint.code === productId);
  };

  /**
   * Handles input change with duplicate detection
   * @param {string} tintId - ID of the tinter row
   * @param {string} value - Input value
   */
  const handleProductInputChange = (tintId, value) => {
    setProductSearchInput(prev => ({ ...prev, [tintId]: value }));
    updateTint(tintId, 'code', value);
    
    // Check if this product is already selected elsewhere
    if (value.trim() && isProductAlreadySelected(value.trim(), tintId)) {
      // Find the tinter row that has this product
      const existingTint = tints.find(tint => tint._id !== tintId && tint.code === value.trim());
      if (existingTint) {
        // Focus on the quantity inputs of the existing tinter
        setTimeout(() => {
          const quantityInput = document.querySelector(`input[data-tint-id="${existingTint._id}"][data-qty-index="0"]`);
          if (quantityInput) {
            quantityInput.focus();
          }
        }, 100);
        
        // Clear the current input since it's a duplicate
        setProductSearchInput(prev => ({ ...prev, [tintId]: '' }));
        updateTint(tintId, 'code', '');
        
        alert(`Product ${value.trim()} is already selected in row ${existingTint.sl}. Please use that row to enter quantities.`);
        return;
      }
    }
    
    handleProductSearch(tintId, value);
  };

  // ===== COMPUTED VALUES & TOTALS =====
  
  /**
   * Total grams of all tinters (without binders and additives)
   * Used for calculations and display
   */
  const totalWithoutAdditives = useMemo(
    () => tints.reduce((sum, t) => sum + Number(t.grams || 0), 0),
    [tints]
  );
  
  /**
   * Total grams of all binders
   * Used for calculations and display
   */
  const bindersTotal = useMemo(
    () => binders.reduce((sum, b) => sum + Number(b.grams || 0), 0),
    [binders]
  );
  
  /**
   * Total volume of all binders
   * Used for calculations and display
   */
  const bindersTotalVolume = useMemo(
    () => binders.reduce((sum, b) => sum + Number(b.volume || 0), 0),
    [binders]
  );
  
  /**
   * Total volume of all tinters (without binders and additives)
   * Used for calculations and display
   */
  const totalWithoutAdditivesVolume = useMemo(
    () => tints.reduce((sum, t) => sum + Number(t.volume || 0), 0),
    [tints]
  );



  // ===== STATE UPDATE FUNCTIONS =====
  
  /**
   * Updates metadata fields (customer info, project details, etc.)
   * @param {string} key - Field name to update
   * @param {any} value - New value for the field
   */
  const updateMeta = (key, value) => setMeta((m) => ({ ...m, [key]: value }));

  /**
   * Updates a specific field in a tinter row
   * Automatically adds a new empty row when editing the last row with input
   * @param {string} _id - Unique identifier of the tinter row
   * @param {string} key - Field name to update (code, series, name, etc.)
   * @param {any} value - New value for the field
   */
  const updateTint = (_id, key, value) => {
    setTints((prev) => {
      // Check if we're editing the last row
      const isEditingLastRow = prev[prev.length - 1]?._id === _id;
      const updated = prev.map((t) => (t._id === _id ? { ...t, [key]: value } : t));
      
      if (isEditingLastRow) {
        const last = updated[updated.length - 1];
        // Check if the last row has any meaningful input
        const hasAnyInput = Boolean(
          (last.code && last.code.trim()) ||
            (last.series && last.series.trim()) ||
            (last.name && last.name.trim()) ||
            Number(last.grams) > 0 ||
            Number(last.volume) > 0
        );
        
        // Add new empty row if current row has input
        if (hasAnyInput) {
          const nextIndex = updated.length + 1;
          return [...updated, createEmptyTint(nextIndex)];
        }
      }
      return updated;
    });
  };

  /**
   * Updates quantity values for a specific tinter row
   * Recalculates grams and volume based on new quantities
   * Automatically adds new row when editing last row with input
   * @param {string} _id - Unique identifier of the tinter row
   * @param {number} colIndex - Column index (0-5) for the quantity field
   * @param {number} value - New quantity value
   */
  const updateTintQty = (_id, colIndex, value) => {
    setTints((prev) => {
      const updated = prev.map((t) => {
        if (t._id !== _id) return t;
        
        // Update quantity array
        const nextQty = [...t.qty];
        nextQty[colIndex] = Number(value) || 0;
        
        // Recalculate derived values (grams and volume) using the calculation engine
        // Note: grams/volume are derived; keep for legacy but not trusted for UI
        const derived = computeTinterRow({ 
          qty: nextQty, 
          coefficient: t.coefficient, 
          Product_Density: t.Product_Density, 
          SolidContent: t.SolidContent, 
          VOC: t.VOC 
        });
        
        // Debug logging for volume calculation
        if (derived.grams > 0) {
          console.log('[Volume Debug] Tinter:', t.name, 'Density:', t.Product_Density, 'g/mL, Grams:', derived.grams, 'g, Volume:', derived.volumeL, 'L');
        }
        
        return { ...t, qty: nextQty, grams: derived.grams, volume: derived.volumeL };
      });

      // Check if we need to add a new row
      const last = updated[updated.length - 1];
      const hasQtyInput = last.qty.some((v) => Number(v) > 0);
      const hasMeta = Boolean((last.code && last.code.trim()) || (last.series && last.series.trim()) || (last.name && last.name.trim()));
      
      // Add new row if editing last row and it has input
      if (hasQtyInput || hasMeta) {
        if (prev[prev.length - 1]?._id === _id) {
          return [...updated, createEmptyTint(updated.length + 1)];
        }
      }
      return updated;
    });
  };

  // ===== BINDER MANAGEMENT =====
  
  /**
   * Adds a new empty binder row to the formula
   */
  const addBinder = () => setBinders((prev) => [...prev, { _id: cryptoRandomId(), name: '', grams: 0, volume: 0 }]);
  
  /**
   * Updates a specific field in a binder row
   * @param {string} _id - Unique identifier of the binder
   * @param {string} key - Field name to update
   * @param {any} value - New value for the field
   */
  const updateBinder = (_id, key, value) => setBinders((prev) => prev.map((b) => (b._id === _id ? { ...b, [key]: value } : b)));
  
  /**
   * Removes a binder row from the formula
   * @param {string} _id - Unique identifier of the binder to remove
   */
  const removeBinder = (_id) => setBinders((prev) => prev.filter((b) => b._id !== _id));

  // ===== ADDITIVE MANAGEMENT =====
  
  /**
   * Adds a new empty additive row to the formula
   */
  const addAdditive = () => setAdditives((prev) => [...prev, { _id: cryptoRandomId(), name: '', percent: 0, grams: 0 }]);
  
  /**
   * Adds a new additive row with data from master data
   * @param {Object} additiveData - Raw additive data from API
   * @param {string} additiveId - Additive ID
   */
  const addAdditiveWithData = (additiveData, additiveId) => {
    const newAdditive = {
      _id: cryptoRandomId(),
      additiveId: additiveId,
      name: additiveData.Additive_Name || '',
      percent: 0,
      grams: 0,
      Additive_Density: Number(additiveData.Additive_Density || 1000),
      SolidContent: Number(additiveData.SolidContent || 0),
      VOC: Number(additiveData.VOC || 0),
    };
    setAdditives((prev) => [...prev, newAdditive]);
  };
  
  /**
   * Updates a specific field in an additive row
   * @param {string} _id - Unique identifier of the additive
   * @param {string} key - Field name to update
   * @param {any} value - New value for the field
   */
  const updateAdditive = (_id, key, value) => setAdditives((prev) => prev.map((a) => (a._id === _id ? { ...a, [key]: value } : a)));
  
     /**
    * Removes an additive row from the formula
    * @param {string} _id - Unique identifier of the additive to remove
    */
   const removeAdditive = (_id) => setAdditives((prev) => prev.filter((a) => a._id !== _id));

  // ===== FILE ATTACHMENT HANDLING =====
  
  /**
   * Handles file attachment upload and preview generation
   * Creates a preview for immediate display and uploads to server
   * @param {File} file - File object to attach
   */
  const onAttach = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    
    // Create preview for immediate display
    const reader = new FileReader();
    reader.onload = (e) => setAttachment({ file, preview: String(e.target?.result || '') });
    reader.readAsDataURL(file);
    
    try {
      // Upload file to server
      const uploaded = await FormulaService.uploadAttachment(file);
      setUploadedAttachment(uploaded);
    } catch (e) {
      console.error('Attachment upload failed', e);
    } finally {
      setIsUploading(false);
    }
  };

  // ===== FORM RESET & CLEARING =====
  
  /**
   * Resets the entire formula to initial state
   * Clears all inputs and resets to default values
   */
  const clearAll = () => {
    // Reset metadata to defaults
    setMeta({ 
      date: new Date().toISOString().slice(0, 10), 
      fileNo: '', 
      customerName: '', 
      colorCode: '', 
      colorName: '', 
      customerRef: '', 
      projectNo: '' 
    });
    
    // Reset category and subcategory selections
    setCategory(categoryOptions[0] || '100 - Paints');
    const subs = subCategoriesByCategory[categoryOptions[0]] || subCategoryOptions;
    setSubCategory((Array.isArray(subs) && subs[0]) || 'Rosner_Acrylic');
    
    // Reset formula components
    setGloss(0);
    setTints([createEmptyTint(1)]);
    setBinders([]);
    setAdditives([]);
    setRemarks('');
    
    // Clear attachments
    setAttachment({ file: null, preview: '' });
    setUploadedAttachment(null);
  };

  // ===== DERIVED COMPUTATIONS =====
  // These useMemo hooks calculate derived values from the formula data
  // They automatically recalculate when their dependencies change
  
  /**
   * Calculates totals for all tinters including grams, volume, and quality metrics
   * Uses the tinters calculation engine for accurate computations
   */
  const tinterTotals = useMemo(() => computeTinters(tints), [tints]);

  /**
   * Selects and configures binder settings based on the current subcategory
   * Applies default values and ensures consistent configuration
   */
  const selectedBinderConfig = useMemo(() => {
    const cfg = binderConfigBySubCategory?.[subCategory] || {};
    
    // Matt/Gloss handling logic based on subcategory (Scenario 1, 2, 3)
    let mattGlossValue = 1; // Default value for Scenario 3
    
    if (cfg?.Matt) {
      // Scenario 1: Subcategory with Matt Input
      mattGlossValue = gloss;
    } else if (cfg?.Gloss) {
      // Scenario 2: Subcategory with Gloss Input
      mattGlossValue = gloss;
    } else {
      // Scenario 3: No Matt/Gloss (Default) - multiplier = 1
      mattGlossValue = 1;
    }
    
    const config = {
      ...cfg,
      Binder2Equation: cfg?.Binder2EQ1 ? 'Eq1' : 'Eq2',
      MattValue: mattGlossValue, // Used ONLY in Binder1 calculation
    };
    
    // Debug logging for binder configuration
    console.log('[Binder Config] Subcategory:', subCategory, {
      hasMatt: !!cfg?.Matt,
      hasGloss: !!cfg?.Gloss,
      hasBinder1: !!cfg?.Binder1,
      hasBinder2: !!cfg?.Binder2,
      mattGlossValue,
      Binder1Avalue: cfg?.Binder1Avalue,
      Binder1Bvalue: cfg?.Binder1Bvalue,
      Binder1Cvalue: cfg?.Binder1Cvalue,
      Binder1dvalue: cfg?.Binder1dvalue,
      Binder2Avalue: cfg?.Binder2Avalue,
      Binder2EQ1: cfg?.Binder2EQ1,
    });
    
    return config;
  }, [binderConfigBySubCategory, subCategory, gloss]);

  /**
   * Calculates binder requirements based on tinter totals and configuration
   * Determines how much of each binder type is needed
   */
  const binderTotals = useMemo(() => computeBinders(tinterTotals.totalGrams, selectedBinderConfig), [tinterTotals.totalGrams, selectedBinderConfig]);
  
  /**
   * Calculates additive requirements based on total formula weight
   * Considers both tinter and binder contributions
   */
  const additiveTotals = useMemo(() => {
    // Base mass for additive calculation = Total Tinter Grams + Total Binder Grams
    const baseMass = tinterTotals.totalGrams + binderTotals.totalBinderGrams;
    
    // Debug logging for additive calculations
    if (additives.length > 0) {
      console.log('[Additive Totals Debug] Inputs:', {
        additives: additives.map(a => ({ _id: a._id, name: a.name, percent: a.percent, additiveId: a.additiveId })),
        baseMass,
        tinterTotals: tinterTotals.totalGrams,
        binderTotals: binderTotals.totalBinderGrams
      });
    }
    
    const result = computeAdditives(additives, baseMass);
    
    if (additives.length > 0) {
      console.log('[Additive Totals Debug] Result:', result);
    }
    
    return result;
  }, [additives, tinterTotals.totalGrams, binderTotals.totalBinderGrams]);
  
  /**
   * Total grams of all additives
   * Used for calculations and display
   */
  const additivesTotal = additiveTotals.totalAdditiveGrams;
  
  /**
   * Computes final totals for the entire formula
   * Combines tinter, binder, and additive totals
   */
  const finalTotals = useMemo(() => computeFinalTotals(
    { totalGrams: tinterTotals.totalGrams, totalVolumeL: tinterTotals.totalVolumeL }, 
    { totalBinderGrams: binderTotals.totalBinderGrams, totalBinderVolumeL: binderTotals.totalBinderVolumeL }, 
    { totalAdditiveGrams: additiveTotals.totalAdditiveGrams, totalAdditiveVolumeL: additiveTotals.totalAdditiveVolumeL }
  ), [tinterTotals, binderTotals, additiveTotals]);
  
  // Grand totals for the entire formula
  const grandTotal = finalTotals.finalGrams;
  const grandTotalVolume = finalTotals.finalVolumeL;
  
  /**
   * Calculates quality metrics for the final formula
   * Includes solid content percentage, density, and VOC content
   */
  const quality = useMemo(() => computeQualityMetrics({ 
    finalGrams: finalTotals.finalGrams, 
    finalVolumeL: finalTotals.finalVolumeL, 
    totalSolidMass: tinterTotals.totalSolidMass, 
    totalVOCmass: tinterTotals.totalVOCMass 
  }), [finalTotals, tinterTotals]);
  
  /**
   * Calculates quality metrics for the formula
   * Includes solid content percentage, VOC content, and density
   */
  const metrics = useMemo(() => {
    const solidContent = quality.solidsPercent.toFixed(2);
    const voc = quality.voc_gPerL.toFixed(3);
    const density = quality.density_gPerL.toFixed(3);
    return { solidContent, voc, density };
  }, [quality]);

  // ===== VALIDATION & ERROR CHECKING =====
  // These useMemo hooks validate formula data and identify issues
  
  /**
   * Validates tinter data for completeness and correctness
   * Checks for missing density values, duplicate products, etc.
   */
  const tinterErrors = useMemo(() => validateTinters(tints), [tints]);
  
  /**
   * Validates binder configuration for the selected subcategory
   * Ensures all required binder settings are properly configured
   */
  const binderErrors = useMemo(() => validateBinders(selectedBinderConfig), [selectedBinderConfig]);
  
  /**
   * Validates final quality metrics against acceptable ranges
   * Provides warnings for values that may cause issues
   */
  const metricWarnings = useMemo(() => validateMetrics({ 
    solidsPercent: quality.solidsPercent, 
    density_gPerL: quality.density_gPerL, 
    voc_gPerL: quality.voc_gPerL 
  }), [quality]);
  
  /**
   * Determines if there are any blocking errors that prevent formula saving
   * Includes validation errors, missing data, and invalid calculations
   */
  const hasBlockingErrors = loadingMasters || 
    tinterErrors.some(e => e.type === 'missing-density' || e.type === 'duplicate-product') || 
    binderErrors.length > 0 || 
    !(finalTotals.finalVolumeL > 0) || 
    !(finalTotals.finalGrams > 0);

  // ===== FORMULA SAVING =====
  
  /**
   * Saves the current formula to the server
   * Constructs a comprehensive payload with all formula data
   * Handles success/error states and user feedback
   */
  const save = async () => {
    setIsSaving(true);
    
    // Construct the complete formula payload
    const payload = {
      // Basic metadata (customer info, project details)
      meta,
      
      // Formula header information
      header: { category, subCategory, gloss },
      
      // Core formula components
      tints, // Tinter selections and quantities
      
      // Calculated binder requirements
      binders: [
        { name: 'Binder 1', grams: binderTotals.binder1, volume: binderTotals.binder1VolumeL },
        { name: 'Binder 2', grams: binderTotals.binder2, volume: binderTotals.binder2VolumeL },
      ],
      
      // Additive selections and percentages
      additives,
      
      // Comprehensive totals for all components
      totals: {
        tinter: { grams: tinterTotals.totalGrams, volumeL: tinterTotals.totalVolumeL },
        binder: { grams: binderTotals.totalBinderGrams, volumeL: binderTotals.totalBinderVolumeL },
        additive: { grams: additiveTotals.totalAdditiveGrams, volumeL: additiveTotals.totalAdditiveVolumeL },
        final: { grams: finalTotals.finalGrams, volumeL: finalTotals.finalVolumeL },
      },
      
      // Additional information
      remarks,
      
      // Quality metrics for the final formula
      metrics: {
        solidsPercent: quality.solidsPercent,
        density_gPerL: quality.density_gPerL,
        voc_gPerL: quality.voc_gPerL,
      },
      
      // File attachment if provided
      attachment: uploadedAttachment || undefined,
    };
    
    try {
      // Send formula to server via API service
      const res = await FormulaService.createFormula(payload);
      
      if (res?.status) {
        alert('Formula saved successfully');
      } else {
        alert(res?.message || 'Save failed');
      }
    } catch (e) {
      console.error('Save error', e);
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ===== RENDER =====
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Page header with navigation */}
      <Header />
      
      {/* Loading overlay for async operations */}
      <LoadingOverlay 
        isLoading={loadingMasters || isSaving || isUploading} 
        message={
          loadingMasters ? "Loading master data..." :
          isSaving ? "Saving formula..." :
          isUploading ? "Uploading attachment..." :
          "Loading..."
        }
      />
      
      {/* Page Toolbar - Main actions and title */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page title */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Formula</h1>
          
          {/* Action buttons */}
          <div className="flex space-x-3">
            {/* Clear All button - resets entire form */}
            <button 
              onClick={clearAll} 
              disabled={isSaving || isUploading}
              className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
            
            {/* Save button - submits formula to server */}
            <button 
              onClick={save} 
              disabled={hasBlockingErrors || isSaving || isUploading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Formula metadata and configuration */}
          <div className="col-span-2 space-y-4">
            {/* Formula Metadata Form */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <div className="space-y-3">
                {/* Formula Date - Auto-filled with current date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="text"
                    value={meta.date}
                    onChange={(e) => updateMeta('date', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  />
                </div>
                {/* File Number - Unique identifier for the formula */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">File no.</label>
                  <input
                    type="text"
                    value={meta.fileNo}
                    onChange={(e) => updateMeta('fileNo', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-500 text-white"
                  />
                </div>
                
                {/* Customer Name - Client or customer information */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={meta.customerName}
                    onChange={(e) => updateMeta('customerName', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  />
                </div>
                
                {/* Color Code - Technical color identifier */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color Code</label>
                  <input
                    type="text"
                    value={meta.colorCode}
                    onChange={(e) => updateMeta('colorCode', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  />
                </div>
                
                {/* Color Name - Human-readable color description */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color Name</label>
                  <input
                    type="text"
                    value={meta.colorName}
                    onChange={(e) => updateMeta('colorName', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                {/* Customer Reference - Additional customer identifier */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Ref</label>
                  <input
                    type="text"
                    value={meta.customerRef}
                    onChange={(e) => updateMeta('customerRef', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                {/* Project Number - Project identifier or reference */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Project No</label>
                  <input
                    type="text"
                    value={meta.projectNo}
                    onChange={(e) => updateMeta('projectNo', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* File Attachments Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</h3>
              
              {/* File upload area with drag-and-drop styling */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-6 text-center">
                {/* Hidden file input for file selection */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="attachment"
                  onChange={(e) => onAttach(e.target.files?.[0] || null)}
                />
                
                {/* Clickable upload area */}
                <label htmlFor="attachment" className="cursor-pointer">
                  {attachment.preview ? (
                    // Show image preview if file is selected
                    <img src={attachment.preview} alt="preview" className="w-full h-24 object-cover rounded" />
                  ) : (
                    // Show upload prompt if no file selected
                    <>
                      <div className="text-2xl text-gray-400 mb-2">📁</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Click to upload image</div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Quality Metrics Display */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Metrics</h3>
              <div className="space-y-3">
                {/* Solid Content Percentage - Calculated from binder content */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Solid Content(%):</span>
                  <div className="flex items-center space-x-1">
                    <input
                      readOnly
                      value={metrics.solidContent}
                      className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">%</span>
                  </div>
                </div>
                
                {/* VOC Content - Volatile Organic Compounds in g/L */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">VOC (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.voc}
                    className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                  />
                </div>
                
                {/* Density - Formula density in g/L */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Density (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.density}
                    className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                  />
                </div>
                
                {/* Total Sampled Quantity - Sum of all components */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Sampled QTY:</span>
                  <input
                    readOnly
                    value={grandTotal.toFixed(2)}
                    className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-10">
            {/* Formula Configuration Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
              <div className="grid grid-cols-3 gap-4">
                {/* Paint Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                {/* Paint Subcategory Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  >
                    {subCategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                {/* Matt/Gloss Level Input - Dynamic visibility based on subcategory */}
                {(selectedBinderConfig?.Matt || selectedBinderConfig?.Gloss) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {selectedBinderConfig?.Matt ? 'Matt' : 'Gloss'}
                    </label>
                    <input
                      type="text"
                      value={glossInput}
                      onChange={(e) => {
                        const v = sanitizeNumericInput(e.target.value, 'float');
                        setGlossInput(v);
                        setGloss(v === '' ? 0 : Number(v));
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                      placeholder={selectedBinderConfig?.Matt ? 'Enter Matt value' : 'Enter Gloss value'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Main Formula Content Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Tinters Selection and Configuration Table */}
              <div className="col-span-8 bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                {/* Table Header with Column Definitions */}
                <div className="bg-gray-600 text-white">
                  <div className="grid grid-cols-12 text-xs font-medium">
                    {/* Serial Number Column */}
                    <div className="col-span-1 p-2 text-center border-r border-gray-500">SL No.</div>
                    
                    {/* Tinters Information Column - Product details */}
                    <div className="col-span-7 p-2 text-center border-r border-gray-500">Tinters</div>
                    
                    {/* Quantity Display Column - Shows calculated totals */}
                    <div className="col-span-4 p-2">
                      <div className="text-center mb-1">Quantity</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center">Grams (g)</div>
                        <div className="text-center">Volume (L)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-200">
                  {tints.map((tint, index) => (
                    <div key={tint._id} className="grid grid-cols-12 text-xs h-[42px]">
                      <div className="col-span-1 p-2 text-center bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                        {index + 1}
                      </div>
                      <div className="col-span-7 p-2 border-r border-gray-200">
                        <div className="grid grid-cols-12 gap-1">
                          <div className="col-span-3 relative">
                            <input
                              value={productSearchInput[tint._id] !== undefined ? productSearchInput[tint._id] : tint.code}
                              onChange={(e) => {
                                const value = e.target.value;
                                handleProductInputChange(tint._id, value);
                              }}
                              onFocus={(e) => {
                                handleProductSearch(tint._id, productSearchInput[tint._id] || tint.code);
                                calculateDropdownPosition(tint._id, e);
                              }}
                              onKeyDown={(e) => {
                                if (showProductList[tint._id]) {
                                  handleProductDropdownKeyDown(tint._id, e);
                                }
                              }}
                              onBlur={() => {
                                // Delay hiding the dropdown to allow clicking on products
                                setTimeout(() => setShowProductList(prev => ({ ...prev, [tint._id]: false })), 200);
                              }}
                              className="w-full px-1 py-1 text-xs border-0 border-b border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="Product ID"
                            />
                            {/* Product dropdown */}
                            {showProductList[tint._id] && (
                              <div 
                                className="fixed z-[9999] w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg"
                                data-product-dropdown
                                data-tint-id={tint._id}
                                style={{
                                  top: dropdownPosition[tint._id]?.top || 0,
                                  left: dropdownPosition[tint._id]?.left || 0,
                                  position: 'fixed',
                                  zIndex: 9999
                                }}
                              >
                                {filteredProducts.length > 0 ? (
                                  <>
                                    {/* Show selected product at the top if one is selected */}
                                    {tint.code && tint.code.trim() && (
                                      <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700">
                                        <div className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">
                                          Selected Product:
                                        </div>
                                        <div className="font-medium text-sm text-blue-800 dark:text-blue-100">
                                          {tint.series || tint.code}
                                        </div>
                                        <div className="text-xs text-blue-600 dark:text-blue-300 truncate">
                                          {tint.name || 'N/A'}
                                        </div>
                                      </div>
                                    )}
                                    
                                                                         {/* Show all available products */}
                                     {filteredProducts.map((product, idx) => {
                                       const isSelected = product.Product_Id === tint.code;
                                       const isKeyboardSelected = idx === (selectedDropdownIndex[tint._id] || 0);
                                       return (
                                         <div
                                           key={product._id || idx}
                                           data-product-index={idx}
                                           onClick={() => selectProduct(tint._id, product)}
                                           className={`px-3 py-2 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                             isSelected ? 'bg-green-50 dark:bg-green-900' : 
                                             isKeyboardSelected ? 'bg-blue-50 dark:bg-blue-900' : ''
                                           }`}
                                         >
                                           <div className={`font-medium text-sm ${
                                             isSelected 
                                               ? 'text-green-800 dark:text-green-100' 
                                               : isKeyboardSelected
                                               ? 'text-blue-800 dark:text-blue-100'
                                               : 'text-gray-900 dark:text-white'
                                           }`}>
                                             {product.Abbreviation || 'N/A'}
                                             {isSelected && (
                                               <span className="ml-2 text-xs text-green-600 dark:text-green-300">
                                                 ✓ Selected
                                               </span>
                                             )}
                                             {isKeyboardSelected && !isSelected && (
                                               <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">
                                                 ← Use Enter to select
                                               </span>
                                             )}
                                           </div>
                                           <div className={`text-xs truncate ${
                                             isSelected 
                                               ? 'text-green-600 dark:text-green-300' 
                                               : isKeyboardSelected
                                               ? 'text-blue-600 dark:text-blue-300'
                                               : 'text-gray-600 dark:text-gray-400'
                                           }`}>
                                             {product.Product_Name || 'N/A'}
                                           </div>
                                         </div>
                                       );
                                     })}
                                  </>
                                ) : (
                                  <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                                    {tint.code ? (
                                      `No products found for "${tint.code}"`
                                    ) : (
                                      <div>
                                        <div>No products available for subcategory</div>
                                        <div className="text-xs mt-1">"{subCategory}"</div>
                                        <div className="text-xs mt-1 text-gray-400">Try selecting a different subcategory</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="col-span-3">
                            <input
                              value={tint.series}
                              readOnly
                              className="w-full px-1 py-1 text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                          <div className="col-span-6">
                            <input
                              value={tint.name}
                              readOnly
                              className="w-full px-1 py-1 text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-4 p-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center text-sm font-medium text-blue-600">
                            {tint.grams.toFixed(2)} g
                          </div>
                          <div className="text-center text-sm text-gray-800 dark:text-gray-200">
                            {tint.volume.toFixed(4)} L
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Inputs */}
              <div className="col-span-4 bg-white dark:bg-gray-800 rounded shadow p-4 pb-0">
                <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Quantity</div>
                <div className=" mt-4">
                  {tints.map((tint) => (
                    <div key={tint._id} className="grid grid-cols-6 h-[42px] pb-2 gap-1">
                      {tint.qty.map((qty, colIndex) => (
                          <input
                            key={colIndex}
                            type="text"
                            data-tint-id={tint._id}
                            data-qty-index={colIndex}
                            value={
                              qtyInput[tint._id]?.[colIndex] !== undefined
                                ? qtyInput[tint._id][colIndex]
                                : (qty === 0 ? '' : String(qty))
                            }
                            onChange={(e) => {
                              const v = sanitizeNumericInput(e.target.value, 'float');
                              setQtyInput((prev) => {
                                const prevRow = prev[tint._id] ? [...prev[tint._id]] : Array(6).fill('');
                                prevRow[colIndex] = v;
                                return { ...prev, [tint._id]: prevRow };
                              });
                              updateTintQty(tint._id, colIndex, v === '' ? 0 : Number(v));
                            }}
                            className="px-2 py-1 text-xs text-right border-b border-gray-300 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals, Binders and Remarks Section */}
            <div className="grid grid-cols-12 gap-6 mt-6">
              {/* Totals and Binders */}
              <div className="col-span-8 bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                {/* Total without Additives - aligned to quantity columns */}
                <div className="bg-gray-600 text-white p-2">
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 text-sm font-medium">Total without Additives</div>
                    <div className="col-span-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center text-blue-300 font-semibold">{totalWithoutAdditives.toFixed(2)} g</div>
                        <div className="text-center text-sm">{totalWithoutAdditivesVolume.toFixed(4)} L</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Binders - aligned to quantity columns */}
                <div className="bg-gray-500 text-white p-2">
                  <div className="text-sm font-medium mb-2">Binders</div>
                  {/* Binder 1 - Show only if configured in subcategory */}
                  {selectedBinderConfig?.Binder1 && (
                    <div className="grid grid-cols-12 items-center mb-1">
                      <div className="col-span-1"></div>
                      <div className="col-span-7 text-sm">
                        <div className="flex items-center space-x-2">
                          <span>Binder 1:</span>
                          <span className="text-gray-300 font-medium">
                            {getBinderName(selectedBinderConfig.Binder1)}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center text-blue-300 font-semibold">{binderTotals.binder1.toFixed(2)} g</div>
                          <div className="text-center text-sm">{binderTotals.binder1VolumeL.toFixed(4)} L</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Binder 2 - Show only if configured in subcategory */}
                  {selectedBinderConfig?.Binder2 && (
                    <div className="grid grid-cols-12 items-center mb-1">
                      <div className="col-span-1"></div>
                      <div className="col-span-7 text-sm">
                        <div className="flex items-center space-x-2">
                          <span>Binder 2:</span>
                          <span className="text-gray-300 font-medium">
                            {getBinderName(selectedBinderConfig.Binder2)}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center text-blue-300 font-semibold">{binderTotals.binder2.toFixed(2)} g</div>
                          <div className="text-center text-sm">{binderTotals.binder2VolumeL.toFixed(4)} L</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Show message if no binders configured */}
                  {!selectedBinderConfig?.Binder1 && !selectedBinderConfig?.Binder2 && (
                    <div className="grid grid-cols-12 items-center mb-1">
                      <div className="col-span-1"></div>
                      <div className="col-span-7 text-sm text-gray-300">No binders configured for this subcategory</div>
                      <div className="col-span-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center text-gray-300">0.00 g</div>
                          <div className="text-center text-gray-300">0.0000 L</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additives - aligned to quantity columns */}
                <div className="bg-gray-400 text-white p-2">
                  <div className="grid grid-cols-4 mb-2">
                    <div className="text-sm font-medium">Additives</div>
                    <div className="text-center">
                      <select 
                        className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
                        value={selectedAdditiveId}
                        onChange={(e) => {
                          const additiveId = e.target.value;
                          setSelectedAdditiveId(additiveId);
                          if (additiveId) {
                            // Add new additive row if not already present
                            const existingAdditive = additives.find(a => a.additiveId === additiveId);
                            if (!existingAdditive) {
                              const additive = rawAdditives.find(a => a.Additive_Id === additiveId);
                              if (additive) {
                                addAdditiveWithData(additive, additiveId);
                                setAdditivePercentageInput('0'); // Set default percentage
                              }
                            } else {
                              // If additive already exists, set the percentage input to its current value
                              setAdditivePercentageInput(String(existingAdditive.percent || 0));
                            }
                          } else {
                            setAdditivePercentageInput('');
                          }
                        }}
                      >
                        <option value="">Select Additive</option>
                        {rawAdditives.map((additive) => (
                          <option key={additive.Additive_Id} value={additive.Additive_Id}>
                            {additive.Additive_Name} ({additive.Abbreviation || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-center">
                      <input
                        type="text"
                        value={additivePercentageInput}
                        onChange={(e) => {
                          const v = sanitizeNumericInput(e.target.value, 'float');
                          setAdditivePercentageInput(v);
                          // Update additive percentage if additive is selected
                          if (selectedAdditiveId) {
                            const additive = additives.find(a => a.additiveId === selectedAdditiveId);
                            if (additive) {
                              updateAdditive(additive._id, 'percent', v === '' ? 0 : Number(v));
                            }
                          }
                        }}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-xs w-12 text-center"
                        placeholder="0"
                      />
                      <span className="text-sm mx-2">%</span>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => {
                          if (selectedAdditiveId) {
                            const additive = additives.find(a => a.additiveId === selectedAdditiveId);
                            if (additive) {
                              // Update the percentage and clear selection
                              updateAdditive(additive._id, 'percent', Number(additivePercentageInput) || 0);
                              setSelectedAdditiveId('');
                              setAdditivePercentageInput('');
                            }
                          }
                        }}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        disabled={!selectedAdditiveId}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* Individual Additive Rows */}
                  {additives.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {additives.map((additive, index) => {
                        // Find the calculated values for this additive
                        const calculatedRow = additiveTotals.rows.find(row => row.id === additive._id);
                        return (
                          <div key={additive._id} className="grid grid-cols-12 items-center text-xs">
                            <div className="col-span-1 text-center">{index + 1}</div>
                            <div className="col-span-7">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{additive.name}</span>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={additive.percent || 0}
                                    onChange={(e) => {
                                      const v = sanitizeNumericInput(e.target.value, 'float');
                                      updateAdditive(additive._id, 'percent', v === '' ? 0 : Number(v));
                                    }}
                                    className="bg-gray-600 text-white px-2 py-1 rounded text-xs w-12 text-center"
                                    placeholder="0"
                                  />
                                  <span className="text-xs">%</span>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-4">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-center text-blue-300 font-semibold">
                                  {calculatedRow ? calculatedRow.grams.toFixed(2) : '0.00'} g
                                </div>
                                <div className="text-center text-sm">
                                  {calculatedRow ? calculatedRow.volumeL.toFixed(4) : '0.0000'} L
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 text-sm font-medium">Additives Total</div>
                    <div className="col-span-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center text-blue-300 font-semibold">{additiveTotals.totalAdditiveGrams.toFixed(2)} g</div>
                        <div className="text-center text-sm">{additiveTotals.totalAdditiveVolumeL.toFixed(4)} L</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total - aligned to quantity columns */}
                <div className="bg-gray-600 text-white p-2">
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 text-sm font-medium">Total</div>
                    <div className="col-span-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center text-blue-300 font-semibold text-lg">{grandTotal.toFixed(2)} g</div>
                        <div className="text-center text-lg">{grandTotalVolume.toFixed(4)} L</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="col-span-4 bg-white dark:bg-gray-800 rounded shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Remarks</h3>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={10}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded text-sm resize-none dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * CreateFormula Component Summary
 * 
 * This component provides a comprehensive interface for creating paint formulas with:
 * 
 * FEATURES:
 * - Tinter selection with product search and auto-completion
 * - Quantity input with automatic calculations
 * - Binder and additive management
 * - Real-time quality metrics calculation
 * - File attachment support
 * - Comprehensive validation and error checking
 * 
 * STATE MANAGEMENT:
 * - Form data (metadata, tinters, binders, additives)
 * - Master data (categories, products, configurations) - Always fresh from server
 * - UI state (loading, errors, dropdowns)
 * - Computed values (totals, metrics, validations)
 * 
 * CALCULATIONS:
 * - Uses specialized calculation engines for accurate results
 * - Real-time updates as user modifies inputs
 * - Quality metrics (solid content, VOC, density)
 * 
 * VALIDATION:
 * - Input sanitization and validation
 * - Business rule enforcement
 * - Error prevention and user feedback
 * 
 * PERFORMANCE:
 * - Memoized calculations to prevent unnecessary re-computations
 * - Efficient state updates and re-renders
 * - Optimized for large formula management
 * 
 * @author Megapaints Team
 * @version 1.0.0
 * @lastUpdated 2024
 */

export default CreateFormula;