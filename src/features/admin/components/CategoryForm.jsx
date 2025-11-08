import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  X,
  Folder,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  FileText,
  Hash,
  Layers,
  Package,
  Calculator,
  MessageSquare,
} from 'lucide-react';

const CategoryForm = ({ category = null, parentCategory = null, isSubcategoryMode = false, onClose, onSuccess }) => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [binders, setBinders] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
    // Subcategory-specific fields
    suffix: '',
    brand: '',
    unit: '',
    level_of_shine: '',
    binder_1_id: '',
    binder_2_id: '',
    binder_1_equation_values: {
      valueA: '',
      valueB: '',
      valueC: '',
      valueD: '',
    },
    binder_2_equation_type: '',
    binder_2_equation_values: {
      valueA: '',
    },
    remarks: '',
  });

  useEffect(() => {
    fetchCategories();
    // Fetch binders if this is a subcategory (parentCategory exists, category has parent_id, or isSubcategoryMode)
    if (parentCategory || (category && category.parent_id) || isSubcategoryMode) {
      fetchBinders();
    }
  }, [category, parentCategory, isSubcategoryMode]);

  // Fetch binders when parent_id is set in formData
  useEffect(() => {
    if (formData.parent_id) {
      fetchBinders();
    }
  }, [formData.parent_id]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent_id: category.parent_id?._id || category.parent_id || '',
        image_url: category.image_url || '',
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== undefined ? category.is_active : true,
        // Subcategory-specific fields
        suffix: category.suffix || '',
        brand: category.brand || '',
        unit: category.unit || '',
        level_of_shine: category.level_of_shine || '',
        binder_1_id: category.binder_1_id?._id || category.binder_1_id || '',
        binder_2_id: category.binder_2_id?._id || category.binder_2_id || '',
        binder_1_equation_values: {
          valueA: category.binder_1_equation_values?.valueA || '',
          valueB: category.binder_1_equation_values?.valueB || '',
          valueC: category.binder_1_equation_values?.valueC || '',
          valueD: category.binder_1_equation_values?.valueD || '',
        },
        binder_2_equation_type: category.binder_2_equation_type || '',
        binder_2_equation_values: {
          valueA: category.binder_2_equation_values?.valueA || '',
        },
        remarks: category.remarks || '',
      });
    } else if (parentCategory) {
      setFormData(prev => ({
        ...prev,
        parent_id: parentCategory._id || parentCategory,
      }));
    }
  }, [category, parentCategory]);

  const fetchCategories = async () => {
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.getCategories({ limit: 100 });
      if (response.status === 'success') {
        // Filter out the current category if editing to prevent circular references
        const filteredCategories = category
          ? response.data.categories.filter(cat => cat._id !== category._id)
          : response.data.categories;
        setCategories(filteredCategories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchBinders = async () => {
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.getProducts({
        product_type: 'binder',
        limit: 100,
        is_active: true
      });
      if (response.status === 'success') {
        setBinders(response.data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch binders:', err);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (formData.image_url && !/^https?:\/\/.+/.test(formData.image_url)) {
      errors.image_url = 'Please enter a valid URL';
    }

    if (formData.sort_order < 0) {
      errors.sort_order = 'Sort order must be a non-negative number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      // Handle nested equation values
      if (name.startsWith('binder_1_equation_values.') || name.startsWith('binder_2_equation_values.')) {
        const [parent, field] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: value === '' ? '' : parseFloat(value),
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value === '' ? 0 : parseInt(value, 10),
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleToggleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName] === value ? '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const adminServices = getAdminServices();

      // Prepare data for API - only include fields that have values
      const submitData = {
        name: formData.name.trim(),
      };

      // Only include optional fields if they have values
      if (formData.description && formData.description.trim()) {
        submitData.description = formData.description.trim();
      }

      if (formData.image_url && formData.image_url.trim()) {
        submitData.image_url = formData.image_url.trim();
      }

      if (formData.parent_id && formData.parent_id.trim()) {
        submitData.parent_id = formData.parent_id.trim();
      }

      if (formData.sort_order !== undefined && formData.sort_order !== null) {
        submitData.sort_order = parseInt(formData.sort_order, 10);
      }

      if (formData.is_active !== undefined) {
        submitData.is_active = Boolean(formData.is_active);
      }

      // Only include subcategory-specific fields if parent_id exists
      if (formData.parent_id) {
        if (formData.suffix !== undefined && formData.suffix !== '') {
          submitData.suffix = formData.suffix.trim();
        }
        if (formData.brand !== undefined && formData.brand !== '') {
          submitData.brand = formData.brand;
        }
        if (formData.unit !== undefined && formData.unit !== '') {
          submitData.unit = formData.unit;
        }
        if (formData.level_of_shine !== undefined && formData.level_of_shine !== '') {
          submitData.level_of_shine = formData.level_of_shine;
        }
        if (formData.binder_1_id !== undefined && formData.binder_1_id !== '') {
          submitData.binder_1_id = formData.binder_1_id.trim();
        }
        if (formData.binder_2_id !== undefined && formData.binder_2_id !== '') {
          submitData.binder_2_id = formData.binder_2_id.trim();
        }
        if (formData.binder_1_equation_values) {
          const eq1 = formData.binder_1_equation_values;
          if (eq1.valueA !== '' || eq1.valueB !== '' || eq1.valueC !== '' || eq1.valueD !== '') {
            submitData.binder_1_equation_values = {
              valueA: eq1.valueA !== '' ? parseFloat(eq1.valueA) : null,
              valueB: eq1.valueB !== '' ? parseFloat(eq1.valueB) : null,
              valueC: eq1.valueC !== '' ? parseFloat(eq1.valueC) : null,
              valueD: eq1.valueD !== '' ? parseFloat(eq1.valueD) : null,
            };
          }
        }
        if (formData.binder_2_equation_type !== undefined && formData.binder_2_equation_type !== '') {
          submitData.binder_2_equation_type = formData.binder_2_equation_type;
        }
        if (formData.binder_2_equation_values) {
          const eq2 = formData.binder_2_equation_values;
          if (eq2.valueA !== '') {
            submitData.binder_2_equation_values = {
              valueA: parseFloat(eq2.valueA),
            };
          }
        }
        if (formData.remarks !== undefined && formData.remarks !== '') {
          submitData.remarks = formData.remarks.trim();
        }
      }

      let response;
      if (category) {
        // Update existing category
        response = await adminServices.productCatalog.updateCategory(category._id, submitData);
      } else {
        // Create new category
        response = await adminServices.productCatalog.createCategory(submitData);
      }

      if (response.status === 'success') {
        setSuccess(category ? 'Category updated successfully!' : 'Category created successfully!');
        setTimeout(() => {
          onSuccess && onSuccess(response.data);
          onClose && onClose();
        }, 1500);
      } else {
        const errorMsg = response.message || 'Operation failed';
        const errorDetails = response.details || [];
        setError(errorDetails.length > 0 
          ? `${errorMsg}: ${errorDetails.join(', ')}`
          : errorMsg);
      }
    } catch (err) {
      console.error('Category operation failed:', err);
      const errorMsg = err.message || 'Operation failed';
      const errorDetails = err.details || [];
      setError(errorDetails.length > 0 
        ? `${errorMsg}: ${errorDetails.join(', ')}`
        : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getParentCategoryName = () => {
    if (parentCategory) {
      return parentCategory.name || 'Selected Parent';
    }
    if (formData.parent_id) {
      const parent = categories.find(cat => cat._id === formData.parent_id);
      return parent?.name || 'Selected Parent';
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {category ? 'Edit Category' : parentCategory ? 'Add Subcategory' : 'Add New Category'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category 
                  ? 'Update category information'
                  : parentCategory 
                    ? `Create subcategory under "${parentCategory.name || 'parent'}"`
                    : 'Create a new product category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg text-red-700 dark:text-red-400 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg text-green-700 dark:text-green-400 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Success</p>
                <p className="text-sm mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Parent Category Info */}
          {getParentCategoryName() && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Parent Category: {getParentCategoryName()}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Folder className="w-4 h-4 mr-2 text-gray-500" />
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    validationErrors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                  }`}
                  placeholder="Enter category name"
                />
                {validationErrors.name && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-gray-500" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                  placeholder="Enter category description"
                />
              </div>

              {!parentCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-gray-500" />
                    Parent Category
                  </label>
                  <select
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                  >
                    <option value="">None (Root Category)</option>
                    {categories
                      .filter(cat => !cat.parent_id || !cat.parent_id._id)
                      .map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Leave empty to create a root category
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.image_url ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {validationErrors.image_url && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.image_url}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Hash className="w-4 h-4 mr-2 text-gray-500" />
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.sort_order ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {validationErrors.sort_order && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.sort_order}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Category</span>
              </label>
            </div>

            {/* Subcategory Configuration - Only show when parentCategory exists, category has parent_id, formData has parent_id, or isSubcategoryMode */}
            {(parentCategory || (category && category.parent_id) || (formData.parent_id && formData.parent_id !== '') || isSubcategoryMode) && (
              <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subcategory Configuration</h3>
                </div>

                {/* Suffix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Hash className="w-4 h-4 mr-2 text-gray-500" />
                    Suffix
                  </label>
                  <input
                    type="text"
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    placeholder="A"
                    maxLength={50}
                  />
                </div>

                {/* Brand Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Brand
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleChange('brand', 'mipa')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        formData.brand === 'mipa'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Mipa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('brand', 'rosner')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        formData.brand === 'rosner'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Rosner
                    </button>
                  </div>
                </div>

                {/* Unit Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleChange('unit', 'kg')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        formData.unit === 'kg'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Kilo Gram
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('unit', 'liter')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        formData.unit === 'liter'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Liter
                    </button>
                  </div>
                </div>

                {/* Level of Shine Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level of Shine
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleChange('level_of_shine', 'matt')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        formData.level_of_shine === 'matt'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Matt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleChange('level_of_shine', 'gloss')}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        formData.level_of_shine === 'gloss'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Gloss
                    </button>
                  </div>
                </div>

                {/* Binder 1 Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                    Binder 1
                  </label>
                  <select
                    name="binder_1_id"
                    value={formData.binder_1_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                  >
                    <option value="">Select Binder 1</option>
                    {binders.map(binder => (
                      <option key={binder._id} value={binder._id}>
                        {binder.name} {binder.code ? `(${binder.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Binder 1 Equation Values - Show when binder_1_id is selected */}
                {formData.binder_1_id && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Binder 1 Equation</span>
                    </div>
                    <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <code className="text-xs text-gray-600 dark:text-gray-400">
                        (( Total tinter X valueA X {formData.level_of_shine || 'Gloss or Matt'} ) - (valueB X valueC X Total tinter ) ) /valueD
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          valueA
                        </label>
                        <input
                          type="number"
                          name="binder_1_equation_values.valueA"
                          value={formData.binder_1_equation_values.valueA}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          valueB
                        </label>
                        <input
                          type="number"
                          name="binder_1_equation_values.valueB"
                          value={formData.binder_1_equation_values.valueB}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          valueC
                        </label>
                        <input
                          type="number"
                          name="binder_1_equation_values.valueC"
                          value={formData.binder_1_equation_values.valueC}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          valueD
                        </label>
                        <input
                          type="number"
                          name="binder_1_equation_values.valueD"
                          value={formData.binder_1_equation_values.valueD}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Binder 2 Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                    Binder 2
                  </label>
                  <select
                    name="binder_2_id"
                    value={formData.binder_2_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                  >
                    <option value="">Select Binder 2</option>
                    {binders.map(binder => (
                      <option key={binder._id} value={binder._id}>
                        {binder.name} {binder.code ? `(${binder.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Binder 2 Equation Type and Values - Show when binder_2_id is selected */}
                {formData.binder_2_id && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calculator className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Binder 2 Equation Type</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => handleToggleChange('binder_2_equation_type', 'equation_1')}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                          formData.binder_2_equation_type === 'equation_1'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Equation 1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('binder_2_equation_type', 'equation_2')}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                          formData.binder_2_equation_type === 'equation_2'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Equation 2
                      </button>
                    </div>
                    {formData.binder_2_equation_type && (
                      <>
                        <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                          <code className="text-xs text-gray-600 dark:text-gray-400">
                            {formData.binder_2_equation_type === 'equation_1' 
                              ? '( Total tinter X valueA ) - Value of Binder 1'
                              : 'Total tinter X valueA'
                            }
                          </code>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            valueA
                          </label>
                          <input
                            type="number"
                            name="binder_2_equation_values.valueA"
                            value={formData.binder_2_equation_values.valueA}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    placeholder="Enter any remarks or notes..."
                    maxLength={2000}
                  />
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {category ? 'Update Category' : 'Create Category'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;


