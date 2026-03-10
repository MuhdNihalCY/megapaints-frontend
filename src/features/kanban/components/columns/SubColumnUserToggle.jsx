/**
 * SubColumnUserToggle Component
 * Allows Office/Sales users to enable/disable users in sub-columns
 */

import { useState, useEffect } from "react";
import { Switch, Tooltip, IconButton } from "@mui/material";
import { UserCheck, UserX } from "lucide-react";
import { kanbanService } from "../../services/kanbanService";
import toast from "react-hot-toast";

const SubColumnUserToggle = ({
    boardId,
    userId,
    columnId,
    isEnabled,
    onToggle,
    userDesignation,
    currentUserDesignation,
}) => {
    const [loading, setLoading] = useState(false);
    const [localEnabled, setLocalEnabled] = useState(isEnabled);

    // Sync from server/WebSocket when isEnabled prop changes (e.g. another user toggled)
    useEffect(() => {
        setLocalEnabled(isEnabled);
    }, [isEnabled]);

    // Only show toggle for Office/Sales users
    const canToggle =
        currentUserDesignation === "Office" ||
        currentUserDesignation === "Sales" ||
        false; // Add admin check if needed

    if (!canToggle) {
        return null;
    }

    const handleToggle = async (event) => {
        const newEnabled = event.target.checked;
        setLocalEnabled(newEnabled);
        setLoading(true);

        try {
            await kanbanService.toggleSubColumnUser(
                boardId,
                userId,
                columnId,
                newEnabled,
            );

            if (onToggle) {
                onToggle(userId, columnId, newEnabled);
            }

            toast.success(
                newEnabled
                    ? "User enabled in sub-column"
                    : "User disabled in sub-column",
            );
        } catch (error) {
            // Revert on error
            setLocalEnabled(!newEnabled);
            toast.error(error.message || "Failed to toggle user status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Tooltip
            title={
                localEnabled
                    ? "Disable user in sub-column"
                    : "Enable user in sub-column"
            }
        >
            <span>
                <Switch
                    checked={localEnabled}
                    onChange={handleToggle}
                    disabled={loading}
                    size="small"
                    color={localEnabled ? "success" : "default"}
                />
            </span>
        </Tooltip>
    );
};

export default SubColumnUserToggle;
