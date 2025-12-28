import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import {
    Home,
    Folder,
    Layers,
    Package,
    Palette,
    Beaker,
    Wrench,
    Box,
    ShoppingBag,
    Truck,
    Store,
    Users,
    ShoppingCart,
    UserCircle,
    LogOut,
    Sun,
    Moon,
    Settings,
    ChevronLeft,
    ChevronRight,
    Grid3x3,
    Warehouse,
    BarChart3,
    Columns,
} from "lucide-react";

const drawerWidth = 260;
const drawerWidthCollapsed = 80;

const menuItems = [
    { text: "Dashboard", icon: Home, path: "/admin/dashboard" },
    { text: "Categories", icon: Folder, path: "/admin/categories" },
    { text: "Sub-Categories", icon: Layers, path: "/admin/sub-categories" },
    { text: "Groups", icon: Grid3x3, path: "/admin/groups" },
    { text: "Products", icon: Package, path: "/admin/products" },
    { text: "Tinters", icon: Palette, path: "/admin/tinters" },
    { text: "Additives", icon: Beaker, path: "/admin/additives" },
    { text: "Binders", icon: Wrench, path: "/admin/binders" },
    { text: "Auxiliaries", icon: Box, path: "/admin/auxiliaries" },
    { text: "Accessories", icon: Box, path: "/admin/accessories" },
    { text: "3P Products", icon: Truck, path: "/admin/third-party-products" },
    { text: "Branches", icon: Store, path: "/admin/branches" },
    { text: "Inventory", icon: Warehouse, path: "/admin/inventory" },
    {
        text: "Inventory Summary",
        icon: BarChart3,
        path: "/admin/inventory/summary",
    },
    { text: "Users", icon: Users, path: "/admin/users" },
    { text: "Customers", icon: Users, path: "/admin/customers" },
    { text: "Orders", icon: ShoppingCart, path: "/admin/orders" },
    { text: "Kanban Columns", icon: Columns, path: "/admin/kanban-columns" },
];

export default function AdminLayout() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [open, setOpen] = useState(true);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleLogout = async () => {
        setProfileMenuOpen(false);
        await logout();
        navigate("/admin/login");
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogoClick = () => {
        setOpen(true);
        navigate("/admin/dashboard");
    };

    const isMenuItemActive = (path) => {
        return location.pathname === path;
    };

    // Get current page title and icon based on active route
    const getCurrentPageInfo = () => {
        const activeItem = menuItems.find((item) =>
            isMenuItemActive(item.path),
        );
        return activeItem || { text: "Admin Dashboard", icon: Home };
    };

    const currentPageInfo = getCurrentPageInfo();
    const CurrentPageIcon = currentPageInfo.icon;

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 min-w-fit">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-30 flex flex-col ${
                    open ? "w-64" : "w-20"
                }`}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div
                        onClick={handleLogoClick}
                        className="flex items-center cursor-pointer flex-1"
                    >
                        {open ? (
                            <>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-white font-bold text-lg">
                                        M
                                    </span>
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    MegaPaints
                                </span>
                            </>
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
                                <span className="text-white font-bold text-lg">
                                    M
                                </span>
                            </div>
                        )}
                    </div>
                    {open && (
                        <button
                            onClick={handleDrawerToggle}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 min-h-0">
                    <div className="px-2 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isMenuItemActive(item.path);
                            return (
                                <button
                                    key={item.text}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    } ${open ? "justify-start" : "justify-center"}`}
                                    title={!open ? item.text : ""}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${open ? "mr-3" : ""} ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}
                                    />
                                    {open && (
                                        <span
                                            className={`text-sm font-medium ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}
                                        >
                                            {item.text}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Logout Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                            open ? "justify-start" : "justify-center"
                        }`}
                        title={!open ? "Logout" : ""}
                    >
                        <LogOut className={`w-5 h-5 ${open ? "mr-3" : ""}`} />
                        {open && (
                            <span className="text-sm font-medium">Logout</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div
                className={`flex-1 transition-all duration-300 ${open ? "ml-64" : "ml-20"}`}
            >
                {/* Top Bar */}
                <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-6">
                        {/* Page Title */}
                        <div className="flex items-center space-x-3">
                            {!open && (
                                <button
                                    onClick={handleDrawerToggle}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                            <CurrentPageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {currentPageInfo.text}
                            </h1>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-3">
                            {/* Theme Toggle */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleTheme();
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                                title={
                                    isDark
                                        ? "Switch to Light Mode"
                                        : "Switch to Dark Mode"
                                }
                                type="button"
                                aria-label="Toggle theme"
                            >
                                {isDark ? (
                                    <Sun className="w-5 h-5" />
                                ) : (
                                    <Moon className="w-5 h-5" />
                                )}
                            </button>

                            {/* Profile Menu */}
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setProfileMenuOpen(!profileMenuOpen)
                                    }
                                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user?.username?.[0]?.toUpperCase() ||
                                                "A"}
                                        </span>
                                    </div>
                                    {open && (
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                                            {user?.username || "Admin"}
                                        </span>
                                    )}
                                </button>

                                {/* Profile Dropdown */}
                                {profileMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() =>
                                                setProfileMenuOpen(false)
                                            }
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                                            <button
                                                onClick={() => {
                                                    setProfileMenuOpen(false);
                                                    handleNavigation(
                                                        "/admin/profile",
                                                    );
                                                }}
                                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Settings className="w-4 h-4 mr-3" />
                                                Profile Settings
                                            </button>
                                            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4 mr-3" />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
