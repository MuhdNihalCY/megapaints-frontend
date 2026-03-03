import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import { FormulaService } from "../../formula/services/formulaService";
import { fetchMastersFresh } from "../../formula/services/mastersService";
import CustomerDropdown from "../../components/customer/CustomerDropdown";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, Edit, Package, ShoppingCart } from "lucide-react";

function getBranchId(branch) {
    if (!branch) return null;
    if (typeof branch === "string") return branch;
    return branch._id || branch.id || null;
}

const Order = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, getUserServices } = useAuth();
    const formulaIdFromUrl = searchParams.get("formula_id");

    const [formula, setFormula] = useState(null);
    const [loading, setLoading] = useState(!!formulaIdFromUrl);
    const [error, setError] = useState("");
    const [masters, setMasters] = useState(null);
    const [qtyInput, setQtyInput] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [branchId, setBranchId] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isStockingOut, setIsStockingOut] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const branches = useMemo(() => {
        const b = user?.branches;
        if (!Array.isArray(b) || b.length === 0) return [];
        return b.map((br) => ({
            _id: getBranchId(br),
            id: getBranchId(br),
            name: typeof br === "object" && br?.name != null ? br.name : String(getBranchId(br)),
            code: typeof br === "object" && br?.code != null ? br.code : "",
        })).filter((br) => br._id);
    }, [user?.branches]);

    useEffect(() => {
        if (branches.length === 1 && !selectedBranchId) {
            setSelectedBranchId(branches[0]._id);
            setBranchId(branches[0]._id);
        } else if (selectedBranchId) {
            setBranchId(selectedBranchId);
        }
    }, [branches, selectedBranchId]);

    const unit = useMemo(() => {
        if (!masters || !formula?.subcategory) return "kg";
        const config = masters.binderConfigBySubCategory?.[formula.subcategory];
        if (config?.Liter) return "L";
        return "kg";
    }, [masters, formula?.subcategory]);

    const density = useMemo(() => {
        const d = formula?.order_snapshot?.metrics?.density ?? formula?.density ?? 1000;
        return Number(d) || 1000;
    }, [formula]);

    const totalGrams = useMemo(() => {
        const q = parseFloat(qtyInput);
        if (!Number.isFinite(q) || q < 0) return 0;
        if (unit === "kg") return q * 1000;
        return q * density;
    }, [qtyInput, unit, density]);

    const snapshot = useMemo(() => {
        return formula?.order_snapshot || formula;
    }, [formula]);

    const originalTotalGrams = useMemo(() => {
        const g = Number(snapshot?.totals?.grams);
        return g > 0 ? g : totalGrams;
    }, [snapshot?.totals?.grams, totalGrams]);

    const scaledTinters = useMemo(() => {
        if (!Array.isArray(snapshot?.tinters)) return [];
        const den = density > 0 ? density : 1000;
        return snapshot.tinters.map((t) => {
            const quantity = Math.round((Number(t.ratio) || 0) * totalGrams * 1000) / 1000;
            const volume = totalGrams > 0 && den > 0 ? quantity / den : 0;
            return { ...t, quantity, volume };
        });
    }, [snapshot?.tinters, totalGrams, density]);

    const scaledBinders = useMemo(() => {
        if (!Array.isArray(snapshot?.binders)) return [];
        const orig = originalTotalGrams > 0 ? originalTotalGrams : totalGrams;
        return snapshot.binders.map((b) => {
            const grams = Math.round((Number(b.ratio) || 0) * totalGrams * 1000) / 1000;
            const vol = Number(b.volume) && orig > 0 ? (Number(b.volume) / orig) * totalGrams : 0;
            return { ...b, grams, volume: Math.round(vol * 1000) / 1000 };
        });
    }, [snapshot?.binders, totalGrams, originalTotalGrams]);

    const scaledAdditives = useMemo(() => {
        if (!Array.isArray(snapshot?.additives)) return [];
        const den = density > 0 ? density : 1000;
        return snapshot.additives.map((a) => {
            const grams = Math.round((Number(a.ratio) || 0) * totalGrams * 1000) / 1000;
            const volume = grams > 0 && den > 0 ? grams / den : 0;
            return { ...a, grams, volume };
        });
    }, [snapshot?.additives, totalGrams, density]);

    const totalWithoutAdditivesGrams = useMemo(
        () => scaledTinters.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0),
        [scaledTinters],
    );
    const totalWithoutAdditivesVolume = useMemo(
        () => scaledTinters.reduce((sum, t) => sum + (Number(t.volume) || 0), 0),
        [scaledTinters],
    );
    const bindersTotalGrams = useMemo(
        () => scaledBinders.reduce((sum, b) => sum + (Number(b.grams) || 0), 0),
        [scaledBinders],
    );
    const bindersTotalVolume = useMemo(
        () => scaledBinders.reduce((sum, b) => sum + (Number(b.volume) || 0), 0),
        [scaledBinders],
    );
    const additivesTotalGrams = useMemo(
        () => scaledAdditives.reduce((sum, a) => sum + (Number(a.grams) || 0), 0),
        [scaledAdditives],
    );
    const additivesTotalVolume = useMemo(
        () => scaledAdditives.reduce((sum, a) => sum + (Number(a.volume) || 0), 0),
        [scaledAdditives],
    );
    const grandTotalVolume = useMemo(() => {
        if (totalGrams <= 0 || !density) return 0;
        return totalGrams / density;
    }, [totalGrams, density]);

    const remarks = useMemo(() => {
        const fd = formula?.formulation_data || {};
        const r = fd.remarks ?? fd.remarks_notes ?? "";
        return typeof r === "string" ? r : String(r ?? "");
    }, [formula]);

    const meta = useMemo(() => {
        const fd = formula?.formulation_data || {};
        const m = fd.meta || {};
        return {
            date: m.date || (formula?.createdAt ? new Date(formula.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""),
            fileNo: formula?.file_no ?? m.fileNo ?? m.file_no ?? "",
            customerName: formula?.customer_name ?? m.customerName ?? m.customer_name ?? "",
            colorCode: formula?.color_code ?? m.colorCode ?? m.color_code ?? "",
            colorName: formula?.color_name ?? m.colorName ?? m.color_name ?? "",
            customerRef: m.customerRef ?? m.customer_ref ?? "",
            projectNo: m.projectNo ?? m.project_no ?? "",
        };
    }, [formula]);

    useEffect(() => {
        if (!formulaIdFromUrl) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError("");
        Promise.all([
            FormulaService.fetchFormulaById(formulaIdFromUrl),
            fetchMastersFresh().catch(() => null),
        ])
            .then(([res, m]) => {
                if (cancelled) return;
                const data = res?.data ?? res;
                const formulation = data?.data ?? data;
                if (!formulation || !formulation._id) {
                    setError("Formulation not found");
                    setFormula(null);
                    return;
                }
                setFormula(formulation);
                setMasters(m && m.status ? m : null);
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e?.response?.data?.message || e?.message || "Failed to load formula");
                    setFormula(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [formulaIdFromUrl]);

    const handleCreateOrder = async () => {
        const bid = selectedBranchId || branchId;
        if (!bid) {
            setMessage({ type: "error", text: "Please select a branch." });
            return;
        }
        if (!selectedCustomer?._id) {
            setMessage({ type: "error", text: "Please select a customer." });
            return;
        }
        const q = parseFloat(qtyInput);
        if (!Number.isFinite(q) || q <= 0) {
            setMessage({ type: "error", text: "Enter a valid quantity." });
            return;
        }
        setIsCreating(true);
        setMessage({ type: "", text: "" });
        try {
            const services = getUserServices();
            const result = await services.user.createFormulaOrder({
                customer_id: selectedCustomer._id,
                formula_id: formulaIdFromUrl,
                quantities: { requested: q, unit },
                pricing: { total: 0, currency: "AED" },
                branch_id: bid,
            });
            const order = result?.data?.order ?? result?.order;
            if (order?._id) {
                setCreatedOrderId(order._id);
                setMessage({ type: "success", text: "Order created successfully." });
            } else {
                setMessage({ type: "error", text: "Order created but ID not returned." });
            }
        } catch (e) {
            setMessage({
                type: "error",
                text: e?.response?.data?.message || e?.message || "Failed to create order",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleStockOut = async () => {
        if (!createdOrderId) return;
        setIsStockingOut(true);
        setMessage({ type: "", text: "" });
        try {
            const services = getUserServices();
            await services.user.stockOutFormulaOrder(createdOrderId);
            setMessage({ type: "success", text: "Stock-out successful." });
        } catch (e) {
            const data = e?.response?.data || e;
            const errMsg = data?.message || data?.errors?.[0]?.msg || e?.message || "Stock-out failed";
            setMessage({ type: "error", text: errMsg });
        } finally {
            setIsStockingOut(false);
        }
    };

    if (!formulaIdFromUrl) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Select a formula from the formulas list to create an order.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/formulas")}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Go to Formulas
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </main>
            </div>
        );
    }

    if (error || !formula) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Header />
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-red-700 dark:text-red-300">
                        {error || "Formula not found"}
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/formulas")}
                        className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Back to Formulas
                    </button>
                </main>
            </div>
        );
    }

    const noBranches = branches.length === 0;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Header />
            <main className=" mx-auto">
                {message.text && (
                    <div
                        className={`mb-4 p-4 rounded-lg ${
                            message.type === "error"
                                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {noBranches && (
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200">
                        No branch assigned. Please contact admin to assign a branch.
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-lg">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Create Order from Formula
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate(`/edit-formula/${formulaIdFromUrl}`)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                <Edit className="w-4 h-4" />
                                Edit this formula
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateOrder}
                                disabled={noBranches || isCreating || !selectedCustomer || !qtyInput || parseFloat(qtyInput) <= 0}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ShoppingCart className="w-4 h-4" />
                                )}
                                Create Order
                            </button>
                            <button
                                type="button"
                                onClick={handleStockOut}
                                disabled={!createdOrderId || isStockingOut}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isStockingOut ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Package className="w-4 h-4" />
                                )}
                                Stock out this order
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-b-lg shadow">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Left sidebar - meta, customer, branch, metrics */}
                        <div className="col-span-2 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">{meta.date}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">File no.</label>
                                    <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100 font-mono">{meta.fileNo}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer (formula)</label>
                                    <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">{meta.customerName}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color Code</label>
                                    <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">{meta.colorCode}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color Name</label>
                                    <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">{meta.colorName}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Project No</label>
                                    <div className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">{meta.projectNo}</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Order customer</label>
                                <CustomerDropdown
                                    selectedCustomer={selectedCustomer}
                                    onCustomerSelect={setSelectedCustomer}
                                    placeholder="Select customer..."
                                    disabled={noBranches}
                                    className="w-full"
                                />
                            </div>

                            {branches.length > 1 && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                                    <select
                                        value={selectedBranchId || ""}
                                        onChange={(e) => {
                                            setSelectedBranchId(e.target.value || null);
                                            setBranchId(e.target.value || null);
                                        }}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="">Select branch</option>
                                        {branches.map((br) => (
                                            <option key={br._id} value={br._id}>
                                                {br.name || br.code || br._id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {snapshot?.metrics && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded shadow">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metrics</h3>
                                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                        <div>Density: {snapshot.metrics.density ?? "—"} g/L</div>
                                        <div>Solids: {snapshot.metrics.solids_percent ?? "—"}%</div>
                                        <div>VOC: {snapshot.metrics.voc ?? "—"}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main content - same layout as Create Formula: col-8 (tinters + totals block) + col-4 (quantity) */}
                        <div className="col-span-10">
                            <div className="grid grid-cols-12 gap-6">
                                {/* Left: Tinters table + Totals/Binders/Additives/Total block */}
                                <div className="col-span-12 space-y-6">
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-3">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                            <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">{formula.category ?? "—"}</div>
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategory</label>
                                            <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">{formula.subcategory ?? "—"}</div>
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Gloss</label>
                                            <div className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">{formula.gloss ?? "—"}</div>
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Enter Quantity ({unit === "L" ? "L" : "kg"})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step={unit === "L" ? "0.01" : "0.001"}
                                                value={qtyInput}
                                                onChange={(e) => setQtyInput(e.target.value)}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={unit === "L" ? "0" : "0"}
                                            />
                                        </div>
                                    </div>

                                    {/* Tinters table - same header as Create Formula: SL No, Tinters, Quantity (Grams + Volume) */}
                                    <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                                        <div className="bg-gray-600 text-white">
                                            <div className="grid grid-cols-12 text-xs font-medium">
                                                <div className="col-span-1 p-2 text-center border-r border-gray-500">SL No.</div>
                                                <div className="col-span-7 p-2 text-center border-r border-gray-500">Tinters</div>
                                                <div className="col-span-4 p-2">
                                                    <div className="text-center mb-1">Quantity</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-center">Grams (g)</div>
                                                        <div className="text-center">Volume (ml)</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {scaledTinters.length === 0 ? (
                                                <div className="grid grid-cols-12 text-sm p-4 text-gray-500 dark:text-gray-400">No tinters</div>
                                            ) : (
                                                scaledTinters.map((t, index) => (
                                                    <div key={index} className="grid grid-cols-12 text-xs h-[42px] items-center">
                                                        <div className="col-span-1 p-2 text-center bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                                                            {index + 1}
                                                        </div>
                                                        <div className="col-span-7 p-2 border-r border-gray-200 dark:border-gray-600">
                                                            <div className="grid grid-cols-12 gap-1">
                                                                <div className="col-span-3 text-gray-900 dark:text-white font-mono">{t.code ?? "—"}</div>
                                                                <div className="col-span-6 text-gray-900 dark:text-white truncate">{t.name ?? "—"}</div>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-4 p-2">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="text-center text-sm font-medium text-blue-600 dark:text-blue-300">
                                                                    {t.quantity != null ? Number(t.quantity).toFixed(2) : "—"} g
                                                                </div>
                                                                <div className="text-center text-sm text-gray-800 dark:text-gray-200">
                                                                    {t.volume != null ? (Number(t.volume) * 1000).toFixed(2) : "—"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Totals, Binders, Additives, Total - same block as Create Formula */}
                                    <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                                        {/* Total without Additives */}
                                        <div className="bg-gray-600 text-white p-2">
                                            <div className="grid grid-cols-12 items-center">
                                                <div className="col-span-1" />
                                                <div className="col-span-7 text-sm font-medium">Total without Additives</div>
                                                <div className="col-span-4">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-center text-blue-300 font-semibold">
                                                            {totalWithoutAdditivesGrams.toFixed(2)} g
                                                        </div>
                                                        <div className="text-center text-sm">
                                                            {(totalWithoutAdditivesVolume * 1000).toFixed(2)} ml
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Binders */}
                                        <div className="bg-gray-500 text-white p-2">
                                            <div className="text-sm font-medium mb-2">Binders</div>
                                            {scaledBinders.length === 0 ? (
                                                <div className="grid grid-cols-12 items-center mb-1">
                                                    <div className="col-span-1" />
                                                    <div className="col-span-7 text-sm text-gray-300">No binders</div>
                                                    <div className="col-span-4">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="text-center text-gray-300">0.00 g</div>
                                                            <div className="text-center text-gray-300">0.00 ml</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                scaledBinders.map((b, i) => (
                                                    <div key={i} className="grid grid-cols-12 items-center mb-1">
                                                        <div className="col-span-1" />
                                                        <div className="col-span-7 text-sm">
                                                            <span className="text-gray-300 font-medium">Binder {i + 1}:</span> {b.name ?? "—"}
                                                        </div>
                                                        <div className="col-span-4">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="text-center text-blue-300 font-semibold">
                                                                    {b.grams != null ? Number(b.grams).toFixed(2) : "—"} g
                                                                </div>
                                                                <div className="text-center text-sm">
                                                                    {b.volume != null ? (Number(b.volume) * 1000).toFixed(2) : "—"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Additives - each additive with name, grams, volume; then total row */}
                                        <div className="bg-gray-400 text-white p-2">
                                            <div className="text-sm font-medium mb-2">Additives</div>
                                            {scaledAdditives.length === 0 ? (
                                                <div className="grid grid-cols-12 items-center mb-1">
                                                    <div className="col-span-1" />
                                                    <div className="col-span-7 text-sm text-gray-200">No additives</div>
                                                    <div className="col-span-4">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="text-center text-gray-200">0.00 g</div>
                                                            <div className="text-center text-gray-200">0.00 ml</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {scaledAdditives.map((a, i) => (
                                                        <div key={i} className="grid grid-cols-12 items-center mb-1">
                                                            <div className="col-span-1" />
                                                            <div className="col-span-7 text-sm">
                                                                <span className="text-gray-200 font-medium">Additive {i + 1}:</span> {a.name ?? "—"}
                                                            </div>
                                                            <div className="col-span-4">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="text-center text-blue-200 font-semibold">
                                                                        {a.grams != null ? Number(a.grams).toFixed(2) : "—"} g
                                                                    </div>
                                                                    <div className="text-center text-sm">
                                                                        {a.volume != null ? (Number(a.volume) * 1000).toFixed(2) : "—"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="grid grid-cols-12 items-center mt-1 pt-1 border-t border-gray-300">
                                                        <div className="col-span-1" />
                                                        <div className="col-span-7 text-sm font-medium">Additives Total</div>
                                                        <div className="col-span-4">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="text-center text-blue-200 font-semibold">
                                                                    {additivesTotalGrams.toFixed(2)} g
                                                                </div>
                                                                <div className="text-center text-sm">
                                                                    {(additivesTotalVolume * 1000).toFixed(2)} ml
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Total */}
                                        <div className="bg-gray-600 text-white p-2">
                                            <div className="grid grid-cols-12 items-center">
                                                <div className="col-span-1" />
                                                <div className="col-span-7 text-sm font-medium">Total</div>
                                                <div className="col-span-4">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-center text-blue-300 font-semibold text-lg">
                                                            {totalGrams.toFixed(2)} g
                                                        </div>
                                                        <div className="text-center text-lg">
                                                            {(grandTotalVolume * 1000).toFixed(2)} ml
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remarks at bottom - always shown */}
                                    <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Remarks</h3>
                                        <div className="p-3 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 whitespace-pre-wrap min-h-[80px]">
                                            {remarks || "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Order;
