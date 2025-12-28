/**
 * ReadyProductsManager Component
 * Manage ready products on Trello-style cards
 * Horizontal form layout: Product Name | Quantity | Unit | Add Button
 */

import React, { useState, useEffect, useRef } from "react";
import { Package, X, Plus, Trash2, Edit2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import productSearchService from "../../services/productSearchService";
import { useAuth } from "../../../../contexts/AuthContext";

const UNITS = ["kg", "g", "L", "mL", "Liter", "piece", "set", "box", "unit"];

const ReadyProductsManager = ({ card, onUpdate, currentUser }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState(() => {
        const readyProducts = card?.readyProducts || card?.ready_products || [];
        return Array.isArray(readyProducts) ? readyProducts : [];
    });

    // Form state
    const [productName, setProductName] = useState("");
    const [quantity, setQuantity] = useState("0.00");
    const [unit, setUnit] = useState("Liter");
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Search state
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Edit state
    const [editingIndex, setEditingIndex] = useState(null);
    const [editQuantity, setEditQuantity] = useState("");
    const [editUnit, setEditUnit] = useState("");

    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    // Sync products when card changes
    useEffect(() => {
        const readyProducts = card?.readyProducts || card?.ready_products || [];
        if (Array.isArray(readyProducts)) {
            setProducts(readyProducts);
        }
    }, [card]);

    // Get branch ID from user
    const getBranchId = () => {
        if (user?.branches && user.branches.length > 0) {
            const firstBranch = user.branches[0];
            return typeof firstBranch === "string"
                ? firstBranch
                : firstBranch?._id || firstBranch?.id || firstBranch;
        }
        return null;
    };

    // Debounced search for product name
    useEffect(() => {
        if (!productName.trim()) {
            setSearchResults([]);
            setSelectedProduct(null);
            // Don't hide dropdown if input is focused - let user see it's ready for input
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const branchId = getBranchId();
                const results = await productSearchService.searchProducts(
                    productName,
                    branchId,
                    { limit: 10 },
                );
                setSearchResults(results || []);
                setShowDropdown(true);
            } catch (error) {
                console.error("Product search error:", error);
                setSearchResults([]);
                // Keep dropdown visible if input is focused
                if (isInputFocused) {
                    setShowDropdown(true);
                }
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [productName, user, isInputFocused]);

    // Handle product selection from dropdown
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setProductName(product.name);
        setQuantity((product.standard_quantity || 1).toFixed(2));
        setUnit(product.unit || product.standard_quantity_unit || "Liter");
        setShowDropdown(false);
        setSearchResults([]);
    };

    // Handle add product
    const handleAddProduct = () => {
        if (!selectedProduct) {
            alert("Please select a product from the dropdown");
            return;
        }

        // Check if product is already added
        const isAlreadyAdded = products.some(
            (p) => (p.product_id || p._id) === selectedProduct._id,
        );

        if (isAlreadyAdded) {
            alert(
                "This product is already added. Please edit the existing entry.",
            );
            return;
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty < 0) {
            alert("Please enter a valid quantity (>= 0)");
            return;
        }

        const newProduct = {
            product_id: selectedProduct._id,
            product_name: selectedProduct.name,
            product_code: selectedProduct.code,
            quantity: qty,
            unit: unit,
            added_at: new Date().toISOString(),
            added_by: currentUser?.id || currentUser?._id,
        };

        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        onUpdate(updatedProducts);

        // Reset form
        setProductName("");
        setQuantity("0.00");
        setUnit("Liter");
        setSelectedProduct(null);
    };

    // Handle remove product
    const handleRemoveProduct = (index) => {
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
        onUpdate(updatedProducts);
    };

    // Handle start edit
    const handleStartEdit = (index) => {
        const product = products[index];
        setEditingIndex(index);
        setEditQuantity(product.quantity.toString());
        setEditUnit(product.unit);
    };

    // Handle save edit
    const handleSaveEdit = () => {
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

        const updatedProducts = [...products];
        updatedProducts[editingIndex] = {
            ...updatedProducts[editingIndex],
            quantity: qty,
            unit: editUnit.trim(),
        };

        setProducts(updatedProducts);
        onUpdate(updatedProducts);
        setEditingIndex(null);
        setEditQuantity("");
        setEditUnit("");
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditQuantity("");
        setEditUnit("");
    };

    // Handle input focus
    const handleInputFocus = () => {
        setIsInputFocused(true);
        setShowDropdown(true);
    };

    // Handle input blur
    const handleInputBlur = () => {
        setIsInputFocused(false);
        // Delay closing dropdown to allow clicking on dropdown items
        setTimeout(() => {
            if (!isInputFocused) {
                setShowDropdown(false);
            }
        }, 200);
    };

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                searchRef.current &&
                !searchRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
                setIsInputFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="mb-6">
            {/* Title */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Ready Products
            </h3>

            {/* Horizontal Form */}
            <div className="flex items-center gap-2 mb-4" ref={searchRef}>
                {/* Product Name Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={productName}
                        onChange={(e) => {
                            setProductName(e.target.value);
                            setSelectedProduct(null);
                        }}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder="Product Name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                ref={dropdownRef}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                            >
                                {isSearching ? (
                                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        Searching...
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {productName.trim()
                                            ? "No products found"
                                            : "Start typing to search products"}
                                    </div>
                                ) : (
                                    searchResults.map((product) => (
                                        <button
                                            key={product._id}
                                            onClick={() =>
                                                handleProductSelect(product)
                                            }
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            } // Prevent input blur when clicking
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                        >
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                                                {product.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {product.code} • {product.unit}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quantity Input */}
                <div className="w-24">
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="0.00"
                    />
                </div>

                {/* Unit Dropdown */}
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
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Add Button */}
                <button
                    onClick={handleAddProduct}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                    Add
                </button>
            </div>

            {/* Products List */}
            {products.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No products added yet
                </p>
            ) : (
                <div className="space-y-2">
                    {products.map((product, index) => {
                        const productKey =
                            product.product_id ||
                            product._id ||
                            `product-${index}`;
                        return (
                            <div
                                key={productKey}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                                {editingIndex === index ? (
                                    <div className="flex-1 flex items-center gap-2">
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
                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                        </div>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {product.product_name ||
                                                    product.name ||
                                                    "Unknown Product"}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {product.product_code ||
                                                    product.code ||
                                                    "N/A"}{" "}
                                                • {product.quantity || 0}{" "}
                                                {product.unit || "unit"}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() =>
                                                    handleStartEdit(index)
                                                }
                                                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleRemoveProduct(index)
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
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReadyProductsManager;
