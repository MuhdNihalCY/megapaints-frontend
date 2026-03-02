import api from "../../utils/api";

async function getAll(
    endpoint,
    {
        page = 1,
        limit = 1000,
        sortBy = "name",
        sortOrder = "asc",
        search = "",
    } = {},
    params = {} 
) {
    const queryParams = { page, limit, sortBy, sortOrder, search, ...params };
    const res = await api.get(`/v1/${endpoint}`, {
        params: queryParams,
    });
    return res.data;
}

export const FormulaService = {
    async fetchMasters() {
        // Fetch all master data in parallel using unified endpoint
        const [cat, sub, prod, add] = await Promise.all([
            getAll("category").catch(() => ({
                success: false,
                categories: [],
            })),
            getAll("subcategory").catch(() => ({
                success: false,
                subcategories: [],
            })),
            // Fetch default products (tinters)
            getAll("product").catch(() => ({ success: false, products: [] })),
            // Fetch additives using unified endpoint with product_type
            getAll("product", { product_type: 'additive' }).catch(() => ({ success: false, products: [] })),
        ]);

        const categories = Array.isArray(cat?.categories) ? cat.categories : [];
        const subcategories = Array.isArray(sub?.subcategories)
            ? sub.subcategories
            : [];
        const products = Array.isArray(prod?.products) ? prod.products : [];
        // Additives are now returned in 'products' array from unified endpoint
        const additives = Array.isArray(add?.products) ? add.products : [];

        const categoryNames = categories
            .map((c) => c?.name || c?.Category_Name || c?.Category || c?._id)
            .filter(Boolean);
        const subcategoryNames = subcategories
            .map(
                (s) =>
                    s?.name || s?.Subcategory_Name || s?.SubCategory || s?._id,
            )
            .filter(Boolean);

        return {
            status: true,
            categories: categoryNames,
            subCategoriesByCategory: {},
            defaultCategory: categoryNames[0],
            defaultSubCategory: subcategoryNames[0],
            glossDefault: 0,
            defaultTints: [],
            defaultBinders: [],
            defaultAdditives: [],
            defaultRemarks: "",
            metaDefaults: {},
            products,
            additives,
        };
    },

    async fetchFormulaById(formulaId) {
        const res = await api.get(
            `/user/formulas/${encodeURIComponent(formulaId)}`,
        );
        return res.data;
    },

    async fetchAllFormulas(params = {}) {
        const res = await api.get("/user/formulas", {
            params: {
                page: 1,
                limit: 50,
                sortBy: "updatedAt",
                sortOrder: "desc",
                search: "",
                ...params,
            },
        });
        return res.data;
    },

    /**
     * Create formula. If file is provided, sends multipart (payload + file) in one request.
     * File is only sent when saving, not when selecting.
     */
    async createFormula(payload, file = null) {
        if (file) {
            const form = new FormData();
            form.append("formula", JSON.stringify(payload));
            form.append("file", file);
            const res = await api.post("/user/formulas", form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data;
        }
        const res = await api.post("/user/formulas", payload);
        return res.data;
    },

    async updateFormula(formulaId, payload, file = null) {
        if (file) {
            const form = new FormData();
            form.append("formula", JSON.stringify(payload));
            form.append("file", file);
            const res = await api.put(
                `/user/formulas/${encodeURIComponent(formulaId)}`,
                form,
                { headers: { "Content-Type": "multipart/form-data" } },
            );
            return res.data;
        }
        const res = await api.put(
            `/user/formulas/${encodeURIComponent(formulaId)}`,
            payload,
        );
        return res.data;
    },

    async deleteFormula(formulaId) {
        const res = await api.delete(
            `/user/formulas/${encodeURIComponent(formulaId)}`,
        );
        return res.data;
    },

};

export default FormulaService;
