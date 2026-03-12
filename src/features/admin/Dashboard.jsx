import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import apiServiceFactory from "../../services/ApiServiceFactory.js";
import {
    Folder,
    Package,
    Users,
    Store,
    ShoppingCart,
    TrendingUp,
    Activity,
    ArrowRight,
} from "lucide-react";

const Dashboard = () => {
    const navigate = useNavigate();
    const { getAdminServices } = useAuth();
    const [stats, setStats] = useState({
        categories: 0,
        products: 0,
        users: 0,
        branches: 0,
        customers: 0,
        loading: true,
    });
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setStats((prev) => ({ ...prev, loading: true }));
            setError("");

            const adminServices = getAdminServices();

            // Fetch all stats in parallel
            const [
                categoriesRes,
                productsRes,
                usersRes,
                branchesRes,
                customersRes,
            ] = await Promise.allSettled([
                adminServices?.productCatalog
                    ?.getCategories({ limit: 1 })
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
                adminServices?.productCatalog
                    ?.getAllItems({ limit: 1 })
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
                adminServices?.businessManagement
                    ?.getUsers({ limit: 1 })
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
                adminServices?.businessManagement
                    ?.getBranches({ limit: 1 })
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
                // Customers API - use apiRequest to include auth token
                adminServices?.admin?.apiRequest("/customers?limit=1")
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
            ]);

            const newStats = {
                categories:
                    (categoriesRes.status === "fulfilled" &&
                        categoriesRes.value?.data?.pagination?.total) ||
                    0,
                products:
                    (productsRes.status === "fulfilled" &&
                        productsRes.value?.data?.pagination?.total) ||
                    0,
                users:
                    (usersRes.status === "fulfilled" &&
                        usersRes.value?.data?.pagination?.total) ||
                    0,
                branches:
                    (branchesRes.status === "fulfilled" &&
                        branchesRes.value?.data?.pagination?.total) ||
                    0,
                customers:
                    (customersRes.status === "fulfilled" &&
                        customersRes.value?.data?.pagination?.total) ||
                    0,
                loading: false,
            };

            setStats(newStats);
        } catch (err) {
            console.error("Failed to fetch dashboard stats:", err);
            setError("Failed to load dashboard statistics");
            setStats((prev) => ({ ...prev, loading: false }));
        }
    };

    const statCards = [
        {
            title: "Categories",
            value: stats.categories,
            icon: Folder,
            path: "/admin/categories",
        },
        {
            title: "Products",
            value: stats.products,
            icon: Package,
            path: "/admin/products",
        },
        {
            title: "Users",
            value: stats.users,
            icon: Users,
            path: "/admin/users",
        },
        {
            title: "Branches",
            value: stats.branches,
            icon: Store,
            path: "/admin/branches",
        },
        {
            title: "Customers",
            value: stats.customers,
            icon: ShoppingCart,
            path: "/admin/customers",
        },
    ];

    const quickActions = [
        {
            title: "Manage Categories",
            description: "View and manage product categories",
            icon: Folder,
            path: "/admin/categories",
        },
        {
            title: "Manage Products",
            description: "View and manage products",
            icon: Package,
            path: "/admin/products",
        },
        {
            title: "Manage Users",
            description: "View and manage user accounts",
            icon: Users,
            path: "/admin/users",
        },
        {
            title: "Manage Customers",
            description: "View and manage customers",
            icon: ShoppingCart,
            path: "/admin/customers",
        },
        {
            title: "Manage Branches",
            description: "View and manage branches",
            icon: Store,
            path: "/admin/branches",
        },
    ];

    if (stats.loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">
                        Loading dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Dashboard Overview
                </h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    Welcome to your MegaPaints Admin Dashboard
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => navigate(stat.path)}
                            className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 sm:mb-4">
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                        {stats.loading
                                            ? "..."
                                            : stat.value.toLocaleString()}
                                    </div>
                                    <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {stat.title}
                                    </div>
                                </div>
                                <ArrowRight
                                    className="w-5 h-5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 sm:mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        Quick Actions
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(action.path)}
                                className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-left hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 sm:mb-4">
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {action.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        {action.description}
                                    </p>
                                    <div className="mt-4 flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Go to page
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
