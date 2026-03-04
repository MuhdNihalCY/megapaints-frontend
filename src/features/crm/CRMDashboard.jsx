import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Upload, Loader2, Eye } from "lucide-react";
import UserHeader from "../user/components/Header";
import api from "../../utils/api";
import CreateCustomerModal from "./components/CreateCustomerModal";
import UploadLedgerModal from "./components/UploadLedgerModal";
import CustomerQuickViewModal from "./components/CustomerQuickViewModal";
import AddFollowupModal from "./components/AddFollowupModal";

const CRMDashboard = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [counts, setCounts] = useState({ totalCustomers: 0, orderCount: 0 });
    const [loading, setLoading] = useState(true);
    const [countsLoading, setCountsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sortOption, setSortOption] = useState("");
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [addFollowupModalOpen, setAddFollowupModalOpen] = useState(false);
    const [quickViewCustomerId, setQuickViewCustomerId] = useState(null);
    const [customerError, setCustomerError] = useState(null);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setCustomerError(null);
            const res = await api.get("/customers", {
                params: { limit: 500, page: 1 },
            });
            const data = res.data?.data;
            if (res.data?.status === "success" && data) {
                setCustomers(Array.isArray(data.customers) ? data.customers : []);
            } else {
                setCustomers([]);
            }
        } catch (err) {
            console.error("Failed to fetch customers:", err?.response?.data || err);
            setCustomers([]);
            const msg = err.response?.data?.message || err.message || "Could not load customers.";
            setCustomerError(msg);
        } finally {
            setLoading(false);
        }
    };

    const fetchCounts = async () => {
        try {
            setCountsLoading(true);
            const res = await api.get("/crm/dashboard");
            if (res.data?.status === "success" && res.data?.data) {
                setCounts({
                    totalCustomers: res.data.data.totalCustomers ?? 0,
                    orderCount: res.data.data.orderCount ?? 0,
                });
            }
        } catch (err) {
            console.error("Failed to fetch CRM counts:", err);
        } finally {
            setCountsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchCounts();
    }, []);

    const refreshAll = () => {
        fetchCustomers();
        fetchCounts();
    };

    const getAddressDisplay = (c) => {
        if (c.full_address) return c.full_address;
        const addr = c.address;
        if (!addr) return "";
        const parts = [
            addr.street,
            addr.city,
            addr.state,
            addr.postal_code,
            addr.country,
        ].filter(Boolean);
        return parts.join(", ");
    };

    const getLocationDisplay = (c) => {
        return c.location || (c.address && (c.address.city || c.address.state)) || "—";
    };

    const filtered = useMemo(() => {
        let list = [...customers];
        const q = (search || "").toLowerCase().trim();
        if (q) {
            list = list.filter(
                (c) =>
                    (c.name || "").toLowerCase().includes(q) ||
                    getLocationDisplay(c).toLowerCase().includes(q) ||
                    getAddressDisplay(c).toLowerCase().includes(q)
            );
        }
        if (sortOption === "Customer Name") {
            list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        } else if (sortOption === "Location") {
            list.sort((a, b) =>
                getLocationDisplay(a).localeCompare(getLocationDisplay(b))
            );
        }
        return list;
    }, [customers, search, sortOption]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <UserHeader />
            <main className="mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Customers
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setUploadModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Add Ledger Data
                        </button>
                        <button
                            type="button"
                            onClick={() => setAddFollowupModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Customer follow-up
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add new customer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Total Customers
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                            {countsLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                counts.totalCustomers
                            )}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Orders
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                            {countsLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                counts.orderCount
                            )}
                        </p>
                    </div>
                </div>

                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search by customer, location, or address..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                    />
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm min-w-[200px]"
                    >
                        <option value="">Select a sort option</option>
                        <option value="Customer Name">Customer Name</option>
                        <option value="Location">Location</option>
                    </select>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Customer
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Locations
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Address
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                            >
                                                {customerError ? (
                                                    <span>{customerError}</span>
                                                ) : (
                                                    <>
                                                        No customers found.
                                                        {customers.length === 0 && (
                                                            <> Use &quot;Add new customer&quot; above to create one.</>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((customer) => (
                                            <tr
                                                key={customer._id}
                                                onClick={() =>
                                                    navigate(
                                                        `/crm/customer/${customer._id}`
                                                    )
                                                }
                                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    {customer.name || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {getLocationDisplay(customer)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                                                    {getAddressDisplay(customer) || "—"}
                                                </td>
                                                <td
                                                    className="px-4 py-3 text-right"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuickViewCustomerId(customer._id)}
                                                        className="p-1.5 rounded text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="Quick view"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            <CreateCustomerModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => {
                    setCreateModalOpen(false);
                    refreshAll();
                }}
            />
            <UploadLedgerModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onSuccess={() => {
                    setUploadModalOpen(false);
                    refreshAll();
                }}
                customers={customers}
            />
            <CustomerQuickViewModal
                customerId={quickViewCustomerId}
                isOpen={!!quickViewCustomerId}
                onClose={() => setQuickViewCustomerId(null)}
            />
            <AddFollowupModal
                isOpen={addFollowupModalOpen}
                onClose={() => setAddFollowupModalOpen(false)}
                onSuccess={() => {
                    setAddFollowupModalOpen(false);
                    refreshAll();
                }}
            />
        </div>
    );
};

export default CRMDashboard;
