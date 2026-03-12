import { Sun, Moon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import NotificationBell from "../../../features/kanban/components/notifications/NotificationBell";
import NotificationPanel from "../../../features/kanban/components/notifications/NotificationPanel";

const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
            ? "bg-blue-600 text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

const UserHeader = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const handleNotificationNavigate = (cardId, notification) => {
        if (!notification) return;
        const target = notification.target || {};
        const meta = notification.metadata || {};
        if (target.type === "crm_followup") {
            const customerId = meta.customer_id || target.customerId;
            if (customerId) {
                navigate(`/crm/customer/${customerId}?followupLog=${target.id}`);
            } else {
                navigate("/crm");
            }
        } else if (target.type === "crm_task") {
            const customerId = meta.customer_id || target.customerId;
            const taskId = meta.task_id || target.id;
            if (customerId && taskId) {
                navigate(`/crm/customer/${customerId}?taskId=${taskId}`);
            } else if (customerId) {
                navigate(`/crm/customer/${customerId}`);
            } else {
                navigate("/crm");
            }
        } else if (target.type === "comment" || target.type === "card") {
            // Kanban comment mention or card assignment: open dashboard with card modal
            const raw =
                cardId ??
                target.cardId ??
                meta.cardId;
            const idStr =
                raw != null
                    ? typeof raw === "object"
                        ? raw._id ?? raw.id
                        : raw
                    : null;
            if (idStr) {
                navigate("/dashboard", {
                    state: { openCardId: String(idStr) },
                });
            } else {
                navigate("/dashboard");
            }
        } else if (cardId) {
            navigate("/dashboard", {
                state: { openCardId: String(cardId) },
            });
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-6">
                        <NavLink
                            to="/dashboard"
                            className="text-2xl font-bold text-gray-900 dark:text-white"
                        >
                            MegaPaints
                        </NavLink>
                        <nav className="hidden md:flex items-center space-x-2">
                            <NavLink to="/dashboard" className={navLinkClass}>
                                Dashboard
                            </NavLink>
                            <NavLink
                                to="/create-formula"
                                className={navLinkClass}
                            >
                                Create Formula
                            </NavLink>
                            <NavLink to="/formulas" className={navLinkClass}>
                                Formulas
                            </NavLink>
                            <NavLink to="/orders" className={navLinkClass}>
                                Orders
                            </NavLink>
                            <NavLink to="/inventory" className={navLinkClass}>
                                Inventory
                            </NavLink>
                            <NavLink to="/crm" className={navLinkClass}>
                                CRM
                            </NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <NotificationBell />
                        <NotificationPanel onNavigateToCard={handleNotificationNavigate} />
                        <span className="text-gray-700 dark:text-gray-300">
                            {user?.username || "User"}
                        </span>
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
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default UserHeader;
