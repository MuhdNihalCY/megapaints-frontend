import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  X,
  Beaker,
  Hash,
  FileText,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  FlaskConical,
} from 'lucide-react';

const UNITS = ['kg', 'g', 'L', 'mL', 'piece', 'set', 'box', 'unit'];

const AdditiveForm = ({ additive = null, onClose, onSuccess }) => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    chemical_formula: '',
    base_price: '',
    unit: 'kg',
    is_active: true,
  });

  useEffect(() => {
    if (additive) {
      setFormData({
        name: additive.name || '',
        code: additive.code || '',
        description: additive.description || '',
        category: additive.category || '',
        chemical_formula: additive.chemical_formula || '',
        base_price: additive.unit_price || '',
        unit: additive.unit || 'kg',
        is_active: additive.is_active !== undefined ? additive.is_active : true,
      });
    }
  }, [additive]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    }

    if (!formData.base_price || parseFloat(formData.base_price) < 0) {
      errors.base_price = 'Base price must be a non-negative number';
    }

    if (!formData.unit) {
      errors.unit = 'Unit is required';
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
        [name]: value === '' ? '' : parseFloat(value),
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

      // Prepare data for API (backend expects base_price, maps to unit_price)
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        base_price: parseFloat(formData.base_price),
        unit: formData.unit,
        is_active: formData.is_active,
      };

      // Only include optional fields if provided
      if (formData.category) {
        submitData.category = formData.category.trim();
      }

      if (formData.chemical_formula) {
        submitData.chemical_formula = formData.chemical_formula.trim();
      }

      let response;
      if (additive) {
        // Update existing additive
        response = await adminServices.productCatalog.updateAdditive(additive._id, submitData);
      } else {
        // Create new additive
        response = await adminServices.productCatalog.createAdditive(submitData);
      }

      if (response.status === 'success') {
        setSuccess(additive ? 'Additive updated successfully!' : 'Additive created successfully!');
        setTimeout(() => {
          onSuccess && onSuccess(response.data);
          onClose && onClose();
        }, 1500);
      } else {
        setError(response.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Additive operation failed:', err);
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Beaker className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {additive ? 'Edit Additive' : 'Add New Additive'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {additive ? 'Update additive information' : 'Create a new paint additive'}
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
                <Beaker className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Beaker className="w-4 h-4 mr-2 text-gray-500" />
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="Enter additive name"
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
                    Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors uppercase ${
                      validationErrors.code ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="ADD001"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {validationErrors.code && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.code}
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    placeholder="Enter additive description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FlaskConical className="w-4 h-4 mr-2 text-gray-500" />
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    placeholder="Enter category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <FlaskConical className="w-4 h-4 mr-2 text-gray-500" />
                    Chemical Formula
                  </label>
                  <input
                    type="text"
                    name="chemical_formula"
                    value={formData.chemical_formula}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    placeholder="e.g., H2O"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                    Base Price *
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.base_price ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {validationErrors.base_price && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.base_price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                    Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.unit ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  {validationErrors.unit && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.unit}
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
                  className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Additive</span>
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
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {additive ? 'Update Additive' : 'Create Additive'}
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

export default AdditiveForm;

