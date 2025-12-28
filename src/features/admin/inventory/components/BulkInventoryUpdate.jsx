import { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    X,
    Upload,
    Loader2,
    CheckCircle,
    AlertCircle,
    Building2,
    Package,
    Filter,
    Plus,
    Trash2,
} from "lucide-react";

const BulkInventoryUpdate = ({ onClose, onSuccess, inline = false }) => {
    const { getAdminServices } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [branches, setBranches] = useState([]);
    const [products, setProducts] = useState([]);
    const [updates, setUpdates] = useState([
        {
            branch_id: "",
            product_id: "",
            product_type: "",
            operation: "add",
            quantity: 0,
        },
    ]);

    useEffect(() => {
        fetchBranches();
        fetchProducts();
    }, []);

    const fetchBranches = async () => {
        try {
            const adminServices = getAdminServices();
            const response = await adminServices.businessManagement.getBranches(
                { limit: 100 },
            );
            if (response.status === "success") {
                setBranches(response.data.branches || []);
            }
        } catch (err) {
            console.error("Failed to fetch branches:", err);
        }
    };

    const fetchProducts = async () => {
        try {
            const adminServices = getAdminServices();
            const response = await adminServices.productCatalog.getAllItems({
                limit: 1000,
                page: 1,
            });
            if (response.status === "success") {
                setProducts(response.data.items || []);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    };

    const getFilteredProducts = (productType) => {
        if (!productType) return products;
        return products.filter((p) => p.item_type === productType);
    };

    const handleAddRow = () => {
        setUpdates([
            ...updates,
            {
                branch_id: "",
                product_id: "",
                product_type: "",
                operation: "add",
                quantity: 0,
            },
        ]);
    };

    const handleRemoveRow = (index) => {
        if (updates.length > 1) {
            setUpdates(updates.filter((_, i) => i !== index));
        }
    };

    const handleUpdateChange = (index, field, value) => {
        const newUpdates = [...updates];
        newUpdates[index][field] = value;

        // Clear product selection when product type changes
        if (field === "product_type") {
            newUpdates[index].product_id = "";
        }

        setUpdates(newUpdates);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all rows
        const invalidRows = updates.filter(
            (update) =>
                !update.branch_id || !update.product_id || update.quantity <= 0,
        );

        if (invalidRows.length > 0) {
            setError(
                "Please fill all required fields (Branch, Product, and Quantity > 0) for all rows",
            );
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const adminServices = getAdminServices();

            // Format updates for API
            const formattedUpdates = updates.map((update) => ({
                branch_id: update.branch_id,
                product_id: update.product_id,
                operation: update.operation,
                quantity: parseFloat(update.quantity) || 0,
            }));

            const response =
                await adminServices.inventoryManagement.bulkUpdateInventory(
                    formattedUpdates,
                );

            if (response.status === "success") {
                setSuccess(
                    `Bulk update completed: ${response.data.summary.success} successful, ${response.data.summary.failed} failed`,
                );
                setTimeout(() => {
                    onSuccess && onSuccess();
                    if (!inline && onClose) {
                        onClose();
                    }
                }, 2000);
            } else {
                setError(response.message || "Failed to bulk update inventory");
            }
        } catch (err) {
            console.error("Bulk update failed:", err);
            setError(err.message || "Bulk update failed");
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <>
            {inline && (
                <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Bulk Stock Update
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Update multiple inventory items at once with bulk
                        operations
                    </p>
                </div>
            )}

            <div
                className={`${inline ? "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" : ""}`}
            >
                <div
                    className={`${inline ? "p-6" : "flex-1 overflow-y-auto p-6"}`}
                >
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
                            <p className="text-red-700 dark:text-red-400 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {error}
                            </p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
                            <p className="text-green-700 dark:text-green-400 flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                {success}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Instructions */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Instructions:</strong> Select branch and
                                product for each row, choose operation
                                (Add/Deduct/Update), and enter quantity. You can
                                add multiple rows to update multiple inventory
                                items at once.
                            </p>
                        </div>

                        {/* Table Header */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Branch *
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Product Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Product *
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Operation
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Quantity *
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {updates.map((update, index) => {
                                        const filteredProducts =
                                            getFilteredProducts(
                                                update.product_type,
                                            );
                                        return (
                                            <tr
                                                key={index}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={update.branch_id}
                                                        onChange={(e) =>
                                                            handleUpdateChange(
                                                                index,
                                                                "branch_id",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                                        required
                                                    >
                                                        <option
                                                            key="select-branch"
                                                            value=""
                                                        >
                                                            Select Branch
                                                        </option>
                                                        {branches.map(
                                                            (branch, idx) => (
                                                                <option
                                                                    key={
                                                                        branch._id ||
                                                                        branch.id ||
                                                                        `branch-${idx}`
                                                                    }
                                                                    value={
                                                                        branch._id ||
                                                                        branch.id ||
                                                                        ""
                                                                    }
                                                                >
                                                                    {
                                                                        branch.name
                                                                    }{" "}
                                                                    (
                                                                    {
                                                                        branch.code
                                                                    }
                                                                    )
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={
                                                            update.product_type
                                                        }
                                                        onChange={(e) =>
                                                            handleUpdateChange(
                                                                index,
                                                                "product_type",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                                    >
                                                        <option
                                                            key="all"
                                                            value=""
                                                        >
                                                            All Types
                                                        </option>
                                                        <option
                                                            key="tinters"
                                                            value="tinters"
                                                        >
                                                            Tinters
                                                        </option>
                                                        <option
                                                            key="additive"
                                                            value="additive"
                                                        >
                                                            Additive
                                                        </option>
                                                        <option
                                                            key="binder"
                                                            value="binder"
                                                        >
                                                            Binder
                                                        </option>
                                                        <option
                                                            key="auxiliary"
                                                            value="auxiliary"
                                                        >
                                                            Auxiliary
                                                        </option>
                                                        <option
                                                            key="accessory"
                                                            value="accessory"
                                                        >
                                                            Accessory
                                                        </option>
                                                        <option
                                                            key="third_party"
                                                            value="third_party"
                                                        >
                                                            Third Party
                                                        </option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={
                                                            update.product_id
                                                        }
                                                        onChange={(e) =>
                                                            handleUpdateChange(
                                                                index,
                                                                "product_id",
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            filteredProducts.length ===
                                                            0
                                                        }
                                                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm ${
                                                            filteredProducts.length ===
                                                            0
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
                                                        }`}
                                                        required
                                                    >
                                                        <option
                                                            key="select-product"
                                                            value=""
                                                        >
                                                            {filteredProducts.length ===
                                                            0
                                                                ? update.product_type
                                                                    ? "No products found"
                                                                    : "Select type first"
                                                                : "Select Product"}
                                                        </option>
                                                        {filteredProducts.map(
                                                            (
                                                                product,
                                                                index,
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        product._id ||
                                                                        `product-${index}`
                                                                    }
                                                                    value={
                                                                        product._id
                                                                    }
                                                                >
                                                                    {
                                                                        product.name
                                                                    }{" "}
                                                                    {product.code
                                                                        ? `(${product.code})`
                                                                        : ""}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={update.operation}
                                                        onChange={(e) =>
                                                            handleUpdateChange(
                                                                index,
                                                                "operation",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                                    >
                                                        <option
                                                            key="add"
                                                            value="add"
                                                        >
                                                            Add
                                                        </option>
                                                        <option
                                                            key="deduct"
                                                            value="deduct"
                                                        >
                                                            Deduct
                                                        </option>
                                                        <option
                                                            key="update"
                                                            value="update"
                                                        >
                                                            Update
                                                        </option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={update.quantity}
                                                        onChange={(e) =>
                                                            handleUpdateChange(
                                                                index,
                                                                "quantity",
                                                                parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                            )
                                                        }
                                                        step="0.001"
                                                        min="0"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveRow(
                                                                index,
                                                            )
                                                        }
                                                        disabled={
                                                            updates.length === 1
                                                        }
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            updates.length === 1
                                                                ? "text-gray-400 cursor-not-allowed"
                                                                : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        }`}
                                                        title="Remove row"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Row Button */}
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center font-medium"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Row
                        </button>

                        {/* Form Actions */}
                        <div
                            className={`flex ${inline ? "justify-end" : "justify-end"} space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700`}
                        >
                            {!inline && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center font-medium"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Update Inventory
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );

    if (inline) {
        return <div className="space-y-6">{content}</div>;
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Bulk Inventory Update
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {content}
            </div>
        </div>
    );
};

export default BulkInventoryUpdate;
