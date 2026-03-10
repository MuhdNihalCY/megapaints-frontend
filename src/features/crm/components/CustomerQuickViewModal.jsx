import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ExternalLink, Loader2 } from "lucide-react";
import api from "../../../utils/api";

const getAddressDisplay = (c) => {
    if (c?.full_address) return c.full_address;
    const addr = c?.address;
    if (!addr) return "";
    const parts = [addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean);
    return parts.join(", ");
};

const CustomerQuickViewModal = ({ customerId, isOpen, onClose, lastUploadedCustomerId, onRefetchedAfterUpload }) => {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [followups, setFollowups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [innerTab, setInnerTab] = useState("payment");

    const loadData = React.useCallback(async () => {
        if (!customerId) return;
        setLoading(true);
        setCustomer(null);
        setPerformance(null);
        setFollowups([]);
        try {
            const [custRes, perfRes, followRes] = await Promise.all([
                api.get(`/customers/${customerId}`),
                api.get(`/crm/customers/${customerId}/performance`).catch(() => ({ data: {} })),
                api.get(`/customer-followups?customer_id=${customerId}&limit=50`).catch(() => ({ data: {} })),
            ]);
            if (custRes.data?.status === "success" && custRes.data?.data?.customer) {
                setCustomer(custRes.data.data.customer);
            }
            if (perfRes.data?.status === "success" && perfRes.data?.data) {
                setPerformance(perfRes.data.data);
            }
            if (followRes.data?.status === "success" && followRes.data?.data?.followups) {
                setFollowups(followRes.data.data.followups);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        if (!isOpen || !customerId) return;
        loadData();
    }, [isOpen, customerId, loadData]);

    useEffect(() => {
        if (!isOpen || !customerId || !lastUploadedCustomerId) return;
        if (String(lastUploadedCustomerId) !== String(customerId)) return;
        loadData();
        onRefetchedAfterUpload?.();
    }, [lastUploadedCustomerId, customerId, isOpen, loadData]);

    if (!isOpen) return null;

    const salesExName =
        customer?.sales_ex_display ||
        (customer?.sales_executive && typeof customer.sales_executive === "object"
            ? [customer.sales_executive.first_name, customer.sales_executive.last_name].filter(Boolean).join(" ") || customer.sales_executive.username
            : "");
    const coordName =
        customer?.coordinator_display ||
        (customer?.coordinator && typeof customer.coordinator === "object"
            ? [customer.coordinator.first_name, customer.coordinator.last_name].filter(Boolean).join(" ") || customer.coordinator.username
            : "");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} aria-hidden="true" />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {customer?.name || "Customer"}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                navigate(`/crm/customer/${customerId}`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                            <ExternalLink className="w-4 h-4" /> View full page
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : customer ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Address</p>
                                <p className="text-gray-900 dark:text-white">{getAddressDisplay(customer) || "—"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Location</p>
                                <p className="text-gray-900 dark:text-white">{customer.location || "—"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Sales Ex.</p>
                                <p className="text-gray-900 dark:text-white">{salesExName || "—"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Co-ordinator</p>
                                <p className="text-gray-900 dark:text-white">{coordName || "—"}</p>
                            </div>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex gap-2 mb-3">
                                {["payment", "purchase", "followup"].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setInnerTab(t)}
                                        className={`px-3 py-1.5 rounded text-sm ${
                                            innerTab === t
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        }`}
                                    >
                                        {t === "payment" && "Purchase payment analysis"}
                                        {t === "purchase" && "Purchase details"}
                                        {t === "followup" && "Follow-up summary"}
                                    </button>
                                ))}
                            </div>
                            {innerTab === "payment" && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>Statement: Last updated {performance?.lastUpdated ? new Date(performance.lastUpdated).toLocaleDateString() : "—"}</p>
                                    <p className="mt-1">Closing balance: {performance?.summary?.closing_balance != null ? performance.summary.closing_balance : "—"}</p>
                                    <p className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                navigate(`/crm/customer/${customerId}`);
                                            }}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Open full page for charts and ledger
                                        </button>
                                    </p>
                                </div>
                            )}
                            {innerTab === "purchase" && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            navigate(`/crm/customer/${customerId}`);
                                        }}
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Open full page for purchase details table
                                    </button>
                                </p>
                            )}
                            {innerTab === "followup" && (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {followups.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No follow-ups.</p>
                                    ) : (
                                        followups.slice(0, 10).map((f) => (
                                            <div key={f._id} className="p-2 rounded border border-gray-200 dark:border-gray-600 text-sm">
                                                <span className="font-medium text-gray-900 dark:text-white">{f.subject || "—"}</span>
                                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                                    {f.followup_date ? new Date(f.followup_date).toLocaleDateString() : ""}
                                                </span>
                                                <p className="text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">{f.description || "—"}</p>
                                            </div>
                                        ))
                                    )}
                                    {followups.length > 10 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                navigate(`/crm/customer/${customerId}`);
                                            }}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            View all {followups.length} follow-ups on full page
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="p-8 text-center text-gray-500 dark:text-gray-400">Customer not found.</p>
                )}
            </div>
        </div>
    );
};

export default CustomerQuickViewModal;
