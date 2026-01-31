import api from '../../utils/api';

/**
 * Fetches binders by their IDs
 * @param {Array<string>} ids - Array of binder IDs to fetch
 * @returns {Promise<Array>} Array of binder objects
 */
export async function fetchBindersByIds(ids) {
  try {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    // Fetch all binders
    // We fetch a large limit to ensure we get better coverage
    const response = await api.get('/v1/product', { 
      params: { 
        page: 1, 
        limit: 1000,
        product_type: 'binder'
      } 
    });

    const data = response.data;
    
    // Extract items from unified response structure
    const items = (Array.isArray(data?.products) && data.products) ||
                  [];

    if (items.length === 0) {
      return [];
    }

    // Filter by requested IDs
    // We check both _id and Binder_Id for matches
    const uniqueIds = new Set(ids.map(id => String(id)));
    
    return items.filter(item => {
      const id1 = String(item._id || '');
      const id2 = String(item.Binder_Id || '');
      return uniqueIds.has(id1) || uniqueIds.has(id2);
    });

  } catch (error) {
    console.error('[BinderService] Failed to fetch binders by IDs:', error);
    return [];
  }
}

export default {
  fetchBindersByIds
};
