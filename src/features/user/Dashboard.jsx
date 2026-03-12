import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Welcome Back!
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Ready to create something amazing?
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                                Start New Project
                            </button>
                            <button className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                View Gallery
                            </button>
                            <button className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                My Projects
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                                <span>
                                    Project "Sunset Landscape" completed
                                </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                                <span>Started new project "Abstract Art"</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                                <span>Shared project with community</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Your Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    12
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Projects
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    8
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Completed
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    156
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    Hours
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    4
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    In Progress
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Available Tools
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Paint Brush
                            </button>
                            <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Color Picker
                            </button>
                            <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Eraser
                            </button>
                            <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Layers
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Community
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Followers
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    24
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Following
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    18
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Likes Received
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    156
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;
