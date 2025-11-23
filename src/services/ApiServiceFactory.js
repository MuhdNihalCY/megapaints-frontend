/**
 * API Service Factory
 * Central factory for creating and managing all API services
 * Provides a unified interface for admin and user operations
 */
import AdminApiService from './AdminApiService.js';
import UserApiService from './UserApiService.js';
import ProductCatalogService from './ProductCatalogService.js';
import BusinessManagementService from './BusinessManagementService.js';
import KanbanBoardService from './KanbanBoardService.js';
import LabelManagementService from './LabelManagementService.js';
import InventoryService from './InventoryService.js';
import OrderService from './OrderService.js';
import { getApiUrl } from '../config/api.js';

class ApiServiceFactory {
  constructor() {
    this.adminApi = null;
    this.userApi = null;
    this.productCatalog = null;
    this.businessManagement = null;
    this.kanbanBoard = null;
    this.labelManagement = null;
    this.inventoryManagement = null;
    this.orderManagement = null;
    this.currentUserType = null;
  }

  /**
   * Initialize admin services
   * @returns {Object} Admin services object
   */
  initializeAdminServices() {
    if (!this.adminApi) {
      this.adminApi = new AdminApiService();
      this.productCatalog = new ProductCatalogService(this.adminApi);
      this.businessManagement = new BusinessManagementService(this.adminApi);
      this.kanbanBoard = new KanbanBoardService(this.adminApi);
      this.labelManagement = new LabelManagementService(this.adminApi);
      this.inventoryManagement = new InventoryService(this.adminApi);
      this.orderManagement = new OrderService(this.adminApi);
    }
    this.currentUserType = 'admin';
    
    return {
      admin: this.adminApi,
      productCatalog: this.productCatalog,
      businessManagement: this.businessManagement,
      kanbanBoard: this.kanbanBoard,
      labelManagement: this.labelManagement,
      inventoryManagement: this.inventoryManagement,
      orderManagement: this.orderManagement
    };
  }

  /**
   * Initialize user services
   * @returns {Object} User services object
   */
  initializeUserServices() {
    if (!this.userApi) {
      this.userApi = new UserApiService();
    }
    this.currentUserType = 'user';
    
    return {
      user: this.userApi
    };
  }

  /**
   * Get current user type
   * @returns {string|null} Current user type
   */
  getCurrentUserType() {
    return this.currentUserType;
  }

  /**
   * Check if admin services are available
   * @returns {boolean} Admin services availability
   */
  isAdminServicesAvailable() {
    return !!this.adminApi;
  }

  /**
   * Check if user services are available
   * @returns {boolean} User services availability
   */
  isUserServicesAvailable() {
    return !!this.userApi;
  }

  /**
   * Get all available services based on current user type
   * @returns {Object} Available services
   */
  getAvailableServices() {
    const services = {};
    
    if (this.isAdminServicesAvailable()) {
      services.admin = this.adminApi;
      services.productCatalog = this.productCatalog;
      services.businessManagement = this.businessManagement;
      services.kanbanBoard = this.kanbanBoard;
      services.labelManagement = this.labelManagement;
      services.inventoryManagement = this.inventoryManagement;
      services.orderManagement = this.orderManagement;
    }
    
    if (this.isUserServicesAvailable()) {
      services.user = this.userApi;
    }
    
    return services;
  }

  /**
   * Clear all services and reset state
   */
  clearServices() {
    if (this.adminApi) {
      this.adminApi.clearTokens();
    }
    if (this.userApi) {
      this.userApi.clearTokens();
    }
    
    this.adminApi = null;
    this.userApi = null;
    this.productCatalog = null;
    this.businessManagement = null;
    this.kanbanBoard = null;
    this.labelManagement = null;
    this.inventoryManagement = null;
    this.orderManagement = null;
    this.currentUserType = null;
  }

  /**
   * Get service by name
   * @param {string} serviceName - Name of the service
   * @returns {Object|null} Service instance or null
   */
  getService(serviceName) {
    const services = this.getAvailableServices();
    return services[serviceName] || null;
  }

  /**
   * Check if user is authenticated as admin
   * @returns {boolean} Admin authentication status
   */
  isAdminAuthenticated() {
    return this.adminApi?.isAuthenticated() || false;
  }

  /**
   * Check if user is authenticated as regular user
   * @returns {boolean} User authentication status
   */
  isUserAuthenticated() {
    return this.userApi?.isAuthenticated() || false;
  }

  /**
   * Check if any user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return this.isAdminAuthenticated() || this.isUserAuthenticated();
  }

  /**
   * Get current user data
   * @returns {Object|null} Current user data
   */
  getCurrentUser() {
    if (this.isAdminAuthenticated()) {
      return this.adminApi.getCurrentUser();
    } else if (this.isUserAuthenticated()) {
      return this.userApi.getCurrentUser();
    }
    return null;
  }

