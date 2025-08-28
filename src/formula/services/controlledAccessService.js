import api from '../../utils/api';

/**
 * Controlled Access Service
 * 
 * This service handles controlled access operations such as
 * password verification for sensitive operations like file number editing.
 */

/**
 * Verifies a controlled access key
 * @param {string} accessKey - The access key to verify
 * @returns {Promise<Object>} Response with success status and message
 */
export const verifyAccessKey = async (accessKey) => {
  try {
    console.log('[ControlledAccess] Verifying access key...');
    const response = await api.post('/v1/controlled_access/api/verify-access-key', {
      accessKey: accessKey.trim()
    });
    
    console.log('[ControlledAccess] API Response:', response.data);
    
    // Handle different response formats
    const success = response.data.success || response.data.status === 'success' || response.data.verified === true;
    const message = response.data.message || response.data.msg || 
      (success ? 'Access key verification successful' : 'Access key verification failed');
    
    console.log('[ControlledAccess] Processed result:', { success, message });
    
    return {
      success,
      message
    };
  } catch (error) {
    console.error('[ControlledAccess] Error verifying access key:', error);
    console.error('[ControlledAccess] Error response:', error.response?.data);
    
    // Handle different error response formats
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.msg || 
                        error.response?.data?.error ||
                        error.message || 
                        'Access key verification failed. Please try again.';
    
    throw {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Controlled Access Service Object
 */
export const ControlledAccessService = {
  verifyAccessKey
};
