import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { RefreshCw, AlertCircle, CheckCircle, Activity, X } from 'lucide-react';

const SyncManagement = () => {
  const { getAdminServices } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConflicts();
  }, []);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const adminServices = getAdminServices();
      const response = await adminServices.inventoryManagement.getSyncConflicts();

      if (response.status === 'success') {
        setConflicts(response.data.conflict?.hasConflict ? [response.data.conflict] : []);
      }
    } catch (err) {
      console.error('Failed to fetch conflicts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');

      const adminServices = getAdminServices();
      const response = await adminServices.inventoryManagement.syncInventory({});

      if (response.status === 'success') {
        setSuccess(`Sync completed: ${response.data.result.synced} items synced`);
        setSyncStatus(response.data.result);
        fetchConflicts();
      } else {
        setError(response.message || 'Failed to sync inventory');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setError(err.message || 'Failed to sync inventory');
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async (conflictId, resolution) => {
    try {
      setLoading(true);
      const adminServices = getAdminServices();
      const response = await adminServices.inventoryManagement.resolveConflict(conflictId, resolution);

      if (response.status === 'success') {
        setSuccess('Conflict resolved successfully');
        fetchConflicts();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Failed to resolve conflict');
      }
    } catch (err) {
      console.error('Resolve conflict failed:', err);
      setError(err.message || 'Failed to resolve conflict');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sync Management</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </>
          )}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
          <button onClick={() => setSuccess('')} className="text-green-600 dark:text-green-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-600 dark:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sync Status */}
      {syncStatus && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Last Sync Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Synced</p>
              <p className="text-2xl font-bold text-green-600">{syncStatus.synced || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conflicts</p>
              <p className="text-2xl font-bold text-yellow-600">{syncStatus.conflicts || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-2xl font-bold text-red-600">{syncStatus.errors || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sync Conflicts</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <div key={index} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Conflict Type: {conflict.conflictType || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Branch ID: {conflict.branchId || 'N/A'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolveConflict(conflict.conflictId, 'last_write_wins')}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Last Write Wins
                      </button>
                      <button
                        onClick={() => handleResolveConflict(conflict.conflictId, 'manual')}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                      >
                        Manual Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {conflicts.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No conflicts detected</p>
        </div>
      )}
    </div>
  );
};

export default SyncManagement;


