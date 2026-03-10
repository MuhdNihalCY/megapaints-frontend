import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import { FormulaService } from "../../formula/services/formulaService";
import { fetchMastersFresh } from "../../formula/services/mastersService";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, Edit, ShoppingCart } from "lucide-react";
import OrderDetailsView from "./components/OrderDetailsView";

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
    const [message, setMessage] = useState({ type: "", text: "" });
    const [orderPreview, setOrderPreview] = useState(null);

    const branches = useMemo(() => {
        const b = user?.branches;
        if (!Array.isArray(b) || b.length === 0) return [];
        return b
            .map((br) => ({
                _id: getBranchId(br),
                id: getBranchId(br),
                name:
                    typeof br === "object" && br?.name != null
                        ? br.name
                        : String(getBranchId(br)),
                code:
                    typeof br === "object" && br?.code != null ? br.code : "",
            }))
            .filter((br) => br._id);
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
        const config =
            masters.binderConfigBySubCategory?.[formula.subcategory];
        if (config?.Liter) return "L";
        return "kg";
    }, [masters, formula?.subcategory]);

    const density = useMemo(() => {
        const d =
            formula?.order_snapshot?.metrics?.density ??
            formula?.density ??
            1000;
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
            const quantity =
                Math.round((Number(t.ratio) || 0) * totalGrams * 1000) / 1000;
            const volume =
                totalGrams > 0 && den > 0 ? quantity / den : 0;
            return { ...t, quantity, volume };
        });
    }, [snapshot?.tinters, totalGrams, density]);

    const scaledBinders = useMemo(() => {
        if (!Array.isArray(snapshot?.binders)) return [];
        const orig = originalTotalGrams > 0 ? originalTotalGrams : totalGrams;
        return snapshot.binders.map((b) => {
            const grams =
                Math.round((Number(b.ratio) || 0) * totalGrams * 1000) /
                1000;
            const vol =
                Number(b.volume) && orig > 0
                    ? (Number(b.volume) / orig) * totalGrams
                    : 0;
            return {
                ...b,
                grams,
                volume: Math.round(vol * 1000) / 1000,
            };
        });
    }, [snapshot?.binders, totalGrams, originalTotalGrams]);

    const scaledAdditives = useMemo(() => {
        if (!Array.isArray(snapshot?.additives)) return [];
        const den = density > 0 ? density : 1000;
        return snapshot.additives.map((a) => {
            const grams =
                Math.round((Number(a.ratio) || 0) * totalGrams * 1000) /
                1000;
            const volume = grams > 0 && den > 0 ? grams / den : 0;
            return { ...a, grams, volume };
        });
    }, [snapshot?.additives, totalGrams, density]);

    const totalWithoutAdditivesGrams = useMemo(
        () =>
            scaledTinters.reduce(
                (sum, t) => sum + (Number(t.quantity) || 0),
                0,
            ),
        [scaledTinters],
    );
    const totalWithoutAdditivesVolume = useMemo(
        () =>
            scaledTinters.reduce(
                (sum, t) => sum + (Number(t.volume) || 0),
                0,
            ),
        [scaledTinters],
    );
    const additivesTotalGrams = useMemo(
        () =>
            scaledAdditives.reduce(
                (sum, a) => sum + (Number(a.grams) || 0),
                0,
            ),
        [scaledAdditives],
    );
    const additivesTotalVolume = useMemo(
        () =>
            scaledAdditives.reduce(
                (sum, a) => sum + (Number(a.volume) || 0),
                0,
            ),
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
            date:
                m.date ||
                (formula?.createdAt
                    ? new Date(formula.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                          },
                      )
                    : ""),
            fileNo:
                formula?.file_no ??
                m.fileNo ??
                m.file_no ??
                "",
            customerName:
                formula?.customer_name ??
                m.customerName ??
                m.customer_name ??
                "",
            colorCode:
                formula?.color_code ??
                m.colorCode ??
                m.color_code ??
                "",
            colorName:
                formula?.color_name ??
                m.colorName ??
                m.color_name ??
                "",
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
                    setError(
                        e?.response?.data?.message ||
                            e?.message ||
                            "Failed to load formula",
                    );
                    setFormula(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [formulaIdFromUrl]);

    // Fetch order preview (costing, metrics) when formula and quantity/unit change
    useEffect(() => {
        if (!formulaIdFromUrl || !formula?._id) {
            setOrderPreview(null);
            return;
        }
        const q = parseFloat(qtyInput);
        const quantity = Number.isFinite(q) && q >= 0 ? q : 0;
        let cancelled = false;
        const services = getUserServices();
        services.user
            .getFormulaOrderPreview({ formula_id: formulaIdFromUrl, quantity, unit })
            .then((res) => {
                if (cancelled) return;
                const data = res?.data ?? res;
                setOrderPreview(data);
            })
            .catch(() => {
                if (!cancelled) setOrderPreview(null);
            });
        return () => {
            cancelled = true;
        };
    }, [formulaIdFromUrl, formula?._id, qtyInput, unit, getUserServices]);

    const handleCreateOrder = async () => {
        const bid = selectedBranchId || branchId;
        if (!bid) {
            setMessage({ type: "error", text: "Please select a branch." });
            return;
        }
        if (!selectedCustomer?._id) {
            setMessage({
                type: "error",
                text: "Please select a customer.",
            });
            return;
        }
        const q = parseFloat(qtyInput);
        if (!Number.isFinite(q) || q <= 0) {
            setMessage({
                type: "error",
                text: "Enter a valid quantity.",
            });
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
                setMessage({
                    type: "success",
                    text: "Order created and inventory updated.",
                });
            } else {
                setMessage({
                    type: "error",
                    text: "Order created but ID not returned.",
                });
            }
        } catch (e) {
            setMessage({
                type: "error",
                text:
                    e?.response?.data?.message ||
                    e?.message ||
                    "Failed to create order",
            });
        } finally {
            setIsCreating(false);
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
            <main className="mx-auto">
                <OrderDetailsView
                    mode="create"
                    headerTitle="Create Order from Formula"
                    onEditFormula={() =>
                        navigate(`/edit-formula/${formulaIdFromUrl}`)
                    }
                    onCreateOrder={handleCreateOrder}
                    isCreating={isCreating}
                    canCreateOrder={
                        !noBranches &&
                        !!selectedCustomer &&
                        !!qtyInput &&
                        parseFloat(qtyInput) > 0
                    }
                    message={message}
                    noBranches={noBranches}
                    meta={meta}
                    formula={formula}
                    selectedCustomer={selectedCustomer}
                    onCustomerSelect={setSelectedCustomer}
                    branches={branches}
                    selectedBranchId={selectedBranchId}
                    onBranchChange={(value) => {
                        setSelectedBranchId(value);
                        setBranchId(value);
                    }}
                    unit={unit}
                    qtyInput={qtyInput}
                    onQtyInputChange={setQtyInput}
                    snapshot={snapshot}
                    orderPreview={orderPreview}
                    scaledTinters={scaledTinters}
                    scaledBinders={scaledBinders}
                    scaledAdditives={scaledAdditives}
                    totals={{
                        totalWithoutAdditivesGrams,
                        totalWithoutAdditivesVolume,
                        additivesTotalGrams,
                        additivesTotalVolume,
                        totalGrams,
                        grandTotalVolume,
                    }}
                    remarks={remarks}
                />
            </main>
        </div>
    );
};

export default Order;

