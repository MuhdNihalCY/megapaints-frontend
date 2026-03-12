import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Route guard that requires the current user to have the super_user role.
 * Admins without super_user are redirected to /admin/dashboard.
 * Non-admins are redirected to /admin/login.
 */
const SuperUserProtectedRoute = ({ children }) => {
    const { user, isAdmin, isSuperUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-red-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    if (!isSuperUser) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
};

export default SuperUserProtectedRoute;
