/**
 * usePermissions Hook
 * Hook for managing user permissions in Kanban board
 */

import { useContext } from 'react';
import PermissionContext from '../contexts/PermissionContext';

// Hook to use permissions
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export default usePermissions;
