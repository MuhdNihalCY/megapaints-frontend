/**
 * KeyboardShortcutsHelp Component
 * Display all available keyboard shortcuts
 */

import React from "react";
import { X, Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getShortcutsByCategory,
    formatShortcut,
} from "../../hooks/useKeyboardShortcuts";

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
    const shortcuts = getShortcutsByCategory();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Keyboard Shortcuts
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(shortcuts).map(
                                ([category, items]) => (
                                    <div key={category}>
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                            {category}
                                        </h3>
                                        <div className="space-y-2">
                                            {items.map((shortcut) => (
                                                <div
                                                    key={shortcut.action}
                                                    className="flex items-center justify-between gap-4 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {shortcut.description}
                                                    </span>
                                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm whitespace-nowrap">
                                                        {formatShortcut(
                                                            shortcut,
                                                        )}
                                                    </kbd>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>

                        {/* Footer Note */}
                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                <strong>Pro Tip:</strong> Press{" "}
                                <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded">
                                    ?
                                </kbd>{" "}
                                anytime to see this help menu.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default KeyboardShortcutsHelp;
