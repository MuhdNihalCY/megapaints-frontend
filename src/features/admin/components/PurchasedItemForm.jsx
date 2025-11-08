import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  X,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  Package,
  Tag,
  DollarSign,
  Calendar,
  Hash,
  Building2,
} from 'lucide-react';

const PurchasedItemForm = ({ item = null, onClose, onSuccess }) => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplier: '',
    quantity: '',
    unit: 'Ltr',
    price: '',
    date: new Date().toISOString().split('T')[0],
  });

  const UNITS = ['Ltr', 'kg', 'g', 'mL', 'piece', 'set', 'box', 'unit'];

  useEffect(() => {
    fetchCategories();
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        supplier: item.supplier || '',
        quantity: item.quantity || '',
        unit: item.unit || 'Ltr',
        price: item.price || '',
        date: item.date || new Date().toISOString().split('T')[0],
      });
    }
  }, [item]);

  const fetchCategories = async () => {
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.productCatalog.getCategories({ limit: 100 });
      if (response.status === 'success') {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.supplier.trim()) {
      errors.supplier = 'Supplier is required';
    }

    if (!formData.quantity.trim()) {
      errors.quantity = 'Quantity is required';
    } else if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
      errors.quantity = 'Quantity must be a positive number';
    }

    if (!formData.price.trim()) {
      errors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
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
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const adminServices = getAdminServices();
      
      // For now, using mock API - replace with actual API when available
      if (item) {
        // Update purchased item
        // const response = await adminServices.updatePurchasedItem(item._id || item.id, formData);
        setSuccess('Purchased item updated successfully');
      } else {
        // Create purchased item
        // const response = await adminServices.createPurchasedItem(formData);
        setSuccess('Purchased item created successfully');
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Purchased item operation failed:', err);
      setError(err.message || 'Failed to save purchased item. Please try again.');
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
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {item ? 'Edit Purchased Item' : 'Add New Purchased Item'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item ? 'Update purchased item information' : 'Create a new purchased item'}
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
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="Enter item name"
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
                    <Tag className="w-4 h-4 mr-2 text-gray-500" />
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    list="categories"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.category ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="Enter category"
                  />
                  <datalist id="categories">
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name} />
                    ))}
                  </datalist>
                  {validationErrors.category && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                    Supplier *
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.supplier ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="Enter supplier name"
                  />
                  {validationErrors.supplier && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.supplier}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Hash className="w-4 h-4 mr-2 text-gray-500" />
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.quantity ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {validationErrors.quantity && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.quantity}
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
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.price ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {validationErrors.price && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      validationErrors.date ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.date && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{item ? 'Update Item' : 'Create Item'}</span>
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

export default PurchasedItemForm;

