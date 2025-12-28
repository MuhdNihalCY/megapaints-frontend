/**
 * TrelloChecklist Component
 * Complete Trello-style checklist with all features
 * - Progress bar
 * - Add/edit/delete items
 * - Checkbox completion
 * - Strikethrough completed items
 * - Hide completed items option
 * - Delete checklist
 */

import React, { useState } from "react";
import {
    CheckSquare,
    Check,
    Plus,
    Trash2,
    MoreHorizontal,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TrelloChecklist = ({ checklist, onUpdate, onDelete }) => {
    const [newItemText, setNewItemText] = useState("");
    const [editingItemId, setEditingItemId] = useState(null);
    const [editText, setEditText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [hideCompleted, setHideCompleted] = useState(false);

    if (!checklist) return null;

    const items = checklist.items || [];
    const completedCount = items.filter((item) => item.completed).length;
    const totalCount = items.length;
    const progressPercentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Filter items based on hideCompleted setting
    const visibleItems = hideCompleted
        ? items.filter((item) => !item.completed)
        : items;

    // Handle add item
    const handleAddItem = () => {
        if (newItemText.trim()) {
            const newItem = {
                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: newItemText.trim(),
                completed: false,
                position: items.length,
            };

            onUpdate({
                ...checklist,
                items: [...items, newItem],
            });

            setNewItemText("");
        }
    };

    // Handle toggle item completion
    const handleToggleItem = (itemId) => {
        const updatedItems = items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item,
        );

        onUpdate({
            ...checklist,
            items: updatedItems,
        });
    };

    // Handle start editing item
    const handleStartEdit = (item) => {
        setEditingItemId(item.id);
        setEditText(item.name);
    };

    // Handle save edit
    const handleSaveEdit = () => {
        if (editText.trim()) {
            const updatedItems = items.map((item) =>
                item.id === editingItemId
                    ? { ...item, name: editText.trim() }
                    : item,
            );

            onUpdate({
                ...checklist,
                items: updatedItems,
            });
        }

        setEditingItemId(null);
        setEditText("");
    };

    // Handle delete item
    const handleDeleteItem = (itemId) => {
        const updatedItems = items.filter((item) => item.id !== itemId);

        onUpdate({
            ...checklist,
            items: updatedItems,
        });
    };

    // Handle delete all completed
    const handleDeleteCompleted = () => {
        const updatedItems = items.filter((item) => !item.completed);

        onUpdate({
            ...checklist,
            items: updatedItems,
        });

        setShowMenu(false);
    };

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {checklist.title}
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    {completedCount > 0 && (
                        <button
                            onClick={() => setHideCompleted(!hideCompleted)}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            {hideCompleted ? "Show" : "Hide"} completed (
                            {completedCount})
                        </button>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
                                <button
                                    onClick={() => {
                                        setHideCompleted(!hideCompleted);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {hideCompleted ? "Show" : "Hide"} checked
                                    items
                                </button>
                                {completedCount > 0 && (
                                    <button
                                        onClick={handleDeleteCompleted}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Delete checked items
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                "Delete this checklist?",
                                            )
                                        ) {
                                            onDelete(checklist.id);
                                        }
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    Delete checklist
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {progressPercentage}%
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            className={`h-full transition-colors ${
                                progressPercentage === 100
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                            }`}
                        />
                    </div>
                </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2 mb-3">
                <AnimatePresence>
                    {visibleItems.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="group flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => handleToggleItem(item.id)}
                                className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                                    item.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                }`}
                            >
                                {item.completed && (
                                    <Check className="w-3 h-3 text-white" />
                                )}
                            </button>

                            {/* Item Content */}
                            <div className="flex-1 min-w-0">
                                {editingItemId === item.id ? (
                                    <input
                                        type="text"
                                        value={editText}
                                        onChange={(e) =>
                                            setEditText(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSaveEdit();
                                            } else if (e.key === "Escape") {
                                                setEditingItemId(null);
                                                setEditText("");
                                            }
                                        }}
                                        onBlur={handleSaveEdit}
                                        className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => handleStartEdit(item)}
                                        className={`text-sm cursor-pointer block ${
                                            item.completed
                                                ? "line-through text-gray-500 dark:text-gray-400"
                                                : "text-gray-900 dark:text-white"
                                        }`}
                                    >
                                        {item.name}
                                    </span>
                                )}
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                            >
                                <Trash2 className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add Item Input */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleAddItem}
                    disabled={!newItemText.trim()}
                    className="flex-shrink-0 p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddItem();
                        }
                    }}
                    placeholder="Add an item"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
            </div>
        </div>
    );
};

export default TrelloChecklist;
