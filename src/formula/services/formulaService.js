import api from '../../utils/api';

async function getAll(endpoint, { page = 1, limit = 1000, sortBy = 'name', sortOrder = 'asc', search = '' } = {}) {
  const res = await api.get(`/v1/${endpoint}`, { params: { page, limit, sortBy, sortOrder, search } });
  return res.data;
}

export const FormulaService = {
  async fetchMasters() {
    const [cat, sub, prod, add] = await Promise.all([
      getAll('category').catch(() => ({ success: false, categories: [] })),
      getAll('subcategory').catch(() => ({ success: false, subcategories: [] })),
      getAll('product').catch(() => ({ success: false, products: [] })),
      getAll('additive').catch(() => ({ success: false, additives: [] })),
    ]);

    const categories = Array.isArray(cat?.categories) ? cat.categories : [];
    const subcategories = Array.isArray(sub?.subcategories) ? sub.subcategories : [];
    const products = Array.isArray(prod?.products) ? prod.products : [];
    const additives = Array.isArray(add?.additives) ? add.additives : [];

    const categoryNames = categories.map((c) => c?.name || c?.Category_Name || c?.Category || c?._id).filter(Boolean);
    const subcategoryNames = subcategories.map((s) => s?.name || s?.Subcategory_Name || s?.SubCategory || s?._id).filter(Boolean);

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
      defaultRemarks: '',
      metaDefaults: {},
      products,
      additives,
    };
  },

  async fetchFormulaById(formulaId) {
    const res = await api.get(`/admin/formula/${encodeURIComponent(formulaId)}`);
    return res.data;
  },

  async fetchAllFormulas() {
    const res = await api.get('/v1/formulations/formula', {
      params: { 
        page: 1, 
        limit: 10000,
        sortBy: 'FileNo',
        sortOrder: 'desc'
      }
    });
    return res.data;
  },

  async createFormula(payload) {
    const res = await api.post('/admin/formula', payload);
    return res.data;
  },

  async updateFormula(formulaId, payload) {
    const res = await api.put(`/admin/formula/${encodeURIComponent(formulaId)}`, payload);
    return res.data;
  },

  async uploadAttachment(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/admin/formula/attachments', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
};

export default FormulaService;


