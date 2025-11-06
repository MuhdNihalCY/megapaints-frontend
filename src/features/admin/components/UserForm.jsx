import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import apiServiceFactory from '../../../services/ApiServiceFactory.js';
import {
  X,
  User,
  Mail,
  Lock,
  UserCircle,
  Phone,
  Briefcase,
  Shield,
  Building2,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';

const UserForm = ({ user = null, onClose, onSuccess }) => {
  const { apiRequest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([
    'admin',
    'manager', 
    'supervisor',
    'operator',
    'viewer'
  ]);
  const [permissions, setPermissions] = useState([
    'products:read',
    'products:write',
    'inventory:read',
    'inventory:write',
    'orders:read',
    'orders:write',
    'users:read',
    'users:write',
    'reports:read',
    'reports:write'
  ]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    designation: '',
    roles: [],
    branches: [],
    permissions: [],
    is_active: true
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchBranches();
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        designation: user.designation || '',
        roles: user.roles || [],
        branches: user.branches || [],
        permissions: user.permissions || [],
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      const adminServices = apiServiceFactory.initializeAdminServices();
      const response = await adminServices.businessManagement.getBranches();
      if (response.status === 'success') {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError('Failed to load branches');
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!user && !formData.password) {
      errors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!formData.designation.trim()) {
      errors.designation = 'Designation is required';
    }

    if (formData.roles.length === 0) {
      errors.roles = 'At least one role is required';
    }

    if (formData.branches.length === 0) {
      errors.branches = 'At least one branch is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
      const adminServices = apiServiceFactory.initializeAdminServices();
      
      // Prepare data for API
      const submitData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim(),
        roles: formData.roles,
        branches: formData.branches,
        permissions: formData.permissions,
        is_active: formData.is_active
      };

      // Only include password for new users or when password is provided
      if (!user && formData.password) {
        submitData.password = formData.password;
      } else if (user && formData.password) {
        submitData.password = formData.password;
      }

      let response;
      if (user) {
        // Update existing user
        response = await adminServices.businessManagement.updateUser(user._id, submitData);
      } else {
        // Create new user
        response = await adminServices.businessManagement.createUser(submitData);
      }

      if (response.status === 'success') {
        setSuccess(user ? 'User updated successfully!' : 'User created successfully!');
        setTimeout(() => {
          onSuccess && onSuccess(response.data);
          onClose && onClose();
        }, 1500);
      } else {
        setError(response.message || 'Operation failed');
      }
    } catch (err) {
      console.error('User operation failed:', err);
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user ? 'Edit User' : 'Add New User'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user ? 'Update user information and permissions' : 'Create a new user account'}
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
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    validationErrors.username ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                />
                {validationErrors.username && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-500" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    validationErrors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {validationErrors.email && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.email}
                  </p>
                )}
              </div>
            </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Password</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Key className="w-4 h-4 mr-2 text-gray-500" />
                  Password {!user && '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    validationErrors.password ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                  }`}
                  placeholder={user ? "Leave blank to keep current password" : "Enter password"}
                />
                {validationErrors.password && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-gray-500" />
                  Confirm Password {formData.password && '*'}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    validationErrors.confirmPassword ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    validationErrors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {validationErrors.first_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    validationErrors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {validationErrors.last_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.last_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-500" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    validationErrors.designation ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300'
                  }`}
                  placeholder="Enter designation"
                />
                {validationErrors.designation && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.designation}
                  </p>
                )}
              </div>
            </div>
            </div>

            {/* Roles Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Roles & Permissions</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Roles *
                </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {roles.map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayChange('roles', [...formData.roles, role]);
                        } else {
                          handleArrayChange('roles', formData.roles.filter(r => r !== role));
                        }
                      }}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{role}</span>
                  </label>
                ))}
              </div>
              {validationErrors.roles && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.roles}</p>
              )}
              </div>
            </div>

            {/* Branches Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                Branches *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {branches.map((branch) => (
                  <label key={branch._id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.branches.includes(branch._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayChange('branches', [...formData.branches, branch._id]);
                        } else {
                          handleArrayChange('branches', formData.branches.filter(b => b !== branch._id));
                        }
                      }}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{branch.name}</span>
                  </label>
                ))}
              </div>
              {validationErrors.branches && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.branches}</p>
              )}
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayChange('permissions', [...formData.permissions, permission]);
                        } else {
                          handleArrayChange('permissions', formData.permissions.filter(p => p !== permission));
                        }
                      }}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{permission}</span>
                  </label>
                ))}
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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active User</span>
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
                    {user ? 'Update User' : 'Create User'}
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

export default UserForm;
