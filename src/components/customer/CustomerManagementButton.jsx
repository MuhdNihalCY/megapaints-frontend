/**
 * CustomerManagementButton Component
 * General customer management button for use across the application
 * Provides quick access to customer management features
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus } from "lucide-react";
import CustomerManagementModal from "./CustomerManagementModal";
import AddFollowupModal from "../../features/crm/components/AddFollowupModal";

const CustomerManagementButton = ({ user, className = "" }) => {
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showCreateCustomerModal, setShowCreateCustomerModal] =
        useState(false);
    const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
    const [activeAction, setActiveAction] = useState(null);

    // Check if user has permission to manage customers
    const canManageCustomers =
        user &&
        (user.roles?.includes("admin") ||
            user.roles?.includes("manager") ||
            user.roles?.includes("sales") ||
            user.designation === "admin" ||
            user.designation === "manager" ||
            user.designation === "sales");

    if (!canManageCustomers) {
        return null;
    }

    const handleCustomerAction = (action) => {
        setActiveAction(action);
        switch (action) {
            case "create-customer":
                setShowCreateCustomerModal(true);
                break;
            case "add-followup":
                setShowAddFollowupModal(true);
                break;
            case "manage-customers":
                setShowCustomerModal(true);
                break;
            default:
                break;
        }
    };

    return (
        <>
            <div className={`flex items-center gap-2 ${className}`}>
                {/* Quick Customer Actions */}
                <div className="flex items-center gap-1">
                    <motion.button
                        onClick={() => handleCustomerAction("create-customer")}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Create New Customer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Customer</span>
                    </motion.button>

                    <motion.button
                        onClick={() => handleCustomerAction("add-followup")}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Add Customer follow-up"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Customer follow-up</span>
                    </motion.button>

                    <motion.button
                        onClick={() => handleCustomerAction("manage-customers")}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Manage Customers"
                    >
                        <Users className="w-4 h-4" />
                        <span>Customers</span>
                    </motion.button>
                </div>
            </div>

            {/* Create Customer Modal - Using CustomerManagementModal with manage mode and auto-show create form */}
            <CustomerManagementModal
                isOpen={showCreateCustomerModal}
                onClose={() => {
                    setShowCreateCustomerModal(false);
                    setActiveAction(null);
                }}
                mode="manage"
                autoShowCreateForm={true}
                onCustomerCreated={(customer) => {
                    // Customer created successfully - form will close but modal stays open
                    // Any additional logic can be added here if needed
                    console.log("Customer created:", customer);
                }}
            />

            {/* Customer Management Modal */}
            <CustomerManagementModal
                isOpen={showCustomerModal}
                onClose={() => {
                    setShowCustomerModal(false);
                    setActiveAction(null);
                }}
            />

            {/* Add Customer follow-up (log-style) - same modal as CRM */}
            <AddFollowupModal
                isOpen={showAddFollowupModal}
                onClose={() => {
                    setShowAddFollowupModal(false);
                    setActiveAction(null);
                }}
                onSuccess={() => setShowAddFollowupModal(false)}
            />
        </>
    );
};

export default CustomerManagementButton;
