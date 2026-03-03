import React, { useState, useMemo } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import api from "../../../utils/api";

const UploadLedgerModal = ({ isOpen, onClose, onSuccess, customers }) => {
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const filteredCustomers = useMemo(() => {
        const q = (customerSearch || "").toLowerCase().trim();
        if (!q) return customers.slice(0, 20);
        return customers
            .filter((c) => (c.name || "").toLowerCase().includes(q))
            .slice(0, 20);
    }, [customers, customerSearch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const customerId = selectedCustomerId || filteredCustomers[0]?._id;
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
                setCustomerSearch("");
                setSelectedCustomerId("");
                setFile(null);
                onSuccess();
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Customer Name
                        </label>
                        <input
                            type="text"
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                if (!e.target.value)
                                    setSelectedCustomerId("");
                            }}
                            placeholder="Type to search customers..."
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                        />
                        {filteredCustomers.length > 0 && (
                            <ul className="mt-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                                {filteredCustomers.map((c) => (
                                    <li key={c._id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomerId(c._id);
                                                setCustomerSearch(c.name || "");
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                selectedCustomerId === c._id
                                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                    : "text-gray-900 dark:text-white"
                                            }`}
                                        >
                                            {c.name || "—"}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
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
