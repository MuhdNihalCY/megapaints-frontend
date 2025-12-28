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
                    ?.getProducts({ limit: 1 })
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
                adminServices?.businessManagement
                    ?.getUsers({ limit: 1 })
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
                adminServices?.businessManagement
                    ?.getBranches({ limit: 1 })
                    .catch(() => ({ data: { pagination: { total: 0 } } })),
                // Customers API - use direct API call since it's not under /api/admin
                fetch("/api/customers?limit=1")
                    .then((res) => res.json())
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
            color: "from-purple-500 to-indigo-600",
            bgColor: "bg-purple-50 dark:bg-purple-900/20",
            iconColor: "text-purple-600 dark:text-purple-400",
            path: "/admin/categories",
        },
        {
            title: "Products",
            value: stats.products,
            icon: Package,
            color: "from-blue-500 to-cyan-600",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            iconColor: "text-blue-600 dark:text-blue-400",
            path: "/admin/products",
        },
        {
            title: "Users",
            value: stats.users,
            icon: Users,
            color: "from-pink-500 to-rose-600",
            bgColor: "bg-pink-50 dark:bg-pink-900/20",
            iconColor: "text-pink-600 dark:text-pink-400",
            path: "/admin/users",
        },
        {
            title: "Branches",
            value: stats.branches,
            icon: Store,
            color: "from-emerald-500 to-teal-600",
            bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            path: "/admin/branches",
        },
        {
            title: "Customers",
            value: stats.customers,
            icon: ShoppingCart,
            color: "from-orange-500 to-amber-600",
            bgColor: "bg-orange-50 dark:bg-orange-900/20",
            iconColor: "text-orange-600 dark:text-orange-400",
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
                    <Activity className="w-8 h-8 text-blue-500 animate-spin" />
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
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Dashboard Overview
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
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
                            className={`relative overflow-hidden rounded-xl ${stat.bgColor} border border-gray-200 dark:border-gray-700 p-4 sm:p-6 cursor-pointer transition-colors hover:border-blue-300 dark:hover:border-blue-600 group`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div
                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 sm:mb-4 transition-colors`}
                                    >
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                        {stats.loading
                                            ? "..."
                                            : stat.value.toLocaleString()}
                                    </div>
                                    <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {stat.title}
                                    </div>
                                </div>
                                <ArrowRight
                                    className={`w-5 h-5 ${stat.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}
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
                                className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-left transition-colors hover:border-blue-300 dark:hover:border-blue-600"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        {action.description}
                                    </p>
                                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
