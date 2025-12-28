/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcuts for Kanban board
 */

import { useEffect, useCallback } from "react";

/**
 * Keyboard shortcuts configuration
 */
export const SHORTCUTS = {
    // Global shortcuts
    NEW_CARD: { key: "n", description: "Create new card" },
    SEARCH: { key: "f", ctrl: true, description: "Search cards" },
    FIND: { key: "/", description: "Quick find" },
    HELP: { key: "?", description: "Show keyboard shortcuts" },

    // Modal shortcuts
    SAVE: { key: "Enter", ctrl: true, description: "Save and close" },
    CLOSE: { key: "Escape", description: "Close modal" },

    // Navigation
    NEXT_CARD: { key: "j", description: "Next card" },
    PREV_CARD: { key: "k", description: "Previous card" },
    NEXT_COLUMN: { key: "l", description: "Next column" },
    PREV_COLUMN: { key: "h", description: "Previous column" },

    // Actions
    ARCHIVE: { key: "e", description: "Archive card" },
    WATCH: { key: "w", description: "Watch/unwatch card" },
    MEMBERS: { key: "m", description: "Add members" },
    LABELS: { key: "l", shift: true, description: "Add labels" },
    DUE_DATE: { key: "d", description: "Set due date" },
    ATTACHMENT: { key: "a", description: "Add attachment" },
    CHECKLIST: { key: "c", description: "Add checklist" },
    COMMENT: { key: "t", description: "Add comment" },
};

/**
 * Check if shortcut matches event
 */
const matchesShortcut = (event, shortcut) => {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = shortcut.ctrl
        ? event.ctrlKey || event.metaKey
        : !event.ctrlKey && !event.metaKey;
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;

    return keyMatch && ctrlMatch && shiftMatch && altMatch;
};

/**
 * useKeyboardShortcuts Hook
 */
export const useKeyboardShortcuts = (
    handlers = {},
    enabled = true,
    scope = "global",
) => {
    const handleKeyDown = useCallback(
        (event) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in input fields (unless specified)
            const activeElement = document.activeElement;
            const isInputField = ["INPUT", "TEXTAREA", "SELECT"].includes(
                activeElement?.tagName,
            );

            // Allow some shortcuts even in input fields
            const allowInInput =
                ["Escape", "Enter"].includes(event.key) &&
                (event.ctrlKey || event.metaKey || event.key === "Escape");

            if (isInputField && !allowInInput) {
                return;
            }

            // Check each shortcut
            Object.entries(SHORTCUTS).forEach(([action, shortcut]) => {
                if (matchesShortcut(event, shortcut) && handlers[action]) {
                    event.preventDefault();
                    event.stopPropagation();
                    handlers[action](event);
                }
            });
        },
        [handlers, enabled],
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown, enabled]);
};

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut) => {
    const parts = [];

    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.shift) parts.push("Shift");
    if (shortcut.alt) parts.push("Alt");
    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
};

/**
 * Get shortcuts by category
 */
export const getShortcutsByCategory = () => {
    return {
        Global: [
            { action: "NEW_CARD", ...SHORTCUTS.NEW_CARD },
            { action: "SEARCH", ...SHORTCUTS.SEARCH },
            { action: "FIND", ...SHORTCUTS.FIND },
            { action: "HELP", ...SHORTCUTS.HELP },
        ],
        Navigation: [
            { action: "NEXT_CARD", ...SHORTCUTS.NEXT_CARD },
            { action: "PREV_CARD", ...SHORTCUTS.PREV_CARD },
            { action: "NEXT_COLUMN", ...SHORTCUTS.NEXT_COLUMN },
            { action: "PREV_COLUMN", ...SHORTCUTS.PREV_COLUMN },
        ],
        "Card Actions": [
            { action: "MEMBERS", ...SHORTCUTS.MEMBERS },
            { action: "LABELS", ...SHORTCUTS.LABELS },
            { action: "DUE_DATE", ...SHORTCUTS.DUE_DATE },
            { action: "ATTACHMENT", ...SHORTCUTS.ATTACHMENT },
            { action: "CHECKLIST", ...SHORTCUTS.CHECKLIST },
            { action: "COMMENT", ...SHORTCUTS.COMMENT },
            { action: "WATCH", ...SHORTCUTS.WATCH },
            { action: "ARCHIVE", ...SHORTCUTS.ARCHIVE },
        ],
        Modal: [
            { action: "SAVE", ...SHORTCUTS.SAVE },
            { action: "CLOSE", ...SHORTCUTS.CLOSE },
        ],
    };
};

export default useKeyboardShortcuts;
