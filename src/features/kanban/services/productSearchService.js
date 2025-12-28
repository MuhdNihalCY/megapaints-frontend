/**
 * Product Search Service
 * Service for searching products for Ready Products section
 */

import api from "../../../utils/api";

class ProductSearchService {
    /**
     * Search products
     * GET /api/products/search
     * @param {string} searchTerm - Search term
     * @param {string} branchId - Branch ID (optional)
     * @param {Object} options - Additional options (product_type, limit)
     * @returns {Promise<Object>} Search results
     */
    async searchProducts(searchTerm = "", branchId = null, options = {}) {
        try {
            const params = {
                ...(searchTerm && { search: searchTerm }),
                ...(branchId && { branch_id: branchId }),
                ...(options.product_type && {
                    product_type: options.product_type,
                }),
                ...(options.limit && { limit: options.limit }),
            };

            const response = await api.get("/products/search", { params });

            if (response.data && response.data.status === "success") {
                return response.data.data.products || [];
            }

            return [];
        } catch (error) {
            throw error;
        }
    }
}

export default new ProductSearchService();
