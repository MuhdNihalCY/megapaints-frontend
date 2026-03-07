import { useState, useEffect, useMemo, Fragment } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Header from "./components/Header";
import { Package, RefreshCw, Search, Edit, Loader2, ChevronUp, ChevronDown } from "lucide-react";

function getBranchId(branch) {
    if (!branch) return null;
    if (typeof branch === "string") return branch;
    return branch._id || branch.id || null;
}

const UserInventory = () => {
    const { user, getUserServices } = useAuth();
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
    const [editingId, setEditingId] = useState(null);
    const [editQuantity, setEditQuantity] = useState("");
    const [quantityToAdd, setQuantityToAdd] = useState("");
    const [stockOperationMode, setStockOperationMode] = useState("edit");
    const [saving, setSaving] = useState(false);
    const [sortBy, setSortBy] = useState("product");
    const [sortDir, setSortDir] = useState("asc");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const getQty = (inv) =>
        Number(
            inv.quantity ?? inv.current_quantity ?? inv.current_stock ?? inv.stock_info?.current_stock ?? 0
        );

    const branches = useMemo(() => {
        const b = user?.branches;
        if (!Array.isArray(b) || b.length === 0) return [];
        return b.map((br) => ({
            _id: getBranchId(br),
            name: typeof br === "object" && br?.name != null ? br.name : String(getBranchId(br)),
        })).filter((br) => br._id);
    }, [user?.branches]);

    useEffect(() => {
        if (branches.length === 1 && !selectedBranchId) {
            setSelectedBranchId(branches[0]._id);
        }
    }, [branches]);

    const branchIdToUse = selectedBranchId || (branches.length === 1 ? branches[0]._id : null);

    useEffect(() => {
        if (!branchIdToUse) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError("");
        const services = getUserServices();
        services.user
            .getInventory({
                branch_id: branchIdToUse,
                page: pagination.page,
                limit: pagination.limit,
                ...(searchTerm && { search: searchTerm }),
            })
            .then((response) => {
                if (cancelled) return;
                const data = response?.data ?? response;
                const list = data?.inventories ?? [];
                const meta = data?.pagination ?? {};
                setInventories(Array.isArray(list) ? list : []);
                setPagination((prev) => ({
                    ...prev,
                    total: meta.total ?? prev.total,
                    pages: meta.pages ?? prev.pages,
                }));
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message || "Failed to load inventory");
                setInventories([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [branchIdToUse, pagination.page, pagination.limit, searchTerm, refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger((t) => t + 1);
    };

    const handleSaveQuantity = async (inv) => {
        const branchId = inv.branch?._id || inv.branch_id;
        const productId = inv.product?._id || inv.product_id;
        if (!branchId || !productId) return;

        const services = getUserServices();
        setSaving(true);
        setError("");

        try {
            if (stockOperationMode === "add") {
                const unitsInput = parseFloat(quantityToAdd);
                if (!Number.isFinite(unitsInput) || unitsInput <= 0) {
                    setError("Units to add must be greater than 0");
                    setSaving(false);
                    return;
                }
                const standardQuantity = Number(inv.product?.standard_quantity) || 1;
                const calculatedQuantity = unitsInput * standardQuantity;
                await services.user.addStock(branchId, productId, calculatedQuantity, { reason: "Manual add (user inventory)" });
                setSuccess(`Stock added: ${unitsInput} unit(s) × ${standardQuantity} = ${calculatedQuantity.toFixed(3)} ${inv.product?.standard_quantity_unit || inv.product?.unit || inv.unit || "g"}`);
            } else {
                const q = parseFloat(editQuantity);
                if (!Number.isFinite(q) || q < 0) {
                    setError("Enter a valid quantity");
                    setSaving(false);
                    return;
                }
                await services.user.updateInventory(branchId, productId, { quantity: q });
                setSuccess("Quantity updated.");
            }
            setEditingId(null);
            setEditQuantity("");
            setQuantityToAdd("");
            setStockOperationMode("edit");
            handleRefresh();
            setTimeout(() => setSuccess(""), 3000);
        } catch (e) {
            setError(e?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (inv) => {
        const key = `${inv.branch?._id || inv.branch_id}-${inv.product?._id || inv.product_id}`;
        setEditingId(key);
        setStockOperationMode("edit");
        setEditQuantity(String(getQty(inv)));
        setQuantityToAdd("");
    };

    const closeEdit = () => {
        setEditingId(null);
        setEditQuantity("");
        setQuantityToAdd("");
        setStockOperationMode("edit");
    };

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return inventories;
        const s = searchTerm.toLowerCase().trim();
        const sNum = parseFloat(s);
        const isNumeric = s !== "" && Number.isFinite(sNum);
        return inventories.filter((inv) => {
            if (inv.product?.name && inv.product.name.toLowerCase().includes(s)) return true;
            if (inv.product?.code && inv.product.code.toLowerCase().includes(s)) return true;
            if (inv.product?.product_type && inv.product.product_type.toLowerCase().includes(s)) return true;
            const unit = (inv.product?.unit ?? inv.unit ?? "g").toLowerCase();
            if (unit.includes(s)) return true;
            if (isNumeric) {
                const qty = getQty(inv);
                if (qty === sNum) return true;
                if (String(qty).includes(s)) return true;
            }
            return false;
        });
    }, [inventories, searchTerm]);

    const sortedList = useMemo(() => {
        const list = [...filteredList];
        const dir = sortDir === "asc" ? 1 : -1;
        list.sort((a, b) => {
            let va, vb;
            switch (sortBy) {
                case "product":
                    va = (a.product?.name ?? "").toLowerCase();
                    vb = (b.product?.name ?? "").toLowerCase();
                    return dir * (va < vb ? -1 : va > vb ? 1 : 0);
                case "code":
                    va = (a.product?.code ?? "").toLowerCase();
                    vb = (b.product?.code ?? "").toLowerCase();
                    return dir * (va < vb ? -1 : va > vb ? 1 : 0);
                case "type":
                    va = (a.product?.product_type ?? "").toLowerCase();
                    vb = (b.product?.product_type ?? "").toLowerCase();
                    return dir * (va < vb ? -1 : va > vb ? 1 : 0);
                case "quantity":
                    va = getQty(a);
                    vb = getQty(b);
                    return dir * (va - vb);
                case "unit":
                    va = (a.product?.unit ?? a.unit ?? "g").toLowerCase();
                    vb = (b.product?.unit ?? b.unit ?? "g").toLowerCase();
                    return dir * (va < vb ? -1 : va > vb ? 1 : 0);
                default:
                    return 0;
            }
        });
        return list;
    }, [filteredList, sortBy, sortDir]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(column);
            setSortDir("asc");
        }
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return null;
        return sortDir === "asc" ? (
            <ChevronUp className="w-4 h-4 inline-block ml-0.5" />
        ) : (
            <ChevronDown className="w-4 h-4 inline-block ml-0.5" />
        );
    };

    if (!user?.branches?.length) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-amber-800 dark:text-amber-200">
                        No branch assigned. You cannot access inventory. Contact your administrator.
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Package className="w-6 h-6" />
                            Inventory
                        </h1>
                        <div className="flex flex-wrap items-center gap-3">
                            {branches.length > 1 && (
                                <select
                                    value={selectedBranchId}
                                    onChange={(e) => setSelectedBranchId(e.target.value || "")}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                >
                                    <option value="">Select branch</option>
                                    {branches.map((br) => (
                                        <option key={br._id} value={br._id}>
                                            {br.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by product, code, type, quantity, unit..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-48"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <div className="p-6 overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : filteredList.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                No inventory records. Use filters or select another branch.
                            </p>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="pb-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("product")}
                                                className="inline-flex items-center hover:text-gray-900 dark:hover:text-white"
                                            >
                                                Product
                                                <SortIcon column="product" />
                                            </button>
                                        </th>
                                        <th className="pb-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("code")}
                                                className="inline-flex items-center hover:text-gray-900 dark:hover:text-white"
                                            >
                                                Code
                                                <SortIcon column="code" />
                                            </button>
                                        </th>
                                        <th className="pb-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("type")}
                                                className="inline-flex items-center hover:text-gray-900 dark:hover:text-white"
                                            >
                                                Type
                                                <SortIcon column="type" />
                                            </button>
                                        </th>
                                        <th className="pb-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("quantity")}
                                                className="inline-flex items-center hover:text-gray-900 dark:hover:text-white"
                                            >
                                                Quantity
                                                <SortIcon column="quantity" />
                                            </button>
                                        </th>
                                        <th className="pb-2 pr-4 font-medium text-gray-700 dark:text-gray-300">
                                            <button
                                                type="button"
                                                onClick={() => handleSort("unit")}
                                                className="inline-flex items-center hover:text-gray-900 dark:hover:text-white"
                                            >
                                                Unit
                                                <SortIcon column="unit" />
                                            </button>
                                        </th>
                                        <th className="pb-2 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedList.map((inv) => {
                                        const branchId = inv.branch?._id || inv.branch_id;
                                        const productId = inv.product?._id || inv.product_id;
                                        const key = `${branchId}-${productId}`;
                                        const isEditing = editingId === key;
                                        const qty = getQty(inv);
                                        const unit = inv.product?.unit ?? inv.unit ?? "g";
                                        return (
                                            <Fragment key={key}>
                                                <tr key={key} className="border-b border-gray-100 dark:border-gray-700/50">
                                                    <td className="py-3 pr-4 text-gray-900 dark:text-white">
                                                        {inv.product?.name ?? "—"}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 font-mono">
                                                        {inv.product?.code ?? "—"}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                                                        {inv.product?.product_type ?? "—"}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <span className="text-gray-900 dark:text-white font-medium">
                                                            {Number(qty).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                                                        {unit}
                                                    </td>
                                                    <td className="py-3">
                                                        {isEditing ? (
                                                            <button
                                                                type="button"
                                                                onClick={closeEdit}
                                                                className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                                            >
                                                                Cancel
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(inv)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                                Update
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                                {isEditing && (
                                                    <tr key={`${key}-form`} className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-700/30">
                                                        <td colSpan={6} className="py-4 px-4">
                                                            <div className="max-w-2xl space-y-4">
                                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                                        Stock Operation Mode
                                                                    </label>
                                                                    <div className="flex gap-4">
                                                                        <label className="flex items-center cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`stockMode-${key}`}
                                                                                value="add"
                                                                                checked={stockOperationMode === "add"}
                                                                                onChange={() => setStockOperationMode("add")}
                                                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span className="text-sm text-gray-700 dark:text-gray-300">Add Stock</span>
                                                                        </label>
                                                                        <label className="flex items-center cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`stockMode-${key}`}
                                                                                value="edit"
                                                                                checked={stockOperationMode === "edit"}
                                                                                onChange={() => setStockOperationMode("edit")}
                                                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span className="text-sm text-gray-700 dark:text-gray-300">Edit Current Stock</span>
                                                                        </label>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                                        {stockOperationMode === "add"
                                                                            ? "Add quantity to current stock"
                                                                            : "Set stock to a new value"}
                                                                    </p>
                                                                </div>
                                                                {stockOperationMode === "add" ? (
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                            Units to add *
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.001"
                                                                            value={quantityToAdd}
                                                                            onChange={(e) => {
                                                                                const v = e.target.value;
                                                                                if (v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0))
                                                                                    setQuantityToAdd(v);
                                                                            }}
                                                                            placeholder="0"
                                                                            className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                                        />
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                            Current stock: {Number(qty).toLocaleString()} {unit}
                                                                        </p>
                                                                        {(() => {
                                                                            const stdQty = Number(inv.product?.standard_quantity) || 1;
                                                                            const unitsVal = quantityToAdd === "" ? 0 : parseFloat(quantityToAdd) || 0;
                                                                            const calculated = unitsVal * stdQty;
                                                                            const stdUnit = inv.product?.standard_quantity_unit || inv.product?.unit || unit;
                                                                            return unitsVal > 0 ? (
                                                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                                                    {unitsVal} × {stdQty} = {calculated.toFixed(3)} {stdUnit}
                                                                                </p>
                                                                            ) : null;
                                                                        })()}
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                            New quantity ({unit}) *
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.001"
                                                                            value={editQuantity}
                                                                            onChange={(e) => setEditQuantity(e.target.value)}
                                                                            className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveQuantity(inv)}
                                                                        disabled={saving}
                                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                                                    >
                                                                        {saving ? "Saving..." : "Save"}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={closeEdit}
                                                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {pagination.pages > 1 && (
                        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                            <span>
                                Page {pagination.page} of {pagination.pages} ({pagination.total} items)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                    disabled={pagination.page <= 1}
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))
                                    }
                                    disabled={pagination.page >= pagination.pages}
                                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserInventory;