  /**
   * Get current user type based on authentication
   * @returns {string|null} User type
   */
  getAuthenticatedUserType() {
    if (this.isAdminAuthenticated()) {
      return 'admin';
    } else if (this.isUserAuthenticated()) {
      return 'user';
    }
    return null;
  }

  /**
   * Login as admin
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<Object>} Login result
   */
  async adminLogin(username, password) {
    const services = this.initializeAdminServices();
    return await services.admin.login(username, password);
  }

  /**
   * Login as user
   * @param {string} username - User username
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async userLogin(username, password) {
    const services = this.initializeUserServices();
    return await services.user.login(username, password);
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async userRegister(userData) {
    const services = this.initializeUserServices();
    return await services.user.register(userData);
  }

  /**
   * Logout current user
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    const userType = this.getAuthenticatedUserType();
    
    if (userType === 'admin' && this.adminApi) {
      return await this.adminApi.logout();
    } else if (userType === 'user' && this.userApi) {
      return await this.userApi.logout();
    }
    
    // Clear services if no specific logout
    this.clearServices();
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Refresh current user's token
   * @returns {Promise<Object>} Token refresh result
   */
  async refreshToken() {
    const userType = this.getAuthenticatedUserType();
    
    if (userType === 'admin' && this.adminApi) {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      return await this.adminApi.refreshToken(refreshToken);
    } else if (userType === 'user' && this.userApi) {
      const refreshToken = localStorage.getItem('userRefreshToken');
      return await this.userApi.refreshToken(refreshToken);
    }
    
    throw new Error('No authenticated user found');
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getProfile() {
    const userType = this.getAuthenticatedUserType();
    
    if (userType === 'admin' && this.adminApi) {
      return await this.adminApi.getProfile();
    } else if (userType === 'user' && this.userApi) {
      return await this.userApi.getProfile();
    }
    
    throw new Error('No authenticated user found');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    const userType = this.getAuthenticatedUserType();
    
    if (userType === 'admin' && this.adminApi) {
      // Admin profile update would need to be implemented in AdminApiService
      throw new Error('Admin profile update not implemented');
    } else if (userType === 'user' && this.userApi) {
      return await this.userApi.updateProfile(profileData);
    }
    
    throw new Error('No authenticated user found');
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} Password change result
   */
  async changePassword(passwordData) {
    const userType = this.getAuthenticatedUserType();
    
    if (userType === 'admin' && this.adminApi) {
      const { oldPassword, newPassword, confirmPassword } = passwordData;
      return await this.adminApi.changePasswordSimple(oldPassword, newPassword, confirmPassword);
    } else if (userType === 'user' && this.userApi) {
      const { currentPassword, newPassword } = passwordData;
      return await this.userApi.changePassword(currentPassword, newPassword);
    }
    
    throw new Error('No authenticated user found');
  }

  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async apiRequest(endpoint, options = {}) {
    const userType = this.getAuthenticatedUserType();
    
    if (userType === 'admin' && this.adminApi) {
      return await this.adminApi.apiRequest(endpoint, options);
    } else if (userType === 'user' && this.userApi) {
      return await this.userApi.apiRequest(endpoint, options);
    }
    
    throw new Error('No authenticated user found');
  }

  /**
   * Get health check status
   * @returns {Promise<Object>} Health check result
   */
  async getHealthCheck() {
    try {
      const response = await fetch(getApiUrl('/health'));
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed health check
   * @returns {Promise<Object>} Detailed health check result
   */
  async getDetailedHealthCheck() {
    try {
      const response = await fetch(getApiUrl('/health/detailed'));
      return await response.json();
    } catch (error) {
      console.error('Detailed health check failed:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Validation result
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    const minLength = 6;
    const hasMinLength = password.length >= minLength;
    
    return {
      isValid: hasMinLength,
      hasMinLength,
      minLength,
      message: hasMinLength ? 'Password is valid' : `Password must be at least ${minLength} characters`
    };
  }

  /**
   * Get user role
   * @returns {string|null} User role
   */
  getUserRole() {
    const user = this.getCurrentUser();
    if (user && user.roles && user.roles.length > 0) {
      return user.roles[0]; // Return first role
    }
    return null;
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Permission status
   */
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (user && user.permissions) {
      return user.permissions.includes(permission);
    }
    return false;
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Array} permissions - Permissions to check
   * @returns {boolean} Permission status
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   * @param {Array} permissions - Permissions to check
   * @returns {boolean} Permission status
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }
}

// Create singleton instance
const apiServiceFactory = new ApiServiceFactory();

export default apiServiceFactory;
