import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  X,
  Package,
  Building2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  Hash,
  Filter,
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';

const InventoryForm = ({ inventory = null, onClose, onSuccess }) => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    branch_id: '',
    product_id: '',
    stock_info: {
      current_stock: 0,
      minimum_stock: 0,
      maximum_stock: 0,
      unit: 'kg',
    },
    bulk_handling: false,
  });
  const [selectedProductType, setSelectedProductType] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (inventory && products.length > 0) {
      const branchId = inventory.branch?._id || inventory.branch?._id?._id;
      const productId = inventory.product?._id || inventory.product?._id?._id;
      const product = products.find(p => (p._id || p._id?._id) === productId);
      if (product) {
        setSelectedProductType(product.item_type || 'product');
      }
      setFormData({
        branch_id: branchId || '',
        product_id: productId || '',
        stock_info: inventory.stock_info || {
          current_stock: 0,
          minimum_stock: 0,
          maximum_stock: 0,
          unit: 'kg',
        },
        bulk_handling: inventory.bulk_handling || false,
      });
    }
  }, [inventory, products]);

  const fetchBranches = async () => {
    try {
      const adminServices = getAdminServices();
      const response = await adminServices.businessManagement.getBranches({ limit: 100 });
      if (response.status === 'success') {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const adminServices = getAdminServices();
      // Fetch products - all-items endpoint allows up to 1000 items for dropdowns
      const response = await adminServices.productCatalog.getAllItems({ limit: 1000, page: 1 });
      if (response.status === 'success') {
        const items = response.data.items || [];
        setProducts(items);
        // If product type is selected, filter products
        if (selectedProductType) {
          setFilteredProducts(items.filter(p => p.item_type === selectedProductType));
        } else {
          setFilteredProducts(items);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Filter products when product type changes
  useEffect(() => {
    if (products.length > 0) {
      if (selectedProductType) {
        setFilteredProducts(products.filter(p => p.item_type === selectedProductType));
        // Clear product selection when type changes (only if not editing)
        if (!inventory) {
          setFormData(prev => ({ ...prev, product_id: '' }));
        }
      } else {
        setFilteredProducts(products);
      }
    }
  }, [selectedProductType, products, inventory]);

  const validateForm = () => {
    const errors = {};

    if (!formData.branch_id) {
      errors.branch_id = 'Branch is required';
    }

    if (!formData.product_id) {
      errors.product_id = 'Product is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('stock_info.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        stock_info: {
          ...prev.stock_info,
          [field]: type === 'number' ? parseFloat(value) || 0 : value,
        },
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

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

      if (inventory) {
        // Update existing inventory
        const branchId = inventory.branch?._id || inventory.branch?._id?._id;
        const productId = inventory.product?._id || inventory.product?._id?._id;
        // Remove pricing from formData before sending
        const { pricing, ...inventoryData } = formData;
        const response = await adminServices.inventoryManagement.updateInventory(
          branchId,
          productId,
          inventoryData
        );

        if (response.status === 'success') {
          setSuccess('Inventory updated successfully!');
          setTimeout(() => {
            onSuccess && onSuccess();
            onClose && onClose();
          }, 1500);
        } else {
          setError(response.message || 'Failed to update inventory');
        }
      } else {
        // Create new inventory (pricing removed - not needed in inventory form)
        const response = await adminServices.inventoryManagement.createInventory({
          branch_id: formData.branch_id,
          product_id: formData.product_id,
          stock_info: formData.stock_info,
          bulk_handling: formData.bulk_handling,
        });

        if (response.status === 'success') {
          setSuccess('Inventory created successfully!');
          setTimeout(() => {
            onSuccess && onSuccess();
            onClose && onClose();
          }, 1500);
        } else {
          setError(response.message || 'Failed to create inventory');
        }
      }
    } catch (err) {
      console.error('Inventory operation failed:', err);
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {inventory ? 'Edit Inventory' : 'Add Inventory'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
              <p className="text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Branch and Product Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Branch"
                  options={branches}
                  value={formData.branch_id}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, branch_id: value }));
                    if (validationErrors.branch_id) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.branch_id;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Search and select branch..."
                  disabled={!!inventory}
                  searchKey="name"
                  displayKey="name"
                  secondaryKey="code"
                  required
                  error={validationErrors.branch_id}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Filter className="w-4 h-4 inline mr-2" />
                    Product Type
                  </label>
                  <select
                    value={selectedProductType}
                    onChange={(e) => setSelectedProductType(e.target.value)}
                    disabled={!!inventory}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option key="all" value="">All Product Types</option>
                    <option key="tinters" value="tinters">Tinters</option>
                    <option key="additive" value="additive">Additive</option>
                    <option key="binder" value="binder">Binder</option>
                    <option key="auxiliary" value="auxiliary">Auxiliary</option>
                    <option key="accessory" value="accessory">Accessory</option>
                    <option key="third_party" value="third_party">Third Party</option>
                  </select>
                </div>
              </div>

              <SearchableSelect
                label="Product"
                options={filteredProducts}
                value={formData.product_id}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, product_id: value }));
                  if (validationErrors.product_id) {
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.product_id;
                      return newErrors;
                    });
                  }
                }}
                placeholder={
                  filteredProducts.length === 0 
                    ? selectedProductType 
                      ? 'No products found for selected type' 
                      : 'Select Product Type first'
                    : 'Search and select product...'
                }
                disabled={!!inventory || filteredProducts.length === 0}
                searchKey="name"
                displayKey="name"
                secondaryKey="code"
                required
                error={validationErrors.product_id}
              />
              {filteredProducts.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    name="stock_info.current_stock"
                    value={formData.stock_info.current_stock}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <select
                    name="stock_info.unit"
                    value={formData.stock_info.unit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="mL">mL</option>
                    <option value="piece">piece</option>
                    <option value="set">set</option>
                    <option value="box">box</option>
                    <option value="unit">unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    name="stock_info.minimum_stock"
                    value={formData.stock_info.minimum_stock}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Stock
                  </label>
                  <input
                    type="number"
                    name="stock_info.maximum_stock"
                    value={formData.stock_info.maximum_stock}
                    onChange={handleInputChange}
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Handling */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="bulk_handling"
                  checked={formData.bulk_handling}
                  onChange={handleInputChange}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bulk Handling</span>
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
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {inventory ? 'Update Inventory' : 'Create Inventory'}
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

export default InventoryForm;

