import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    User,
    Building,
    ChevronDown,
    X,
    Check,
} from "lucide-react";
import { kanbanService } from "../../features/kanban/services/kanbanService";
import { useAuth } from "../../contexts/AuthContext";
import CustomerManagementModal from "./CustomerManagementModal";

// Helper function to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
    if (!id || typeof id !== "string") return false;
    // MongoDB ObjectId is 24 characters of hexadecimal
    return /^[0-9a-fA-F]{24}$/.test(id);
};

const CustomerDropdown = ({
    selectedCustomer,
    onCustomerSelect,
    onCustomerCreate,
    onRequestCreateCustomer,
    placeholder = "Select customer...",
    disabled = false,
    className = "",
    customerId = null, // Optional: customer ID when customer object is not available (e.g., 403 error)
}) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    // Load customers when dropdown opens OR when customerId is provided (to find customer)
    useEffect(() => {
        const loadCustomers = async () => {
            // Load if dropdown is open OR if we have a customerId but no selectedCustomer (need to find it)
            const shouldLoad = isOpen || (customerId && !selectedCustomer);
            if (!shouldLoad) return;

            setLoading(true);
            setError(null);

            try {
                // Get valid branch_id from user context
                let branchId = null;

                // Try to get from user.branches
                if (
                    user?.branches &&
                    Array.isArray(user.branches) &&
                    user.branches.length > 0
                ) {
                    const firstBranch = user.branches[0];
                    // Handle both string and object formats
                    let branchIdStr = null;
                    if (typeof firstBranch === "string") {
                        branchIdStr = firstBranch;
                    } else if (firstBranch && typeof firstBranch === "object") {
                        // Try various possible properties
                        branchIdStr =
                            firstBranch._id ||
                            firstBranch.id ||
                            (firstBranch.toString &&
                            typeof firstBranch.toString === "function"
                                ? firstBranch.toString()
                                : null);
                    }

                    if (branchIdStr) {
                        const branchIdString = String(branchIdStr);
                        if (isValidObjectId(branchIdString)) {
                            branchId = branchIdString;
                        }
                    }
                }

                // If we still don't have a valid branch_id, the backend should use req.user.branches[0]
                // But since the backend requires it, we'll include it only if we have it
                const params = {
                    ...(branchId ? { branch_id: branchId } : {}),
                    ...(searchQuery ? { search: searchQuery } : {}),
                };

                const response = await kanbanService.getCustomers(params);
                // handleResponse returns { status: 'success', data: { customers: [...], ... }, message: '...' }
                const customersList =
                    response?.data?.customers || response?.customers || [];
                setCustomers(customersList);
            } catch (err) {
                console.error("Failed to load customers:", err);
                const errorMessage =
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to load customers";
                if (
                    errorMessage.includes("Branch filter required") ||
                    errorMessage.includes("Branch ID")
                ) {
                    setError(
                        "No branch assigned. Please contact an administrator.",
                    );
                } else {
                    setError(errorMessage);
                }
                setCustomers([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(loadCustomers, isOpen ? 300 : 0); // Load immediately if customerId provided
        return () => clearTimeout(debounceTimer);
    }, [isOpen, searchQuery, user, customerId, selectedCustomer]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    // Auto-select customer if customerId matches a customer in the list
    // This handles the case where we got a 403 error but the customer is actually in the accessible list
    useEffect(() => {
        if (customerId && customers.length > 0 && onCustomerSelect) {
            const foundCustomer = customers.find((c) => {
                const cId = c._id || c.id;
                return cId && cId.toString() === customerId.toString();
            });
            // Only auto-select if we found the customer and it's not already selected
            if (
                foundCustomer &&
                (!selectedCustomer ||
                    selectedCustomer._id?.toString() !== customerId.toString())
            ) {
                // Auto-select the customer if found in the accessible list
                // Use setTimeout to avoid state update during render
                setTimeout(() => {
                    onCustomerSelect(foundCustomer);
                }, 0);
            }
        }
    }, [customerId, selectedCustomer, customers, onCustomerSelect]);

    const handleCustomerSelect = (customer) => {
        onCustomerSelect(customer);
        setIsOpen(false);
        setSearchQuery("");
    };

    const handleCustomerCreated = (customer) => {
        // Add to local list
        setCustomers((prev) => [customer, ...prev]);

        // Select the new customer
        onCustomerSelect(customer);

        // Close dropdown
        setIsOpen(false);

        // Notify parent about creation
        if (onCustomerCreate) {
            onCustomerCreate(customer);
        }
    };

    const getCustomerIcon = (customer) => {
        if (customer.customer_type === "business") {
            return <Building className="w-4 h-4" />;
        }
        return <User className="w-4 h-4" />;
    };

    const getCustomerDisplayName = (customer) => {
        if (!customer) return "Unknown Customer";
        if (
            customer.company &&
            customer.name &&
            customer.name !== customer.company
        ) {
            return `${customer.name} (${customer.company})`;
        }
        return (
            customer.name ||
            customer.company ||
            customer._id ||
            customer.id ||
            "Unknown Customer"
        );
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Selected Customer Display */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-gray-400 dark:hover:border-gray-500"
                }`}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {selectedCustomer &&
                    (selectedCustomer.name ||
                        selectedCustomer._id ||
                        selectedCustomer.id) ? (
                        <>
                            {getCustomerIcon(selectedCustomer)}
                            <span className="truncate text-gray-900 dark:text-white">
                                {getCustomerDisplayName(selectedCustomer)}
                            </span>
                            {selectedCustomer.status &&
                                !selectedCustomer._isRestricted && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {selectedCustomer.status}
                                    </span>
                                )}
                            {selectedCustomer._isRestricted && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded italic">
                                    Limited access
                                </span>
                            )}
                        </>
                    ) : customerId && customers.length > 0 ? (
                        // Check if customer is in the accessible list
                        (() => {
                            const foundCustomer = customers.find((c) => {
                                const cId = c._id || c.id;
                                return (
                                    cId &&
                                    cId.toString() === customerId.toString()
                                );
                            });
                            if (foundCustomer) {
                                // Customer is in list but not selected - this shouldn't happen due to auto-select
                                // But show it anyway as fallback
                                return (
                                    <>
                                        {getCustomerIcon(foundCustomer)}
                                        <span className="truncate text-gray-900 dark:text-white">
                                            {getCustomerDisplayName(
                                                foundCustomer,
                                            )}
                                        </span>
                                        {foundCustomer.status && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                {foundCustomer.status}
                                            </span>
                                        )}
                                    </>
                                );
                            }
                            // Customer not in accessible list
                            return (
                                <span className="text-gray-500 dark:text-gray-400 italic">
                                    Customer selected (not in accessible list)
                                </span>
                            );
                        })()
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                            {placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Create New Customer Button */}
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    if (
                                        typeof onRequestCreateCustomer ===
                                        "function"
                                    ) {
                                        onRequestCreateCustomer();
                                    } else {
                                        // Fallback: open the modal directly
                                        setShowCreateModal(true);
                                    }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Customer
                            </button>
                        </div>

                        {/* Customer List */}
                        <div className="max-h-48 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    Loading customers...
                                </div>
                            ) : error ? (
                                <div className="p-4 text-center text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            ) : customers.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    {searchQuery
                                        ? "No customers found matching your search."
                                        : "No customers available."}
                                </div>
                            ) : (
                                <>
                                    {/* Show message if customerId is provided but not in list (403 scenario) */}
                                    {customerId &&
                                        !selectedCustomer &&
                                        !customers.find(
                                            (c) =>
                                                (c._id || c.id)?.toString() ===
                                                customerId?.toString(),
                                        ) && (
                                            <div className="p-3 mx-2 mb-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                <div className="text-xs text-yellow-800 dark:text-yellow-200">
                                                    <strong>Note:</strong> A
                                                    customer is assigned to this
                                                    card, but you don't have
                                                    access to view their
                                                    details.
                                                </div>
                                            </div>
                                        )}
                                    {customers.map((customer) => {
                                        const isSelected =
                                            selectedCustomer?._id ===
                                                customer._id ||
                                            selectedCustomer?.id ===
                                                customer._id ||
                                            (!selectedCustomer &&
                                                customerId &&
                                                (
                                                    customer._id || customer.id
                                                )?.toString() ===
                                                    customerId?.toString());
                                        return (
                                            <button
                                                key={customer._id}
                                                type="button"
                                                onClick={() =>
                                                    handleCustomerSelect(
                                                        customer,
                                                    )
                                                }
                                                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                                    isSelected
                                                        ? "bg-blue-50 dark:bg-blue-900/20"
                                                        : ""
                                                }`}
                                            >
                                                {getCustomerIcon(customer)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {getCustomerDisplayName(
                                                            customer,
                                                        )}
                                                    </div>
                                                    {customer.email && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                        {customer.status}
                                                    </span>
                                                    {isSelected && (
                                                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Customer Modal - Use main CustomerManagementModal with manage mode and auto-show create form */}
            <CustomerManagementModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                }}
                mode="manage"
                autoShowCreateForm={true}
                onCustomerCreated={handleCustomerCreated}
            />
        </div>
    );
};

export default CustomerDropdown;
