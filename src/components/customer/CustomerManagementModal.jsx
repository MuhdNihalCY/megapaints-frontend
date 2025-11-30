import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Search, Plus, Edit2, Trash2, User, Building, 
  Mail, Phone, MapPin, Calendar, Tag,
  Users, AlertCircle, MessageCircle, Save
} from 'lucide-react';
import { kanbanService } from '../../features/kanban/services/kanbanService';
import { useAuth } from '../../contexts/AuthContext';

// Helper function to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  // MongoDB ObjectId is 24 characters of hexadecimal
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const CustomerManagementModal = ({ isOpen, onClose, onCustomerSelect, mode = 'manage', onCustomerCreated, editingCustomer: externalEditingCustomer = null, onCustomerUpdated, autoShowCreateForm = false }) => {
  // mode can be: 'manage' (default - shows list + create/edit), 'create-only' (only create form), 'edit-only' (only edit form)
  // editingCustomer: if provided, will automatically show edit form for that customer
  // autoShowCreateForm: if true, automatically shows create form when modal opens in manage mode
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(mode === 'create-only' || autoShowCreateForm); // Auto-show create form in create-only mode or if autoShowCreateForm is true
  const [showEditForm, setShowEditForm] = useState(mode === 'edit-only' || !!externalEditingCustomer); // Auto-show edit form in edit-only mode or if editingCustomer prop provided
  const [editingCustomer, setEditingCustomer] = useState(externalEditingCustomer);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    customer_type: 'business',
    status: 'prospect',
    notes: '',
    tags: [],
    contacts: [],
    address: {
      street: '',
      city: ''
    },
    location: '',
    sales_executive: '',
    coordinator: ''
  });
  
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null); // For admin branch selector
  
  // Country codes for GCC countries (default +971 for UAE)
  const countryCodes = [
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' }
  ];
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load customers (only if not in create-only mode)
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('super_admin')) {
        loadBranches();
      }
      // Only load customers if in manage mode
      if (mode === 'manage') {
        loadCustomers();
      }
      // Auto-show create form if requested
      if (autoShowCreateForm && mode === 'manage') {
        setShowCreateForm(true);
      }
    }
  }, [isOpen, selectedBranchId, mode, autoShowCreateForm]); // Reload when branch selection changes
  
  // Load branches for admin users
  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const branchService = (await import('../../services/BranchService')).default;
      const response = await branchService.getBranches({ is_active: true });
      // Handle different response formats
      if (Array.isArray(response)) {
        setBranches(response);
      } else if (response?.data?.branches) {
        setBranches(response.data.branches);
      } else if (response?.branches) {
        setBranches(response.branches);
      } else if (response?.data && Array.isArray(response.data)) {
        setBranches(response.data);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };
  
  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('super_admin');
  
  // Load users for Sales Executive and Co-ordinator dropdowns
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersData = await kanbanService.getUsers();
      // Handle different response formats
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else if (usersData?.data?.users) {
        setUsers(usersData.data.users);
      } else if (usersData?.users) {
        setUsers(usersData.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get valid branch_id from user context
      let branchId = null;
      
      // Try to get from user.branches
      if (user?.branches && Array.isArray(user.branches) && user.branches.length > 0) {
        const firstBranch = user.branches[0];

        // Handle both string and object formats
        let branchIdStr = null;
        if (typeof firstBranch === 'string') {
          branchIdStr = firstBranch;
        } else if (firstBranch && typeof firstBranch === 'object') {
          // Try various possible properties
          branchIdStr = firstBranch._id || firstBranch.id || 
                       (firstBranch.toString && typeof firstBranch.toString === 'function' ? firstBranch.toString() : null);
        }
        
        if (branchIdStr) {
          const branchIdString = String(branchIdStr);
          const isValid = isValidObjectId(branchIdString);
          if (isValid) {
            branchId = branchIdString;
          }
        }
      }

      // Check if user has no branches - prevent API call and show error immediately
      if (!branchId && (!user?.branches || (Array.isArray(user.branches) && user.branches.length === 0))) {
        setError('No branch assigned to your account. Please contact an administrator to assign a branch before accessing customers.');
        setCustomers([]);
        setLoading(false);
        return;
      }

      // For admin users, use selectedBranchId if set, otherwise don't send branch_id (shows all)
      // For non-admin users, use their branch
      const isAdmin = user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('super_admin');
      const params = {};
      
      if (isAdmin) {
        // Admin: send branch_id only if a specific branch is selected
        if (selectedBranchId) {
          params.branch_id = selectedBranchId;
        }
        // If no branch selected, don't send branch_id - backend will show all customers
      } else {
        // Non-admin: send their branch_id
        if (branchId) {
          params.branch_id = branchId;
        }
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await kanbanService.getCustomers(params);
      setCustomers(response.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
      
      // The kanbanService.handleError throws a new Error, so we need to check the original error
      // Try to get the original error response from the error object
      const originalError = err.originalError || err.cause || err;
      const errorResponse = originalError?.response?.data || err.response?.data;
      const errorMessage = errorResponse?.message || err.message || 'Failed to load customers';
      const errorDetails = errorResponse?.details || '';
      
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
      // Transform contacts data for backend
      const transformedContacts = (newCustomer.contacts || []).map(contact => {
        const phone = contact.phone_country_code && contact.phone_number 
          ? `${contact.phone_country_code}${contact.phone_number}`.trim()
          : '';
        
        // Get WhatsApp number
        let whatsappNumber = '';
        if (contact.use_same_as_phone) {
          whatsappNumber = phone;
        } else if (contact.whatsapp_country_code && contact.whatsapp_number) {
          whatsappNumber = `${contact.whatsapp_country_code}${contact.whatsapp_number}`.trim();
        }
        
        // Build position field with WhatsApp info if different from phone
        let position = '';
        if (whatsappNumber && whatsappNumber !== phone) {
          position = `WhatsApp: ${whatsappNumber}`;
        }
        
        return {
          name: contact.name ? contact.name.trim() : '',
          phone: phone,
          position: position || undefined,
          is_primary: false // First contact will be primary
        };
      }).filter(contact => contact.name || contact.phone || contact.position); // Only include contacts that have at least one field filled
      
      // Set first contact as primary
      if (transformedContacts.length > 0) {
        transformedContacts[0].is_primary = true;
      }
      
      // Include branch_id and transformed contacts in the customer data
      // Also include address (street), location, sales_executive, and coordinator
      // Clean up empty strings - convert to null/undefined to avoid validation errors
      const customerData = {
        name: newCustomer.name.trim(),
        email: newCustomer.email?.trim() || undefined,
        phone: newCustomer.phone?.trim() || undefined,
        company: newCustomer.company?.trim() || undefined,
        customer_type: newCustomer.customer_type,
        status: newCustomer.status,
        branch_id: branchId,
        notes: newCustomer.notes?.trim() || undefined,
        tags: newCustomer.tags || [],
        contacts: transformedContacts,
        address: {
          street: newCustomer.address?.street?.trim() || undefined,
          city: (newCustomer.location?.trim() || newCustomer.address?.city?.trim()) || undefined
        },
        sales_executive: newCustomer.sales_executive?.trim() || null,
        coordinator: newCustomer.coordinator?.trim() || null
      };
      
      // Remove undefined values to avoid sending them
      Object.keys(customerData).forEach(key => {
        if (customerData[key] === undefined) {
          delete customerData[key];
        }
      });
      
      // Clean address object
      if (customerData.address) {
        Object.keys(customerData.address).forEach(key => {
          if (customerData.address[key] === undefined) {
            delete customerData.address[key];
          }
        });
        // Remove address if it's empty
        if (Object.keys(customerData.address).length === 0) {
          delete customerData.address;
        }
      }
      
      const response = await kanbanService.createCustomer(customerData);
      const createdCustomer = response.customer;
      
      // Call onCustomerCreated callback if provided
      if (onCustomerCreated) {
        onCustomerCreated(createdCustomer);
      }
      
      // If in manage mode, add to list and keep form open
      if (mode === 'manage') {
      setCustomers(prev => [createdCustomer, ...prev]);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        company: '',
        customer_type: 'business',
        status: 'prospect',
        notes: '',
          tags: [],
          contacts: [],
          address: {
            street: '',
            city: ''
          },
          location: '',
          sales_executive: '',
          coordinator: ''
      });
      setShowCreateForm(false);
      } else {
        // In create-only mode, close the modal after creation
        setNewCustomer({
          name: '',
          email: '',
          phone: '',
          company: '',
          customer_type: 'business',
          status: 'prospect',
          notes: '',
          tags: [],
          contacts: [],
          address: {
            street: '',
            city: ''
          },
          location: '',
          sales_executive: '',
          coordinator: ''
        });
        onClose();
      }
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
      // Transform contacts data for backend (same as create)
      const transformedContacts = (editingCustomer.contacts || []).map(contact => {
        const phone = contact.phone_country_code && contact.phone_number 
          ? `${contact.phone_country_code}${contact.phone_number}`.trim()
          : '';
        
        // Get WhatsApp number
        let whatsappNumber = '';
        if (contact.use_same_as_phone) {
          whatsappNumber = phone;
        } else if (contact.whatsapp_country_code && contact.whatsapp_number) {
          whatsappNumber = `${contact.whatsapp_country_code}${contact.whatsapp_number}`.trim();
        }
        
        // Build position field with WhatsApp info if different from phone
        let position = '';
        if (whatsappNumber && whatsappNumber !== phone) {
          position = `WhatsApp: ${whatsappNumber}`;
        }
        
        return {
          name: contact.name ? contact.name.trim() : '',
          phone: phone,
          position: position || undefined,
          is_primary: false
        };
      }).filter(contact => contact.name || contact.phone || contact.position);
      
      // Set first contact as primary
      if (transformedContacts.length > 0) {
        transformedContacts[0].is_primary = true;
      }
      
      // Clean up empty strings - convert to null/undefined to avoid validation errors
      const updateData = {
        name: editingCustomer.name.trim(),
        email: editingCustomer.email?.trim() || undefined,
        phone: editingCustomer.phone?.trim() || undefined,
        company: editingCustomer.company?.trim() || undefined,
        customer_type: editingCustomer.customer_type,
        status: editingCustomer.status,
        notes: editingCustomer.notes?.trim() || undefined,
        tags: editingCustomer.tags || [],
        contacts: transformedContacts,
        address: {
          street: editingCustomer.address?.street?.trim() || undefined,
          city: (editingCustomer.location?.trim() || editingCustomer.address?.city?.trim()) || undefined
        },
        sales_executive: editingCustomer.sales_executive?.trim() || null,
        coordinator: editingCustomer.coordinator?.trim() || null
      };
      
      // Add branch_id if admin user changed it
      if (isAdmin && editingCustomer.branch_id) {
        updateData.branch_id = editingCustomer.branch_id;
      }
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Clean address object
      if (updateData.address) {
        Object.keys(updateData.address).forEach(key => {
          if (updateData.address[key] === undefined) {
            delete updateData.address[key];
          }
        });
        if (Object.keys(updateData.address).length === 0) {
          delete updateData.address;
        }
      }
      
      const response = await kanbanService.updateCustomer(editingCustomer._id, updateData);
      
      // Call onCustomerUpdated callback if provided
      if (onCustomerUpdated) {
        onCustomerUpdated(response.customer);
      }
      
      // If in manage mode, update the list
      if (mode === 'manage') {
      setCustomers(prev => prev.map(customer => 
        customer._id === editingCustomer._id ? response.customer : customer
      ));
      }
      
      // If in edit-only mode or external editingCustomer, close modal
      if (mode === 'edit-only' || externalEditingCustomer) {
        onClose();
      } else {
      setShowEditForm(false);
      setEditingCustomer(null);
      }
    } catch (err) {
      console.error('Failed to update customer:', err);
      
      // Get error details from the error object
      const originalError = err.originalError || err.cause || err;
      const errorResponse = originalError?.response?.data || err.response?.data;
      const errorMessage = errorResponse?.message || err.message || 'Failed to update customer';
      const errorDetails = errorResponse?.details || [];
      
      // Handle specific error cases
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        setUpdateError('A customer with this name already exists. Please choose a different name.');
      } else if (errorMessage.includes('Validation failed') && Array.isArray(errorDetails)) {
        setUpdateError(errorDetails.join(', ') || 'Please check your input and try again.');
      } else {
        setUpdateError(errorMessage || 'Failed to update customer. Please try again.');
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
    // Transform customer data to match form structure
    // Transform contacts from backend format to form format
    const transformedContacts = (customer.contacts || []).map(contact => {
      // Parse phone number to extract country code and number
      const phone = contact.phone || '';
      let phone_country_code = '+971';
      let phone_number = '';
      
      // Try to extract country code from phone
      const countryCodeMatch = phone.match(/^(\+\d{1,4})/);
      if (countryCodeMatch) {
        phone_country_code = countryCodeMatch[1];
        phone_number = phone.replace(countryCodeMatch[1], '').trim();
      } else if (phone) {
        phone_number = phone;
      }
      
      // Parse WhatsApp from position field if it exists
      let whatsapp_country_code = '+971';
      let whatsapp_number = '';
      let use_same_as_phone = false;
      
      if (contact.position && contact.position.includes('WhatsApp:')) {
        const whatsappMatch = contact.position.match(/WhatsApp:\s*(\+\d{1,4})(\d+)/);
        if (whatsappMatch) {
          whatsapp_country_code = whatsappMatch[1];
          whatsapp_number = whatsappMatch[2];
        }
      } else if (phone) {
        // If no WhatsApp in position, check if it's the same as phone
        use_same_as_phone = true;
        whatsapp_country_code = phone_country_code;
        whatsapp_number = phone_number;
      }
      
      return {
        name: contact.name || '',
        phone_country_code,
        phone_number,
        whatsapp_country_code,
        whatsapp_number,
        use_same_as_phone
      };
    });
    
      setEditingCustomer({
        ...customer,
        address: customer.address || { street: '', city: '' },
        location: customer.address?.city || '',
        sales_executive: customer.sales_executive?._id || customer.sales_executive || '',
        coordinator: customer.coordinator?._id || customer.coordinator || '',
        branch_id: customer.branch_id?._id || customer.branch_id || '',
        contacts: transformedContacts.length > 0 ? transformedContacts : []
      });
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

  // Render edit customer form - shared between edit-only and manage modes
  const renderEditCustomerForm = () => {
    if (!editingCustomer) return null;
    
    return (
      <>
        {updateError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg text-red-700 dark:text-red-400 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{updateError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdateCustomer} className="space-y-6">
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
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter name here"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  Address
                </label>
                <input
                  type="text"
                  value={editingCustomer.address?.street || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  placeholder="Address here"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  Location
                </label>
                <input
                  type="text"
                  value={editingCustomer.location || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter Location here"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Sales Ex.
                </label>
                <select
                  value={editingCustomer.sales_executive || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, sales_executive: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={loadingUsers}
                >
                  <option value="">Select Sales Executive</option>
                  {users.map(user => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.username || user.email || 'User'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Co-ordinator
                </label>
                <select
                  value={editingCustomer.coordinator || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, coordinator: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={loadingUsers}
                >
                  <option value="">Select Co-ordinator</option>
                  {users.map(user => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.username || user.email || 'User'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Building className="w-4 h-4 mr-2 text-gray-500" />
                  Company
                </label>
                <input
                  type="text"
                  value={editingCustomer.company || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, company: e.target.value }))}
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
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, email: e.target.value }))}
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
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, phone: e.target.value }))}
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
                  value={editingCustomer.customer_type}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, customer_type: e.target.value }))}
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
                  value={editingCustomer.status}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="prospect">Prospect</option>
                  <option value="lead">Lead</option>
                  <option value="customer">Customer</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Branch Selection for Admin Users */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Building className="w-4 h-4 mr-2 text-gray-500" />
                  Branch
                </label>
                <select
                  value={editingCustomer.branch_id || ''}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, branch_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={loadingBranches}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id || branch.id} value={branch._id || branch.id}>
                      {branch.name} {branch.code ? `(${branch.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                Notes
              </label>
              <textarea
                value={editingCustomer.notes || ''}
                onChange={(e) => setEditingCustomer(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the customer..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
              />
            </div>
          </div>

          {/* Contact Persons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Persons</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(prev => ({
                    ...prev,
                    contacts: [
                      ...(prev.contacts || []),
                      {
                        name: '',
                        phone_country_code: '+971',
                        phone_number: '',
                        whatsapp_country_code: '+971',
                        whatsapp_number: '',
                        use_same_as_phone: false
                      }
                    ]
                  }));
                }}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            {(!editingCustomer.contacts || editingCustomer.contacts.length === 0) ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No contact persons added yet</p>
                <p className="text-xs mt-1">Click "Add Contact" to add a contact person</p>
              </div>
            ) : (
              <div className="space-y-4">
                {editingCustomer.contacts.map((contact, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Contact Person {index + 1}
                      </h4>
                      {(editingCustomer.contacts.length > 1) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomer(prev => ({
                              ...prev,
                              contacts: prev.contacts.filter((_, i) => i !== index)
                            }));
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove contact"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Contact Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          Name of Contact Person
                        </label>
                        <input
                          type="text"
                          value={contact.name || ''}
                          onChange={(e) => {
                            const updatedContacts = [...editingCustomer.contacts];
                            updatedContacts[index] = { ...updatedContacts[index], name: e.target.value };
                            setEditingCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                          }}
                          placeholder="Enter contact person name"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      </div>

                      {/* Contact Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          Contact Number
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={contact.phone_country_code || '+971'}
                            onChange={(e) => {
                              const updatedContacts = [...editingCustomer.contacts];
                              const newCountryCode = e.target.value;
                              updatedContacts[index] = { 
                                ...updatedContacts[index], 
                                phone_country_code: newCountryCode,
                                whatsapp_country_code: contact.use_same_as_phone ? newCountryCode : updatedContacts[index].whatsapp_country_code
                              };
                              setEditingCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                            }}
                            className="w-32 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                          >
                            {countryCodes.map((cc) => (
                              <option key={cc.code} value={cc.code}>
                                {cc.flag} {cc.code}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={contact.phone_number || ''}
                            onChange={(e) => {
                              const updatedContacts = [...editingCustomer.contacts];
                              const newPhoneNumber = e.target.value;
                              updatedContacts[index] = { 
                                ...updatedContacts[index], 
                                phone_number: newPhoneNumber,
                                whatsapp_number: contact.use_same_as_phone ? newPhoneNumber : updatedContacts[index].whatsapp_number
                              };
                              setEditingCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                            }}
                            placeholder="1234567890"
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                          />
                        </div>
                      </div>

                      {/* WhatsApp Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
                          WhatsApp Number
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`edit-same-as-phone-${index}`}
                              checked={contact.use_same_as_phone || false}
                              onChange={(e) => {
                                const updatedContacts = [...editingCustomer.contacts];
                                const useSame = e.target.checked;
                                updatedContacts[index] = {
                                  ...updatedContacts[index],
                                  use_same_as_phone: useSame,
                                  whatsapp_country_code: useSame ? updatedContacts[index].phone_country_code : (updatedContacts[index].whatsapp_country_code || '+971'),
                                  whatsapp_number: useSame ? updatedContacts[index].phone_number : (updatedContacts[index].whatsapp_number || '')
                                };
                                setEditingCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor={`edit-same-as-phone-${index}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                              Same as contact number
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={contact.whatsapp_country_code || '+971'}
                              onChange={(e) => {
                                const updatedContacts = [...editingCustomer.contacts];
                                updatedContacts[index] = { ...updatedContacts[index], whatsapp_country_code: e.target.value };
                                setEditingCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                              }}
                              disabled={contact.use_same_as_phone}
                              className="w-32 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {countryCodes.map((cc) => (
                                <option key={cc.code} value={cc.code}>
                                  {cc.flag} {cc.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="tel"
                              value={contact.whatsapp_number || ''}
                              onChange={(e) => {
                                const updatedContacts = [...editingCustomer.contacts];
                                updatedContacts[index] = { ...updatedContacts[index], whatsapp_number: e.target.value };
                                setEditingCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                              }}
                              disabled={contact.use_same_as_phone}
                              placeholder="1234567890"
                              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={updating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Customer
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (mode === 'edit-only') {
                  onClose();
                } else {
                  setShowEditForm(false);
                  setEditingCustomer(null);
                }
              }}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </>
    );
  };

  // Render create customer form - shared between create-only and manage modes
  const renderCreateCustomerForm = () => (
    <>
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
                placeholder="Enter name here"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                Address
              </label>
              <input
                type="text"
                value={newCustomer.address?.street || ''}
                onChange={(e) => setNewCustomer(prev => ({ 
                  ...prev, 
                  address: { ...prev.address, street: e.target.value }
                }))}
                placeholder="Address here"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                Location
              </label>
              <input
                type="text"
                value={newCustomer.location || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter Location here"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                Sales Ex.
              </label>
              <select
                value={newCustomer.sales_executive || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, sales_executive: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                disabled={loadingUsers}
              >
                <option value="">Select Sales Executive</option>
                {users.map(user => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username || user.email || 'User'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                Co-ordinator
              </label>
              <select
                value={newCustomer.coordinator || ''}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, coordinator: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                disabled={loadingUsers}
              >
                <option value="">Select Co-ordinator</option>
                {users.map(user => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username || user.email || 'User'}
                  </option>
                ))}
              </select>
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

        {/* Contact Persons */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Persons</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewCustomer(prev => ({
                  ...prev,
                  contacts: [
                    ...prev.contacts,
                    {
                      name: '',
                      phone_country_code: '+971',
                      phone_number: '',
                      whatsapp_country_code: '+971',
                      whatsapp_number: '',
                      use_same_as_phone: false
                    }
                  ]
                }));
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>

          {newCustomer.contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No contact persons added yet</p>
              <p className="text-xs mt-1">Click "Add Contact" to add a contact person</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newCustomer.contacts.map((contact, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Contact Person {index + 1}
                    </h4>
                    {newCustomer.contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewCustomer(prev => ({
                            ...prev,
                            contacts: prev.contacts.filter((_, i) => i !== index)
                          }));
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove contact"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Contact Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        Name of Contact Person
                      </label>
                      <input
                        type="text"
                        value={contact.name || ''}
                        onChange={(e) => {
                          const updatedContacts = [...newCustomer.contacts];
                          updatedContacts[index] = { ...updatedContacts[index], name: e.target.value };
                          setNewCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                        }}
                        placeholder="Enter contact person name"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      />
                    </div>

                    {/* Contact Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        Contact Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={contact.phone_country_code || '+971'}
                          onChange={(e) => {
                            const updatedContacts = [...newCustomer.contacts];
                            const newCountryCode = e.target.value;
                            updatedContacts[index] = { 
                              ...updatedContacts[index], 
                              phone_country_code: newCountryCode,
                              whatsapp_country_code: contact.use_same_as_phone ? newCountryCode : updatedContacts[index].whatsapp_country_code
                            };
                            setNewCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                          }}
                          className="w-32 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        >
                          {countryCodes.map((cc) => (
                            <option key={cc.code} value={cc.code}>
                              {cc.flag} {cc.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          value={contact.phone_number || ''}
                          onChange={(e) => {
                            const updatedContacts = [...newCustomer.contacts];
                            const newPhoneNumber = e.target.value;
                            updatedContacts[index] = { 
                              ...updatedContacts[index], 
                              phone_number: newPhoneNumber,
                              whatsapp_number: contact.use_same_as_phone ? newPhoneNumber : updatedContacts[index].whatsapp_number
                            };
                            setNewCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                          }}
                          placeholder="1234567890"
                          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <MessageCircle className="w-4 h-4 mr-2 text-gray-500" />
                        WhatsApp Number
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`same-as-phone-${index}`}
                            checked={contact.use_same_as_phone || false}
                            onChange={(e) => {
                              const updatedContacts = [...newCustomer.contacts];
                              const useSame = e.target.checked;
                              updatedContacts[index] = {
                                ...updatedContacts[index],
                                use_same_as_phone: useSame,
                                whatsapp_country_code: useSame ? updatedContacts[index].phone_country_code : (updatedContacts[index].whatsapp_country_code || '+971'),
                                whatsapp_number: useSame ? updatedContacts[index].phone_number : (updatedContacts[index].whatsapp_number || '')
                              };
                              setNewCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor={`same-as-phone-${index}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                            Same as contact number
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={contact.whatsapp_country_code || '+971'}
                            onChange={(e) => {
                              const updatedContacts = [...newCustomer.contacts];
                              updatedContacts[index] = { ...updatedContacts[index], whatsapp_country_code: e.target.value };
                              setNewCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                            }}
                            disabled={contact.use_same_as_phone}
                            className="w-32 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {countryCodes.map((cc) => (
                              <option key={cc.code} value={cc.code}>
                                {cc.flag} {cc.code}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={contact.whatsapp_number || ''}
                            onChange={(e) => {
                              const updatedContacts = [...newCustomer.contacts];
                              updatedContacts[index] = { ...updatedContacts[index], whatsapp_number: e.target.value };
                              setNewCustomer(prev => ({ ...prev, contacts: updatedContacts }));
                            }}
                            disabled={contact.use_same_as_phone}
                            placeholder="1234567890"
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              if (mode === 'create-only') {
                onClose();
              } else {
                setNewCustomer({
                  name: '',
                  email: '',
                  phone: '',
                  company: '',
                  customer_type: 'business',
                  status: 'prospect',
                  notes: '',
                  tags: [],
                  contacts: []
                });
                setShowCreateForm(false);
              }
            }}
            className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] min-h-[600px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'create-only' ? 'Create New Customer' : 
               mode === 'edit-only' ? 'Edit Customer' : 
               'Customer Management'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Show create form directly in create-only mode, otherwise show list + form */}
          {mode === 'create-only' ? (
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
              {/* Render form directly in create-only mode */}
              {renderCreateCustomerForm()}
            </div>
          ) : (
          <div className="flex h-[calc(90vh-140px)] min-h-[600px]">
            {/* Left Panel - Customer List */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Search and Actions */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                {/* Branch Selector for Admin Users */}
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filter by Branch
                    </label>
                    <select
                      value={selectedBranchId || ''}
                      onChange={(e) => setSelectedBranchId(e.target.value || null)}
                      disabled={loadingBranches}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">All Branches</option>
                      {branches.map(branch => (
                        <option key={branch._id || branch.id} value={branch._id || branch.id}>
                          {branch.name} {branch.code ? `(${branch.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
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
          )}

          {/* Create Customer Form - Show directly in create-only mode, or as modal overlay in manage mode */}
          {/* Render form content - shared between both modes */}
          {(showCreateForm || mode === 'create-only') && (
            mode === 'create-only' ? (
              // In create-only mode, form is already rendered in the div above (line 725-736)
              // We'll render the actual form content there
              null
            ) : (
          <AnimatePresence>
            {showCreateForm && (
                // In manage mode, render as modal overlay
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10002]"
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
                        tags: [],
                        contacts: [],
                        address: {
                          street: '',
                          city: ''
                        },
                        location: '',
                        sales_executive: '',
                        coordinator: ''
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
                            tags: [],
                            contacts: [],
                            address: {
                              street: '',
                              city: ''
                            },
                            location: '',
                            sales_executive: '',
                            coordinator: ''
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
                      {renderCreateCustomerForm()}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )
          )}

          {/* Edit Customer Form - Show in edit-only mode or when editing in manage mode */}
          {mode !== 'edit-only' && (
            <AnimatePresence>
              {showEditForm && editingCustomer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10002] animate-in fade-in duration-200"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Edit2 className="w-5 h-5 text-white" />
                      </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Customer</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Update customer information
                        </p>
                      </div>
                    </div>
                  <button
                    onClick={() => setShowEditForm(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {renderEditCustomerForm()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          )}

          {/* Delete Confirmation */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10003]"
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
    </AnimatePresence>,
    document.body
  );
};

export default CustomerManagementModal;
