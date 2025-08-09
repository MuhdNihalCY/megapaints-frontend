import { useMemo, useState } from 'react';

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
  { id: cryptoRandomId(), sl: 1, code: '10009', series: 'PUR 68', name: 'Mipa PUR Mixing Tinter Nr. 68 green', qty: [34, 324, 43, 42, 2, 423], grams: 868.00, volume: 796.3252 },
  { id: cryptoRandomId(), sl: 2, code: '10004', series: 'PUR 59', name: 'Mipa PUR Mixing Tinter Nr. 59 magenta', qty: [324, 23, 4, 3, 6, 8], grams: 368.00, volume: 350.4756 },
  { id: cryptoRandomId(), sl: 3, code: '', series: '', name: 'Product ID', qty: [0, 0, 0, 0, 0, 0], grams: 0, volume: 0 },
];

function createEmptyTint(nextIndex) {
  return { id: cryptoRandomId(), sl: nextIndex, code: '', series: '', name: '', qty: [0, 0, 0, 0, 0, 0], grams: 0, volume: 0 };
}

const CreateFormula = () => {
  const [category, setCategory] = useState('100 - Paints');
  const [subCategory, setSubCategory] = useState('Rosner_Acrylic');
  const [gloss, setGloss] = useState(13);

  const [meta, setMeta] = useState({
    date: '08/09/2025',
    fileNo: '10140',
    customerName: 'wcpr',
    colorCode: 'Mipa',
    colorName: 'qwer',
    customerRef: 'qew',
    projectNo: 'qew',
  });

  const [tints, setTints] = useState(initialTints);

  const [binders, setBinders] = useState([
    { id: cryptoRandomId(), name: 'Duocryl Profi 1', grams: 608.49, volume: 654.13 },
    { id: cryptoRandomId(), name: 'Duocryl Profi 5', grams: 4335.51, volume: 4608.65 },
  ]);
  
  const [additives, setAdditives] = useState([
    { id: cryptoRandomId(), name: 'Str-Add fein', percent: 3, grams: 185.4 },
  ]);
  
  const [remarks, setRemarks] = useState('Rosner Acrylic');
  const [attachment, setAttachment] = useState({ file: null, preview: '' });

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

  const onAttach = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setAttachment({ file, preview: String(e.target?.result || '') });
    reader.readAsDataURL(file);
  };

  const clearAll = () => {
    setMeta({ date: new Date().toISOString().slice(0, 10), fileNo: '', customerName: '', colorCode: '', colorName: '', customerRef: '', projectNo: '' });
    setCategory('100 - Paints');
    setSubCategory('Rosner_Acrylic');
    setGloss(0);
    setTints(initialTints.map((t, i) => ({ ...t, sl: i + 1 }))); 
    setBinders([]);
    setAdditives([]);
    setRemarks('');
    setAttachment({ file: null, preview: '' });
  };

  const save = () => {
    const payload = {
      meta,
      header: { category, subCategory, gloss },
      tints,
      binders,
      additives,
      totals: { totalWithoutAdditives, bindersTotal, additivesTotal, grandTotal },
      remarks,
      metrics,
    };
    console.log('CreateFormula.save', payload);
    alert('Formula saved locally (see console). Hook this up to your backend.');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Create Formula</h1>
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
            <div className="bg-white p-4 rounded shadow">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={meta.date}
                    onChange={(e) => updateMeta('date', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">File no.</label>
                  <input
                    type="text"
                    value={meta.fileNo}
                    onChange={(e) => updateMeta('fileNo', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={meta.customerName}
                    onChange={(e) => updateMeta('customerName', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color Code</label>
                  <input
                    type="text"
                    value={meta.colorCode}
                    onChange={(e) => updateMeta('colorCode', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color Name</label>
                  <input
                    type="text"
                    value={meta.colorName}
                    onChange={(e) => updateMeta('colorName', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer Ref</label>
                  <input
                    type="text"
                    value={meta.customerRef}
                    onChange={(e) => updateMeta('customerRef', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project No</label>
                  <input
                    type="text"
                    value={meta.projectNo}
                    onChange={(e) => updateMeta('projectNo', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
              <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
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
                      <div className="text-xs text-gray-500">Click to upload image</div>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-10">
            {/* Header Controls */}
            <div className="bg-white p-4 rounded shadow mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-yellow-200"
                  >
                    <option>100 - Paints</option>
                    <option>200 - Primers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-yellow-200"
                  >
                    <option>Rosner_Acrylic</option>
                    <option>Rosner_PU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gloss</label>
                  <input
                    type="number"
                    value={gloss}
                    onChange={(e) => setGloss(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded bg-yellow-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Tints and Quantities Table */}
              <div className="col-span-8 bg-white rounded shadow overflow-hidden">
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
                      <div className="col-span-1 p-2 text-center bg-gray-100 border-r border-gray-200">
                        {index + 1}
                      </div>
                      <div className="col-span-7 p-2 border-r border-gray-200">
                        <div className="grid grid-cols-12 gap-1">
                          <input
                            value={tint.code}
                            onChange={(e) => updateTint(tint.id, 'code', e.target.value)}
                            className="col-span-2 px-1 py-1 text-xs border-0 border-b border-gray-300 bg-transparent"
                            placeholder="Code"
                          />
                          <input
                            value={tint.series}
                            onChange={(e) => updateTint(tint.id, 'series', e.target.value)}
                            className="col-span-2 px-1 py-1 text-xs border-0 border-b border-gray-300 bg-transparent"
                            placeholder="Series"
                          />
                          <input
                            value={tint.name}
                            onChange={(e) => updateTint(tint.id, 'name', e.target.value)}
                            className="col-span-8 px-1 py-1 text-xs border-0 border-b border-gray-300 bg-transparent"
                            placeholder="Tinter Name"
                          />
                        </div>
                      </div>
                      <div className="col-span-4 p-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-right text-sm font-medium text-blue-600">
                            {tint.grams.toFixed(2)}
                          </div>
                          <div className="text-right text-sm">
                            {tint.volume.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity Inputs */}
              <div className="col-span-4 bg-white rounded shadow p-4">
                <div className="text-center text-sm font-medium text-gray-700 mb-3">Quantity</div>
                <div className="space-y-2">
                  {tints.map((tint) => (
                    <div key={tint.id} className="grid grid-cols-6 gap-1">
                      {tint.qty.map((qty, colIndex) => (
                        <input
                          key={colIndex}
                          type="number"
                          value={qty}
                          onChange={(e) => updateTintQty(tint.id, colIndex, e.target.value)}
                          className="px-2 py-1 text-xs text-right border border-gray-300 rounded"
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
              <div className="col-span-8 bg-white rounded shadow overflow-hidden">
                {/* Total without Additives */}
                <div className="bg-gray-600 text-white p-3 grid grid-cols-3">
                  <div className="text-sm font-medium">Total without Additives</div>
                  <div className="text-right text-blue-300 font-semibold">{totalWithoutAdditives.toFixed(2)}</div>
                  <div className="text-right text-sm">{totalWithoutAdditivesVolume.toFixed(2)} in Volume</div>
                </div>

                {/* Binders */}
                <div className="bg-gray-500 text-white p-3">
                  <div className="text-sm font-medium mb-2">Binders</div>
                  {binders.map((binder) => (
                    <div key={binder.id} className="grid grid-cols-3 mb-1">
                      <div className="text-sm">{binder.name}</div>
                      <div className="text-right text-blue-300 font-semibold">{binder.grams}</div>
                      <div className="text-right text-sm">{binder.volume}</div>
                    </div>
                  ))}
                </div>

                {/* Additives */}
                <div className="bg-gray-400 text-white p-3">
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
                        type="number"
                        value={additives[0]?.percent || 0}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-xs w-12 text-center"
                        onChange={(e) => updateAdditive(additives[0]?.id, 'percent', Number(e.target.value))}
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3">
                    <div></div>
                    <div className="text-right text-blue-300 font-semibold">{additivesTotal.toFixed(2)}</div>
                    <div className="text-right text-sm">{additivesTotal.toFixed(2)}</div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gray-600 text-white p-3">
                  <div className="grid grid-cols-3">
                    <div className="text-sm font-medium">Total</div>
                    <div className="text-right text-blue-300 font-semibold text-lg">{grandTotal.toFixed(2)}</div>
                    <div className="text-right text-lg">{grandTotalVolume.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="col-span-4 bg-white rounded shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Remarks</h3>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={10}
                  className="w-full p-3 border border-gray-300 rounded text-sm resize-none"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="bg-white rounded shadow p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Solid Content(%):</span>
                  <div className="flex items-center space-x-1">
                    <input
                      readOnly
                      value={metrics.solidContent}
                      className="w-20 px-2 py-1 text-right bg-gray-100 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded shadow p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">VOC (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.voc}
                    className="w-20 px-2 py-1 text-right bg-gray-100 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              <div className="bg-white rounded shadow p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Density (g/Ltr):</span>
                  <input
                    readOnly
                    value={metrics.density}
                    className="w-20 px-2 py-1 text-right bg-gray-100 border border-gray-300 rounded text-sm"
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