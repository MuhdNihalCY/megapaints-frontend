/**
 * Custom Hooks for Kanban Board
 * Reusable hooks for common Kanban functionality
 */

import { useMemo } from "react";
import { CARD_PRIORITIES } from "../utils/constants";

/**
 * Hook for managing priority display
 * @param {string} priority - Priority level
 * @returns {Object} Priority display information
 */
export const usePriorityDisplay = (priority) => {
    return useMemo(() => {
        // CARD_PRIORITIES uses uppercase keys (LOW, MEDIUM, HIGH, URGENT)
        // but card priorities are lowercase (low, medium, high, urgent)
        // Find the matching priority by checking the id field
        const priorityKey = priority ? priority.toUpperCase() : "MEDIUM";
        let priorityConfig = CARD_PRIORITIES[priorityKey];

        // If not found by key, search by id field
        if (!priorityConfig) {
            const found = Object.values(CARD_PRIORITIES).find(
                (p) =>
                    p.id === priority ||
                    p.id === priority?.toLowerCase() ||
                    p.name?.toLowerCase() === priority?.toLowerCase() ||
                    p.id?.toUpperCase() === priorityKey,
            );
            priorityConfig = found || CARD_PRIORITIES.MEDIUM;
        }

        // Ensure we have a valid config
        if (!priorityConfig) {
            priorityConfig = CARD_PRIORITIES.MEDIUM;
        }

        return {
            level: priority || "medium",
            label: priorityConfig.name || "Medium", // CARD_PRIORITIES uses 'name', not 'label'
            color: priorityConfig.color || "#3B82F6",
            icon: priorityConfig.icon,
            bgColor: priorityConfig.bgColor || `${priorityConfig.color}20`,
            textColor: priorityConfig.textColor || priorityConfig.color,
        };
    }, [priority]);
};

/**
 * Hook for managing labels display
 * @param {Array} cardLabels - Array of label objects { id, name?, color? } or primitive label ids
 * @param {Array} availableLabels - Board labels for resolving name/color when card has only id or empty name
 * @returns {Object} Labels display information
 */
export const useLabelsDisplay = (cardLabels, availableLabels = []) => {
    return useMemo(() => {
        if (!cardLabels || cardLabels.length === 0) {
            return {
                labels: [],
                hasLabels: false,
                labelCount: 0,
            };
        }

        const normalizeId = (id) => {
            if (id == null) return null;
            if (typeof id === "string") return id;
            if (typeof id === "object" && (id.id || id._id)) return id.id || id._id;
            return String(id);
        };

        const labelInfo = cardLabels.map((item) => {
            const isObject = typeof item === "object" && item !== null && (item.id != null || item._id != null || item.label_id != null);
            const id = isObject ? (item.label_id || item.id || item._id) : item;
            const normalizedId = normalizeId(id);
            const availableLabel = availableLabels.find(
                (al) => normalizeId(al.id || al._id) === normalizedId,
            );

            if (isObject) {
                return {
                    id: id,
                    name: (item.name && item.name.trim()) ? item.name : (availableLabel?.name || "Unknown"),
                    color: item.color || availableLabel?.color || "#6b7280",
                    bgColor: `${item.color || availableLabel?.color || "#6b7280"}20`,
                    textColor: item.color || availableLabel?.color || "#6b7280",
                };
            }

            return {
                id: id,
                name: availableLabel?.name || "Unknown",
                color: availableLabel?.color || "#6b7280",
                bgColor: `${availableLabel?.color || "#6b7280"}20`,
                textColor: availableLabel?.color || "#6b7280",
            };
        });

        return {
            labels: labelInfo,
            hasLabels: true,
            labelCount: labelInfo.length,
        };
    }, [cardLabels, availableLabels]);
};
