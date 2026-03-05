/**
 * ProductionItemsManager Component
 * Manage production items on Trello-style cards with checklist functionality.
 * No product search: add by item name, quantity, unit. Each item is expandable
 * to search/select formulas and create new formulas (auto-added to item).
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Check, Trash2, Edit2, ChevronDown, ChevronRight, Plus, X, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import FormulaService from "../../../../formula/services/formulaService";

const UNITS = ["kg", "g", "L", "mL", "Liter", "piece", "set", "box", "unit"];

const ProductionItemsManager = ({ card, onUpdate, currentUser, cardId }) => {
    const navigate = useNavigate();
    const [items, setItems] = useState(() => {
        const productionItems =
            card?.productionItems || card?.production_items || [];
        const list = Array.isArray(productionItems) ? productionItems : [];
        return list.map((it) => ({
            ...it,
            formulas: Array.isArray(it.formulas) ? it.formulas : [],
        }));
    });

    // Add form state (no product search)
    const [itemName, setItemName] = useState("");
    const [quantity, setQuantity] = useState("0.00");
    const [unit, setUnit] = useState("Liter");

    // Expand state: which item index is expanded (null = none)
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Edit state
    const [editingIndex, setEditingIndex] = useState(null);
    const [editQuantity, setEditQuantity] = useState("");
    const [editUnit, setEditUnit] = useState("");

    // Formula search state (per expanded item)
    const [formulaSearchQuery, setFormulaSearchQuery] = useState("");
    const [formulaSearchResults, setFormulaSearchResults] = useState([]);
    const [formulaSearching, setFormulaSearching] = useState(false);
    const [formulaSearchDropdownOpen, setFormulaSearchDropdownOpen] = useState(false);
    const formulaSearchRef = useRef(null);
    const formulaDropdownRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Sync items when card changes (e.g. from location.state newFormulaId)
    useEffect(() => {
        const productionItems =
            card?.productionItems || card?.production_items || [];
        if (Array.isArray(productionItems)) {
            setItems(
                productionItems.map((it) => ({
                    ...it,
                    formulas: Array.isArray(it.formulas) ? it.formulas : [],
                })),
            );
        }
    }, [card]);

    // Debounced formula search
    useEffect(() => {
        if (expandedIndex === null) return;

        const query = (formulaSearchQuery || "").trim();
        if (!query) {
            setFormulaSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setFormulaSearching(true);
            try {
                const res = await FormulaService.fetchAllFormulas({
                    search: query,
                    limit: 10,
                    page: 1,
                });
                const list = res?.data ?? res?.formulas ?? [];
                setFormulaSearchResults(Array.isArray(list) ? list : []);
                setFormulaSearchDropdownOpen(true);
            } catch (err) {
                console.error("Formula search error:", err);
                setFormulaSearchResults([]);
            } finally {
                setFormulaSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [formulaSearchQuery, expandedIndex]);

    // Click outside to close formula dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                formulaSearchRef.current &&
                !formulaSearchRef.current.contains(e.target) &&
                formulaDropdownRef.current &&
                !formulaDropdownRef.current.contains(e.target)
            ) {
                setFormulaSearchDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Position formula dropdown using input's bounding rect (for portal)
    const updateDropdownPosition = useCallback(() => {
        if (formulaSearchRef.current) {
            const rect = formulaSearchRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
            });
        }
    }, []);

    useEffect(() => {
        if (!formulaSearchDropdownOpen) return;
        updateDropdownPosition();
        const onScrollOrResize = () => updateDropdownPosition();
        window.addEventListener("scroll", onScrollOrResize, true);
        window.addEventListener("resize", onScrollOrResize);
        return () => {
            window.removeEventListener("scroll", onScrollOrResize, true);
            window.removeEventListener("resize", onScrollOrResize);
        };
    }, [formulaSearchDropdownOpen, updateDropdownPosition]);

    const handleAddItem = useCallback(() => {
        const name = (itemName || "").trim();
        if (!name) {
            alert("Please enter an item name");
            return;
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty < 0) {
            alert("Please enter a valid quantity (>= 0)");
            return;
        }

        const newItem = {
            item_name: name,
            quantity: qty,
            unit: unit,
            is_completed: false,
            formulas: [],
            added_at: new Date().toISOString(),
            added_by: currentUser?.id || currentUser?._id,
        };

        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        onUpdate(updatedItems);

        setItemName("");
        setQuantity("0.00");
        setUnit("Liter");
    }, [itemName, quantity, unit, items, currentUser, onUpdate]);

    const handleToggleCompletion = useCallback(
        (index) => {
            const updatedItems = [...items];
            const item = updatedItems[index];
            const isCompleted = !item.is_completed;
            updatedItems[index] = {
                ...item,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null,
                completed_by: isCompleted
                    ? currentUser?.id || currentUser?._id
                    : null,
            };
            setItems(updatedItems);
            onUpdate(updatedItems);
        },
        [items, currentUser, onUpdate],
    );

    const handleRemoveItem = useCallback(
        (index) => {
            const updatedItems = items.filter((_, i) => i !== index);
            if (expandedIndex === index) setExpandedIndex(null);
            else if (expandedIndex !== null && expandedIndex > index)
                setExpandedIndex(expandedIndex - 1);
            setItems(updatedItems);
            onUpdate(updatedItems);
        },
        [items, expandedIndex, onUpdate],
    );

    const handleStartEdit = useCallback((index) => {
        const item = items[index];
        setEditingIndex(index);
        setEditQuantity(String(item.quantity ?? ""));
        setEditUnit(item.unit || "Liter");
    }, [items]);

    const handleSaveEdit = useCallback(() => {
        if (editingIndex === null) return;
        const qty = parseFloat(editQuantity);
        if (isNaN(qty) || qty < 0) {
            alert("Please enter a valid quantity (>= 0)");
            return;
        }
        if (!editUnit.trim()) {
            alert("Please enter a unit");
            return;
        }
        const updatedItems = [...items];
        updatedItems[editingIndex] = {
            ...updatedItems[editingIndex],
            quantity: qty,
            unit: editUnit.trim(),
        };
        setItems(updatedItems);
        onUpdate(updatedItems);
        setEditingIndex(null);
        setEditQuantity("");
        setEditUnit("");
    }, [editingIndex, editQuantity, editUnit, items, onUpdate]);

    const handleCancelEdit = useCallback(() => {
        setEditingIndex(null);
        setEditQuantity("");
        setEditUnit("");
    }, []);

    const handleToggleExpand = useCallback((index) => {
        setExpandedIndex((prev) => (prev === index ? null : index));
        if (expandedIndex !== index) {
            setFormulaSearchQuery("");
            setFormulaSearchResults([]);
            setFormulaSearchDropdownOpen(false);
        }
    }, [expandedIndex]);

    const addFormulaToItem = useCallback(
        (index, formula) => {
            const item = items[index];
            const formulas = Array.isArray(item.formulas) ? [...item.formulas] : [];
            const id = formula._id || formula.id;
            if (formulas.some((f) => (f.formula_id || f._id) === id)) return;
            formulas.push({
                formula_id: id,
                file_no: formula.file_no ?? formula.FileNo ?? "",
                name: formula.name ?? formula.color_name ?? formula.file_no ?? "Formula",
                color_name: formula.color_name ?? "",
                color_code: formula.color_code ?? "",
                subcategory: formula.subcategory ?? "",
                gloss: formula.gloss != null ? formula.gloss : undefined,
            });
            const updatedItems = [...items];
            updatedItems[index] = { ...item, formulas };
            setItems(updatedItems);
            onUpdate(updatedItems);
            setFormulaSearchDropdownOpen(false);
            setFormulaSearchQuery("");
            setFormulaSearchResults([]);
        },
        [items, onUpdate],
    );

    const removeFormulaFromItem = useCallback(
        (itemIndex, formulaIndex) => {
            const updatedItems = [...items];
            const item = updatedItems[itemIndex];
            const formulas = [...(item.formulas || [])];
            formulas.splice(formulaIndex, 1);
            updatedItems[itemIndex] = { ...item, formulas };
            setItems(updatedItems);
            onUpdate(updatedItems);
        },
        [items, onUpdate],
    );

    const getDisplayName = (item) =>
        item.item_name || item.product_name || item.name || "Unnamed item";

    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Production Items
            </h3>

            {/* Add form: Item name | Quantity | Unit | Add (no product search) */}
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Item name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <div className="w-24">
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                </div>
                <div className="w-32 relative">
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm appearance-none pr-8"
                    >
                        {UNITS.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    Add
                </button>
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No production items added yet
                </p>
            ) : (
                <div className="space-y-2">
                    {items.map((item, index) => {
                        const itemKey =
                            item.product_id || item._id || `item-${index}`;
                        const isCompleted = item.is_completed || false;
                        const completedDate = item.completed_at
                            ? new Date(item.completed_at)
                            : null;
                        const isExpanded = expandedIndex === index;
                        const itemFormulas = Array.isArray(item.formulas)
                            ? item.formulas
                            : [];

                        return (
                            <div
                                key={itemKey}
                                className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                            >
                                <div
                                    className={`flex items-center gap-3 p-3 transition-colors ${
                                        isCompleted
                                            ? "bg-gray-100 dark:bg-gray-800/50 opacity-75"
                                            : "bg-gray-50 dark:bg-gray-800"
                                    }`}
                                >
                                    {editingIndex === index ? (
                                        <div className="flex-1 flex items-center gap-2 flex-wrap">
                                            <input
                                                type="number"
                                                value={editQuantity}
                                                onChange={(e) =>
                                                    setEditQuantity(e.target.value)
                                                }
                                                min="0"
                                                step="0.01"
                                                className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Qty"
                                            />
                                            <div className="w-32 relative">
                                                <select
                                                    value={editUnit}
                                                    onChange={(e) =>
                                                        setEditUnit(e.target.value)
                                                    }
                                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none pr-8"
                                                >
                                                    {UNITS.map((u) => (
                                                        <option key={u} value={u}>
                                                            {u}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSaveEdit}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggleCompletion(index)
                                                }
                                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                    isCompleted
                                                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                                                        : "border-gray-300 dark:border-gray-600 hover:border-blue-500 bg-white dark:bg-gray-700"
                                                }`}
                                                title={
                                                    isCompleted
                                                        ? "Mark as incomplete"
                                                        : "Mark as complete"
                                                }
                                            >
                                                {isCompleted && (
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggleExpand(index)
                                                }
                                                className="flex-shrink-0 p-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                title={
                                                    isExpanded
                                                        ? "Collapse formulas"
                                                        : "Expand formulas"
                                                }
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className={`text-sm font-medium ${
                                                        isCompleted
                                                            ? "line-through text-gray-500 dark:text-gray-400"
                                                            : "text-gray-900 dark:text-white"
                                                    }`}
                                                >
                                                    {getDisplayName(item)}
                                                </div>
                                                <div
                                                    className={`text-xs ${
                                                        isCompleted
                                                            ? "text-gray-400 dark:text-gray-500"
                                                            : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                                >
                                                    {item.product_code || "—"} •{" "}
                                                    {item.quantity ?? 0} {item.unit || "unit"}
                                                    {completedDate && (
                                                        <span className="ml-2">
                                                            • Completed{" "}
                                                            {format(
                                                                completedDate,
                                                                "MMM d, yyyy",
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleStartEdit(index)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveItem(index)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Expanded: formula search, select, list, create link */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 overflow-hidden"
                                        >
                                            <div className="p-3 space-y-3">
                                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Formulas
                                                </div>

                                                {/* Attached formulas: vertical list, each formula shows label + value rows */}
                                                {itemFormulas.length > 0 && (
                                                    <div className="space-y-2 w-full min-w-0">
                                                        {itemFormulas.map((f, fi) => {
                                                            const formulaId = f.formula_id || f._id;
                                                            const glossVal = f.gloss;
                                                            const mattGlossDisplay =
                                                                glossVal != null && glossVal !== ""
                                                                    ? Number(glossVal) === 0 || (typeof glossVal === "number" && glossVal < 10)
                                                                        ? "Matt"
                                                                        : typeof glossVal === "number"
                                                                          ? `Gloss ${glossVal}`
                                                                          : String(glossVal)
                                                                    : "—";
                                                            return (
                                                                <div
                                                                    key={formulaId || fi}
                                                                    className="rounded bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 text-sm overflow-hidden min-w-0"
                                                                >
                                                                    <div className="p-2 space-y-1.5">
                                                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                                                                            {/* Column 1 */}
                                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">File no</span>
                                                                                    <span className="font-mono text-gray-900 dark:text-white break-all" title={f.file_no || "—"}>{f.file_no || "—"}</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Color name</span>
                                                                                    <span className="text-gray-700 dark:text-gray-300 break-all" title={f.name || f.color_name || "—"}>{f.name || f.color_name || "—"}</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Color code</span>
                                                                                    <span className="text-gray-600 dark:text-gray-400 break-all" title={f.color_code || "—"}>{f.color_code || "—"}</span>
                                                                                </div>
                                                                            </div>
                                                                            {/* Column 2 */}
                                                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Subcategory</span>
                                                                                    <span className="text-gray-600 dark:text-gray-400 break-all" title={f.subcategory || "—"}>{f.subcategory || "—"}</span>
                                                                                </div>
                                                                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Matt/Gloss</span>
                                                                                    <span className="text-gray-600 dark:text-gray-400">{mattGlossDisplay}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 border-t border-gray-200/60 dark:border-gray-600/60 justify-end">
                                                                            {/* <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Actions</span> */}
                                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => navigate(`/order?formula_id=${formulaId}`)}
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                                                                    title="Place order"
                                                                                >
                                                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                                                    Place order
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeFormulaFromItem(index, fi)}
                                                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                                                                    title="Remove"
                                                                                >
                                                                                    <X className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Search formulas */}
                                                <div
                                                    className="relative"
                                                    ref={formulaSearchRef}
                                                >
                                                    <input
                                                        type="text"
                                                        value={formulaSearchQuery}
                                                        onChange={(e) =>
                                                            setFormulaSearchQuery(
                                                                e.target.value,
                                                            )
                                                        }
                                                        onFocus={() => {
                                                            if (formulaSearchRef.current) {
                                                                const rect = formulaSearchRef.current.getBoundingClientRect();
                                                                setDropdownPosition({
                                                                    top: rect.bottom,
                                                                    left: rect.left,
                                                                    width: rect.width,
                                                                });
                                                            }
                                                            setFormulaSearchDropdownOpen(true);
                                                        }}
                                                        placeholder="Search formulas..."
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    />
                                                </div>

                                                {/* Formula list dropdown: render in portal so it is not clipped by parent overflow */}
                                                {typeof document !== "undefined" &&
                                                    formulaSearchDropdownOpen &&
                                                    createPortal(
                                                        <motion.div
                                                            ref={formulaDropdownRef}
                                                            initial={{ opacity: 0, y: -4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -4 }}
                                                            style={{
                                                                position: "fixed",
                                                                top: dropdownPosition.top + 4,
                                                                left: dropdownPosition.left,
                                                                width: Math.max(dropdownPosition.width, 280),
                                                                zIndex: 9999,
                                                            }}
                                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                                                        >
                                                            {formulaSearching ? (
                                                                <div className="p-3 text-sm text-gray-500">
                                                                    Searching...
                                                                </div>
                                                            ) : formulaSearchResults.length === 0 ? (
                                                                <div className="p-3 text-sm text-gray-500">
                                                                    {formulaSearchQuery.trim()
                                                                        ? "No formulas found"
                                                                        : "Type to search formulas"}
                                                                </div>
                                                            ) : (
                                                                formulaSearchResults.map((formula) => (
                                                                    <button
                                                                        key={formula._id || formula.id}
                                                                        type="button"
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={() =>
                                                                            addFormulaToItem(index, formula)
                                                                        }
                                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                                    >
                                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                                            {formula.file_no ||
                                                                                formula.FileNo ||
                                                                                formula.name ||
                                                                                "—"}
                                                                        </span>
                                                                        {(formula.color_name ||
                                                                            formula.customer_name) && (
                                                                            <span className="ml-2 text-xs text-gray-500">
                                                                                {[formula.color_name, formula.customer_name]
                                                                                    .filter(Boolean)
                                                                                    .join(" • ")}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                ))
                                                            )}
                                                        </motion.div>,
                                                        document.body,
                                                    )}

                                                {/* Create formula link */}
                                                <div>
                                                    <a
                                                        href={
                                                            cardId
                                                                ? `/create-formula?from=kanban&cardId=${encodeURIComponent(cardId)}&productionItemIndex=${index}`
                                                                : "/create-formula"
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Create formula
                                                    </a>
                                                    {!cardId && (
                                                        <span className="ml-1 text-xs text-gray-400">
                                                            (Save card first to link new formula to this item)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProductionItemsManager;
