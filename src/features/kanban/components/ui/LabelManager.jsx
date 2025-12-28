/**
 * Label Manager Component
 * Allows users to create, edit, and delete custom labels
 */

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, X, Save } from "lucide-react";
import { useKanban } from "../../contexts/KanbanContext";
import { useAuth } from "../../../../contexts/AuthContext";
import toast from "react-hot-toast";
import { LoadingOverlay } from "../../../../components";

const LabelManager = ({ isOpen, onClose, onLabelSelect }) => {
    const {
        labels,
        createLabel,
        updateLabel,
        deleteLabel,
        fetchLabelsByBranch,
    } = useKanban();
    const { user } = useAuth();
    const [branchId, setBranchId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingLabel, setEditingLabel] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingLabelId, setDeletingLabelId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        color: "#3b82f6",
        description: "",
    });

    // Get branch ID from user
    useEffect(() => {
        if (user?.branches && user.branches.length > 0) {
            const firstBranch = user.branches[0];
            const branchIdStr =
                typeof firstBranch === "string"
                    ? firstBranch
                    : firstBranch?._id || firstBranch?.id || firstBranch;
            setBranchId(branchIdStr);

            // Fetch labels for this branch
            if (isOpen && branchIdStr && fetchLabelsByBranch) {
                fetchLabelsByBranch(branchIdStr).catch(() => {
                    // Failed to fetch labels
                });
            }
        }
    }, [user, isOpen, fetchLabelsByBranch]);

    const handleCreateLabel = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Label name is required");
            return;
        }

        if (!branchId) {
            toast.error("Branch ID is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createLabel({
                name: formData.name.trim(),
                color: formData.color,
                description: formData.description.trim(),
                branch_id: branchId,
            });

            if (result && result.status === "success") {
                setFormData({ name: "", color: "#3b82f6", description: "" });
                setIsCreating(false);
                toast.success("Label created successfully");
                // Refresh labels
                if (branchId) {
                    await fetchLabelsByBranch(branchId);
                }
            } else {
                throw new Error(result?.message || "Failed to create label");
            }
        } catch (error) {
            // Extract error message - prioritize details array, then message, then default
            let errorMessage = "Failed to create label";
            if (
                error.details &&
                Array.isArray(error.details) &&
                error.details.length > 0
            ) {
                errorMessage = error.details[0];
            } else if (error.details && typeof error.details === "string") {
                errorMessage = error.details;
            } else if (error.response?.data?.details) {
                if (
                    Array.isArray(error.response.data.details) &&
                    error.response.data.details.length > 0
                ) {
                    errorMessage = error.response.data.details[0];
                } else if (typeof error.response.data.details === "string") {
                    errorMessage = error.response.data.details;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateLabel = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Label name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const labelId = editingLabel.id || editingLabel._id;
            await updateLabel(labelId, {
                name: formData.name.trim(),
                color: formData.color,
                description: formData.description.trim(),
            });

            setFormData({ name: "", color: "#3b82f6", description: "" });
            setEditingLabel(null);
            toast.success("Label updated successfully");
            // Refresh labels
            if (branchId) {
                fetchLabelsByBranch(branchId);
            }
        } catch (error) {
            toast.error("Failed to update label");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLabel = async (labelId) => {
        if (!confirm("Are you sure you want to delete this label?")) {
            return;
        }

        setDeletingLabelId(labelId);
        try {
            await deleteLabel(labelId);
            toast.success("Label deleted successfully");
            // Refresh labels
            if (branchId) {
                fetchLabelsByBranch(branchId);
            }
        } catch (error) {
            toast.error("Failed to delete label");
        } finally {
            setDeletingLabelId(null);
        }
    };

    const startEditing = (label) => {
        setEditingLabel(label);
        setFormData({
            name: label.name,
            color: label.color,
            description: label.description || "",
        });
    };

    const cancelEditing = () => {
        setEditingLabel(null);
        setFormData({ name: "", color: "#3b82f6", description: "" });
    };

    const handleLabelClick = (label) => {
        if (onLabelSelect) {
            onLabelSelect(label);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Loading Overlay for form submission */}
            <LoadingOverlay
                isLoading={isSubmitting}
                message="Saving label..."
            />

            <div
                className="fixed inset-0 bg-gradient-to-br from-neutral-900/90 via-gray-900/80 to-neutral-800/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 overflow-hidden"
                onClick={onClose}
            >
                <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Manage Labels
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Create New Label */}
                        {!isCreating && !editingLabel && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center space-x-2 transition-colors"
                            >
                                <Plus size={16} />
                                <span>Create New Label</span>
                            </button>
                        )}

                        {/* Create/Edit Form */}
                        {(isCreating || editingLabel) && (
                            <form
                                onSubmit={
                                    editingLabel
                                        ? handleUpdateLabel
                                        : handleCreateLabel
                                }
                                className="space-y-4 mb-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Label Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter label name"
                                        maxLength={50}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Color
                                    </label>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                color: e.target.value,
                                            }))
                                        }
                                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Enter label description"
                                        maxLength={200}
                                        rows={2}
                                    />
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center space-x-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        <span>
                                            {editingLabel ? "Update" : "Create"}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={
                                            editingLabel
                                                ? cancelEditing
                                                : () => setIsCreating(false)
                                        }
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Labels List */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Existing Labels
                            </h3>
                            {labels.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No labels created yet
                                </p>
                            ) : (
                                labels.map((label) => {
                                    const labelId = label.id || label._id;
                                    return (
                                        <div
                                            key={labelId}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            onClick={() =>
                                                handleLabelClick(label)
                                            }
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            label.color,
                                                    }}
                                                />
                                                <span className="text-gray-900 dark:text-white font-medium">
                                                    {label.name}
                                                </span>
                                            </div>
                                            <div
                                                className="flex space-x-2"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    onClick={() =>
                                                        startEditing(label)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    title="Edit label"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteLabel(
                                                            labelId,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingLabelId ===
                                                        labelId
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete label"
                                                >
                                                    {deletingLabelId ===
                                                    labelId ? (
                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LabelManager;
