import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Header from "./components/Header";
import AccessKeyModal from "./components/AccessKeyModal";
import { ShoppingCart, Loader2, Package, RefreshCw, Printer, Copy, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import OrderDetailsView from "./components/OrderDetailsView";
import { fetchMastersFresh } from "../../formula/services/mastersService";

const Orders = () => {
    const navigate = useNavigate();
    const { getUserServices } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [categoryNameById, setCategoryNameById] = useState({});

    useEffect(() => {
        let cancelled = false;
        fetchMastersFresh()
            .then((data) => {
                if (cancelled) return;
                const map = {};
                (data?.categories || []).forEach((c) => {
                    if (c?.id != null && c?.name != null) map[String(c.id)] = c.name;
                });
                setCategoryNameById(map);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const getCategoryDisplayName = (val) => {
        const id = val?.$oid ?? val;
        if (id == null || id === "") return "—";
        return categoryNameById[String(id)] ?? String(id);
    };

    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const services = getUserServices();
            const res = await services.user.getOrders({
                type: "all",
                page: pagination.page,
                limit: pagination.limit,
            });
            const data = res?.data ?? res;
            setOrders(Array.isArray(data?.orders) ? data.orders : []);
            const meta = data?.pagination ?? {};
            setPagination((prev) => ({
                ...prev,
                total: meta.total ?? prev.total,
                pages: Math.max(1, meta.pages ?? 0),
            }));
        } catch (e) {
            setError(e?.message || "Failed to load orders");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [pagination.page]);

    const formatDateDisplay = (d) => {
        if (!d) return "—";
        const date = new Date(d);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleRepeatOrder = (order) => {
        if (order.formula_id) {
            navigate(`/order?formula_id=${order.formula_id}`);
        } else {
            navigate("/order");
        }
    };

    const handleDeleteOrderWithKey = async (accessKey) => {
        if (!orderToDelete) return;
        setMessage({ type: "", text: "" });
        setError("");
        try {
            const services = getUserServices();
            const res = await services.user.deleteOrder(
                orderToDelete._id,
                orderToDelete.order_type || "formula",
                accessKey,
            );
            const data = res?.data ?? res;
            if (data?.message || res?.status === "success") {
                setMessage({ type: "success", text: "Order deleted successfully." });
                setOrderToDelete(null);
                fetchOrders();
            } else {
                setError(res?.message || data?.message || "Failed to delete order");
                setOrderToDelete(null);
            }
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Failed to delete order";
            setError(msg);
            setOrderToDelete(null);
        }
    };

    const renderOrderCard = (order, options = {}) => {
        const t = order.order_type || "formula";
        const price = order.pricing?.total ?? order.pricing?.subtotal;
        const currency = order.pricing?.currency || "AED";
        const priceStr =
            price != null && Number.isFinite(Number(price))
                ? `${Number(price).toFixed(2)} ${currency}`
                : "—";
        const { onDeleteOrder, onViewDetails } = options;

        if (t !== "formula") {
            return (
                <div className="p-4 space-y-2 text-sm">
                    <p><span className="text-gray-500 dark:text-gray-400">Order No:</span> {order.order_number ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Date:</span> {formatDateDisplay(order.created_at)}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Customer:</span> {order.customer?.name ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Total:</span> <span className="font-semibold text-gray-900 dark:text-white">{priceStr}</span></p>
                    {onDeleteOrder && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                            <button
                                type="button"
                                onClick={() => onDeleteOrder(order)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete order
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        const fd = order.formula_data || {};
        const qty = order.quantities?.requested ?? 0;
        const qtyUnit = order.quantities?.unit ?? "L";
        const unitLabel = qtyUnit === "L" ? "Liter" : qtyUnit === "kg" ? "Kilogram" : qtyUnit;
        const remarks = fd.remarks ?? order.notes ?? "";

        return (
            <div className="p-4 space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    <p><span className="text-gray-500 dark:text-gray-400">Order No:</span> <span className="font-mono text-gray-900 dark:text-white">{order.order_number ?? "—"}</span></p>
                    <p><span className="text-gray-500 dark:text-gray-400">Project No:</span> {fd.project_no ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Date:</span> {formatDateDisplay(order.created_at)}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Formula No:</span> <span className="font-mono">{fd.file_number ?? "—"}</span></p>
                    <p><span className="text-gray-500 dark:text-gray-400">Quantity:</span> {qty} - {unitLabel}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Total:</span> <span className="font-semibold text-gray-900 dark:text-white">{priceStr}</span></p>
                    <p><span className="text-gray-500 dark:text-gray-400">Mixer:</span> {fd.mixer ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Customer Name:</span> {order.customer?.name ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Color Name:</span> {fd.color_name ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Customer Ref:</span> {fd.customer_ref ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Color Code:</span> {fd.color_code ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Category:</span> {fd.category ?? "—"}</p>
                    <p><span className="text-gray-500 dark:text-gray-400">Sub Category:</span> {fd.subcategory ?? "—"}</p>
                </div>
                {remarks && (
                    <p><span className="text-gray-500 dark:text-gray-400">Remarks:</span> {remarks}</p>
                )}
                <p><span className="text-gray-500 dark:text-gray-400">Matt:</span> {fd.gloss != null ? fd.gloss : "—"}</p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                        title="Print label – will implement later"
                    >
                        <Printer className="w-4 h-4" />
                        Print Label
                    </button>
                    {onViewDetails && (
                        <button
                            type="button"
                            onClick={() => onViewDetails(order)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
                        >
                            View details
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleRepeatOrder(order)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm"
                    >
                        <Copy className="w-4 h-4" />
                        Repeat Order
                    </button>
                    {onDeleteOrder && (
                        <button
                            type="button"
                            onClick={() => onDeleteOrder(order)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete order
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const detailSnapshot =
        selectedOrder?.order_snapshot ?? selectedOrder?.formula_data;
    const detailTinters = Array.isArray(detailSnapshot?.tinters)
        ? detailSnapshot.tinters.map((t) => ({
              ...t,
              quantity: t.quantity ?? t.grams ?? 0,
              // store volume in Liters so the view can show ml via *1000
              volume: (t.quantity_ml ?? 0) / 1000,
          }))
        : [];
    const detailBinders = Array.isArray(detailSnapshot?.binders)
        ? detailSnapshot.binders.map((b) => ({
              ...b,
              grams: b.grams ?? b.quantity ?? 0,
              volume: (b.quantity_ml ?? b.volume ?? 0) / 1000,
          }))
        : [];
    const detailAdditives = Array.isArray(detailSnapshot?.additives)
        ? detailSnapshot.additives.map((a) => ({
              ...a,
              grams: a.grams ?? a.quantity ?? 0,
              volume: (a.quantity_ml ?? 0) / 1000,
          }))
        : [];

    const detailTotalWithoutAdditivesGrams = detailTinters.reduce(
        (sum, t) => sum + (Number(t.quantity) || 0),
        0,
    );
    const detailTotalWithoutAdditivesVolume = detailTinters.reduce(
        (sum, t) => sum + (Number(t.volume) || 0),
        0,
    );
    const detailAdditivesTotalGrams = detailAdditives.reduce(
        (sum, a) => sum + (Number(a.grams) || 0),
        0,
    );
    const detailAdditivesTotalVolume = detailAdditives.reduce(
        (sum, a) => sum + (Number(a.volume) || 0),
        0,
    );
    const detailTotalGrams =
        (detailSnapshot?.totals?.grams ??
            detailTotalWithoutAdditivesGrams +
                detailBinders.reduce(
                    (sum, b) => sum + (Number(b.grams) || 0),
                    0,
                ) +
                detailAdditivesTotalGrams) || 0;
    const detailGrandTotalVolume =
        (detailSnapshot?.totals?.volume ??
            detailTotalWithoutAdditivesVolume +
                detailBinders.reduce(
                    (sum, b) => sum + (Number(b.volume) || 0),
                    0,
                ) +
                detailAdditivesTotalVolume) || 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart className="w-6 h-6" />
                            Orders
                        </h1>
                        <button
                            type="button"
                            onClick={() => fetchOrders()}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {message.text && (
                        <div
                            className={`p-3 rounded-lg text-sm ${
                                message.type === "success"
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-lg">
                            <Package className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No orders found. Create an order from the{" "}
                                <Link to="/order" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    Order
                                </Link>{" "}
                                page.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div
                                    key={order._id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-600 overflow-hidden"
                                >
                                    {renderOrderCard(order, {
                                        onDeleteOrder: (o) => setOrderToDelete(o),
                                        onViewDetails: (o) => {
                                            setSelectedOrder(o);
                                            setIsDetailsModalOpen(true);
                                        },
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && pagination.pages > 1 && (
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 py-3">
                            <span>
                                Page {pagination.page} of {pagination.pages} ({pagination.total} orders)
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
                                    onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
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

            {isDetailsModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-40"
                        onClick={() => {
                            setIsDetailsModalOpen(false);
                            setSelectedOrder(null);
                        }}
                    />
                    <div className="relative z-50 max-w-7xl w-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Order details
                            </h2>
                            <button
                                type="button"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                onClick={() => {
                                    setIsDetailsModalOpen(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[calc(90vh-3rem)] bg-gray-50 dark:bg-gray-900">
                            {selectedOrder && (
                                <OrderDetailsView
                                    mode="view"
                                    headerTitle="Order details"
                                    message={null}
                                    noBranches={false}
                                    meta={{
                                        date: formatDateDisplay(selectedOrder.created_at) ?? "",
                                        fileNo: selectedOrder?.formula_data?.file_number ?? "",
                                        customerName: selectedOrder?.customer?.name ?? "",
                                        colorCode: selectedOrder?.formula_data?.color_code ?? "",
                                        colorName: selectedOrder?.formula_data?.color_name ?? "",
                                        customerRef: selectedOrder?.formula_data?.customer_ref ?? "",
                                        projectNo: selectedOrder?.formula_data?.project_no ?? "",
                                    }}
                                    formula={{
                                        category: getCategoryDisplayName(
                                            selectedOrder?.formula_data?.category,
                                        ),
                                        subcategory: selectedOrder?.formula_data?.subcategory,
                                        gloss: selectedOrder?.formula_data?.gloss,
                                        attachment: selectedOrder?.formula_data?.attachment,
                                        order_snapshot:
                                            selectedOrder?.order_snapshot ?? selectedOrder?.formula_data,
                                    }}
                                    selectedCustomer={selectedOrder?.customer}
                                    branches={[]}
                                    unit={selectedOrder?.quantities?.unit ?? "L"}
                                    qtyInput={
                                        selectedOrder?.quantities?.requested?.toString() ?? ""
                                    }
                                    snapshot={
                                        selectedOrder?.order_snapshot ?? selectedOrder?.formula_data
                                    }
                                    orderPreview={
                                        selectedOrder?.formula_data?.metrics ||
                                        selectedOrder?.pricing
                                            ? {
                                                  metrics:
                                                      selectedOrder?.formula_data?.metrics ??
                                                      null,
                                                  costing: {
                                                      cost:
                                                          selectedOrder?.pricing?.total ??
                                                          selectedOrder?.pricing?.cost ??
                                                          0,
                                                      currency:
                                                          selectedOrder?.pricing?.currency ||
                                                          "AED",
                                                  },
                                              }
                                            : null
                                    }
                                    scaledTinters={
                                        detailTinters
                                    }
                                    scaledBinders={
                                        detailBinders
                                    }
                                    scaledAdditives={
                                        detailAdditives
                                    }
                                    totals={{
                                        totalWithoutAdditivesGrams:
                                            detailTotalWithoutAdditivesGrams,
                                        totalWithoutAdditivesVolume:
                                            detailTotalWithoutAdditivesVolume,
                                        additivesTotalGrams:
                                            detailAdditivesTotalGrams,
                                        additivesTotalVolume:
                                            detailAdditivesTotalVolume,
                                        totalGrams: detailTotalGrams,
                                        grandTotalVolume: detailGrandTotalVolume,
                                    }}
                                    remarks={
                                        selectedOrder?.formula_data?.remarks ??
                                        selectedOrder?.notes ??
                                        ""
                                    }
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AccessKeyModal
                isOpen={!!orderToDelete}
                onClose={() => setOrderToDelete(null)}
                onSuccessWithKey={handleDeleteOrderWithKey}
                title="Delete order"
                helpText="Enter the controlled access key to delete this order. The same key is used for other controlled actions (e.g. file number editing)."
                successMessage="✓ Access key verified. Deleting order..."
            />
        </div>
    );
};

export default Orders;
