import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import api from "../../../utils/api";

const UploadLedgerModal = ({ isOpen, onClose, onSuccess, customers }) => {
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const [activeCustomerIndex, setActiveCustomerIndex] = useState(-1);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [successResult, setSuccessResult] = useState(null);
    const customerBoxRef = useRef(null);

    const filteredCustomers = useMemo(() => {
        const q = (customerSearch || "").toLowerCase().trim();
        if (!q) return customers.slice(0, 20);
        return customers
            .filter((c) => (c.name || "").toLowerCase().includes(q))
            .slice(0, 20);
    }, [customers, customerSearch]);

    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerId) return null;
        return customers.find((c) => c._id === selectedCustomerId) || null;
    }, [customers, selectedCustomerId]);

    useEffect(() => {
        if (!isOpen) return;
        setSuccessResult(null);
        const onPointerDown = (e) => {
            if (!customerBoxRef.current) return;
            if (!customerBoxRef.current.contains(e.target)) {
                setIsCustomerOpen(false);
                setActiveCustomerIndex(-1);
            }
        };
        window.addEventListener("pointerdown", onPointerDown);
        return () => window.removeEventListener("pointerdown", onPointerDown);
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessResult(null);
        const customerId = selectedCustomerId;
        if (!customerId) {
            setError("Please select a customer.");
            return;
        }
        if (!file) {
            setError("Please select an Excel file (.xlsx).");
            return;
        }
        const ext = (file.name || "").toLowerCase();
        if (!ext.endsWith(".xlsx")) {
            setError("Only .xlsx files are accepted.");
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("customer_id", customerId);
            formData.append("file", file);
            const res = await api.post("/crm/ledger-upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data?.status === "success") {
                const data = res.data?.data || {};
                setSuccessResult({
                    rowsAdded: data.rowsAdded ?? 0,
                    rowsSkippedDuplicate: data.rowsSkippedDuplicate ?? 0,
                });
                setCustomerSearch("");
                setSelectedCustomerId("");
                setFile(null);
                onSuccess({ customerId, ...data });
            } else {
                setError(
                    res.data?.message ||
                        res.data?.details ||
                        "Upload failed"
                );
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.details ||
                err.message ||
                "Upload failed";
            setError(typeof msg === "string" ? msg : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Upload Ledger Data
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}
                    {successResult != null && (
                        <p className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                            Ledger uploaded successfully. Rows added: {successResult.rowsAdded}, duplicates skipped: {successResult.rowsSkippedDuplicate}.
                        </p>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Customer Name
                        </label>
                        <div ref={customerBoxRef} className="relative">
                            <input
                                type="text"
                                value={customerSearch}
                                onFocus={() => {
                                    setIsCustomerOpen(true);
                                    setActiveCustomerIndex(
                                        filteredCustomers.length ? 0 : -1
                                    );
                                }}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setCustomerSearch(next);
                                    setIsCustomerOpen(true);
                                    setSelectedCustomerId("");
                                    setActiveCustomerIndex(0);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        setIsCustomerOpen(false);
                                        setActiveCustomerIndex(-1);
                                        return;
                                    }
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        setIsCustomerOpen(true);
                                        setActiveCustomerIndex((i) => {
                                            const next = Math.min(
                                                (i < 0 ? -1 : i) + 1,
                                                filteredCustomers.length - 1
                                            );
                                            return Number.isFinite(next)
                                                ? next
                                                : -1;
                                        });
                                        return;
                                    }
                                    if (e.key === "ArrowUp") {
                                        e.preventDefault();
                                        setIsCustomerOpen(true);
                                        setActiveCustomerIndex((i) =>
                                            Math.max(i - 1, 0)
                                        );
                                        return;
                                    }
                                    if (e.key === "Enter") {
                                        if (!isCustomerOpen) return;
                                        e.preventDefault();
                                        const picked =
                                            filteredCustomers[
                                                activeCustomerIndex
                                            ] || null;
                                        if (!picked) return;
                                        setSelectedCustomerId(picked._id);
                                        setCustomerSearch(picked.name || "");
                                        setIsCustomerOpen(false);
                                        setActiveCustomerIndex(-1);
                                    }
                                }}
                                placeholder="Search and select a customer…"
                                aria-label="Customer"
                                role="combobox"
                                aria-expanded={isCustomerOpen}
                                aria-controls="customer-listbox"
                                aria-autocomplete="list"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            />
                            {!!selectedCustomerId && selectedCustomer && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Selected: {selectedCustomer.name || "—"}
                                </p>
                            )}

                            {isCustomerOpen && (
                                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                                    {filteredCustomers.length > 0 ? (
                                        <ul
                                            id="customer-listbox"
                                            role="listbox"
                                            className="max-h-44 overflow-y-auto"
                                        >
                                            {filteredCustomers.map((c, idx) => {
                                                const isActive =
                                                    idx ===
                                                    activeCustomerIndex;
                                                const isSelected =
                                                    selectedCustomerId === c._id;
                                                return (
                                                    <li key={c._id}>
                                                        <button
                                                            type="button"
                                                            role="option"
                                                            aria-selected={
                                                                isSelected
                                                            }
                                                            onMouseEnter={() =>
                                                                setActiveCustomerIndex(
                                                                    idx
                                                                )
                                                            }
                                                            onClick={() => {
                                                                setSelectedCustomerId(
                                                                    c._id
                                                                );
                                                                setCustomerSearch(
                                                                    c.name ||
                                                                        ""
                                                                );
                                                                setIsCustomerOpen(
                                                                    false
                                                                );
                                                                setActiveCustomerIndex(
                                                                    -1
                                                                );
                                                            }}
                                                            className={`w-full text-left px-3 py-2 text-sm ${
                                                                isActive
                                                                    ? "bg-gray-100 dark:bg-gray-700"
                                                                    : ""
                                                            } ${
                                                                isSelected
                                                                    ? "text-blue-700 dark:text-blue-300"
                                                                    : "text-gray-900 dark:text-white"
                                                            }`}
                                                        >
                                                            {c.name || "—"}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                                            No matching customers.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            File
                        </label>
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                            }
                            className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Select an Excel file (.xlsx only)
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadLedgerModal;
