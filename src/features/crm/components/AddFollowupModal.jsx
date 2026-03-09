import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import api from "../../../utils/api";
import ContactedPersonPicker from "./ContactedPersonPicker";

const PURPOSE_OPTIONS = [
    "Regular visit",
    "Payment follow-up",
    "New Introduction",
    "Trouble shooting",
    "Technical support",
    "Urgent Delivery",
];

const CONNECTION_OPTIONS = ["In-Person", "Call"];

const AddFollowupModal = ({
    isOpen,
    onClose,
    onSuccess,
    prefilledCustomerId = null,
    prefilledCustomerName = "",
}) => {
    const [serialNo, setSerialNo] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerId, setCustomerId] = useState(null);
    const [purpose, setPurpose] = useState("");
    const [connectionType, setConnectionType] = useState("");
    const [comment, setComment] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [branchUsers, setBranchUsers] = useState([]);
    const [loadingSerial, setLoadingSerial] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const debounceRef = useRef(null);
    const suggestionsRef = useRef(null);

    const fetchNextSerial = useCallback(async () => {
        setLoadingSerial(true);
        setError("");
        try {
            const res = await api.get("/crm/followup-logs/next-serial");
            if (res.data?.status === "success" && res.data?.data?.serial_no) {
                setSerialNo(res.data.data.serial_no);
            } else {
                setError("Could not load serial number.");
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.details ||
                err.message ||
                "Failed to load serial number";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setLoadingSerial(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const load = async () => {
            try {
                const res = await api.get("/crm/branch-users/me");
                if (res.data?.status === "success" && Array.isArray(res.data?.data?.users)) {
                    setBranchUsers(res.data.data.users);
                } else {
                    setBranchUsers([]);
                }
            } catch {
                setBranchUsers([]);
            }
        };
        load();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setError("");
        setValidationErrors({});
        setSerialNo("");
        setComment("");
        setContactPerson("");
        setSuggestions([]);
        setCustomerName(prefilledCustomerName || "");
        setCustomerId(prefilledCustomerId || null);
        setPurpose("");
        setConnectionType("");
        if (prefilledCustomerId && prefilledCustomerName) {
            setCustomerName(prefilledCustomerName);
            setCustomerId(prefilledCustomerId);
        }
        fetchNextSerial();
    }, [isOpen, prefilledCustomerId, prefilledCustomerName, fetchNextSerial]);

    useEffect(() => {
        if (!isOpen || !customerName.trim() || customerId) {
            setSuggestions([]);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get("/customers", {
                    params: { search: customerName.trim(), limit: 20, page: 1 },
                });
                const data = res.data?.data;
                const list = Array.isArray(data?.customers) ? data.customers : [];
                setSuggestions(list);
            } catch {
                setSuggestions([]);
            }
            debounceRef.current = null;
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [isOpen, customerName, customerId]);

    const handleSelectCustomer = (customer) => {
        setCustomerId(customer._id);
        setCustomerName(customer.name || "");
        setSuggestions([]);
    };

    const getContactPersonDisplay = (val) => {
        if (!val || val === "Me") return val || "";
        const u = branchUsers.find((x) => String(x._id) === String(val));
        return u ? [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.email || "" : "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const errs = {};
        if (!customerId && !(customerName || "").trim()) {
            errs.customer = "Customer is required.";
        }
        if (!purpose) errs.purpose = "Purpose is required.";
        if (!connectionType) errs.connectionType = "Connected through is required.";
        setValidationErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        try {
            const payload = {
                serial_no: serialNo,
                purpose: purpose.trim(),
                connection_type: connectionType,
                comment: (comment || "").trim(),
                contact_person: contactPerson === "Me" ? "Me" : getContactPersonDisplay(contactPerson) || "",
            };
            if (customerId) {
                payload.customer_id = customerId;
            } else {
                payload.customer_name = customerName.trim();
            }
            const res = await api.post("/crm/followup-logs", payload);
            if (res.data?.status === "success") {
                onSuccess();
                onClose();
            } else {
                setError(
                    res.data?.message ||
                        res.data?.details ||
                        "Failed to create follow-up log"
                );
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.details ||
                err.message ||
                "Failed to create follow-up log";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Add Customer follow-up
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
                            Serial number
                        </label>
                        <input
                            type="text"
                            value={serialNo}
                            readOnly
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 text-sm"
                        />
                        {loadingSerial && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                            </span>
                        )}
                    </div>

                    <div className="relative" ref={suggestionsRef}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Customer name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => {
                                setCustomerName(e.target.value);
                                setCustomerId(null);
                            }}
                            placeholder="Type to search..."
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            disabled={!!prefilledCustomerId}
                        />
                        {validationErrors.customer && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                {validationErrors.customer}
                            </p>
                        )}
                        {suggestions.length > 0 && !prefilledCustomerId && (
                            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.map((c) => (
                                    <li key={c._id}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectCustomer(c)}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
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
                            Purpose <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                        >
                            <option value="">Select purpose…</option>
                            {PURPOSE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        {validationErrors.purpose && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                {validationErrors.purpose}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Connected through <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                            {CONNECTION_OPTIONS.map((opt) => (
                                <label
                                    key={opt}
                                    className="inline-flex items-center gap-2 cursor-pointer"
                                >
                                    <input
                                        type="radio"
                                        name="connectionType"
                                        value={opt}
                                        checked={connectionType === opt}
                                        onChange={() => setConnectionType(opt)}
                                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {opt}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {validationErrors.connectionType && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                {validationErrors.connectionType}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Comments
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <ContactedPersonPicker
                            users={branchUsers}
                            value={contactPerson}
                            onChange={setContactPerson}
                            placeholder="Search and select person…"
                            label="Contacted person"
                        />
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
                            disabled={saving || loadingSerial}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AddFollowupModal;
