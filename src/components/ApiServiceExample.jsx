/**
 * API Service Example Component
 * Demonstrates how to use the new API service structure
 * This component shows examples for both admin and user operations
 */
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import apiServiceFactory from "../services/ApiServiceFactory.js";
import { ADMIN_PERMISSIONS } from "../utils/adminPermissions";

const ApiServiceExample = () => {
    const { user, isAdmin, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    // Example: Admin Product Management
    const handleAdminProductExample = async () => {
        if (!isAdmin) {
            setError("Admin access required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Initialize admin services
            const adminServices = apiServiceFactory.initializeAdminServices();

            // Example 1: Get all products
            console.log("📦 Fetching products...");
            const products = await adminServices.productCatalog.getProducts({
                page: 1,
                limit: 10,
            });
            console.log("Products:", products);

            // Example 2: Get all additives
            console.log("🧪 Fetching additives...");
            const additives = await adminServices.productCatalog.getAdditives({
                page: 1,
                limit: 10,
            });
            console.log("Additives:", additives);

            // Example 3: Get unified view of all items
            console.log("📋 Fetching all items...");
            const allItems = await adminServices.productCatalog.getAllItems({
                page: 1,
                limit: 20,
            });
            console.log("All Items:", allItems);

            // Example 4: Get product summary
            console.log("📊 Fetching product summary...");
            const summary = await adminServices.productCatalog.getSummary();
            console.log("Summary:", summary);

            // Example 5: Get Kanban boards
            console.log("📋 Fetching Kanban boards...");
            const boards = await adminServices.kanbanBoard.getBoards();
            console.log("Boards:", boards);

            // Example 6: Get labels
            console.log("🏷️ Fetching labels...");
            const labels = await adminServices.labelManagement.getLabels();
            console.log("Labels:", labels);

            setData({
                products: products.data.products,
                additives: additives.data.additives,
                allItems: allItems.data.items,
                summary: summary,
                boards: boards.data.boards,
                labels: labels.data.labels,
            });
        } catch (err) {
            console.error("Admin product example failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Example: Admin Business Management
    const handleAdminBusinessExample = async () => {
        if (!isAdmin) {
            setError("Admin access required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Initialize admin services
            const adminServices = apiServiceFactory.initializeAdminServices();

            // Example 1: Get all branches
            console.log("🏢 Fetching branches...");
            const branches = await adminServices.businessManagement.getBranches(
                {
                    page: 1,
                    limit: 10,
                },
            );
            console.log("Branches:", branches);

            // Example 2: Get all users
            console.log("👥 Fetching users...");
            const users = await adminServices.businessManagement.getUsers({
                page: 1,
                limit: 10,
            });
            console.log("Users:", users);

            // Example 3: Get business overview
            console.log("📈 Fetching business overview...");
            const overview =
                await adminServices.businessManagement.getBusinessOverview();
            console.log("Business Overview:", overview);

            setData({
                branches: branches.data.branches,
                users: users.data.users,
                overview: overview.data,
            });
        } catch (err) {
            console.error("Admin business example failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Example: User Operations
    const handleUserExample = async () => {
        if (!isAuthenticated || isAdmin) {
            setError("User access required (not admin)");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Initialize user services
            const userServices = apiServiceFactory.initializeUserServices();

            // Example 1: Get user profile
            console.log("👤 Fetching user profile...");
            const profile = await userServices.user.getProfile();
            console.log("Profile:", profile);

            // Example 2: Get user dashboard
            console.log("📊 Fetching user dashboard...");
            const dashboard = await userServices.user.getDashboard();
            console.log("Dashboard:", dashboard);

            // Example 3: Get available products (read-only)
            console.log("🛍️ Fetching available products...");
            const products = await userServices.user.getAvailableProducts({
                page: 1,
                limit: 10,
            });
            console.log("Available Products:", products);

            // Example 4: Get user activity summary
            console.log("📈 Fetching activity summary...");
            const activitySummary =
                await userServices.user.getActivitySummary();
            console.log("Activity Summary:", activitySummary);

            setData({
                profile: profile.data.user,
                dashboard: dashboard.data,
                products: products.data.products,
                activitySummary: activitySummary,
            });
        } catch (err) {
            console.error("User example failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Example: Kanban Board Operations
    const handleKanbanExample = async () => {
        if (!isAdmin) {
            setError("Admin access required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Initialize admin services
            const adminServices = apiServiceFactory.initializeAdminServices();

            // Example 1: Get branch board data
            console.log("📋 Fetching branch board data...");
            const boardData =
                await adminServices.kanbanBoard.getBranchBoardData();
            console.log("Board Data:", boardData);

            // Example 2: Get columns
            console.log("📊 Fetching columns...");
            const columns = await adminServices.kanbanBoard.getColumns();
            console.log("Columns:", columns);

            // Example 3: Get cards
            console.log("🎴 Fetching cards...");
            const cards = await adminServices.kanbanBoard.getCards();
            console.log("Cards:", cards);

            // Example 4: Get labels
            console.log("🏷️ Fetching branch labels...");
            const branchLabels =
                await adminServices.labelManagement.getBranchLabels();
            console.log("Branch Labels:", branchLabels);

            // Example 5: Get board statistics
            console.log("📈 Fetching board statistics...");
            const boardStats =
                await adminServices.kanbanBoard.getBoardStatistics();
            console.log("Board Statistics:", boardStats);

            setData({
                boardData: boardData.data,
                columns: columns.data,
                cards: cards.data,
                branchLabels: branchLabels.data,
                boardStats: boardStats.data,
            });
        } catch (err) {
            console.error("Kanban example failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Example: Health Check
    const handleHealthCheck = async () => {
        try {
            setLoading(true);
            setError("");

            console.log("🏥 Checking API health...");
            const health = await apiServiceFactory.getHealthCheck();
            console.log("Health Check:", health);

            console.log("🔍 Checking detailed health...");
            const detailedHealth =
                await apiServiceFactory.getDetailedHealthCheck();
            console.log("Detailed Health:", detailedHealth);

            setData({
                health,
                detailedHealth,
            });
        } catch (err) {
            console.error("Health check failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Example: Permission Checking
    const handlePermissionExample = () => {
        if (!isAuthenticated) {
            setError("Authentication required");
            return;
        }

        const permissions = [
            ADMIN_PERMISSIONS.PRODUCTS_READ,
            ADMIN_PERMISSIONS.PRODUCTS_CREATE,
            ADMIN_PERMISSIONS.USERS_READ,
            ADMIN_PERMISSIONS.USERS_CREATE,
            ADMIN_PERMISSIONS.INVENTORY_READ,
        ];

        const permissionResults = permissions.map((permission) => ({
            permission,
            hasPermission: apiServiceFactory.hasPermission(permission),
        }));

        const hasAnyProductPermission = apiServiceFactory.hasAnyPermission([
            ADMIN_PERMISSIONS.PRODUCTS_READ,
            ADMIN_PERMISSIONS.PRODUCTS_CREATE,
            ADMIN_PERMISSIONS.PRODUCTS_UPDATE,
            ADMIN_PERMISSIONS.PRODUCTS_DELETE,
        ]);

        const hasAllUserPermissions = apiServiceFactory.hasAllPermissions([
            ADMIN_PERMISSIONS.USERS_READ,
            ADMIN_PERMISSIONS.USERS_CREATE,
            ADMIN_PERMISSIONS.USERS_UPDATE,
            ADMIN_PERMISSIONS.USERS_DELETE,
        ]);

        setData({
            permissionResults,
            hasAnyProductPermission,
            hasAllUserPermissions,
            userRole: apiServiceFactory.getUserRole(),
            currentUser: apiServiceFactory.getCurrentUser(),
        });
    };

    const clearData = () => {
        setData(null);
        setError("");
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">API Service Examples</h1>

            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Current Status</h2>
                <p>
                    <strong>Authenticated:</strong>{" "}
                    {isAuthenticated ? "Yes" : "No"}
                </p>
                <p>
                    <strong>User Type:</strong> {isAdmin ? "Admin" : "User"}
                </p>
                <p>
                    <strong>User:</strong> {user?.username || "None"}
                </p>
                <p>
                    <strong>Role:</strong>{" "}
                    {apiServiceFactory.getUserRole() || "None"}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {isAdmin && (
                    <>
                        <button
                            onClick={handleAdminProductExample}
                            disabled={loading}
                            className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            Admin: Product Management
                        </button>
                        <button
                            onClick={handleAdminBusinessExample}
                            disabled={loading}
                            className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                        >
                            Admin: Business Management
                        </button>
                        <button
                            onClick={handleKanbanExample}
                            disabled={loading}
                            className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                        >
                            Admin: Kanban Boards
                        </button>
                    </>
                )}

                {isAuthenticated && !isAdmin && (
                    <button
                        onClick={handleUserExample}
                        disabled={loading}
                        className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                    >
                        User Operations
                    </button>
                )}

                <button
                    onClick={handleHealthCheck}
                    disabled={loading}
                    className="p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                >
                    Health Check
                </button>

                <button
                    onClick={handlePermissionExample}
                    disabled={loading}
                    className="p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                    Permission Check
                </button>

                <button
                    onClick={clearData}
                    className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                    Clear Data
                </button>
            </div>

            {loading && (
                <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2">Loading...</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {data && (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold mb-4">
                        Response Data
                    </h2>
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ApiServiceExample;
