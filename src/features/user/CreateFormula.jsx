import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import { FormulaService } from '../../utils/formulaService';

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

const GRAMS_TO_VOLUME_COEFF = 0.918;

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
      const gramsRaw = typeof t.grams === 'number' ? t.grams : qtyArr.reduce((s, n) => s + Number(n || 0), 0);
      const grams = Number(gramsRaw || 0);
      const volume = Number(((typeof t.volume === 'number' ? t.volume : grams * GRAMS_TO_VOLUME_COEFF)).toFixed(4));
      return {
        id: t.id || cryptoRandomId(),
        sl: t.sl || idx + 1,
        code: t.code || '',
        series: t.series || '',
        name: t.name || '',
        qty: qtyArr,
        grams,
        volume,
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
        const data = await FormulaService.fetchMasters();
        // categories: string[] or objects
        const cats = Array.isArray(data?.categories)
          ? data.categories.map((c) => (typeof c === 'string' ? c : (c?.name || c?.label || ''))).filter(Boolean)
          : [];
        const subByCat = data?.subCategoriesByCategory && typeof data.subCategoriesByCategory === 'object' ? data.subCategoriesByCategory : {};
        const glossDefault = typeof data?.glossDefault === 'number' ? data.glossDefault : 0;

        const metaDefaults = data?.metaDefaults && typeof data.metaDefaults === 'object' ? data.metaDefaults : {};

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
          const initialSubs = subByCat[defaults.category];
          setSubCategoryOptions(Array.isArray(initialSubs) && initialSubs.length ? initialSubs : ['Rosner_Acrylic', 'Rosner_PU']);

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
    const subs = subCategoriesByCategory[category];
    if (Array.isArray(subs) && subs.length) {
      setSubCategoryOptions(subs);
      if (!subs.includes(subCategory)) setSubCategory(subs[0]);
    }
  }, [category, subCategoriesByCategory]);

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
        const grams = nextQty.reduce((s, n) => s + Number(n || 0), 0);
        const volume = Number((grams * GRAMS_TO_VOLUME_COEFF).toFixed(4));
        return { ...t, qty: nextQty, grams, volume };
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
    const reader = new FileReader();
    reader.onload = (e) => setAttachment({ file, preview: String(e.target?.result || '') });
    reader.readAsDataURL(file);
    try {
      const uploaded = await FormulaService.uploadAttachment(file);
      setUploadedAttachment(uploaded);
    } catch (e) {
      console.error('Attachment upload failed', e);
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

  const save = async () => {
    const payload = {
      meta,
      header: { category, subCategory, gloss },
      tints,
      binders,
      additives,
      totals: { totalWithoutAdditives, bindersTotal, additivesTotal, grandTotal },
      remarks,
      metrics,
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      {/* Page Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Formula</h1>
          <div className="flex space-x-3">
            <button onClick={clearAll} className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
              Clear All
            </button>
            <button onClick={save} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
              Save
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
                    <div key={tint.id} className="grid grid-cols-12 text-xs">
                      <div className="col-span-1 p-2 text-center bg-gray-100 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                        {index + 1}
                      </div>
                      <div className="col-span-7 p-2 border-r border-gray-200">
                        <div className="grid grid-cols-12 gap-1">
                          <input
                            value={tint.code}
                            onChange={(e) => updateTint(tint.id, 'code', e.target.value)}
                            className="col-span-2 px-1 py-1 text-xs border-0 border-b border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Code"
                          />
                          <input
                            value={tint.series}
                            onChange={(e) => updateTint(tint.id, 'series', e.target.value)}
                            className="col-span-2 px-1 py-1 text-xs border-0 border-b border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Series"
                          />
                          <input
                            value={tint.name}
                            onChange={(e) => updateTint(tint.id, 'name', e.target.value)}
                            className="col-span-8 px-1 py-1 text-xs border-0 border-b border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Tinter Name"
                          />
                        </div>
                      </div>
                      <div className="col-span-4 p-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-right text-sm font-medium text-blue-600">
                            {tint.grams.toFixed(2)}
                          </div>
                          <div className="text-right text-sm text-gray-800 dark:text-gray-200">
                            {tint.volume.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Inputs */}
              <div className="col-span-4 bg-white dark:bg-gray-800 rounded shadow p-4">
                <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Quantity</div>
                <div className="space-y-4 mt-5">
                  {tints.map((tint) => (
                    <div key={tint.id} className="grid grid-cols-6 gap-1">
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
                            className="px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                        <div className="text-right text-blue-300 font-semibold">{totalWithoutAdditives.toFixed(2)}</div>
                        <div className="text-right text-sm">{totalWithoutAdditivesVolume.toFixed(2)}</div>
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
                          <div className="text-right text-blue-300 font-semibold">{binder.grams}</div>
                          <div className="text-right text-sm">{binder.volume}</div>
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
                        <div className="text-right text-blue-300 font-semibold">{additivesTotal.toFixed(2)}</div>
                        <div className="text-right text-sm">{additivesTotal.toFixed(2)}</div>
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
                        <div className="text-right text-blue-300 font-semibold text-lg">{grandTotal.toFixed(2)}</div>
                        <div className="text-right text-lg">{grandTotalVolume.toFixed(2)}</div>
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

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Solid Content(%):</span>
                  <div className="flex items-center space-x-1">
                    <input
                      readOnly
                      value={metrics.solidContent}
                      className="w-20 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm dark:text-white"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">%</span>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">VOC (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.voc}
                    className="w-20 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm dark:text-white"
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Density (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.density}
                    className="w-20 px-2 py-1 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFormula;