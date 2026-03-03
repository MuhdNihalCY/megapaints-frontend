import React, { useState } from "react";
import { X } from "lucide-react";
import api from "../../../utils/api";

const CreateCustomerModal = ({ isOpen, onClose, onSuccess }) => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        name: "",
        address_text: "",
        location: "",
        sales_ex_display: "",
        coordinator_display: "",
        contacts: [{ name: "", phone: "", whatsapp: "" }],
    });

    const updateContact = (index, field, value) => {
        const next = [...(form.contacts || [])];
        if (!next[index]) next[index] = { name: "", phone: "", whatsapp: "" };
        next[index] = { ...next[index], [field]: value };
        setForm({ ...form, contacts: next });
    };

    const addContact = () => {
        setForm({
            ...form,
            contacts: [
                ...(form.contacts || []),
                { name: "", phone: "", whatsapp: "" },
            ],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!(form.name || "").trim()) {
            setError("Customer name is required.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                address_text: form.address_text || undefined,
                location: form.location || undefined,
                sales_ex_display: form.sales_ex_display || undefined,
                coordinator_display: form.coordinator_display || undefined,
                contacts: (form.contacts || [])
                    .filter((c) => (c.name || c.phone || c.whatsapp || "").toString().trim())
                    .map((c) => ({
                        name: (c.name || "").trim() || undefined,
                        phone: (c.phone || "").trim() || undefined,
                        whatsapp: (c.whatsapp || "").trim() || undefined,
                    })),
            };
            const res = await api.post("/customers", payload);
            if (res.data?.status === "success") {
                setForm({
                    name: "",
                    address_text: "",
                    location: "",
                    sales_ex_display: "",
                    coordinator_display: "",
                    contacts: [{ name: "", phone: "", whatsapp: "" }],
                });
                onSuccess();
            } else {
                setError(
                    res.data?.message ||
                        res.data?.details ||
                        "Failed to create customer"
                );
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.details ||
                err.message ||
                "Failed to create customer";
            setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
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
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Create Customer
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
                            Customer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Address
                        </label>
                        <textarea
                            value={form.address_text}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    address_text: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Location
                        </label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) =>
                                setForm({ ...form, location: e.target.value })
                            }
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Sales Ex.
                            </label>
                            <input
                                type="text"
                                value={form.sales_ex_display}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        sales_ex_display: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Co-ordinator
                            </label>
                            <input
                                type="text"
                                value={form.coordinator_display}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        coordinator_display: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Contact Person
                            </span>
                            <button
                                type="button"
                                onClick={addContact}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Add more contact
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(form.contacts || []).map((contact, index) => (
                                <div
                                    key={index}
                                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2"
                                >
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={contact.name || ""}
                                        onChange={(e) =>
                                            updateContact(
                                                index,
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Phone (country code + number)"
                                        value={contact.phone || ""}
                                        onChange={(e) =>
                                            updateContact(
                                                index,
                                                "phone",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="WhatsApp (country code + number)"
                                        value={contact.whatsapp || ""}
                                        onChange={(e) =>
                                            updateContact(
                                                index,
                                                "whatsapp",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm"
                                    />
                                </div>
                            ))}
                        </div>
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
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCustomerModal;
