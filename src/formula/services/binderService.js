/**
 * Binder Service
 * Handles fetching individual binders from the unified products API
 * NEW: Uses /api/v1/products/binders endpoints
 */

import api from '../../utils/api';

/**
 * Fetch a single binder by ID
 * @param {string} binderId - The binder ID to fetch
 * @returns {Promise<Object|null>} Binder data or null if not found
 */
export async function fetchBinderById(binderId) {
    if (!binderId) return null;
    
    try {
        // NEW ENDPOINT: /api/v1/products/binders/:id
        const response = await api.get(`/v1/products/binders/${binderId}`);
        
        if (response.data?.binder || response.data?.data) {
            const binder = response.data.binder || response.data.data;
            return {
                _id: binder._id,
                Binder_Id: binder._id?.toString() || '',
                Binder_Name: binder.name || binder.Binder_Name || '',
                Binder_Density: binder.density || binder.Binder_Density || 1000,
                Abbreviation: binder.abbreviation || binder.Abbreviation || '',
                name: binder.name || binder.Binder_Name || '',
                density: binder.density || binder.Binder_Density || 1000,
            };
        }
        
        return null;
    } catch (error) {
        // If individual fetch fails, try bulk fetch with filter
        try {
            // NEW ENDPOINT: /api/v1/products/binders
            const response = await api.get('/v1/products/binders', {
                params: { page: 1, limit: 1000 }
            });
            
            const binders = response.data?.binders || response.data?.data || response.data?.items || [];
            const binder = binders.find(b => 
                String(b._id) === String(binderId) ||
                String(b.Binder_Id) === String(binderId)
            );
            
            if (binder) {
                return {
                    _id: binder._id,
                    Binder_Id: binder._id?.toString() || '',
                    Binder_Name: binder.name || binder.Binder_Name || '',
                    Binder_Density: binder.density || binder.Binder_Density || 1000,
                    Abbreviation: binder.abbreviation || binder.Abbreviation || '',
                    name: binder.name || binder.Binder_Name || '',
                    density: binder.density || binder.Binder_Density || 1000,
                };
            }
        } catch (bulkError) {
            console.error('[Binder Service] Failed to fetch binder:', binderId, bulkError);
        }
        
        return null;
    }
}

/**
 * Fetch multiple binders by IDs
 * @param {string[]} binderIds - Array of binder IDs
 * @returns {Promise<Object[]>} Array of binder data
 */
export async function fetchBindersByIds(binderIds) {
    const validIds = binderIds.filter(id => id && id.trim() !== '');
    
    if (validIds.length === 0) return [];
    
    // Fetch all in parallel
    const results = await Promise.all(
        validIds.map(id => fetchBinderById(id))
    );
    
    return results.filter(b => b !== null);
}

/**
 * Fetch all binders
 * @param {Object} params - Optional query parameters
 * @returns {Promise<Object>} Binders data with pagination
 */
export async function fetchAllBinders(params = {}) {
    try {
        // NEW ENDPOINT: /api/v1/products/binders
        const response = await api.get('/v1/products/binders', {
            params: {
                page: params.page || 1,
                limit: params.limit || 1000,
                search: params.search || '',
                is_active: params.is_active !== undefined ? params.is_active : true,
            }
        });
        
        return {
            binders: response.data?.binders || response.data?.data || response.data?.items || [],
            total: response.data?.total || 0,
            pagination: response.data?.pagination || {},
        };
    } catch (error) {
        console.error('[Binder Service] Failed to fetch all binders:', error);
        throw error;
    }
}
