import api from './api';

// Centralized service for formula-related endpoints.
// All methods return the response payload (res.data).

export const FormulaService = {
  // Fetch dropdown/static master data required by Create Formula screen
  async fetchMasters() {
    // Expected shape (flexible):
    // {
    //   status,
    //   categories,
    //   subCategoriesByCategory,
    //   glossDefault,
    //   defaultBinders,
    //   defaultAdditives,
    //   defaultTints,
    //   metaDefaults
    // }
    const res = await api.get('/formula/masters');
    return res.data;
  },

  // Fetch an existing formula by id
  async fetchFormulaById(formulaId) {
    const res = await api.get(`/formula/${encodeURIComponent(formulaId)}`);
    return res.data;
  },

  // Create a new formula
  async createFormula(payload) {
    const res = await api.post('/formula', payload);
    return res.data;
  },

  // Update existing formula
  async updateFormula(formulaId, payload) {
    const res = await api.put(`/formula/${encodeURIComponent(formulaId)}`, payload);
    return res.data;
  },

  // Upload attachment for a formula; returns { url, id, ... }
  async uploadAttachment(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/formula/attachments', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default FormulaService;
