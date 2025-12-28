import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const UserProtectedRoute = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
};

export default UserProtectedRoute;
