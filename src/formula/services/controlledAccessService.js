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
    const response = await api.post('/v1/controlled_access/api/verify-access-key', {
      accessKey: accessKey.trim()
    });
    
    return {
      success: response.data.success,
      message: response.data.message || 'Access key verification successful'
    };
  } catch (error) {
    console.error('Error verifying access key:', error);
    throw {
      success: false,
      message: error.response?.data?.message || 'Access key verification failed. Please try again.'
    };
  }
};

/**
 * Controlled Access Service Object
 */
export const ControlledAccessService = {
  verifyAccessKey
};
