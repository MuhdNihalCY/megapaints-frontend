import { useState } from 'react';
import { ControlledAccessService } from '../../../formula/services/controlledAccessService';

/**
 * Access Key Verification Modal Component
 * 
 * This modal verifies the controlled access password before allowing
 * file number editing functionality.
 */
const AccessKeyModal = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [accessKey, setAccessKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle access key input change
  const handleAccessKeyChange = (e) => {
    setAccessKey(e.target.value);
    // Clear error and success when user starts typing
    if (error) {
      setError('');
    }
    if (success) {
      setSuccess(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Verify access key
  const handleVerify = async () => {
    if (!accessKey.trim()) {
      setError('Please enter an access key.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      console.log('[AccessKeyModal] Starting verification...');
      const result = await ControlledAccessService.verifyAccessKey(accessKey.trim());
      
      console.log('[AccessKeyModal] Verification result:', result);
      
      if (result.success) {
        // Access key verified successfully
        console.log('[AccessKeyModal] Verification successful, calling onSuccess');
        setSuccess(true);
        setError('');
        // Wait a moment to show success message, then proceed
        setTimeout(() => {
          onSuccess();
          handleCancel();
        }, 1000);
      } else {
        console.log('[AccessKeyModal] Verification failed:', result.message);
        setError(result.message || 'Access key verification failed.');
        setSuccess(false);
      }
    } catch (error) {
      console.error('[AccessKeyModal] Error during verification:', error);
      setError(error.message || 'Access key verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setAccessKey('');
    setError('');
    setSuccess(false);
    setIsVerifying(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Controlled Access Verification
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Access Key
            </label>
            <input
              type="password"
              value={accessKey}
              onChange={handleAccessKeyChange}
              onKeyDown={handleKeyPress}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="Enter controlled access key"
              disabled={isVerifying}
              autoFocus
            />
            
            {/* Help text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the controlled access key to edit file numbers
            </p>
            
            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            )}
            
            {/* Success message */}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                ✓ Access key verified successfully! Opening file number editor...
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!accessKey.trim() || isVerifying}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessKeyModal;
