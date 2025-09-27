/**
 * Product Catalog Service
 * Specialized service for admin product catalog management
 * Handles all product-related operations including categories, products, additives, etc.
 */
class ProductCatalogService {
  constructor(adminApiService) {
    this.adminApi = adminApiService;
  }

  // ==================== CATEGORIES ====================

  /**
   * Get all categories with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Categories data
   */
  async getCategories(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      parent_id: null,
      is_active: null,
      ...options
    };
    return await this.adminApi.getCategories(params);
  }

  /**
   * Get root categories (no parent)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Root categories
   */
  async getRootCategories(options = {}) {
    return await this.getCategories({
      ...options,
      parent_id: null
    });
  }

  /**
   * Get subcategories by parent ID
   * @param {string} parentId - Parent category ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Subcategories
   */
  async getSubcategories(parentId, options = {}) {
    return await this.getCategories({
      ...options,
      parent_id: parentId
    });
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    return await this.adminApi.createCategory(categoryData);
  }

  /**
   * Search categories by name or description
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchCategories(searchTerm, options = {}) {
    return await this.getCategories({
      ...options,
      search: searchTerm
    });
  }

  // ==================== PRODUCTS ====================

  /**
   * Get all products with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products data
   */
  async getProducts(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      category_id: null,
      product_type: null,
      is_active: null,
      ...options
    };
    return await this.adminApi.getProducts(params);
  }

  /**
   * Get products by category
   * @param {string} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products in category
   */
  async getProductsByCategory(categoryId, options = {}) {
    return await this.getProducts({
      ...options,
      category_id: categoryId
    });
  }

  /**
   * Get products by type
   * @param {string} productType - Product type (paint, additive, etc.)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products of type
   */
  async getProductsByType(productType, options = {}) {
    return await this.getProducts({
      ...options,
      product_type: productType
    });
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    return await this.adminApi.createProduct(productData);
  }

  /**
   * Search products by name, code, or description
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(searchTerm, options = {}) {
    return await this.getProducts({
      ...options,
      search: searchTerm
    });
  }

  // ==================== ADDITIVES ====================

  /**
   * Get all additives
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Additives data
   */
  async getAdditives(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      is_active: null,
      ...options
    };
    return await this.adminApi.getAdditives(params);
  }

  /**
   * Create a new additive
   * @param {Object} additiveData - Additive data
   * @returns {Promise<Object>} Created additive
   */
  async createAdditive(additiveData) {
    return await this.adminApi.createAdditive(additiveData);
  }

  /**
   * Search additives
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchAdditives(searchTerm, options = {}) {
    return await this.getAdditives({
      ...options,
      search: searchTerm
    });
  }

  // ==================== BINDERS ====================

  /**
   * Get all binders
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Binders data
   */
  async getBinders(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      is_active: null,
      ...options
    };
    return await this.adminApi.getBinders(params);
  }

  /**
   * Create a new binder
   * @param {Object} binderData - Binder data
   * @returns {Promise<Object>} Created binder
   */
  async createBinder(binderData) {
    return await this.adminApi.createBinder(binderData);
  }

  /**
   * Search binders
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchBinders(searchTerm, options = {}) {
    return await this.getBinders({
      ...options,
      search: searchTerm
    });
  }

  // ==================== AUXILIARIES ====================

  /**
   * Get all auxiliaries
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Auxiliaries data
   */
  async getAuxiliaries(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      is_active: null,
      ...options
    };
    return await this.adminApi.getAuxiliaries(params);
  }

  /**
   * Create a new auxiliary
   * @param {Object} auxiliaryData - Auxiliary data
   * @returns {Promise<Object>} Created auxiliary
   */
  async createAuxiliary(auxiliaryData) {
    return await this.adminApi.createAuxiliary(auxiliaryData);
  }

  /**
   * Search auxiliaries
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchAuxiliaries(searchTerm, options = {}) {
    return await this.getAuxiliaries({
      ...options,
      search: searchTerm
    });
  }

  // ==================== ACCESSORIES ====================

  /**
   * Get all accessories
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Accessories data
   */
  async getAccessories(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      is_active: null,
      ...options
    };
    return await this.adminApi.getAccessories(params);
  }

  /**
   * Create a new accessory
   * @param {Object} accessoryData - Accessory data
   * @returns {Promise<Object>} Created accessory
   */
  async createAccessory(accessoryData) {
    return await this.adminApi.createAccessory(accessoryData);
  }

  /**
   * Search accessories
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchAccessories(searchTerm, options = {}) {
    return await this.getAccessories({
      ...options,
      search: searchTerm
    });
  }

  // ==================== THIRD PARTY PRODUCTS ====================

  /**
   * Get all third party products
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Third party products data
   */
  async getThirdPartyProducts(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      is_active: null,
      ...options
    };
    return await this.adminApi.getThirdPartyProducts(params);
  }

  /**
   * Create a new third party product
   * @param {Object} thirdPartyData - Third party product data
   * @returns {Promise<Object>} Created third party product
   */
  async createThirdPartyProduct(thirdPartyData) {
    return await this.adminApi.createThirdPartyProduct(thirdPartyData);
  }

  /**
   * Search third party products
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchThirdPartyProducts(searchTerm, options = {}) {
    return await this.getThirdPartyProducts({
      ...options,
      search: searchTerm
    });
  }

  // ==================== UNIFIED VIEW ====================

  /**
   * Get all items across all types (unified view)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} All items data
   */
  async getAllItems(options = {}) {
    const params = {
      page: 1,
      limit: 20,
      search: '',
      product_type: '',
      is_active: null,
      ...options
    };
    return await this.adminApi.getAllItems(params);
  }

  /**
   * Get items by type
   * @param {string} itemType - Item type filter
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Items of type
   */
  async getItemsByType(itemType, options = {}) {
    return await this.getAllItems({
      ...options,
      product_type: itemType
    });
  }

  /**
   * Search all items
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Search results
   */
  async searchAllItems(searchTerm, options = {}) {
    return await this.getAllItems({
      ...options,
      search: searchTerm
    });
  }

  // ==================== ANALYTICS & SUMMARY ====================

  /**
   * Get product catalog summary
   * @returns {Promise<Object>} Summary data
   */
  async getSummary() {
    return await this.adminApi.getProductSummary();
  }

  /**
   * Get category hierarchy
   * @returns {Promise<Object>} Category hierarchy
   */
  async getCategoryHierarchy() {
    try {
      const [rootCategories, allCategories] = await Promise.all([
        this.getRootCategories({ limit: 100 }),
        this.getCategories({ limit: 100 })
      ]);

      const hierarchy = this.buildHierarchy(
        allCategories.data.categories,
        rootCategories.data.categories
      );

      return {
        status: 'success',
        data: { hierarchy }
      };
    } catch (error) {
      console.error('Failed to get category hierarchy:', error);
      throw error;
    }
  }

  /**
   * Build category hierarchy from flat list
   * @param {Array} allCategories - All categories
   * @param {Array} rootCategories - Root categories
   * @returns {Array} Hierarchical structure
   */
  buildHierarchy(allCategories, rootCategories) {
    const categoryMap = new Map();
    allCategories.forEach(cat => {
      categoryMap.set(cat._id, { ...cat, children: [] });
    });

    const hierarchy = [];
    rootCategories.forEach(root => {
      const rootNode = categoryMap.get(root._id);
      if (rootNode) {
        this.populateChildren(rootNode, categoryMap);
        hierarchy.push(rootNode);
      }
    });

    return hierarchy;
  }

  /**
   * Populate children recursively
   * @param {Object} parent - Parent category
   * @param {Map} categoryMap - Category map
   */
  populateChildren(parent, categoryMap) {
    categoryMap.forEach(category => {
      if (category.parent_id === parent._id) {
        this.populateChildren(category, categoryMap);
        parent.children.push(category);
      }
    });
  }

  /**
   * Get product statistics
   * @returns {Promise<Object>} Product statistics
   */
  async getProductStatistics() {
    try {
      const [summary, recentItems] = await Promise.all([
        this.getSummary(),
        this.getAllItems({ page: 1, limit: 10 })
      ]);

      return {
        status: 'success',
        data: {
          summary: summary,
          recentItems: recentItems.data.items || [],
          totalItems: recentItems.data.pagination?.total || 0
        }
      };
    } catch (error) {
      console.error('Failed to get product statistics:', error);
      throw error;
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk create items
   * @param {Array} items - Array of items to create
   * @param {string} itemType - Type of items (additive, binder, etc.)
   * @returns {Promise<Object>} Bulk creation result
   */
  async bulkCreateItems(items, itemType) {
    const results = {
      successful: [],
      failed: [],
      total: items.length
    };

    for (const item of items) {
      try {
        let result;
        switch (itemType) {
          case 'additive':
            result = await this.createAdditive(item);
            break;
          case 'binder':
            result = await this.createBinder(item);
            break;
          case 'auxiliary':
            result = await this.createAuxiliary(item);
            break;
          case 'accessory':
            result = await this.createAccessory(item);
            break;
          case 'third_party':
            result = await this.createThirdPartyProduct(item);
            break;
          case 'product':
            result = await this.createProduct(item);
            break;
          default:
            throw new Error(`Unknown item type: ${itemType}`);
        }
        results.successful.push(result.data);
      } catch (error) {
        results.failed.push({
          item,
          error: error.message
        });
      }
    }

    return {
      status: 'success',
      data: results
    };
  }

  /**
   * Export items to CSV format
   * @param {string} itemType - Type of items to export
   * @param {Object} options - Export options
   * @returns {Promise<string>} CSV data
   */
  async exportItemsToCSV(itemType, options = {}) {
    try {
      let items;
      
      switch (itemType) {
        case 'all':
          items = await this.getAllItems({ limit: 1000, ...options });
          break;
        case 'additive':
          items = await this.getAdditives({ limit: 1000, ...options });
          break;
        case 'binder':
          items = await this.getBinders({ limit: 1000, ...options });
          break;
        case 'auxiliary':
          items = await this.getAuxiliaries({ limit: 1000, ...options });
          break;
        case 'accessory':
          items = await this.getAccessories({ limit: 1000, ...options });
          break;
        case 'third_party':
          items = await this.getThirdPartyProducts({ limit: 1000, ...options });
          break;
        case 'product':
          items = await this.getProducts({ limit: 1000, ...options });
          break;
        default:
          throw new Error(`Unknown item type: ${itemType}`);
      }

      return this.convertToCSV(items.data.items || []);
    } catch (error) {
      console.error('Failed to export items to CSV:', error);
      throw error;
    }
  }

  /**
   * Convert items array to CSV format
   * @param {Array} items - Items array
   * @returns {string} CSV data
   */
  convertToCSV(items) {
    if (!items || items.length === 0) {
      return 'No data available';
    }

    const headers = Object.keys(items[0]);
    const csvRows = [
      headers.join(','),
      ...items.map(item => 
        headers.map(header => {
          const value = item[header];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }
}

export default ProductCatalogService;
