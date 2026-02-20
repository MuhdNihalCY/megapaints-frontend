import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
    Plus,
    RefreshCw,
    Search,
    Edit,
    Trash2,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Image as ImageIcon,
    CheckCircle,
    XCircle,
    Activity,
    X,
    Filter,
    Layers,
} from "lucide-react";
import CategoryForm from "./components/CategoryForm";

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [hierarchicalCategories, setHierarchicalCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [parentCategory, setParentCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterActive, setFilterActive] = useState(null);
    const [viewMode, setViewMode] = useState("hierarchical"); // 'hierarchical' or 'flat'
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        pages: 0,
    });
    const { getAdminServices } = useAuth();

    useEffect(() => {
        fetchCategories();
    }, [pagination.page, searchTerm, filterActive]);

    useEffect(() => {
        if (viewMode === "hierarchical") {
            buildHierarchicalStructure();
        }
    }, [categories, viewMode]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const adminServices = getAdminServices();
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(searchTerm && { search: searchTerm }),
                ...(filterActive !== null && { is_active: filterActive }),
            };

            const response =
                await adminServices.productCatalog.getCategories(params);

            if (response.status === "success") {
                setCategories(response.data.categories || []);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.pagination?.total || 0,
                    pages: response.data.pagination?.pages || 0,
                }));
            } else {
                setError("Failed to fetch categories");
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            setError(err.message || "Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    const buildHierarchicalStructure = () => {
        const categoryMap = new Map();
        const rootCategories = [];

        // First pass: create map of all categories
        categories.forEach((cat) => {
            categoryMap.set(cat._id, {
                ...cat,
                children: [],
            });
        });

        // Second pass: build hierarchy
        categories.forEach((cat) => {
            const categoryNode = categoryMap.get(cat._id);
            if (cat.parent_id) {
                const parent = categoryMap.get(
                    cat.parent_id?._id || cat.parent_id,
                );
                if (parent) {
                    parent.children.push(categoryNode);
                } else {
                    // Orphan category (parent not in current set)
                    rootCategories.push(categoryNode);
                }
            } else {
                rootCategories.push(categoryNode);
            }
        });

        setHierarchicalCategories(rootCategories);
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const handleAddCategory = (parent = null) => {
        setEditingCategory(null);
        setParentCategory(parent);
        setShowForm(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setParentCategory(null);
        setShowForm(true);
    };

    const handleDeleteCategory = async (category) => {
        if (
            !window.confirm(
                `Are you sure you want to delete category "${category.name}"? This will also delete all subcategories.`,
            )
        ) {
            return;
        }

        try {
            const adminServices = getAdminServices();
            const response = await adminServices.productCatalog.deleteCategory(
                category._id,
            );

            if (response.status === "success") {
                setSuccess("Category deleted successfully");
                fetchCategories();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError("Failed to delete category");
            }
        } catch (err) {
            console.error("Failed to delete category:", err);
            
            // If category doesn't exist (404), refresh the list
            if (err.response?.status === 404 || err.status === 404) {
                setSuccess("Category no longer exists; list refreshed.");
                fetchCategories();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(err.message || "Failed to delete category");
            }
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingCategory(null);
        setParentCategory(null);
    };

    const handleFormSuccess = () => {
        fetchCategories();
        setShowForm(false);
        setEditingCategory(null);
        setParentCategory(null);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setFilterActive(null);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const renderCategoryRow = (category, level = 0) => {
        const isExpanded = expandedCategories.has(category._id);
        const hasChildren = category.children && category.children.length > 0;
        const indent = level * 24;

        return (
            <div key={category._id}>
                <div
                    className={`flex items-center px-3 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700 ${
                        level > 0 ? "bg-gray-50/50 dark:bg-gray-800/50" : ""
                    }`}
                >
                    <div
                        className="flex items-center flex-1"
                        style={{ paddingLeft: `${indent}px` }}
                    >
                        {/* Expand/Collapse Button */}
                        {hasChildren ? (
                            <button
                                onClick={() => toggleCategory(category._id)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6 mr-2" />
                        )}

                        {/* Category Icon */}
                        <div className="flex-shrink-0 mr-3">
                            {hasChildren ? (
                                <FolderOpen className="w-5 h-5 text-blue-500" />
                            ) : (
                                <Folder className="w-5 h-5 text-gray-400" />
                            )}
                        </div>

                        {/* Category Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {category.name}
                                        </span>
                                        {category.parent_id && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                (Subcategory)
                                            </span>
                                        )}
                                    </div>
                                    {category.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                            {category.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    {/* Status Badge */}
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                            category.is_active
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        }`}
                                    >
                                        {category.is_active ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Inactive
                                            </>
                                        )}
                                    </span>

                                    {/* Sort Order */}
                                    {category.sort_order !== undefined && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:inline">
                                            Order: {category.sort_order}
                                        </span>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                        <button
                                            onClick={() =>
                                                handleAddCategory(category)
                                            }
                                            className="p-1.5 sm:p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            title="Add subcategory"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleEditCategory(category)
                                            }
                                            className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Edit category"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteCategory(category)
                                            }
                                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete category"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Render Children */}
                {hasChildren && isExpanded && (
                    <div>
                        {category.children.map((child) =>
                            renderCategoryRow(child, level + 1),
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderFlatView = () => {
        return categories.map((category) => (
            <div
                key={category._id}
                className="flex items-center px-3 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700"
            >
                <div className="flex-shrink-0 mr-3">
                    <Folder className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {category.name}
                                </span>
                                {category.parent_id && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        Parent:{" "}
                                        {category.parent_id.name ||
                                            category.parent_id._id}
                                    </span>
                                )}
                            </div>
                            {category.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {category.description}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                    category.is_active
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                            >
                                {category.is_active ? "Active" : "Inactive"}
                            </span>

                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <button
                                    onClick={() => handleEditCategory(category)}
                                    className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() =>
                                        handleDeleteCategory(category)
                                    }
                                    className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ));
    };

    if (loading && categories.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <Activity className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">
                        Loading categories...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Category Management
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage product categories and subcategories
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAddCategory(null)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </button>
                    <button
                        onClick={fetchCategories}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {success}
                    </div>
                    <button
                        onClick={() => setSuccess("")}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <XCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                    <button
                        onClick={() => setError("")}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={
                            filterActive === null
                                ? "all"
                                : filterActive
                                  ? "active"
                                  : "inactive"
                        }
                        onChange={(e) => {
                            const value =
                                e.target.value === "all"
                                    ? null
                                    : e.target.value === "active";
                            setFilterActive(value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>

                    {/* View Mode */}
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="hierarchical">Hierarchical View</option>
                        <option value="flat">Flat View</option>
                    </select>

                    {/* Clear Filters */}
                    {(searchTerm || filterActive !== null) && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-3 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                            <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                {viewMode === "hierarchical"
                                    ? "Hierarchical Categories"
                                    : "All Categories"}
                            </h3>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {pagination.total}{" "}
                            {pagination.total === 1 ? "category" : "categories"}
                        </div>
                    </div>
                </div>

                {/* Categories List */}
                <div>
                    {categories.length === 0 ? (
                        <div className="px-3 sm:px-6 py-12 text-center">
                            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                                No categories found
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                {searchTerm || filterActive !== null
                                    ? "Try adjusting your filters"
                                    : "Get started by adding a new category"}
                            </p>
                        </div>
                    ) : viewMode === "hierarchical" ? (
                        <div>
                            {hierarchicalCategories.map((category) =>
                                renderCategoryRow(category, 0),
                            )}
                        </div>
                    ) : (
                        <div>{renderFlatView()}</div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                Showing{" "}
                                <span className="font-medium">
                                    {(pagination.page - 1) * pagination.limit +
                                        1}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">
                                    {Math.min(
                                        pagination.page * pagination.limit,
                                        pagination.total,
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium">
                                    {pagination.total}
                                </span>{" "}
                                categories
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() =>
                                        setPagination((prev) => ({
                                            ...prev,
                                            page: Math.max(1, prev.page - 1),
                                        }))
                                    }
                                    disabled={pagination.page === 1}
                                    className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() =>
                                        setPagination((prev) => ({
                                            ...prev,
                                            page: Math.min(
                                                prev.pages,
                                                prev.page + 1,
                                            ),
                                        }))
                                    }
                                    disabled={
                                        pagination.page === pagination.pages
                                    }
                                    className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Category Form Modal */}
            {showForm && (
                <CategoryForm
                    category={editingCategory}
                    parentCategory={parentCategory}
                    onClose={handleCloseForm}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default Categories;
