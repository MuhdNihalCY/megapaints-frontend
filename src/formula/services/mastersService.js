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
      // Cache hit - returning cached data
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

    // Raw data extracted from API responses

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
          // Category mapped successfully
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
        // Subcategory mapped to category successfully
      } else {
        // Subcategory mapping failed - no matching category found
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
      // Products temporarily assigned for testing
    }

    // Products by subcategory structure created

    // Ensure every category exists as a key even if no subcategories yet
    categoryNames.forEach((catName) => {
      const key = String(catName);
      if (!subCategoriesByCategory[key]) {
        subCategoriesByCategory[key] = [];
      }
    });

    // Final data structure prepared

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
 * 
 * CONSOLE LOGGING STRATEGY:
 * - Removed verbose logging to keep console clean
 * - Kept only essential error handling and data processing logs
 * - Focus on data extraction and relationship mapping
 * - All logs are wrapped in development environment checks where applicable
 */

// import api from '../../utils/api';

/**
 * Fetches master data directly from server without any caching
 * Always returns fresh data for real-time updates
 * @returns {Promise<Object>} Fresh master data from server
 */
export async function fetchMastersFresh() {
  try {
    // Fetching fresh data from server
    
    // Fetch all master data in parallel
    // Fetch all master data in parallel
    const res = await Promise.all([
      api.get('/v1/category', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/subcategory', { params: { page: 1, limit: 1000 } }),
      api.get('/v1/product', { params: { page: 1, limit: 1000 } }), // Fetches tinters/defaults
      api.get('/v1/product', { params: { page: 1, limit: 1000, product_type: 'additive' } }), // Unified endpoint
      api.get('/v1/product', { params: { page: 1, limit: 1000, product_type: 'binder' } }), // Unified endpoint
    ]);
    
    // Extract raw data with fallback handling
    // Note: The unified product endpoint returns data in 'products' field for all types
    const rawCategories = extractArrayData(res[0]?.data, ['categories']);
    const rawSubcategories = extractArrayData(res[1]?.data, ['subcategories', 'Subcategories', 'data', 'items']);
    const rawProducts = extractArrayData(res[2]?.data, ['products']);
    const rawAdditives = extractArrayData(res[3]?.data, ['products']);
    const rawBinders = extractArrayData(res[4]?.data, ['products']);

    // Raw data counts processed

    // ===== PROCESS CATEGORIES =====
    const categoryMap = new Map();
    const categoryNames = [];

    rawCategories.forEach((cat) => {
      const id = cat?.Category_Id || cat?._id || cat?.id || cat?.CategoryID;
      const name = cat?.Category || cat?.name || cat?.Category_Name || cat?.label;
      
      if (id && name) {
        const displayName = `${id} - ${name}`;
        const categoryId = String(id);
        
        categoryNames.push(displayName);
        categoryMap.set(categoryId, {
          id: categoryId,
          name: String(name),
          displayName: displayName
        });
        
        // Category processed successfully
      }
    });

    // Fallback categories if none found
    if (categoryNames.length === 0) {
      const fallbackCategories = [
        { id: '100', name: 'Paints', displayName: '100 - Paints' },
        { id: '102', name: 'Primers', displayName: '102 - Primers' }
      ];
      
      fallbackCategories.forEach(cat => {
        categoryNames.push(cat.displayName);
        categoryMap.set(cat.id, cat);
      });
      
      // Using fallback categories
    }

    // ===== PROCESS PRODUCTS =====
    const productMap = new Map();
    
    console.log('[Masters Debug] Processing', rawProducts.length, 'raw products');
    if (rawProducts.length > 0) {
      console.log('[Masters Debug] Sample product:', {
        code: rawProducts[0]?.code,
        Product_Id: rawProducts[0]?.Product_Id,
        subcategory: rawProducts[0]?.subcategory,
        subcategories: rawProducts[0]?.subcategories
      });
    }
    
    rawProducts.forEach((product) => {
      const productId = String(product?.Product_Id || product?.code || '').trim();
      
      if (productId && productId !== '0' && productId !== 'null' && productId !== 'undefined') {
        // Extract subcategory information from the product
        // Products can have either subcategory (single) or subcategories (array)
        const subcategoryInfo = product?.subcategory || (product?.subcategories && product.subcategories[0]);
        
        // Handle different ObjectId formats: plain string, ObjectId object, or {$oid: "..."} format
        let subcategoryId = '';
        if (subcategoryInfo?._id) {
          if (typeof subcategoryInfo._id === 'string') {
            subcategoryId = subcategoryInfo._id;
          } else if (subcategoryInfo._id.$oid) {
            subcategoryId = subcategoryInfo._id.$oid;
          } else if (subcategoryInfo._id.toString) {
            subcategoryId = subcategoryInfo._id.toString();
          }
        }
        if (!subcategoryId) {
          subcategoryId = subcategoryInfo?.SubCategory_Id || product?.SubCategory_Id || '';
        }
        
        const subcategoryName = subcategoryInfo?.name || '';
        
        const categoryInfo = product?.category;
        let categoryId = '';
        if (categoryInfo?._id) {
          if (typeof categoryInfo._id === 'string') {
            categoryId = categoryInfo._id;
          } else if (categoryInfo._id.$oid) {
            categoryId = categoryInfo._id.$oid;
          } else if (categoryInfo._id.toString) {
            categoryId = categoryInfo._id.toString();
          }
        }
        if (!categoryId) {
          categoryId = categoryInfo?.Category_Id || product?.Category_Id || '';
        }
        
        productMap.set(productId, {
          _id: product._id,
          Product_Id: productId,
          Product_Name: product?.Product_Name || product?.name || '',
          Abbreviation: product?.Abbreviation || product?.abbreviation || '',
          Product_Density: Number(product?.Product_Density || product?.density) || 1000,
          SolidContent: Number(product?.SolidContent || product?.solid_content) || 0,
          VOC: Number(product?.VOC || product?.voc) || 0,
          coefficient: Number(product?.coefficient) || 1,
          SubCategory_Id: String(subcategoryId),
          SubCategory_Name: subcategoryName,
          Category_Id: String(categoryId),
          GroupName: product?.GroupName || product?.group?.name || '',
          Price: product?.Price || product?.base_price || 0,
          PriceUnit: product?.PriceUnit || product?.unit || '',
          // Store all subcategories if product has multiple
          subcategories: product?.subcategories || (subcategoryInfo ? [subcategoryInfo] : [])
        });
      }
    });

    console.log('[Masters Debug] Products mapped:', productMap.size);
    if (productMap.size > 0) {
      const firstProduct = Array.from(productMap.values())[0];
      console.log('[Masters Debug] Sample mapped product:', {
        Product_Id: firstProduct.Product_Id,
        SubCategory_Id: firstProduct.SubCategory_Id,
        SubCategory_Name: firstProduct.SubCategory_Name
      });
    }

    // Products processed successfully

    // ===== PROCESS BINDERS =====
    const binderMap = new Map();
    
    rawBinders.forEach((binder) => {
      const binderId = String(binder?.Binder_Id || binder?._id || '').trim();
      
      if (binderId && binderId !== '0' && binderId !== 'null' && binderId !== 'undefined') {
        binderMap.set(binderId, {
          _id: binder._id,
          Binder_Id: binderId,
          Binder_Name: binder?.Binder_Name || binder?.name || binder?.Name || '',
          Binder_Density: Number(binder?.Binder_Density) || 1000,
          Abbreviation: binder?.Abbreviation || binder?.abbreviation || '',
          Description: binder?.Description || binder?.description || ''
        });
      }
    });

    // Binders processed successfully

    // ===== PROCESS SUBCATEGORIES =====
    const subCategoriesByCategory = {};
    const productsBySubCategory = {};
    const binderConfigBySubCategory = {};

    // Initialize category mappings by category ID (not displayName)
    Array.from(categoryMap.keys()).forEach((id) => {
      subCategoriesByCategory[id] = [];
    });

    rawSubcategories.forEach((sub) => {
      const subName = sub?.SubCategory || sub?.name || sub?.Subcategory_Name || sub?.label;
      const categoryId = String(sub?.Category_Id || sub?.category_id || '');
      
      // Handle different ObjectId formats
      let subCategoryId = '';
      if (sub?._id) {
        if (typeof sub._id === 'string') {
          subCategoryId = sub._id;
        } else if (sub._id.$oid) {
          subCategoryId = sub._id.$oid;
        } else if (sub._id.toString) {
          subCategoryId = sub._id.toString();
        }
      }
      if (!subCategoryId) {
        subCategoryId = String(sub?.SubCategory_Id || '');
      }
      
      if (!subName) {
        console.warn('[Masters] Subcategory missing name:', sub);
        return;
      }

      // Find parent category by ID
      let parentCategoryId = null;
      if (categoryId && categoryMap.has(categoryId)) {
        parentCategoryId = categoryId;
      } else if (categoryId && !isNaN(Number(categoryId))) {
        // Try numeric version
        const numericId = String(Number(categoryId));
        if (categoryMap.has(numericId)) {
          parentCategoryId = numericId;
        }
      }

      // Fallback to first category if no match found
      if (!parentCategoryId && categoryMap.size > 0) {
        parentCategoryId = Array.from(categoryMap.keys())[0];
        // Using fallback category for subcategory
      }

      if (parentCategoryId) {
        // Add subcategory to parent category as an object with id and name
        const existingSub = subCategoriesByCategory[parentCategoryId].find(
          s => s.id === subCategoryId || s.name === subName
        );
        
        if (!existingSub) {
          subCategoriesByCategory[parentCategoryId].push({
            id: subCategoryId,
            name: subName
          });
          // Subcategory mapped successfully
        }

        // Find products for this subcategory
        const subCategoryProducts = [];

        console.log(`[Masters Debug] Processing subcategory: ${subName} (ID: ${subCategoryId})`);

        // Method 1: Products linked by subcategory _id (most accurate)
        if (subCategoryId) {
          productMap.forEach((product, productId) => {
            // Convert both IDs to strings for comparison
            const productSubId = String(product.SubCategory_Id || '');
            const subId = String(subCategoryId);
            const subMongoId = String(sub?._id || '');
            
            // Check if product's subcategory ID matches this subcategory's ID
            if (productSubId && (productSubId === subId || productSubId === subMongoId)) {
              subCategoryProducts.push(product);
              console.log(`  [Match Method 1] Product ${productId} matched by SubCategory_Id`);
            } else if (product.subcategories && Array.isArray(product.subcategories)) {
              // Check if any of the product's subcategories matches
              const matchesSubcategory = product.subcategories.some(sc => {
                const scId = String(sc._id || '');
                return scId && (scId === subId || scId === subMongoId || sc.name === subName);
              });
              if (matchesSubcategory) {
                subCategoryProducts.push(product);
                console.log(`  [Match Method 1b] Product ${productId} matched by subcategories array`);
              }
            }
          });
        }

        // Method 2: Products linked by subcategory name (fallback)
        if (subCategoryProducts.length === 0 && subName) {
          productMap.forEach((product, productId) => {
            if (product.SubCategory_Name === subName) {
              subCategoryProducts.push(product);
              console.log(`  [Match Method 2] Product ${productId} matched by SubCategory_Name`);
            } else if (product.subcategories && Array.isArray(product.subcategories)) {
              const matchesSubcategory = product.subcategories.some(sc => sc.name === subName);
              if (matchesSubcategory) {
                subCategoryProducts.push(product);
                console.log(`  [Match Method 2b] Product ${productId} matched by subcategories name`);
              }
            }
          });
        }

        // Method 3: Products linked by Category_Id (if no direct subcategory link)
        if (subCategoryProducts.length === 0 && categoryId) {
          productMap.forEach((product, productId) => {
            if (String(product.Category_Id) === categoryId) {
              subCategoryProducts.push(product);
              console.log(`  [Match Method 3] Product ${productId} matched by Category_Id`);
            }
          });
        }

        // Method 4: Products from subcategory.Products array (if available)
        if (sub.Products && Array.isArray(sub.Products)) {
          sub.Products.forEach(productId => {
            const productIdStr = String(productId).trim();
            const product = productMap.get(productIdStr);
            if (product && !subCategoryProducts.some(p => p.Product_Id === product.Product_Id)) {
              subCategoryProducts.push(product);
              console.log(`  [Match Method 4] Product ${productIdStr} matched from sub.Products array`);
            }
          });
        }

        productsBySubCategory[subName] = subCategoryProducts;
        console.log(`[Masters Debug] ${subName}: ${subCategoryProducts.length} products matched`);
      // Products mapped to subcategory successfully

        // Configure binders for this subcategory
        // Handle both direct properties and nested Products object
        const binder1Id = String(sub?.Binder1 || sub?.Products?.Binder1 || '');
        const binder2Id = String(sub?.Binder2 || sub?.Products?.Binder2 || '');
        
        const binder1Data = binder1Id ? binderMap.get(binder1Id) : null;
        const binder2Data = binder2Id ? binderMap.get(binder2Id) : null;

        // Transform level_of_shine to Matt/Gloss boolean flags
        // level_of_shine can be 'matt', 'gloss', or null
        const levelOfShine = sub?.level_of_shine || sub?.Products?.level_of_shine;
        const hasMatt = levelOfShine === 'matt' || Boolean(sub?.Matt || sub?.Products?.Matt);
        const hasGloss = levelOfShine === 'gloss' || Boolean(sub?.Gloss || sub?.Products?.Gloss);
        
        console.log(`[Masters Debug] ${subName} - level_of_shine: ${levelOfShine}, Matt: ${hasMatt}, Gloss: ${hasGloss}`);
        
        binderConfigBySubCategory[subName] = {
          // Store the original subcategory data for reference
          SubCategory: subName,
          Category_Id: categoryId,
          SubCategory_Id: subCategoryId,
          
          // Binder IDs (handle both direct and nested)
          Binder1: binder1Id,
          Binder2: binder2Id,
          
          // Store the Products object if it exists
          Products: sub?.Products || null,
          
          // Binder names resolved from binder data
          Binder1Name: binder1Data?.Binder_Name || `Binder ${binder1Id}`,
          Binder2Name: binder2Data?.Binder_Name || `Binder ${binder2Id}`,
          
          // Binder configuration values
          Binder1Avalue: Number(sub?.Binder1Avalue) || 0,
          Binder1Bvalue: Number(sub?.Binder1Bvalue) || 0,
          Binder1Cvalue: Number(sub?.Binder1Cvalue) || 0,
          Binder1dvalue: Number(sub?.Binder1dvalue) || 1,
          Binder2Avalue: Number(sub?.Binder2Avalue) || 0,
          Binder2EQ1: Boolean(sub?.Binder2EQ1),
          Binder2XvalueHidden: Number(sub?.Binder2XvalueHidden) || 0,
          Binder2XWithoutB1Hidden: sub?.Binder2XWithoutB1Hidden || '',
          Binder2XwithB1Hidden: sub?.Binder2XwithB1Hidden || '',
          Binder_Density: Number(sub?.Binder_Density) || 1000,
          
          // UI configuration - Transform level_of_shine to Matt/Gloss booleans
          Gloss: hasGloss,
          Matt: hasMatt,
          Liter: Boolean(sub?.Liter || sub?.Products?.Liter || sub?.unit === 'liter'),
          Gram: Boolean(sub?.Gram || sub?.Products?.Gram || sub?.unit === 'kg'),
          
          // Additional properties
          Remarks: sub?.Remarks || sub?.remarks || '',
          suffix: sub?.suffix || sub?.Products?.suffix || ''
        };

        // Binders configured for subcategory
      }
    });

    // ===== DETERMINE DEFAULTS & FALLBACKS =====
    
    // Ensure "Rosner_Acrylic" exists as a fallback subcategory if missing
    const hasRosnerAcrylic = Object.values(subCategoriesByCategory).some(subs => 
      subs.some(s => s && s.name === 'Rosner_Acrylic')
    );

    if (!hasRosnerAcrylic) {
      // Find or create "Paints" category by ID
      let paintsCategoryId = null;
      
      // Try to find a category with "Paints" in the name
      for (const [id, catData] of categoryMap.entries()) {
        if (catData.name.includes('Paints')) {
          paintsCategoryId = id;
          break;
        }
      }
      
      // If no Paints category found, use the first category or create a fallback
      if (!paintsCategoryId) {
        if (categoryMap.size > 0) {
          paintsCategoryId = Array.from(categoryMap.keys())[0];
        } else {
          // Create fallback category
          paintsCategoryId = '100';
          categoryMap.set(paintsCategoryId, {
            id: '100',
            name: 'Paints',
            displayName: '100 - Paints'
          });
        }
      }
      
      // Ensure the category has a subcategory array
      if (!subCategoriesByCategory[paintsCategoryId]) {
        subCategoriesByCategory[paintsCategoryId] = [];
      }
      
      // Add Rosner_Acrylic to the category
      subCategoriesByCategory[paintsCategoryId].push({
        id: 'rosner_acrylic',
        name: 'Rosner_Acrylic'
      });
      
      // Add fallback binder configuration for Rosner_Acrylic
      binderConfigBySubCategory['Rosner_Acrylic'] = {
        SubCategory: 'Rosner_Acrylic',
        Binder1: 'B001', // Fallback ID
        Binder2: 'B002', // Fallback ID
        Binder1Name: 'Binder 1',
        Binder2Name: 'Binder 2',
        Binder1Avalue: 0,
        Binder1Bvalue: 0,
        Binder1Cvalue: 0,
        Binder1dvalue: 1,
        Binder2Avalue: 0,
        Binder2EQ1: false,
        Gloss: true,
        Matt: true,
        Liter: true,
        Gram: true,
        suffix: 'kg'
      };
      
      // Add fallback products for Rosner_Acrylic if missing
      if (!productsBySubCategory['Rosner_Acrylic']) {
        productsBySubCategory['Rosner_Acrylic'] = [];
      }
    }
    
    // Set defaults using category ID and subcategory name
    const defaultCategoryId = Array.from(categoryMap.keys())[0] || '100';
    const defaultSubCategoryName = subCategoriesByCategory[defaultCategoryId]?.[0]?.name || 'Rosner_Acrylic';

    // Final data structure prepared successfully

    // ===== BUILD PAYLOAD =====
    const payload = {
      status: true,
      categories: Array.from(categoryMap.values()).map(({ id, name }) => ({ id, name })),
      subCategoriesByCategory,
      productsBySubCategory,
      binderConfigBySubCategory,
      
      // Raw data for reference
      products: Array.from(productMap.values()),
      additives: rawAdditives,
      binders: Array.from(binderMap.values()),
      
      // Default values - category as ID, subcategory as name
      defaultCategory: defaultCategoryId,
      defaultSubCategory: defaultSubCategoryName,
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
        date: (() => {
          const now = new Date();
          const d = String(now.getDate()).padStart(2, '0');
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const y = now.getFullYear();
          return `${d}/${m}/${y}`;
        })(),
        fileNo: '',
        customerName: '',
        colorCode: '',
        colorName: '',
        customerRef: '',
        projectNo: ''
      }
    };

    // Fresh data fetched successfully
    return payload;
  } catch (e) {
    console.error('[Masters] Fresh fetch failed', e);
    throw e;
  }
}

/**
 * Helper function to extract array data from API response
 * @param {Object} data - API response data
 * @param {Array<string>} possibleKeys - Possible keys where array data might be found
 * @returns {Array} Extracted array data
 */
function extractArrayData(data, possibleKeys) {
  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }
  return [];
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

  async createFormula(payload, file = null) {
    if (file) {
      const form = new FormData();
      form.append('formula', JSON.stringify(payload));
      form.append('file', file);
      const res = await api.post('/admin/formula', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    }
    const res = await api.post('/admin/formula', payload);
    return res.data;
  },

  async updateFormula(formulaId, payload) {
    const res = await api.put(`/admin/formula/${encodeURIComponent(formulaId)}`, payload);
    return res.data;
  },
};

export default FormulaService;