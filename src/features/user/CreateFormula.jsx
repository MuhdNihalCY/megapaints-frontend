import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import { FormulaService } from '../../formula/services/formulaService';
import { computeTinters, computeTinterRow } from '../../formula/calc/tinters';
import { computeBinders } from '../../formula/calc/binders';
import { computeAdditives } from '../../formula/calc/additives';
import { computeFinalTotals, computeQualityMetrics } from '../../formula/calc/metrics';
import { validateTinters, validateBinders, validateMetrics } from '../../utils/validation';
import { fetchMastersWithCache } from '../../formula/services/mastersService';
import { LoadingOverlay } from '../../components';

export const CreateFormulaSections = {
  HEADER_CONTROLS: 'header-controls',
  LEFT_SIDEBAR: 'left-sidebar',
  TINTS_TABLE: 'tints-table',
  QUANTITY_GRID: 'quantity-grid',
  TOTALS_BINDERS_ADDITIVES: 'totals-binders-additives',
  TOTAL_FOOTER: 'total-footer',
  REMARKS: 'remarks',
  ATTACHMENTS: 'attachments',
  METRICS: 'metrics',
  ACTIONS: 'actions',
};

function cryptoRandomId() {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

const GRAMS_TO_VOLUME_COEFF = 0.918; // legacy fallback only

const initialTints = [
  { id: cryptoRandomId(), sl: 1, code: '', series: '', name: 'Product ID', qty: [0, 0, 0, 0, 0, 0], grams: 0, volume: 0 },
];

function createEmptyTint(nextIndex) {
  return { id: cryptoRandomId(), sl: nextIndex, code: '', series: '', name: '', qty: [0, 0, 0, 0, 0, 0], grams: 0, volume: 0 };
}

const CreateFormula = () => {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [gloss, setGloss] = useState(0);
  const [glossInput, setGlossInput] = useState('');

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [subCategoriesByCategory, setSubCategoriesByCategory] = useState({});
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [mastersError, setMastersError] = useState('');
  const [products, setProducts] = useState([]); // for product metadata (coefficient, density, solids, VOC)
  const [binderConfigBySubCategory, setBinderConfigBySubCategory] = useState({});
  const [productsBySubCategory, setProductsBySubCategory] = useState({});
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductList, setShowProductList] = useState({}); // { [tintId]: boolean }
  const [productSearchInput, setProductSearchInput] = useState({}); // { [tintId]: string }
  const [dropdownPosition, setDropdownPosition] = useState({}); // { [tintId]: { top, left } }
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [meta, setMeta] = useState({
    date: new Date().toISOString().slice(0, 10),
    fileNo: '',
    customerName: '',
    colorCode: '',
    colorName: '',
    customerRef: '',
    projectNo: '',
  });

  const [tints, setTints] = useState(initialTints);

  const [binders, setBinders] = useState([]);
  
  const [additives, setAdditives] = useState([]);
  
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState({ file: null, preview: '' });
  const [uploadedAttachment, setUploadedAttachment] = useState(null); // { id, url, ... }
  const [qtyInput, setQtyInput] = useState({}); // { [tintId]: string[] }
  const [additiveInputById, setAdditiveInputById] = useState({}); // { [additiveId]: string }

  // Input sanitizers
  function sanitizeIntegerInput(raw) {
    if (typeof raw !== 'string') raw = String(raw ?? '');
    // Allow only digits (no negatives by default)
    return raw.replace(/[^0-9]/g, '');
  }

  function sanitizeFloatInput(raw) {
    if (typeof raw !== 'string') raw = String(raw ?? '');
    // Allow digits and a single dot; coerce leading dot to 0.
    const input = raw.replace(/[^0-9.]/g, '');
    let result = '';
    let dotSeen = false;
    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      if (ch === '.') {
        if (dotSeen) continue;
        dotSeen = true;
        if (result === '') result = '0';
        result += '.';
      } else {
        result += ch;
      }
    }
    return result;
  }

  function sanitizeNumericInput(raw, mode = 'float') {
    return mode === 'int' ? sanitizeIntegerInput(raw) : sanitizeFloatInput(raw);
  }

  function normalizeTints(list) {
    const safe = Array.isArray(list) ? list : [];
    const out = safe.map((t, idx) => {
      const qtyArr = Array.isArray(t.qty) ? t.qty.slice(0, 6) : [];
      while (qtyArr.length < 6) qtyArr.push(0);
      const productDensity = Number(t?.Product_Density || 0);
      const coefficient = Number(t?.coefficient || 0);
      const solids = Number(t?.SolidContent || 0);
      const voc = Number(t?.VOC || 0);
      const rowCalc = computeTinterRow({ qty: qtyArr, coefficient, Product_Density: productDensity, SolidContent: solids, VOC: voc });
      return {
        id: t.id || cryptoRandomId(),
        sl: t.sl || idx + 1,
        code: t.code || '',
        series: t.series || '',
        name: t.name || '',
        productId: t.productId || null,
        coefficient: Number.isFinite(coefficient) && coefficient > 0 ? coefficient : 1,
        Product_Density: Number.isFinite(productDensity) ? productDensity : 0,
        SolidContent: Number.isFinite(solids) ? solids : 0,
        VOC: Number.isFinite(voc) ? voc : 0,
        qty: qtyArr,
        grams: rowCalc.grams, // stored for backward-compat but rendering uses computed per-row
        volume: rowCalc.volumeL,
      };
    });
    if (out.length === 0) out.push(createEmptyTint(1));
    return out;
  }

  // Load initial masters from server
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMasters(true);
      setMastersError('');
      try {
        const data = await fetchMastersWithCache();
        try {
          console.log('[CreateFormula] Masters payload:', data);
        } catch (_) {}
        // categories: string[] or objects
        const cats = Array.isArray(data?.categories)
          ? data.categories.map((c) => (typeof c === 'string' ? c : (c?.name || c?.label || ''))).filter(Boolean)
          : [];
        const subByCat = data?.subCategoriesByCategory && typeof data.subCategoriesByCategory === 'object' ? data.subCategoriesByCategory : {};
        const glossDefault = typeof data?.glossDefault === 'number' ? data.glossDefault : 0;

        const metaDefaults = data?.metaDefaults && typeof data.metaDefaults === 'object' ? data.metaDefaults : {};
        const prods = Array.isArray(data?.products) ? data.products : [];
        const binderCfgBySub = data?.binderConfigBySubCategory && typeof data.binderConfigBySubCategory === 'object' ? data.binderConfigBySubCategory : {};
        const productsBySub = data?.productsBySubCategory || {};

        const defaults = {
          category: data?.defaultCategory || cats[0] || '100 - Paints',
          subCategory: data?.defaultSubCategory || (subByCat[cats[0]]?.[0]) || 'Rosner_Acrylic',
          gloss: glossDefault,
          tints: normalizeTints(data?.defaultTints),
          binders: Array.isArray(data?.defaultBinders) ? data.defaultBinders.map((b) => ({
            id: b.id || cryptoRandomId(),
            name: b.name || '',
            grams: Number(b.grams || 0),
            volume: Number(b.volume || 0),
          })) : [],
          additives: Array.isArray(data?.defaultAdditives) ? data.defaultAdditives.map((a) => ({
            id: a.id || cryptoRandomId(),
            name: a.name || '',
            percent: Number(a.percent || 0),
            grams: Number(a.grams || 0),
          })) : [],
          remarks: typeof data?.defaultRemarks === 'string' ? data.defaultRemarks : '',
        };

        if (!cancelled) {
          setCategoryOptions(cats.length ? cats : ['100 - Paints', '200 - Primers']);
          setSubCategoriesByCategory(subByCat);
          setProductsBySubCategory(productsBySub);
          try {
            console.log('[CreateFormula] categories:', cats);
            console.log('[CreateFormula] subCategoriesByCategory keys:', Object.keys(subByCat || {}));
            console.log('[CreateFormula] productsBySubCategory keys:', Object.keys(productsBySub || {}));
            console.log('[CreateFormula] productsBySubCategory details:', productsBySub);
            console.log('[CreateFormula] initial category:', defaults.category, 'initial subcategory:', defaults.subCategory);
          } catch (_) {}
          const initialSubs = subByCat[defaults.category];
          setSubCategoryOptions(Array.isArray(initialSubs) && initialSubs.length ? initialSubs : ['Rosner_Acrylic', 'Rosner_PU']);
          setProducts(prods);
          setBinderConfigBySubCategory(binderCfgBySub);

          setCategory(defaults.category);
          setSubCategory(defaults.subCategory);
          setGloss(defaults.gloss);
          setGlossInput(defaults.gloss ? String(defaults.gloss) : '');
          setTints(defaults.tints);
          setBinders(defaults.binders);
          setAdditives(defaults.additives);
          setRemarks(defaults.remarks);
          setMeta((m) => ({
            ...m,
            ...metaDefaults,
            date: metaDefaults.date || m.date,
          }));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load masters', err);
          setMastersError('Failed to load data.');
          // Fallback sensible defaults
          setCategoryOptions(['100 - Paints', '200 - Primers']);
          setSubCategoryOptions(['Rosner_Acrylic', 'Rosner_PU']);
          setCategory('100 - Paints');
          setSubCategory('Rosner_Acrylic');
          setGloss(0);
          setGlossInput('');
          setTints(normalizeTints(initialTints));
        }
      } finally {
        if (!cancelled) setLoadingMasters(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Update sub-category options when category changes (if masters provided)
  useEffect(() => {
    console.log('[CreateFormula] Category changed to:', category);
    console.log('[CreateFormula] Available subCategoriesByCategory:', subCategoriesByCategory);
    
    const subs = subCategoriesByCategory[category] || [];
    const nextOptions = Array.isArray(subs) ? subs : [];
    
    console.log('[CreateFormula] Found subcategories for category:', category, '->', nextOptions);
    
    setSubCategoryOptions(nextOptions);
    if (!nextOptions.includes(subCategory)) {
      console.log('[CreateFormula] Current subcategory not in new options, resetting to:', nextOptions[0] || '');
      setSubCategory(nextOptions[0] || '');
    }
  }, [category, subCategoriesByCategory]);

  // Update filtered products when subcategory changes
  useEffect(() => {
    console.log('[CreateFormula] Subcategory changed to:', subCategory);
    console.log('[CreateFormula] Available productsBySubCategory:', productsBySubCategory);
    
    if (subCategory && productsBySubCategory[subCategory]) {
      const productsForSubCategory = productsBySubCategory[subCategory];
      console.log('[CreateFormula] Products for subcategory:', subCategory, '->', productsForSubCategory.length, 'products');
      console.log('[CreateFormula] Sample products:', productsForSubCategory.slice(0, 3));
      setFilteredProducts(productsForSubCategory);
    } else {
      console.log('[CreateFormula] No products found for subcategory:', subCategory);
      console.log('[CreateFormula] Available subcategories with products:', Object.keys(productsBySubCategory).filter(key => productsBySubCategory[key].length > 0));
      setFilteredProducts([]);
    }
  }, [subCategory, productsBySubCategory]);

  // Product search and selection functions
  const handleProductSearch = (tintId, searchTerm) => {
    setProductSearchInput(prev => ({ ...prev, [tintId]: searchTerm }));
    
    // Always show the product list when focusing on the input
    setShowProductList(prev => ({ ...prev, [tintId]: true }));
    
    if (!searchTerm.trim()) {
      const availableProducts = productsBySubCategory[subCategory] || [];
      setFilteredProducts(availableProducts);
      console.log('[CreateFormula] No search term, showing all products for subcategory:', subCategory, '->', availableProducts.length, 'products');
      return;
    }

    const availableProducts = productsBySubCategory[subCategory] || [];
    console.log('[CreateFormula] Searching for:', searchTerm, 'in', availableProducts.length, 'available products');
    
    const filtered = availableProducts.filter(product => 
      product.Product_Id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Abbreviation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Product_Name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log('[CreateFormula] Search results:', filtered.length, 'products found');
    setFilteredProducts(filtered);
  };

  const calculateDropdownPosition = (tintId, event) => {
    const rect = event.target.getBoundingClientRect();
    const top = rect.bottom + window.scrollY;
    const left = rect.left + window.scrollX;
    
    setDropdownPosition(prev => ({
      ...prev,
      [tintId]: { top, left }
    }));
  };

  const selectProduct = (tintId, product) => {
    updateTint(tintId, 'code', product.Product_Id || '');
    updateTint(tintId, 'series', product.Abbreviation || ''); // Map Abbreviation to series field
    updateTint(tintId, 'name', product.Product_Name || '');
    updateTint(tintId, 'coefficient', Number(product.coefficient || 1));
    updateTint(tintId, 'Product_Density', Number(product.Product_Density || 0));
    updateTint(tintId, 'SolidContent', Number(product.SolidContent || 0));
    updateTint(tintId, 'VOC', Number(product.VOC || 0));
    
    setShowProductList(prev => ({ ...prev, [tintId]: false }));
    setProductSearchInput(prev => ({ ...prev, [tintId]: '' }));
    
    console.log('[CreateFormula] Selected product for tint', tintId, ':', product);
  };

  const totalWithoutAdditives = useMemo(
    () => tints.reduce((sum, t) => sum + Number(t.grams || 0), 0),
    [tints]
  );
  
  const bindersTotal = useMemo(
    () => binders.reduce((sum, b) => sum + Number(b.grams || 0), 0),
    [binders]
  );
  
  const bindersTotalVolume = useMemo(
    () => binders.reduce((sum, b) => sum + Number(b.volume || 0), 0),
    [binders]
  );
  
  const additivesTotal = useMemo(
    () => additives.reduce((sum, a) => sum + Number(a.grams || 0), 0),
    [additives]
  );
  
  const grandTotal = totalWithoutAdditives + bindersTotal + additivesTotal;
  
  const totalWithoutAdditivesVolume = useMemo(
    () => tints.reduce((sum, t) => sum + Number(t.volume || 0), 0),
    [tints]
  );
  
  const grandTotalVolume = totalWithoutAdditivesVolume + bindersTotalVolume;

  const metrics = useMemo(() => {
    const solidContent = Math.max(0, (bindersTotal / Math.max(1, grandTotal)) * 100).toFixed(2);
    const voc = (additivesTotal * 0.47).toFixed(3);
    const density = (grandTotal / 1000).toFixed(3);
    return { solidContent, voc, density };
  }, [bindersTotal, additivesTotal, grandTotal]);

  const updateMeta = (key, value) => setMeta((m) => ({ ...m, [key]: value }));

  const updateTint = (id, key, value) => {
    setTints((prev) => {
      const isEditingLastRow = prev[prev.length - 1]?.id === id;
      const updated = prev.map((t) => (t.id === id ? { ...t, [key]: value } : t));
      if (isEditingLastRow) {
        const last = updated[updated.length - 1];
        const hasAnyInput = Boolean(
          (last.code && last.code.trim()) ||
            (last.series && last.series.trim()) ||
            (last.name && last.name.trim()) ||
            Number(last.grams) > 0 ||
            Number(last.volume) > 0
        );
        if (hasAnyInput) {
          const nextIndex = updated.length + 1;
          return [...updated, createEmptyTint(nextIndex)];
        }
      }
      return updated;
    });
  };

  const updateTintQty = (id, colIndex, value) => {
    setTints((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        const nextQty = [...t.qty];
        nextQty[colIndex] = Number(value) || 0;
        // grams/volume are derived; keep for legacy but not trusted for UI
        const derived = computeTinterRow({ qty: nextQty, coefficient: t.coefficient, Product_Density: t.Product_Density, SolidContent: t.SolidContent, VOC: t.VOC });
        return { ...t, qty: nextQty, grams: derived.grams, volume: derived.volumeL };
      });

      const last = updated[updated.length - 1];
      const hasQtyInput = last.qty.some((v) => Number(v) > 0);
      const hasMeta = Boolean((last.code && last.code.trim()) || (last.series && last.series.trim()) || (last.name && last.name.trim()));
      if (hasQtyInput || hasMeta) {
        if (prev[prev.length - 1]?.id === id) {
          return [...updated, createEmptyTint(updated.length + 1)];
        }
      }
      return updated;
    });
  };

  const addBinder = () => setBinders((prev) => [...prev, { id: cryptoRandomId(), name: '', grams: 0, volume: 0 }]);
  const updateBinder = (id, key, value) => setBinders((prev) => prev.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  const removeBinder = (id) => setBinders((prev) => prev.filter((b) => b.id !== id));

  const addAdditive = () => setAdditives((prev) => [...prev, { id: cryptoRandomId(), name: '', percent: 0, grams: 0 }]);
  const updateAdditive = (id, key, value) => setAdditives((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)));
  const removeAdditive = (id) => setAdditives((prev) => prev.filter((a) => a.id !== id));

  const onAttach = async (file) => {
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => setAttachment({ file, preview: String(e.target?.result || '') });
    reader.readAsDataURL(file);
    try {
      const uploaded = await FormulaService.uploadAttachment(file);
      setUploadedAttachment(uploaded);
    } catch (e) {
      console.error('Attachment upload failed', e);
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    setMeta({ date: new Date().toISOString().slice(0, 10), fileNo: '', customerName: '', colorCode: '', colorName: '', customerRef: '', projectNo: '' });
    setCategory(categoryOptions[0] || '100 - Paints');
    const subs = subCategoriesByCategory[categoryOptions[0]] || subCategoryOptions;
    setSubCategory((Array.isArray(subs) && subs[0]) || 'Rosner_Acrylic');
    setGloss(0);
    setTints(initialTints.map((t, i) => ({ ...t, sl: i + 1 })));
    setBinders([]);
    setAdditives([]);
    setRemarks('');
    setAttachment({ file: null, preview: '' });
    setUploadedAttachment(null);
  };

  // Derived computations
  const tinterTotals = useMemo(() => computeTinters(tints), [tints]);

  const selectedBinderConfig = useMemo(() => {
    const cfg = binderConfigBySubCategory?.[subCategory] || {};
    return {
      ...cfg,
      Binder2Equation: cfg?.Binder2Equation === 'Eq2' ? 'Eq2' : 'Eq1',
      MattValue: 1, // default; extend when Matt/Gloss logic is finalized
    };
  }, [binderConfigBySubCategory, subCategory]);

  const binderTotals = useMemo(() => computeBinders(tinterTotals.totalGrams, selectedBinderConfig), [tinterTotals.totalGrams, selectedBinderConfig]);
  const additiveTotals = useMemo(() => computeAdditives(additives, tinterTotals.totalGrams + binderTotals.totalBinderGrams), [additives, tinterTotals.totalGrams, binderTotals.totalBinderGrams]);
  const finalTotals = useMemo(() => computeFinalTotals({ totalGrams: tinterTotals.totalGrams, totalVolumeL: tinterTotals.totalVolumeL }, { totalBinderGrams: binderTotals.totalBinderGrams, totalBinderVolumeL: binderTotals.totalBinderVolumeL }, { totalAdditiveGrams: additiveTotals.totalAdditiveGrams, totalAdditiveVolumeL: additiveTotals.totalAdditiveVolumeL }), [tinterTotals, binderTotals, additiveTotals]);
  const quality = useMemo(() => computeQualityMetrics({ finalGrams: finalTotals.finalGrams, finalVolumeL: finalTotals.finalVolumeL, totalSolidMass: tinterTotals.totalSolidMass, totalVOCmass: tinterTotals.totalVOCMass }), [finalTotals, tinterTotals]);

  const tinterErrors = useMemo(() => validateTinters(tints), [tints]);
  const binderErrors = useMemo(() => validateBinders(selectedBinderConfig), [selectedBinderConfig]);
  const metricWarnings = useMemo(() => validateMetrics({ solidsPercent: quality.solidsPercent, density_gPerL: quality.density_gPerL, voc_gPerL: quality.voc_gPerL }), [quality]);
  const hasBlockingErrors = loadingMasters || tinterErrors.some(e => e.type === 'missing-density' || e.type === 'duplicate-product') || binderErrors.length > 0 || !(finalTotals.finalVolumeL > 0) || !(finalTotals.finalGrams > 0);

  const save = async () => {
    setIsSaving(true);
    const payload = {
      meta,
      header: { category, subCategory, gloss },
      tints,
      binders: [
        { name: 'Binder 1', grams: binderTotals.binder1, volume: binderTotals.binder1VolumeL },
        { name: 'Binder 2', grams: binderTotals.binder2, volume: binderTotals.binder2VolumeL },
      ],
      additives,
      totals: {
        tinter: { grams: tinterTotals.totalGrams, volumeL: tinterTotals.totalVolumeL },
        binder: { grams: binderTotals.totalBinderGrams, volumeL: binderTotals.totalBinderVolumeL },
        additive: { grams: additiveTotals.totalAdditiveGrams, volumeL: additiveTotals.totalAdditiveVolumeL },
        final: { grams: finalTotals.finalGrams, volumeL: finalTotals.finalVolumeL },
      },
      remarks,
      metrics: {
        solidsPercent: quality.solidsPercent,
        density_gPerL: quality.density_gPerL,
        voc_gPerL: quality.voc_gPerL,
      },
      attachment: uploadedAttachment || undefined,
    };
    try {
      const res = await FormulaService.createFormula(payload);
      if (res?.status) {
        alert('Formula saved successfully');
      } else {
        alert(res?.message || 'Save failed');
      }
    } catch (e) {
      console.error('Save error', e);
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      
      {/* Loading Overlay */}
      <LoadingOverlay 
        isLoading={loadingMasters || isSaving || isUploading} 
        message={
          loadingMasters ? "Loading ..." :
          isSaving ? "Saving formula..." :
          isUploading ? "Uploading attachment..." :
          "Loading..."
        }
      />
      
      {/* Page Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Formula</h1>
          <div className="flex space-x-3">
            <button 
              onClick={clearAll} 
              disabled={isSaving || isUploading}
              className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
            <button 
              onClick={save} 
              disabled={hasBlockingErrors || isSaving || isUploading}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="text"
                    value={meta.date}
                    onChange={(e) => updateMeta('date', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">File no.</label>
                  <input
                    type="text"
                    value={meta.fileNo}
                    onChange={(e) => updateMeta('fileNo', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={meta.customerName}
                    onChange={(e) => updateMeta('customerName', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color Code</label>
                  <input
                    type="text"
                    value={meta.colorCode}
                    onChange={(e) => updateMeta('colorCode', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color Name</label>
                  <input
                    type="text"
                    value={meta.colorName}
                    onChange={(e) => updateMeta('colorName', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Ref</label>
                  <input
                    type="text"
                    value={meta.customerRef}
                    onChange={(e) => updateMeta('customerRef', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Project No</label>
                  <input
                    type="text"
                    value={meta.projectNo}
                    onChange={(e) => updateMeta('projectNo', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="attachment"
                  onChange={(e) => onAttach(e.target.files?.[0] || null)}
                />
                <label htmlFor="attachment" className="cursor-pointer">
                  {attachment.preview ? (
                    <img src={attachment.preview} alt="preview" className="w-full h-24 object-cover rounded" />
                  ) : (
                    <>
                      <div className="text-2xl text-gray-400 mb-2">📁</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Click to upload image</div>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Solid Content(%):</span>
                  <div className="flex items-center space-x-1">
                    <input
                      readOnly
                      value={metrics.solidContent}
                      className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">VOC (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.voc}
                    className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Density (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.density}
                    className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-300">Sampled QTY:</span>
                  <input
                    readOnly
                    value={grandTotal.toFixed(2)}
                    className="w-16 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-10">
            {/* Header Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  >
                    {subCategoryOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gloss</label>
                  <input
                    type="text"
                    value={glossInput}
                    onChange={(e) => {
                      const v = sanitizeNumericInput(e.target.value, 'float');
                      setGlossInput(v);
                      setGloss(v === '' ? 0 : Number(v));
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-yellow-200 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Tints and Quantities Table */}
              <div className="col-span-8 bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                {/* Header */}
                <div className="bg-gray-600 text-white">
                  <div className="grid grid-cols-12 text-xs font-medium">
                    <div className="col-span-1 p-2 text-center border-r border-gray-500">SL No.</div>
                    <div className="col-span-7 p-2 text-center border-r border-gray-500">Tinters</div>
                    <div className="col-span-4 p-2">
                      <div className="text-center mb-1">Quantity</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center">in Grams</div>
                        <div className="text-center">in Volume</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-200">
                  {tints.map((tint, index) => (
                    <div key={tint.id} className="grid grid-cols-12 text-xs h-[42px]">
                      <div className="col-span-1 p-2 text-center bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                        {index + 1}
                      </div>
                      <div className="col-span-7 p-2 border-r border-gray-200">
                        <div className="grid grid-cols-12 gap-1">
                          <div className="col-span-3 relative">
                            <input
                              value={tint.code}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateTint(tint.id, 'code', value);
                                handleProductSearch(tint.id, value);
                              }}
                              onFocus={(e) => {
                                handleProductSearch(tint.id, tint.code);
                                calculateDropdownPosition(tint.id, e);
                              }}
                              onBlur={() => {
                                // Delay hiding the dropdown to allow clicking on products
                                setTimeout(() => setShowProductList(prev => ({ ...prev, [tint.id]: false })), 200);
                              }}
                              className="w-full px-1 py-1 text-xs border-0 border-b border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="Product ID"
                            />
                            {/* Product dropdown */}
                            {showProductList[tint.id] && (
                              <div 
                                className="fixed z-[9999] w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg"
                                data-product-dropdown
                                style={{
                                  top: dropdownPosition[tint.id]?.top || 0,
                                  left: dropdownPosition[tint.id]?.left || 0,
                                  position: 'fixed',
                                  zIndex: 9999
                                }}
                              >
                                {filteredProducts.length > 0 ? (
                                  filteredProducts.map((product, idx) => (
                                    <div
                                      key={product._id || idx}
                                      onClick={() => selectProduct(tint.id, product)}
                                      className="px-3 py-2 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                    >
                                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                                        {product.Abbreviation || 'N/A'}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {product.Product_Name || 'N/A'}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                                    {tint.code ? (
                                      `No products found for "${tint.code}"`
                                    ) : (
                                      <div>
                                        <div>No products available for subcategory</div>
                                        <div className="text-xs mt-1">"{subCategory}"</div>
                                        <div className="text-xs mt-1 text-gray-400">Try selecting a different subcategory</div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="col-span-3">
                            <input
                              value={tint.series}
                              readOnly
                              className="w-full px-1 py-1 text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                          <div className="col-span-6">
                            <input
                              value={tint.name}
                              readOnly
                              className="w-full px-1 py-1 text-xs bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-4 p-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center text-sm font-medium text-blue-600">
                            {tint.grams.toFixed(2)}
                          </div>
                          <div className="text-center text-sm text-gray-800 dark:text-gray-200">
                            {tint.volume.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Inputs */}
              <div className="col-span-4 bg-white dark:bg-gray-800 rounded shadow p-4 pb-0">
                <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Quantity</div>
                <div className=" mt-4">
                  {tints.map((tint) => (
                    <div key={tint.id} className="grid grid-cols-6 h-[42px] pb-2 gap-1">
                      {tint.qty.map((qty, colIndex) => (
                          <input
                            key={colIndex}
                            type="text"
                            value={
                              qtyInput[tint.id]?.[colIndex] !== undefined
                                ? qtyInput[tint.id][colIndex]
                                : (qty === 0 ? '' : String(qty))
                            }
                            onChange={(e) => {
                              const v = sanitizeNumericInput(e.target.value, 'float');
                              setQtyInput((prev) => {
                                const prevRow = prev[tint.id] ? [...prev[tint.id]] : Array(6).fill('');
                                prevRow[colIndex] = v;
                                return { ...prev, [tint.id]: prevRow };
                              });
                              updateTintQty(tint.id, colIndex, v === '' ? 0 : Number(v));
                            }}
                            className="px-2 py-1 text-xs text-right border-b border-gray-300 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals, Binders and Remarks Section */}
            <div className="grid grid-cols-12 gap-6 mt-6">
              {/* Totals and Binders */}
              <div className="col-span-8 bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
                {/* Total without Additives - aligned to quantity columns */}
                <div className="bg-gray-600 text-white p-2">
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 text-sm font-medium">Total without Additives</div>
                    <div className="col-span-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center text-blue-300 font-semibold">{totalWithoutAdditives.toFixed(2)}</div>
                        <div className="text-center text-sm">{totalWithoutAdditivesVolume.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Binders - aligned to quantity columns */}
                <div className="bg-gray-500 text-white p-2">
                  <div className="text-sm font-medium mb-2">Binders</div>
                  {binders.map((binder) => (
                    <div key={binder.id} className="grid grid-cols-12 items-center mb-1">
                      <div className="col-span-1"></div>
                      <div className="col-span-7 text-sm">{binder.name}</div>
                      <div className="col-span-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center text-blue-300 font-semibold">{binder.grams}</div>
                          <div className="text-center text-sm">{binder.volume}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additives - aligned to quantity columns */}
                <div className="bg-gray-400 text-white p-2">
                  <div className="grid grid-cols-4 mb-2">
                    <div className="text-sm font-medium">Additives</div>
                    <div className="text-center">
                      <select className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                        {additives.map((additive) => (
                          <option key={additive.id}>{additive.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-center">
                      <input
                        type="text"
                        value={(() => {
                          const id = additives[0]?.id;
                          const current = additives[0]?.percent || 0;
                          const mapped = id ? additiveInputById[id] : undefined;
                          return mapped !== undefined ? mapped : (current === 0 ? '' : String(current));
                        })()}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-xs w-12 text-center"
                        onChange={(e) => {
                          const id = additives[0]?.id;
                          const v = sanitizeNumericInput(e.target.value, 'float');
                          if (id) setAdditiveInputById((prev) => ({ ...prev, [id]: v }));
                          // Allow empty field as 0 without forcing a 0 in the input
                          updateAdditive(id, 'percent', v === '' ? 0 : Number(v));
                        }}
                      />
                      <span className="text-sm mx-2">%</span>
                    </div>
                    <div className="text-right">
                      
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 text-sm font-medium">Additives Total</div>
                    <div className="col-span-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center text-blue-300 font-semibold">{additivesTotal.toFixed(2)}</div>
                        <div className="text-center text-sm">{additivesTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total - aligned to quantity columns */}
                <div className="bg-gray-600 text-white p-2">
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 text-sm font-medium">Total</div>
                    <div className="col-span-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center text-blue-300 font-semibold text-lg">{grandTotal.toFixed(2)}</div>
                        <div className="text-center text-lg">{grandTotalVolume.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="col-span-4 bg-white dark:bg-gray-800 rounded shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Remarks</h3>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={10}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded text-sm resize-none dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFormula;