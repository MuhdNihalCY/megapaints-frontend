/**
 * Admin API Service
 * Handles all admin-specific API calls based on the updated API documentation
 * Separated from user APIs for better organization and security
 */
import { getApiUrl } from '../config/api.js';

class AdminApiService {
  constructor() {
    this.baseURL = '/api'; // Will be handled by proxy in development
    this.accessToken = localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
  }

  /**
   * Get headers with admin authentication
   * @returns {Object} Headers object
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  /**
   * Build query parameters from object
   * @param {Object} params - Parameters object
   * @returns {string} Query string
   */
  buildQueryParams(params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '' && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    return queryParams.toString();
  }

  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async apiRequest(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        },
        credentials: 'include'
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      
      let data = null;
      if (response.status !== 204 && 
          contentLength !== '0' && 
          contentType && 
          contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error(`Failed to parse JSON response for ${endpoint}:`, jsonError);
          throw new Error(`Invalid JSON response: ${response.status} ${response.statusText}`);
        }
      }
      
      if (!response.ok) {
        const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error(`Admin API request failed [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Admin Login
   * @param {string} username - Admin username or email
   * @param {string} password - Admin password
   * @returns {Promise<Object>} Login result
   */
  async login(username, password) {
    try {
      const response = await fetch(getApiUrl('/auth/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Store admin-specific tokens
        localStorage.setItem('adminAccessToken', data.data.tokens.accessToken);
        localStorage.setItem('adminRefreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
        
        // Also store in general tokens for compatibility
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        
        this.accessToken = data.data.tokens.accessToken;
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    }
  }

  /**
   * Admin Logout
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    try {
      return await this.apiRequest('/auth/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Admin logout failed:', error);
      throw error;
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Refresh Admin Token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const response = await fetch(getApiUrl('/auth/admin/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Update stored tokens
        localStorage.setItem('adminAccessToken', data.data.tokens.accessToken);
        localStorage.setItem('adminRefreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        
        this.accessToken = data.data.tokens.accessToken;
        return data.data.tokens;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Admin token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get Current Admin Profile
   * @returns {Promise<Object>} Admin profile
   */
  async getProfile() {
    return await this.apiRequest('/auth/admin/me');
  }

  /**
   * Change Admin Password (with OTP)
   * @param {string} otp - OTP code
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result
   */
  async changePasswordWithOTP(otp, newPassword) {
    return await this.apiRequest('/auth/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ otp, newPassword })
    });
  }

  /**
   * Change Admin Password (Simple - with old password)
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<Object>} Result
   */
  async changePasswordSimple(oldPassword, newPassword, confirmPassword) {
    return await this.apiRequest('/auth/admin/change-password-simple', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
    });
  }

  /**
   * Request Password Change OTP
   * @returns {Promise<Object>} Result
   */
  async requestPasswordChangeOTP() {
    return await this.apiRequest('/auth/admin/request-password-change', {
      method: 'POST'
    });
  }

  // ==================== PRODUCT CATALOG MANAGEMENT ====================

  /**
   * Get Product Categories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Categories data
   */
  async getCategories(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products/categories?${queryString}`);
  }

  /**
   * Create Product Category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    return await this.apiRequest('/admin/products/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  /**
   * Update Product Category
   * @param {string} categoryId - Category ID
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(categoryId, categoryData) {
    return await this.apiRequest(`/admin/products/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  }

  /**
   * Delete Product Category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCategory(categoryId) {
    return await this.apiRequest(`/admin/products/categories/${categoryId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get Products
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products data
   */
  async getProducts(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products?${queryString}`);
  }

  /**
   * Create Product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    return await this.apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  /**
   * Update Product
   * @param {string} productId - Product ID
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, productData) {
    return await this.apiRequest(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  /**
   * Delete Product
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProduct(productId) {
    return await this.apiRequest(`/admin/products/${productId}`, {
      method: 'DELETE'
    });
  }

  // ==================== ADDITIVES ====================

  /**
   * Get Additives
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Additives data
   */
  async getAdditives(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products/additives?${queryString}`);
  }

  /**
   * Create Additive
   * @param {Object} additiveData - Additive data
   * @returns {Promise<Object>} Created additive
   */
  async createAdditive(additiveData) {
    return await this.apiRequest('/admin/products/additives', {
      method: 'POST',
      body: JSON.stringify(additiveData)
    });
  }

  /**
   * Update Additive
   * @param {string} additiveId - Additive ID
   * @param {Object} additiveData - Additive data
   * @returns {Promise<Object>} Updated additive
   */
  async updateAdditive(additiveId, additiveData) {
    return await this.apiRequest(`/admin/products/additives/${additiveId}`, {
      method: 'PUT',
      body: JSON.stringify(additiveData)
    });
  }

  /**
   * Delete Additive
   * @param {string} additiveId - Additive ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAdditive(additiveId) {
    return await this.apiRequest(`/admin/products/additives/${additiveId}`, {
      method: 'DELETE'
    });
  }

  // ==================== BINDERS ====================

  /**
   * Get Binders
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Binders data
   */
  async getBinders(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products/binders?${queryString}`);
  }

  /**
   * Create Binder
   * @param {Object} binderData - Binder data
   * @returns {Promise<Object>} Created binder
   */
  async createBinder(binderData) {
    return await this.apiRequest('/admin/products/binders', {
      method: 'POST',
      body: JSON.stringify(binderData)
    });
  }

  /**
   * Update Binder
   * @param {string} binderId - Binder ID
   * @param {Object} binderData - Binder data
   * @returns {Promise<Object>} Updated binder
   */
  async updateBinder(binderId, binderData) {
    return await this.apiRequest(`/admin/products/binders/${binderId}`, {
      method: 'PUT',
      body: JSON.stringify(binderData)
    });
  }

  /**
   * Delete Binder
   * @param {string} binderId - Binder ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBinder(binderId) {
    return await this.apiRequest(`/admin/products/binders/${binderId}`, {
      method: 'DELETE'
    });
  }

  // ==================== AUXILIARIES ====================

  /**
   * Get Auxiliaries
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Auxiliaries data
   */
  async getAuxiliaries(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products/auxiliaries?${queryString}`);
  }

  /**
   * Create Auxiliary
   * @param {Object} auxiliaryData - Auxiliary data
   * @returns {Promise<Object>} Created auxiliary
   */
  async createAuxiliary(auxiliaryData) {
    return await this.apiRequest('/admin/products/auxiliaries', {
      method: 'POST',
      body: JSON.stringify(auxiliaryData)
    });
  }

  /**
   * Update Auxiliary
   * @param {string} auxiliaryId - Auxiliary ID
   * @param {Object} auxiliaryData - Auxiliary data
   * @returns {Promise<Object>} Updated auxiliary
   */
  async updateAuxiliary(auxiliaryId, auxiliaryData) {
    return await this.apiRequest(`/admin/products/auxiliaries/${auxiliaryId}`, {
      method: 'PUT',
      body: JSON.stringify(auxiliaryData)
    });
  }

  /**
   * Delete Auxiliary
   * @param {string} auxiliaryId - Auxiliary ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAuxiliary(auxiliaryId) {
    return await this.apiRequest(`/admin/products/auxiliaries/${auxiliaryId}`, {
      method: 'DELETE'
    });
  }

  // ==================== ACCESSORIES ====================

  /**
   * Get Accessories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Accessories data
   */
  async getAccessories(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products/accessories?${queryString}`);
  }

  /**
   * Create Accessory
   * @param {Object} accessoryData - Accessory data
   * @returns {Promise<Object>} Created accessory
   */
  async createAccessory(accessoryData) {
    return await this.apiRequest('/admin/products/accessories', {
      method: 'POST',
      body: JSON.stringify(accessoryData)
    });
  }

  /**
   * Update Accessory
   * @param {string} accessoryId - Accessory ID
   * @param {Object} accessoryData - Accessory data
   * @returns {Promise<Object>} Updated accessory
   */
  async updateAccessory(accessoryId, accessoryData) {
    return await this.apiRequest(`/admin/products/accessories/${accessoryId}`, {
      method: 'PUT',
      body: JSON.stringify(accessoryData)
    });
  }

  /**
   * Delete Accessory
   * @param {string} accessoryId - Accessory ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAccessory(accessoryId) {
    return await this.apiRequest(`/admin/products/accessories/${accessoryId}`, {
      method: 'DELETE'
    });
  }

  // ==================== THIRD PARTY PRODUCTS ====================

  /**
   * Get Third Party Products
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Third party products data
   */
  async getThirdPartyProducts(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products/third-party?${queryString}`);
  }

  /**
   * Create Third Party Product
   * @param {Object} thirdPartyData - Third party product data
   * @returns {Promise<Object>} Created third party product
   */
  async createThirdPartyProduct(thirdPartyData) {
    return await this.apiRequest('/admin/products/third-party', {
      method: 'POST',
      body: JSON.stringify(thirdPartyData)
    });
  }

  /**
   * Update Third Party Product
   * @param {string} thirdPartyId - Third party product ID
   * @param {Object} thirdPartyData - Third party product data
   * @returns {Promise<Object>} Updated third party product
   */
  async updateThirdPartyProduct(thirdPartyId, thirdPartyData) {
    return await this.apiRequest(`/admin/products/third-party/${thirdPartyId}`, {
      method: 'PUT',
      body: JSON.stringify(thirdPartyData)
    });
  }

  /**
   * Delete Third Party Product
   * @param {string} thirdPartyId - Third party product ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteThirdPartyProduct(thirdPartyId) {
    return await this.apiRequest(`/admin/products/third-party/${thirdPartyId}`, {
      method: 'DELETE'
    });
  }

  // ==================== ALL ITEMS (UNIFIED VIEW) ====================

  /**
   * Get All Items (Unified View)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} All items data
   */
  async getAllItems(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/products/all-items?${queryString}`);
  }

  // ==================== BUSINESS MANAGEMENT ====================

  /**
   * Get Branches
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Branches data
   */
  async getBranches(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/business/branches?${queryString}`);
  }

  /**
   * Create Branch
   * @param {Object} branchData - Branch data
   * @returns {Promise<Object>} Created branch
   */
  async createBranch(branchData) {
    return await this.apiRequest('/admin/business/branches', {
      method: 'POST',
      body: JSON.stringify(branchData)
    });
  }

  /**
   * Get Users (Business Route)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users data
   */
  async getUsers(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/business/users?${queryString}`);
  }

  /**
   * Get Users (Direct Route)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users data
   */
  async getUsersDirect(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/admin/users?${queryString}`);
  }

  /**
   * Create User
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    return await this.apiRequest('/admin/business/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Update User
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    return await this.apiRequest(`/admin/business/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Get User by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    return await this.apiRequest(`/admin/business/users/${userId}`);
  }

  // ==================== BOARD MANAGEMENT ====================

  /**
   * Get all boards with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Boards data
   */
  async getBoards(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/board?${queryString}`);
  }

  /**
   * Get board by ID
   * @param {string} boardId - Board ID
   * @returns {Promise<Object>} Board data
   */
  async getBoardById(boardId) {
    return await this.apiRequest(`/board/${boardId}`);
  }

  /**
   * Create new board
   * @param {Object} boardData - Board data
   * @returns {Promise<Object>} Created board
   */
  async createBoard(boardData) {
    return await this.apiRequest('/board', {
      method: 'POST',
      body: JSON.stringify(boardData)
    });
  }

  /**
   * Update board
   * @param {string} boardId - Board ID
   * @param {Object} boardData - Board data
   * @returns {Promise<Object>} Updated board
   */
  async updateBoard(boardId, boardData) {
    return await this.apiRequest(`/board/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(boardData)
    });
  }

  /**
   * Delete board
   * @param {string} boardId - Board ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBoard(boardId) {
    return await this.apiRequest(`/board/${boardId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get boards by branch
   * @param {string} branchId - Branch ID
   * @returns {Promise<Object>} Branch boards
   */
  async getBoardsByBranch(branchId) {
    return await this.apiRequest(`/board/v2/board/branch?branchId=${branchId}`);
  }

  // ==================== LABEL MANAGEMENT ====================

  /**
   * Get all labels with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Labels data
   */
  async getLabels(params = {}) {
    const queryString = this.buildQueryParams({
      page: 1,
      limit: 20,
      ...params
    });
    return await this.apiRequest(`/label?${queryString}`);
  }

  /**
   * Get label by ID
   * @param {string} labelId - Label ID
   * @returns {Promise<Object>} Label data
   */
  async getLabelById(labelId) {
    return await this.apiRequest(`/label/${labelId}`);
  }

  /**
   * Create new label
   * @param {Object} labelData - Label data
   * @returns {Promise<Object>} Created label
   */
  async createLabel(labelData) {
    return await this.apiRequest('/label', {
      method: 'POST',
      body: JSON.stringify(labelData)
    });
  }

  /**
   * Update label
   * @param {string} labelId - Label ID
   * @param {Object} labelData - Label data
   * @returns {Promise<Object>} Updated label
   */
  async updateLabel(labelId, labelData) {
    return await this.apiRequest(`/label/${labelId}`, {
      method: 'PUT',
      body: JSON.stringify(labelData)
    });
  }

  /**
   * Delete label
   * @param {string} labelId - Label ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteLabel(labelId) {
    return await this.apiRequest(`/label/${labelId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get labels by board
   * @param {string} boardId - Board ID
   * @returns {Promise<Object>} Board labels
   */
  async getLabelsByBoard(boardId) {
    return await this.apiRequest(`/label/v2/labels?boardId=${boardId}`);
  }

  /**
   * Clear stored tokens
   */
  clearTokens() {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.accessToken = null;
  }

  /**
   * Check if admin is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Get current admin user
   * @returns {Object|null} Admin user data
   */
  getCurrentUser() {
    const adminUser = localStorage.getItem('adminUser');
    return adminUser ? JSON.parse(adminUser) : null;
  }

  /**
   * Get product summary
   * @returns {Promise<Object>} Product summary
   */
  async getProductSummary() {
    try {
      const data = await this.getAllItems({ page: 1, limit: 1 });
      return data.data.summary;
    } catch (error) {
      console.error('Failed to get product summary:', error);
      throw error;
    }
  }

  /**
   * Search all products
   * @param {string} searchTerm - Search term
   * @param {string} productType - Product type filter
   * @returns {Promise<Object>} Search results
   */
  async searchAllProducts(searchTerm, productType = '') {
    return await this.getAllItems({
      page: 1,
      limit: 100,
      search: searchTerm,
      product_type: productType
    });
  }
}

export default AdminApiService;
