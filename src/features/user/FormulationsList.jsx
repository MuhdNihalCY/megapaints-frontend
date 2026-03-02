import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import FormulaService from "../../formula/services/formulaService";
import { FileText, Edit, Trash2, Plus, Loader2 } from "lucide-react";

const FormulationsList = () => {
    const navigate = useNavigate();
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchFormulas = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await FormulaService.fetchAllFormulas();
            const list = res?.data ?? res?.formulas ?? [];
            setFormulas(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Fetch formulations error:", e);
            setError(e?.response?.data?.message || e?.message || "Failed to load formulas");
            setFormulas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFormulas();
    }, []);

    const handleEdit = (id) => {
        navigate(`/create-formula/${id}`);
    };

    const handleDeleteClick = (id, fileNo) => {
        setDeleteConfirm({ id, fileNo });
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        const { id } = deleteConfirm;
        setDeletingId(id);
        try {
            await FormulaService.deleteFormula(id);
            setDeleteConfirm(null);
            await fetchFormulas();
        } catch (e) {
            console.error("Delete formula error:", e);
            setError(e?.response?.data?.message || e?.message || "Failed to delete formula");
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (d) => {
        if (!d) return "—";
        const date = new Date(d);
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Formulas
                    </h1>
                    <button
                        type="button"
                        onClick={() => navigate("/create-formula")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Formula
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : formulas.length === 0 ? (
                        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No formulas yet.</p>
                            <button
                                type="button"
                                onClick={() => navigate("/create-formula")}
                                className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Create your first formula
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            File No
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Updated
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {formulas.map((f) => (
                                        <tr
                                            key={f._id || f.id}
                                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
                                                {f.file_no ?? f.FileNo ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                {f.name ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {f.code ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {f.category ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(f.updatedAt ?? f.updated_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(f._id || f.id)}
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteClick(
                                                            f._id || f.id,
                                                            f.file_no ?? f.FileNo,
                                                        )
                                                    }
                                                    disabled={deletingId === (f._id || f.id)}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingId === (f._id || f.id) ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <p className="text-gray-700 dark:text-gray-300">
                            Delete formula <strong>{deleteConfirm.fileNo}</strong>? This will deactivate it; existing orders are unaffected.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleDeleteCancel}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormulationsList;
