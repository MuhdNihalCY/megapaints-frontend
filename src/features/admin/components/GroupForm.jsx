import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  X,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  FileText,
  Hash,
  Package,
} from 'lucide-react';

const GroupForm = ({ group = null, onClose, onSuccess }) => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    product_types: ['tinters'], // Default to tinters only
    sort_order: 0,
    is_active: true,
  });

  const PRODUCT_TYPES = [
    { value: 'tinters', label: 'Tinters' },
    { value: 'additive', label: 'Additive' },
    { value: 'binder', label: 'Binder' },
    { value: 'auxiliary', label: 'Auxiliary' },
    { value: 'accessory', label: 'Accessory' },
    { value: 'third_party', label: 'Third Party' },
  ];

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        code: group.code || '',
        product_types: group.product_types && Array.isArray(group.product_types) && group.product_types.length > 0
          ? group.product_types
          : ['tinters'], // Default to tinters only
        sort_order: group.sort_order || 0,
        is_active: group.is_active !== undefined ? group.is_active : true,
      });
    }
  }, [group]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
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
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value, 10),
      }));
    } else if (e.target.multiple) {
      // Handle multi-select for product_types
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selectedOptions,
      }));
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

      if (formData.code && formData.code.trim()) {
        submitData.code = formData.code.trim();
      }

      if (formData.sort_order !== undefined && formData.sort_order !== null) {
        submitData.sort_order = parseInt(formData.sort_order, 10);
      }

      if (formData.is_active !== undefined) {
        submitData.is_active = Boolean(formData.is_active);
      }

      let response;
      if (group) {
        // Update existing group
        response = await adminServices.productCatalog.updateGroup(group._id, submitData);
      } else {
        // Create new group
        response = await adminServices.productCatalog.createGroup(submitData);
      }

      if (response.status === 'success') {
        setSuccess(group ? 'Group updated successfully!' : 'Group created successfully!');
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
      console.error('Group operation failed:', err);
      const errorMsg = err.message || 'Operation failed';
      const errorDetails = err.details || [];
      setError(errorDetails.length > 0 
        ? `${errorMsg}: ${errorDetails.join(', ')}`
        : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {group ? 'Edit Group' : 'Add New Group'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {group ? 'Update group information' : 'Create a new product group'}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    Group Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="Enter group name"
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
                    <Hash className="w-4 h-4 mr-2 text-gray-500" />
                    Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.code ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="e.g., PMI"
                  />
                  {validationErrors.code && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.code}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.description ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="Enter group description (optional)"
                  />
                  {validationErrors.description && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.description}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                    Available for Product Types *
                  </label>
                  <select
                    name="product_types"
                    multiple
                    value={formData.product_types}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors min-h-[100px] ${
                      validationErrors.product_types ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                  >
                    {PRODUCT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Hold Ctrl/Cmd to select multiple product types. This group will be available for the selected product types.
                  </p>
                  {validationErrors.product_types && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.product_types}
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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Group</span>
              </label>
            </div>

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
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {group ? 'Update Group' : 'Create Group'}
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

export default GroupForm;

