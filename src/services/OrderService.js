// =====================================================
// Order Service - Frontend API Service
// MegaPaints Frontend - Order Management
// =====================================================

class OrderService {
  constructor(adminApiService) {
    this.adminApi = adminApiService;
  }

  /**
   * Get orders with filters and pagination
   * @param {String} type - Order type: 'formula', 'wholesale', 'retail', or 'all'
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination parameters
   * @returns {Promise<Object>} Orders list with pagination
   */
  async getOrders(type = 'all', filters = {}, pagination = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('type', type);
      
      if (pagination.page) queryParams.append('page', pagination.page);
      if (pagination.limit) queryParams.append('limit', pagination.limit);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.payment_status) queryParams.append('payment_status', filters.payment_status);
      if (filters.branch_id) queryParams.append('branch_id', filters.branch_id);
      if (filters.customer_id) queryParams.append('customer_id', filters.customer_id);
      if (filters.date_from) queryParams.append('date_from', filters.date_from);
      if (filters.date_to) queryParams.append('date_to', filters.date_to);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);

      const response = await this.adminApi.apiRequest(`/admin/orders?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   * @param {String} orderId - Order ID
   * @param {String} type - Order type: 'formula', 'wholesale', or 'retail'
   * @returns {Promise<Object>} Order details
   */
  async getOrderById(orderId, type) {
    try {
      const response = await this.adminApi.apiRequest(`/admin/orders/${type}/${orderId}`);
      return response;
    } catch (error) {
      console.error('Get order by ID error:', error);
      throw error;
    }
  }

  /**
   * Update order status
   * @param {String} orderId - Order ID
   * @param {String} type - Order type
   * @param {String} status - New status
   * @param {String} notes - Optional notes
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, type, status, notes = '') {
    try {
      const response = await this.adminApi.apiRequest(`/admin/orders/${type}/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  }

  /**
   * Delete order
   * @param {String} orderId - Order ID
   * @param {String} type - Order type
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOrder(orderId, type) {
    try {
      const response = await this.adminApi.apiRequest(`/admin/orders/${type}/${orderId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Delete order error:', error);
      throw error;
    }
  }

  /**
   * Get order statistics
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStatistics(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.payment_status) queryParams.append('payment_status', filters.payment_status);
      if (filters.branch_id) queryParams.append('branch_id', filters.branch_id);
      if (filters.customer_id) queryParams.append('customer_id', filters.customer_id);
      if (filters.date_from) queryParams.append('date_from', filters.date_from);
      if (filters.date_to) queryParams.append('date_to', filters.date_to);

      const response = await this.adminApi.apiRequest(`/admin/orders/statistics?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Get order statistics error:', error);
      throw error;
    }
  }
}

export default OrderService;


