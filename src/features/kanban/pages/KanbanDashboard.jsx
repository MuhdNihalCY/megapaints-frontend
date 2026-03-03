/**
 * KanbanDashboard Page
 * Main dashboard page for the Kanban board system
 */

import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { KanbanProvider } from "../contexts/KanbanContext";
import { PermissionProvider } from "../contexts/PermissionContext";
import KanbanBoard from "../components/board/KanbanBoard";
import ApiStatusNotification from "../components/common/ApiStatusNotification";
import UserHeader from "../../user/components/Header";

const KanbanDashboard = () => {
    const { user } = useAuth();

    return (
        <PermissionProvider user={user}>
            <KanbanProvider user={user}>
                <div className="kanban-dashboard h-screen flex flex-col">
                    {/* User Header */}
                    <UserHeader />

                    {/* API Status Notification */}
                    <ApiStatusNotification />

                    {/* Main Kanban Board (includes Customer Management with "Add Customer follow-up" button) */}
                    <div className="flex-1 overflow-hidden">
                        <KanbanBoard />
                    </div>
                </div>
            </KanbanProvider>
        </PermissionProvider>
    );
};

export default KanbanDashboard;
