import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Plus, Edit2, Trash2, User, Building, 
  Mail, Phone, MapPin, Calendar, Tag, Eye, EyeOff,
  Users, AlertCircle, CheckCircle
} from 'lucide-react';
import { kanbanService } from '../../services/kanbanService';
import { useAuth } from '../../../../contexts/AuthContext';

// Helper function to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  // MongoDB ObjectId is 24 characters of hexadecimal
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const CustomerManagementModal = ({ isOpen, onClose, onCustomerSelect }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    customer_type: 'business',
    status: 'prospect',
    notes: '',
    tags: []
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load customers
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // DEBUG: Log user object
      console.log('🔍 [CustomerManagementModal] DEBUG - User object:', {
        user: user,
        hasUser: !!user,
        userBranches: user?.branches,
        branchesType: typeof user?.branches,
        isArray: Array.isArray(user?.branches),
        branchesLength: Array.isArray(user?.branches) ? user.branches.length : 'N/A',
        branchesContent: user?.branches,
        userKeys: user ? Object.keys(user) : [],
        userRoles: user?.roles,
        userIsAdmin: user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('super_admin')
      });

      // Get valid branch_id from user context
      let branchId = null;
      
      // Try to get from user.branches
      if (user?.branches && Array.isArray(user.branches) && user.branches.length > 0) {
        const firstBranch = user.branches[0];
        console.log('🔍 [CustomerManagementModal] DEBUG - First branch:', {
          firstBranch,
          firstBranchType: typeof firstBranch,
          isString: typeof firstBranch === 'string',
          isObject: typeof firstBranch === 'object' && firstBranch !== null
        });

        // Handle both string and object formats
        let branchIdStr = null;
        if (typeof firstBranch === 'string') {
          branchIdStr = firstBranch;
          console.log('🔍 [CustomerManagementModal] DEBUG - Branch is string:', branchIdStr);
        } else if (firstBranch && typeof firstBranch === 'object') {
          // Try various possible properties
          branchIdStr = firstBranch._id || firstBranch.id || 
                       (firstBranch.toString && typeof firstBranch.toString === 'function' ? firstBranch.toString() : null);
          console.log('🔍 [CustomerManagementModal] DEBUG - Branch is object:', {
            _id: firstBranch._id,
            id: firstBranch.id,
            toString: firstBranch.toString ? firstBranch.toString() : 'no toString',
            extracted: branchIdStr
          });
        }
        
        if (branchIdStr) {
          const branchIdString = String(branchIdStr);
          console.log('🔍 [CustomerManagementModal] DEBUG - Branch ID string:', branchIdString);
          const isValid = isValidObjectId(branchIdString);
          console.log('🔍 [CustomerManagementModal] DEBUG - Is valid ObjectId:', isValid);
          if (isValid) {
            branchId = branchIdString;
            console.log('✅ [CustomerManagementModal] DEBUG - Using branch_id:', branchId);
          } else {
            console.warn('⚠️ [CustomerManagementModal] DEBUG - Branch ID is not valid ObjectId:', branchIdString);
          }
        } else {
          console.warn('⚠️ [CustomerManagementModal] DEBUG - Could not extract branch ID from firstBranch');
        }
      } else {
        console.warn('⚠️ [CustomerManagementModal] DEBUG - No branches available:', {
          hasBranches: !!user?.branches,
          isArray: Array.isArray(user?.branches),
          length: Array.isArray(user?.branches) ? user.branches.length : 'N/A'
        });
      }

      // Check if user has no branches - prevent API call and show error immediately
      if (!branchId && (!user?.branches || (Array.isArray(user.branches) && user.branches.length === 0))) {
        console.error('❌ [CustomerManagementModal] DEBUG - User has no branches assigned');
        setError('No branch assigned to your account. Please contact an administrator to assign a branch before accessing customers.');
        setCustomers([]);
        setLoading(false);
        return;
      }

      // If we still don't have a valid branch_id, the backend should use req.user.branches[0]
      // But since the backend requires it, we'll include it only if we have it
      const params = {
        ...(branchId ? { branch_id: branchId } : {}),
        ...(searchQuery ? { search: searchQuery } : {})
      };
      
      console.log('🔍 [CustomerManagementModal] DEBUG - Request params:', params);
      console.log('🔍 [CustomerManagementModal] DEBUG - Has branch_id in params:', !!params.branch_id);
      
      const response = await kanbanService.getCustomers(params);
      console.log('✅ [CustomerManagementModal] DEBUG - Successfully loaded customers:', response);
      setCustomers(response.customers || []);
    } catch (err) {
      console.error('❌ [CustomerManagementModal] DEBUG - Failed to load customers:', err);
      
      // The kanbanService.handleError throws a new Error, so we need to check the original error
      // Try to get the original error response from the error object
      const originalError = err.originalError || err.cause || err;
      const errorResponse = originalError?.response?.data || err.response?.data;
      const errorMessage = errorResponse?.message || err.message || 'Failed to load customers';
      const errorDetails = errorResponse?.details || '';
      
      console.error('❌ [CustomerManagementModal] DEBUG - Error response:', errorResponse);
      console.error('❌ [CustomerManagementModal] DEBUG - Error message:', errorMessage);
      console.error('❌ [CustomerManagementModal] DEBUG - Error details:', errorDetails);
      
      // Check if the error is about missing branch
      if (errorMessage.includes('Branch filter required') || errorMessage.includes('Branch ID') || 
          errorDetails.includes('Branch ID must be specified')) {
        // Check if user has no branches assigned
        if (!user?.branches || (Array.isArray(user.branches) && user.branches.length === 0)) {
          setError('No branch assigned to your account. Please contact an administrator to assign a branch before accessing customers.');
        } else {
          setError('Branch ID is required to access customers. Please contact support if this issue persists.');
        }
      } else {
        setError(errorMessage);
      }
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(loadCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    
    if (!newCustomer.name.trim()) {
      setCreateError('Customer name is required');
      return;
    }

    // Get valid branch_id from user context
    let branchId = null;
    if (user?.branches && Array.isArray(user.branches) && user.branches.length > 0) {
      const firstBranch = user.branches[0];
      let branchIdStr = null;
      if (typeof firstBranch === 'string') {
        branchIdStr = firstBranch;
      } else if (firstBranch && typeof firstBranch === 'object') {
        branchIdStr = firstBranch._id || firstBranch.id || 
                     (firstBranch.toString && typeof firstBranch.toString === 'function' ? firstBranch.toString() : null);
      }
      
      if (branchIdStr) {
        const branchIdString = String(branchIdStr);
        if (isValidObjectId(branchIdString)) {
          branchId = branchIdString;
        }
      }
    }

    // Check if user has no branches
    if (!branchId) {
      setCreateError('No branch assigned to your account. Please contact an administrator to assign a branch before creating customers.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      // Include branch_id in the customer data
      const customerData = {
        ...newCustomer,
        branch_id: branchId
      };
      
      const response = await kanbanService.createCustomer(customerData);
      const createdCustomer = response.customer;
      
      setCustomers(prev => [createdCustomer, ...prev]);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        company: '',
        customer_type: 'business',
        status: 'prospect',
        notes: '',
        tags: []
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create customer:', err);
      
      // Get error details from the error object
      const originalError = err.originalError || err.cause || err;
      const errorResponse = originalError?.response?.data || err.response?.data;
      const errorMessage = errorResponse?.message || err.message || 'Failed to create customer';
      const errorDetails = errorResponse?.details || [];
      
      // Handle specific error cases
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setCreateError('A customer with this name already exists. Please choose a different name.');
      } else if (errorMessage.includes('Validation failed') && Array.isArray(errorDetails)) {
        // Show validation errors
        setCreateError(errorDetails.join(', ') || 'Please check your input and try again.');
      } else if (errorMessage.includes('Branch') || errorDetails.some(d => typeof d === 'string' && d.includes('Branch'))) {
        setCreateError('Branch ID is required. Please contact support if this issue persists.');
      } else {
        setCreateError(errorMessage || 'Failed to create customer. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    
    if (!editingCustomer.name.trim()) {
      setUpdateError('Customer name is required');
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      const response = await kanbanService.updateCustomer(editingCustomer._id, editingCustomer);
      
      setCustomers(prev => prev.map(customer => 
        customer._id === editingCustomer._id ? response.customer : customer
      ));
      setShowEditForm(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error('Failed to update customer:', err);
      if (err.response?.data?.message?.includes('already exists')) {
        setUpdateError('A customer with this name already exists. Please choose a different name.');
      } else {
        setUpdateError('Failed to update customer. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      await kanbanService.deleteCustomer(customerId);
      setCustomers(prev => prev.filter(customer => customer._id !== customerId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setError('Failed to delete customer');
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer({ ...customer });
    setShowEditForm(true);
  };

  const handleSelectCustomer = (customer) => {
    if (onCustomerSelect) {
      onCustomerSelect(customer);
    }
    onClose();
  };

  const getCustomerIcon = (customer) => {
    if (customer.customer_type === 'business') {
      return <Building className="w-5 h-5" />;
    }
    return <User className="w-5 h-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      prospect: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      customer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[status] || colors.prospect;
  };

  const getTypeColor = (type) => {
    const colors = {
      individual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      business: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      contractor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      retailer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      wholesaler: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
    };
    return colors[type] || colors.business;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Management
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Left Panel - Customer List */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Search and Actions */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      // Pre-fill the name field with the search query if available
                      if (searchQuery.trim()) {
                        setNewCustomer(prev => ({
                          ...prev,
                          name: searchQuery.trim()
                        }));
                      }
                      setShowCreateForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                </div>
              </div>

              {/* Customer List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    Loading customers...
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600 dark:text-red-400">
                    {error}
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No customers found matching your search.' : 'No customers available.'}
                  </div>
                ) : (
                  <div className="p-2">
                    {customers.map((customer) => (
                      <div
                        key={customer._id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedCustomer?._id === customer._id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-start gap-3">
                          {getCustomerIcon(customer)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {customer.name}
                            </div>
                            {customer.company && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {customer.company}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(customer.status)}`}>
                                {customer.status}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${getTypeColor(customer.customer_type)}`}>
                                {customer.customer_type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCustomer(customer);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(customer);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Customer Details */}
            <div className="w-1/2 flex flex-col">
              {selectedCustomer ? (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Customer Header */}
                    <div className="flex items-start gap-4">
                      {getCustomerIcon(selectedCustomer)}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedCustomer.name}
                        </h3>
                        {selectedCustomer.company && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedCustomer.company}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedCustomer.status)}`}>
                            {selectedCustomer.status}
                          </span>
                          <span className={`text-sm px-3 py-1 rounded-full ${getTypeColor(selectedCustomer.customer_type)}`}>
                            {selectedCustomer.customer_type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectCustomer(selectedCustomer)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Select
                      </button>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Contact Information</h4>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{selectedCustomer.phone}</span>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="text-gray-900 dark:text-white">
                            {selectedCustomer.full_address || selectedCustomer.address}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Business Information */}
                    {selectedCustomer.business_info && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Business Information</h4>
                        {selectedCustomer.business_info.industry && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Industry: {selectedCustomer.business_info.industry}
                          </div>
                        )}
                        {selectedCustomer.business_info.website && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Website: {selectedCustomer.business_info.website}
                          </div>
                        )}
                        {selectedCustomer.business_info.annual_revenue && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Annual Revenue: ${selectedCustomer.business_info.annual_revenue.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Projects */}
                    {selectedCustomer.projects && selectedCustomer.projects.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Active Projects</h4>
                        <div className="space-y-2">
                          {selectedCustomer.projects.map((project) => (
                            <div key={project._id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {project.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Status: {project.status} • Value: ${project.estimated_value?.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCustomer.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(selectedCustomer.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Select a customer to view details
                </div>
              )}
            </div>
          </div>

          {/* Create Customer Form Modal */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setNewCustomer({
                      name: '',
                      email: '',
                      phone: '',
                      company: '',
                      customer_type: 'business',
                      status: 'prospect',
                      notes: '',
                      tags: []
                    });
                    setShowCreateForm(false);
                  }
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Create New Customer
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Add a new customer to your system
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNewCustomer({
                          name: '',
                          email: '',
                          phone: '',
                          company: '',
                          customer_type: 'business',
                          status: 'prospect',
                          notes: '',
                          tags: []
                        });
                        setShowCreateForm(false);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {createError && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg text-red-700 dark:text-red-400 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">Error</p>
                          <p className="text-sm mt-1">{createError}</p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleCreateCustomer} className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-500" />
                              Customer Name *
                            </label>
                            <input
                              type="text"
                              value={newCustomer.name}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter customer name"
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Building className="w-4 h-4 mr-2 text-gray-500" />
                              Company
                            </label>
                            <input
                              type="text"
                              value={newCustomer.company}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, company: e.target.value }))}
                              placeholder="Company name"
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-500" />
                              Email
                            </label>
                            <input
                              type="email"
                              value={newCustomer.email}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="email@example.com"
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-500" />
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={newCustomer.phone}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+1234567890"
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                          <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Customer Type
                            </label>
                            <select
                              value={newCustomer.customer_type}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, customer_type: e.target.value }))}
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                            >
                              <option value="individual">Individual</option>
                              <option value="business">Business</option>
                              <option value="contractor">Contractor</option>
                              <option value="retailer">Retailer</option>
                              <option value="wholesaler">Wholesaler</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Status
                            </label>
                            <select
                              value={newCustomer.status}
                              onChange={(e) => setNewCustomer(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                            >
                              <option value="prospect">Prospect</option>
                              <option value="lead">Lead</option>
                              <option value="customer">Customer</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            Notes
                          </label>
                          <textarea
                            value={newCustomer.notes}
                            onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about the customer..."
                            rows={4}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="submit"
                          disabled={creating}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Create Customer
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCustomer({
                              name: '',
                              email: '',
                              phone: '',
                              company: '',
                              customer_type: 'business',
                              status: 'prospect',
                              notes: '',
                              tags: []
                            });
                            setShowCreateForm(false);
                          }}
                          className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Customer Form */}
          <AnimatePresence>
            {showEditForm && editingCustomer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white dark:bg-gray-900 p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Customer</h3>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateCustomer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={editingCustomer.name}
                        onChange={(e) => setEditingCustomer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter customer name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={editingCustomer.company || ''}
                        onChange={(e) => setEditingCustomer(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Company name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editingCustomer.email || ''}
                        onChange={(e) => setEditingCustomer(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editingCustomer.phone || ''}
                        onChange={(e) => setEditingCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1234567890"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer Type
                      </label>
                      <select
                        value={editingCustomer.customer_type}
                        onChange={(e) => setEditingCustomer(prev => ({ ...prev, customer_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                        <option value="contractor">Contractor</option>
                        <option value="retailer">Retailer</option>
                        <option value="wholesaler">Wholesaler</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={editingCustomer.status}
                        onChange={(e) => setEditingCustomer(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="prospect">Prospect</option>
                        <option value="lead">Lead</option>
                        <option value="customer">Customer</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editingCustomer.notes || ''}
                      onChange={(e) => setEditingCustomer(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  {updateError && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                      {updateError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updating ? 'Updating...' : 'Update Customer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Delete Customer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDeleteCustomer(deleteConfirm._id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomerManagementModal;
