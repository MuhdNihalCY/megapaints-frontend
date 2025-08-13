import api from '../../utils/api';

const CACHE_KEY = 'masters_cache_v3';
const ETAG_KEY = 'masters_cache_etag_v3';

export async function fetchMastersWithCache() {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (_) {}
  let etag = null;
  try { etag = localStorage.getItem(ETAG_KEY) || null; } catch (_) {}

  try {
    const res = await Promise.all([
      api.get('/v1/category', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/subcategory', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/product', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/additive', { params: { page: 1, limit: 1000 } }),
    ]);
    
    const syntheticEtag = `v1:${res[0]?.data?.total || 0}:${res[1]?.data?.total || 0}:${res[2]?.data?.total || 0}:${res[3]?.data?.total || 0}`;
    if (etag && etag === syntheticEtag && cached) {
      console.log('[Masters] cache hit via syntheticEtag; returning cached payload');
      return cached;
    }

    // Extract categories and subcategories from various possible response shapes
    const rawCategories = (Array.isArray(res[0]?.data?.categories) && res[0].data.categories)
      || (Array.isArray(res[0]?.data?.category) && res[0].data.category)
      || (Array.isArray(res[0]?.data?.data) && res[0].data.data)
      || (Array.isArray(res[0]?.data?.items) && res[0].data.items)
      || [];

    const rawSubcategories = (Array.isArray(res[1]?.data?.subcategories) && res[1].data.subcategories)
      || (Array.isArray(res[1]?.data?.Subcategories) && res[1].data.Subcategories)
      || (Array.isArray(res[1]?.data?.data) && res[1].data.data)
      || (Array.isArray(res[1]?.data?.items) && res[1].data.items)
      || [];

    console.log('[Masters] Raw categories:', rawCategories);
    console.log('[Masters] Raw subcategories:', rawSubcategories);

    // Build category mapping by Category_Id
    const categoryIdToName = new Map();
    const categoryNames = [];

    rawCategories.forEach((cat) => {
      const name = cat?.Category || cat?.name || cat?.Category_Name || cat?.label || cat?._id;
      const id = cat?.Category_Id || cat?._id || cat?.id || cat?.CategoryID;
      
      if (name) {
        const categoryName = String(name);
        const categoryId = String(id);
        
        categoryNames.push(categoryName);
        if (categoryId) {
          categoryIdToName.set(categoryId, categoryName);
          console.log(`[Masters] Mapped category ID ${categoryId} -> "${categoryName}"`);
        }
      }
    });

    // Build subcategory mapping by Category_Id
    const subCategoriesByCategory = {};

    rawSubcategories.forEach((sub) => {
      const subName = sub?.SubCategory || sub?.name || sub?.Subcategory_Name || sub?.label || sub?._id;
      if (!subName) return;

      const categoryId = sub?.Category_Id;
      if (categoryId && categoryIdToName.has(String(categoryId))) {
        const parentCategoryName = categoryIdToName.get(String(categoryId));
        const key = String(parentCategoryName);
        
        if (!subCategoriesByCategory[key]) {
          subCategoriesByCategory[key] = [];
        }
        subCategoriesByCategory[key].push(String(subName));
        console.log(`[Masters] Mapped subcategory "${subName}" to category "${parentCategoryName}" via Category_Id: ${categoryId}`);
      } else {
        console.log(`[Masters] Could not map subcategory "${subName}" - Category_Id: ${categoryId}, available category IDs:`, Array.from(categoryIdToName.keys()));
      }
    });

    // Organize products by subcategory
    // Note: This is a placeholder - you may need to adjust based on your actual data structure
    // If products don't have direct subcategory links, you might need to create this mapping differently
    const productsBySubCategory = {};
    
    // For now, we'll create a simple mapping - you may need to adjust this
    // based on how products are actually categorized in your system
    rawSubcategories.forEach((sub) => {
      const subName = sub?.SubCategory || sub?.name || sub?.Subcategory_Name || sub?.label || sub?._id;
      if (subName) {
        productsBySubCategory[String(subName)] = [];
      }
    });

    // Since products don't have direct subcategory links in the sample data,
    // we'll temporarily assign all products to the first subcategory for testing
    // You may need to adjust this based on your actual business logic
    const rawProducts = Array.isArray(res[2]?.data?.products) ? res[2].data.products : [];
    if (rawProducts.length > 0 && Object.keys(productsBySubCategory).length > 0) {
      const firstSubCategory = Object.keys(productsBySubCategory)[0];
      productsBySubCategory[firstSubCategory] = rawProducts;
      console.log(`[Masters] Temporarily assigned ${rawProducts.length} products to subcategory "${firstSubCategory}" for testing`);
    }

    console.log('[Masters] Products by subcategory structure created:', Object.keys(productsBySubCategory));

    // Ensure every category exists as a key even if no subcategories yet
    categoryNames.forEach((catName) => {
      const key = String(catName);
      if (!subCategoriesByCategory[key]) {
        subCategoriesByCategory[key] = [];
      }
    });

    console.log('[Masters] Final categories:', categoryNames);
    console.log('[Masters] Final subCategoriesByCategory:', subCategoriesByCategory);

    const payload = {
      status: true,
      categories: categoryNames,
      subCategoriesByCategory,
      productsBySubCategory,
      products: res[2]?.data?.products || [],
      additives: res[3]?.data?.additives || [],
    };

    try { localStorage.setItem(ETAG_KEY, syntheticEtag); } catch (_) {}
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch (_) {}
    return payload;
  } catch (e) {
    console.error('[Masters] fetch failed; using cached if available', e);
    return cached || Promise.reject(e);
  }
}
/**
 * Masters Service - Updated to handle the correct data structure
 * 
 * This service fetches and processes master data from the API
 * including categories, subcategories, products, and their relationships
 */

// import api from '../../utils/api';

/**
 * Fetches master data directly from server without any caching
 * Always returns fresh data for real-time updates
 * @returns {Promise<Object>} Fresh master data from server
 */
export async function fetchMastersFresh() {
  try {
    console.log('[Masters] Fetching fresh data from server (no cache)');
    
    const res = await Promise.all([
      api.get('/v1/category', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/subcategory', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/product', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/additive', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/binder', { params: { page: 1, limit: 1000 } }), // Add binders API call
    ]);
    
    // Extract categories and subcategories from various possible response shapes
    const rawCategories = (Array.isArray(res[0]?.data?.categories) && res[0].data.categories)
      || (Array.isArray(res[0]?.data?.category) && res[0].data.category)
      || (Array.isArray(res[0]?.data?.data) && res[0].data.data)
      || (Array.isArray(res[0]?.data?.items) && res[0].data.items)
      || [];

    const rawSubcategories = (Array.isArray(res[1]?.data?.subcategories) && res[1].data.subcategories)
      || (Array.isArray(res[1]?.data?.Subcategories) && res[1].data.Subcategories)
      || (Array.isArray(res[1]?.data?.data) && res[1].data.data)
      || (Array.isArray(res[1]?.data?.items) && res[1].data.items)
      || [];

    const rawProducts = (Array.isArray(res[2]?.data?.products) && res[2].data.products)
      || (Array.isArray(res[2]?.data?.data) && res[2].data.data)
      || (Array.isArray(res[2]?.data?.items) && res[2].data.items)
      || [];

    const rawAdditives = (Array.isArray(res[3]?.data?.additives) && res[3].data.additives)
      || (Array.isArray(res[3]?.data?.data) && res[3].data.data)
      || (Array.isArray(res[3]?.data?.items) && res[3].data.items)
      || [];

    const rawBinders = (Array.isArray(res[4]?.data?.binders) && res[4].data.binders)
      || (Array.isArray(res[4]?.data?.data) && res[4].data.data)
      || (Array.isArray(res[4]?.data?.items) && res[4].data.items)
      || [];

    console.log('[Masters] Raw data extraction results:');
    console.log('[Masters] - Categories:', rawCategories.length);
    console.log('[Masters] - Subcategories:', rawSubcategories.length);
    console.log('[Masters] - Products:', rawProducts.length);
    console.log('[Masters] - Additives:', rawAdditives.length);
    console.log('[Masters] - Binders:', rawBinders.length);
    
    if (rawCategories.length > 0) {
      console.log('[Masters] Sample category:', rawCategories[0]);
    }
    if (rawSubcategories.length > 0) {
      console.log('[Masters] Sample subcategory:', rawSubcategories[0]);
    }
    if (rawProducts.length > 0) {
      console.log('[Masters] Sample product:', rawProducts[0]);
    }
    if (rawBinders.length > 0) {
      console.log('[Masters] Sample binder:', rawBinders[0]);
    }

    console.log('[Masters] Raw data counts:', {
      categories: rawCategories.length,
      subcategories: rawSubcategories.length,
      products: rawProducts.length,
      additives: rawAdditives.length,
      binders: rawBinders.length
    });

    // Build category mapping by Category_Id
    const categoryIdToName = new Map();
    const categoryNames = [];

    // Create category mappings - support both existing and new structure
    rawCategories.forEach((cat) => {
      const name = cat?.Category || cat?.name || cat?.Category_Name || cat?.label;
      const id = cat?.Category_Id || cat?._id || cat?.id || cat?.CategoryID;
      
      if (name && id) {
        // Create display name with ID prefix
        const displayName = `${id} - ${name}`;
        const categoryId = String(id);
        
        categoryNames.push(displayName);
        categoryIdToName.set(categoryId, displayName);
        // Also map the numeric version for compatibility
        if (!isNaN(Number(id))) {
          categoryIdToName.set(String(Number(id)), displayName);
        }
        console.log(`[Masters] Mapped category ID ${categoryId} -> "${displayName}"`);
      }
    });

    // Fallback categories if none found
    if (categoryNames.length === 0) {
      categoryNames.push('100 - Paints', '102 - Primers');
      categoryIdToName.set('100', '100 - Paints');
      categoryIdToName.set('102', '102 - Primers');
      console.log('[Masters] Using fallback categories');
    }

    // Build subcategory mapping by Category_Id
    const subCategoriesByCategory = {};
    const binderConfigBySubCategory = {};
    const productsBySubCategory = {};

    // Initialize category mappings
    categoryNames.forEach((catName) => {
      subCategoriesByCategory[catName] = [];
    });

    // Create product lookup map for efficient searching
    const productMap = new Map();
    console.log('[Masters] Creating product map from', rawProducts.length, 'raw products');
    
    rawProducts.forEach((product, index) => {
      const productId = String(product.Product_Id || '').trim();
      if (productId && productId !== '0' && productId !== 'null' && productId !== 'undefined') {
        productMap.set(productId, {
          _id: product._id,
          Product_Id: product.Product_Id,
          Product_Name: product.Product_Name,
          Abbreviation: product.Abbreviation,
          Product_Density: Number(product.Product_Density) || 0,
          SolidContent: Number(product.SolidContent) || 0,
          VOC: Number(product.VOC) || 0,
          coefficient: Number(product.coefficient) || 1,
          GroupName: product.GroupName,
          Price: product.Price,
          PriceUnit: product.PriceUnit
        });
        
        if (index < 3) {
          console.log(`[Masters] Added product to map: ${productId} -> ${product.Product_Name}`);
        }
      } else {
        console.warn(`[Masters] Skipping product with invalid ID:`, product.Product_Id, product);
      }
    });

    console.log('[Masters] Product map created with', productMap.size, 'products');
    console.log('[Masters] Sample product IDs in map:', Array.from(productMap.keys()).slice(0, 5));

    // Create binder lookup map for efficient searching
    const binderMap = new Map();
    console.log('[Masters] Creating binder map from', rawBinders.length, 'raw binders');
    
    rawBinders.forEach((binder, index) => {
      const binderId = String(binder.Binder_Id || binder._id || '').trim();
      if (binderId && binderId !== '0' && binderId !== 'null' && binderId !== 'undefined') {
        binderMap.set(binderId, {
          _id: binder._id,
          Binder_Id: binder.Binder_Id,
          Binder_Name: binder.Binder_Name || binder.name || binder.Name,
          Binder_Density: Number(binder.Binder_Density) || 1000,
          Abbreviation: binder.Abbreviation || binder.abbreviation,
          Description: binder.Description || binder.description
        });
        
        if (index < 3) {
          console.log(`[Masters] Added binder to map: ${binderId} -> ${binder.Binder_Name || binder.name}`);
        }
      } else {
        console.warn(`[Masters] Skipping binder with invalid ID:`, binder.Binder_Id || binder._id, binder);
      }
    });

    console.log('[Masters] Binder map created with', binderMap.size, 'binders');
    console.log('[Masters] Sample binder IDs in map:', Array.from(binderMap.keys()).slice(0, 5));

    // Process subcategories and extract products
    rawSubcategories.forEach((sub) => {
      const subName = sub?.SubCategory || sub?.name || sub?.Subcategory_Name || sub?.label;
      const categoryId = String(sub?.Category_Id || '');
      
      if (!subName) {
        console.warn('[Masters] Subcategory missing name:', sub);
        return;
      }

      console.log(`[Masters] Processing subcategory: ${subName} with Category_Id: ${categoryId}`);
      console.log(`[Masters] Available category mappings:`, Array.from(categoryIdToName.entries()));

      // Find parent category - try both string and numeric versions
      let parentCategoryName = categoryIdToName.get(categoryId);
      if (!parentCategoryName && !isNaN(Number(categoryId))) {
        parentCategoryName = categoryIdToName.get(String(Number(categoryId)));
      }
      
      if (parentCategoryName) {
        // Add subcategory to parent category
        if (!subCategoriesByCategory[parentCategoryName].includes(subName)) {
          subCategoriesByCategory[parentCategoryName].push(subName);
          console.log(`[Masters] Mapped subcategory "${subName}" to category "${parentCategoryName}"`);
        }
      } else {
        // If no matching category found, add to first category as fallback
        const firstCategory = categoryNames[0];
        if (firstCategory && !subCategoriesByCategory[firstCategory].includes(subName)) {
          subCategoriesByCategory[firstCategory].push(subName);
          console.log(`[Masters] Mapped subcategory "${subName}" to fallback category "${firstCategory}"`);
        }
        console.warn(`[Masters] No category found for subcategory "${subName}" with Category_Id: ${categoryId}`);
      }

      // Extract products for this subcategory
      const subCategoryProducts = [];
      
      if (sub.Products && Array.isArray(sub.Products)) {
        console.log(`[Masters] Found ${sub.Products.length} product IDs for ${subName}:`, sub.Products.slice(0, 5));
        console.log(`[Masters] Product map has ${productMap.size} products available`);
        
        sub.Products.forEach(productId => {
          // Convert to string and handle various data types
          const productIdStr = String(productId).trim();
          
          // Skip invalid entries
          if (!productIdStr || 
              productIdStr === '0' || 
              productIdStr === 'null' || 
              productIdStr === 'undefined' ||
              productIdStr.length < 3) {
            console.log(`[Masters] Skipping invalid product ID: ${productIdStr}`);
            return;
          }

          const product = productMap.get(productIdStr);
          if (product) {
            subCategoryProducts.push(product);
            console.log(`[Masters] Found product: ${product.Product_Name} (${productIdStr})`);
          } else {
            console.warn(`[Masters] Product not found for ID: ${productIdStr} in subcategory: ${subName}`);
          }
        });
      } else {
        console.warn(`[Masters] No Products array found for subcategory: ${subName}`);
      }

      productsBySubCategory[subName] = subCategoryProducts;
      console.log(`[Masters] Mapped ${subCategoryProducts.length} products to ${subName}`);

      // Extract binder configuration and get binder names
      const binder1Id = String(sub.Binder1 || '');
      const binder2Id = String(sub.Binder2 || '');
      
      const binder1Data = binder1Id ? binderMap.get(binder1Id) : null;
      const binder2Data = binder2Id ? binderMap.get(binder2Id) : null;
      
      console.log(`[Masters] Binder mapping for ${subName}:`, {
        binder1Id,
        binder2Id,
        binder1Name: binder1Data?.Binder_Name,
        binder2Name: binder2Data?.Binder_Name
      });

      binderConfigBySubCategory[subName] = {
        Binder1: sub.Binder1 || '',
        Binder2: sub.Binder2 || '',
        Binder1Name: binder1Data?.Binder_Name || `Binder ${binder1Id}`,
        Binder2Name: binder2Data?.Binder_Name || `Binder ${binder2Id}`,
        Binder1Avalue: Number(sub.Binder1Avalue) || 0,
        Binder1Bvalue: Number(sub.Binder1Bvalue) || 0,
        Binder1Cvalue: Number(sub.Binder1Cvalue) || 0,
        Binder1dvalue: Number(sub.Binder1dvalue) || 1,
        Binder2Avalue: Number(sub.Binder2Avalue) || 0,
        Binder2Equation: sub.Binder2EQ1 ? 'Eq1' : 'Eq2',
        Binder2XvalueHidden: Number(sub.Binder2XvalueHidden) || 0,
        Binder2XWithoutB1Hidden: sub.Binder2XWithoutB1Hidden || '',
        Binder2XwithB1Hidden: sub.Binder2XwithB1Hidden || '',
        Binder_Density: Number(sub.Binder_Density) || 1000, // Default density
        Gloss: sub.Gloss === 'on',
        Matt: sub.Matt === 'on',
        Liter: sub.Liter === 'on',
        Gram: sub.Gram === 'on',
        Remarks: sub.Remarks || '',
        suffix: sub.suffix || '',
        MattValue: 1 // Default matt value
      };
    });

    // Determine defaults
    const defaultCategory = categoryNames[0] || '100 - Paints';
    const defaultSubCategory = subCategoriesByCategory[defaultCategory]?.[0] || 'Rosner_Acrylic';

    console.log('[Masters] Final data structure:', {
      categoryNames: categoryNames.length,
      subCategoriesByCategory: Object.entries(subCategoriesByCategory).map(([k, v]) => `${k}: ${v.length} subs`),
      productsBySubCategory: Object.entries(productsBySubCategory).map(([k, v]) => `${k}: ${v.length} products`),
      defaultCategory,
      defaultSubCategory
    });

    const payload = {
      status: true,
      categories: categoryNames,
      subCategoriesByCategory,
      productsBySubCategory,
      binderConfigBySubCategory,
      
      // Raw data for reference
      products: rawProducts,
      additives: rawAdditives,
      binders: rawBinders,
      
      // Default values
      defaultCategory,
      defaultSubCategory,
      glossDefault: 0,
      
      // Default formula components
      defaultTints: [
        { 
          _id: '',
          sl: 1,
          code: '',
          series: '',
          name: '',
          qty: [0, 0, 0, 0, 0, 0],
          grams: 0,
          volume: 0,
          coefficient: 1,
          Product_Density: 0,
          SolidContent: 0,
          VOC: 0
        }
      ],
      defaultBinders: [],
      defaultAdditives: [],
      defaultRemarks: '',
      
      // Metadata defaults
      metaDefaults: {
        date: new Date().toISOString().slice(0, 10),
        fileNo: '',
        customerName: '',
        colorCode: '',
        colorName: '',
        customerRef: '',
        projectNo: ''
      }
    };

    console.log('[Masters] Fresh data fetched successfully from server');
    return payload;
  } catch (e) {
    console.error('[Masters] Fresh fetch failed', e);
    throw e; // Re-throw error instead of falling back to cache
  }
}

async function getAll(endpoint, { page = 1, limit = 1000, sortBy = 'name', sortOrder = 'asc', search = '' } = {}) {
  const res = await api.get(`/v1/${endpoint}`, { params: { page, limit, sortBy, sortOrder, search } });
  return res.data;
}

export const FormulaService = {
  async fetchMasters() {
    // Use the new fetchMastersFresh function instead
    return fetchMastersFresh();
  },

  async fetchFormulaById(formulaId) {
    const res = await api.get(`/admin/formula/${encodeURIComponent(formulaId)}`);
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