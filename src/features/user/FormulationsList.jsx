import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import FormulaService from "../../formula/services/formulaService";
import { FileText, Edit, Trash2, Plus, Loader2, ArrowUpDown } from "lucide-react";
import { fetchMastersFresh } from "../../formula/services/mastersService";

const FormulationsList = () => {
    const navigate = useNavigate();
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [masters, setMasters] = useState(null);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState({ key: "updatedAt", dir: "desc" });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 1)));

    const fetchFormulas = async () => {
        setLoading(true);
        setError("");
        try {
            const sortByMap = {
                fileNo: "FileNo",
                customerName: "CustomerName",
                colorName: "ColorName",
                colorCode: "ColorCode",
                category: "Category",
                subCategory: "SubCategory",
                gloss: "Gloss",
                updatedAt: "updatedAt",
            };
            const [res, m] = await Promise.all([
                FormulaService.fetchAllFormulas({
                    page,
                    limit,
                    sortBy: sortByMap[sort.key] || "updatedAt",
                    sortOrder: sort.dir,
                    search,
                }),
                fetchMastersFresh().catch(() => null),
            ]);
            const list = res?.data ?? res?.formulas ?? [];
            setFormulas(Array.isArray(list) ? list : []);
            setTotal(Number(res?.total ?? list?.length ?? 0));
            setMasters(m && m.status ? m : null);
        } catch (e) {
            console.error("Fetch formulations error:", e);
            setError(e?.response?.data?.message || e?.message || "Failed to load formulas");
            setFormulas([]);
            setMasters(null);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFormulas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, sort.key, sort.dir, search]);

    const handleEdit = (id) => {
        navigate(`/edit-formula/${id}`);
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

    const categoryNameById = useState(() => new Map())[0];
    const subCategoryNameById = useState(() => new Map())[0];

    useEffect(() => {
        categoryNameById.clear();
        subCategoryNameById.clear();
        if (!masters) return;

        const cats = Array.isArray(masters.categories) ? masters.categories : [];
        cats.forEach((c) => {
            const id = c?.id != null ? String(c.id) : "";
            const name = c?.name != null ? String(c.name) : "";
            if (id && name) categoryNameById.set(id, name);
        });

        const byCat = masters.subCategoriesByCategory || {};
        Object.values(byCat).forEach((arr) => {
            if (!Array.isArray(arr)) return;
            arr.forEach((s) => {
                const id = s?.id != null ? String(s.id) : (s?._id != null ? String(s._id) : "");
                const name = s?.name != null ? String(s.name) : "";
                if (id && name) subCategoryNameById.set(id, name);
            });
        });
    }, [masters, categoryNameById, subCategoryNameById]);

    const displayCategory = (value) => {
        const v = value != null ? String(value) : "";
        if (!v) return "—";
        // Already human-readable (e.g. "100 - Paints")
        if (v.includes(" - ")) return v;
        return categoryNameById.get(v) || v;
    };

    const displaySubCategory = (value) => {
        const v = value != null ? String(value) : "";
        if (!v) return "—";
        return subCategoryNameById.get(v) || v;
    };

    const rows = useMemo(() => {
        return (Array.isArray(formulas) ? formulas : []).map((f, idx) => {
            const meta = f?.formulation_data?.meta || {};
            const header = f?.formulation_data?.header || {};
            const fileNo = f.file_no ?? f.FileNo ?? "";
            const customerName = f.customer_name ?? meta.customerName ?? meta.customer_name ?? "";
            const colorName = f.color_name ?? meta.colorName ?? meta.color_name ?? "";
            const colorCode = f.color_code ?? meta.colorCode ?? meta.color_code ?? f.code ?? "";
            const category = displayCategory(f.category);
            const subCategory = displaySubCategory(f.subcategory);
            const gloss =
                f.gloss ??
                header.gloss ??
                null;
            const updatedAt = f.updatedAt ?? f.updated_at ?? null;

            return {
                _raw: f,
                _idx: idx,
                id: f._id || f.id,
                fileNo: String(fileNo || ""),
                customerName: String(customerName || ""),
                colorName: String(colorName || ""),
                colorCode: String(colorCode || ""),
                category: String(category || ""),
                subCategory: String(subCategory || ""),
                gloss: gloss == null || gloss === "" ? null : Number(gloss),
                updatedAt: updatedAt ? new Date(updatedAt).getTime() : 0,
            };
        });
        // displayCategory/displaySubCategory depend on masters maps; include masters as dependency via functions
    }, [formulas, masters]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleSort = (key) => {
        setSort((prev) => {
            if (prev.key === key) {
                return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
            }
            return { key, dir: key === "updatedAt" ? "desc" : "asc" };
        });
        setPage(1);
    };

    const SortHeader = ({ label, sortKey, className = "" }) => (
        <button
            type="button"
            onClick={() => toggleSort(sortKey)}
            className={`inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 ${className}`}
            title="Sort"
        >
            <span>{label}</span>
            <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
        </button>
    );

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

                <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="w-full sm:max-w-md">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by File No, customer, color, category, sub-category, gloss..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Rows</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value) || 25);
                                setPage(1);
                            }}
                            className="px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            {[10, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {rows.length} of {total}
                    </div>
                </div>

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
                                            <SortHeader label="File No" sortKey="fileNo" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <SortHeader label="Customer Name" sortKey="customerName" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <SortHeader label="Color Name" sortKey="colorName" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <SortHeader label="Color Code" sortKey="colorCode" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <SortHeader label="Category" sortKey="category" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <SortHeader label="Sub-Category" sortKey="subCategory" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <SortHeader label="Gloss or Matt" sortKey="gloss" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <SortHeader label="Updated" sortKey="updatedAt" />
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {rows.map((r) => {
                                        const f = r._raw;
                                        return (
                                        <tr
                                            key={r.id}
                                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
                                                {r.fileNo || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                {r.customerName || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {r.colorName || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {r.colorCode || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {r.category || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {r.subCategory || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {r.gloss == null || Number.isNaN(r.gloss) ? "—" : String(r.gloss)}
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
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {!loading && totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
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
