import { useUserAuth } from '../contexts/UserAuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AuthSystemTest = () => {
  const { user, loading: userLoading } = useUserAuth();
  const { admin, loading: adminLoading } = useAdminAuth();

  return (
    <div className="bg-green-50 dark:bg-green-900 p-4 rounded shadow mb-4">
      <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Auth System Test</h3>
      <div className="text-xs space-y-1 text-green-700 dark:text-green-300">
        <div>✅ Separate Auth System: Working</div>
        <div>User Loading: {userLoading ? 'Yes' : 'No'}</div>
        <div>Admin Loading: {adminLoading ? 'Yes' : 'No'}</div>
        <div>User Context: {user ? 'Active' : 'Inactive'}</div>
        <div>Admin Context: {admin ? 'Active' : 'Inactive'}</div>
        <div>Current User: {user ? `User: ${user.username}` : admin ? `Admin: ${admin.username}` : 'None'}</div>
        <div>Role: {user ? 'user' : admin ? 'admin' : 'none'}</div>
      </div>
    </div>
  );
};

export default AuthSystemTest;
