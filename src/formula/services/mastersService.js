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


