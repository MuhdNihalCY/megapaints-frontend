/**
 * Authentication Guard Component
 * Ensures the Kanban board only renders for authenticated users
 */

import { useAuth } from "../../../contexts/AuthContext";
import { LoadingOverlay } from "../../../components";

const AuthGuard = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingOverlay message="Loading authentication..." />;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="text-red-500 text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Authentication Required
                        </h2>
                        <p className="text-gray-600 mb-6">
                            You must be logged in to access the Kanban board.
                            Please log in to continue.
                        </p>
                        <a
                            href="/login"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default AuthGuard;
