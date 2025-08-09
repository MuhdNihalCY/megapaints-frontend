import { useMemo, useState } from 'react';
import Header from './components/Header';

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

const GRAMS_TO_VOLUME_COEFF = 0.918; // approximate conversion; adjust as needed

const initialTints = [
  { id: cryptoRandomId(), sl: 1, code: '10009', series: 'PUR 68', name: 'Mipa PUR Mixing Tinter Nr. 68 green', qty: [0, 0, 0, 0, 0, 0], grams: 0, volume: 0 },
  { id: cryptoRandomId(), sl: 2, code: '10004', series: 'PUR 59', name: 'Mipa PUR Mixing Tinter Nr. 59 magenta', qty: [0, 0, 0, 0, 0, 0], grams: 0, volume: 0 },
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
    date: new Date().toISOString().slice(0, 10),
    fileNo: '10140',
    customerName: '',
    colorCode: '',
    colorName: '',
    customerRef: '',
    projectNo: '',
  });

  const [tints, setTints] = useState(initialTints);

  // quantities are now managed per-tint row in tints[i].qty[0..5]

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
  const additivesTotalVolume = 0; // not captured for volume
  const grandTotalVolume = totalWithoutAdditivesVolume + bindersTotalVolume + additivesTotalVolume;

  // compute grams and volume whenever quantities change is handled inline in updateTintQty

  const metrics = useMemo(() => {
    const solidContent = Math.max(0, (bindersTotal / Math.max(1, grandTotal)) * 100).toFixed(2);
    const voc = (additivesTotal * 0.47).toFixed(3);
    const density = (grandTotal / 100).toFixed(3);
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

      // auto-append new row if last row receives any input
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
      qtyCols,
      binders,
      additives,
      totals: { totalWithoutAdditives, bindersTotal, additivesTotal, grandTotal },
      remarks,
      metrics,
    };
    // eslint-disable-next-line no-console
    console.log('CreateFormula.save', payload);
    alert('Formula saved locally (see console). Hook this up to your backend.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
      <Header />

      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 flex justify-end space-x-3" data-section={CreateFormulaSections.ACTIONS}>
        <button onClick={clearAll} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">Clear All</button>
        <button onClick={save} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Save</button>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4" data-section={CreateFormulaSections.HEADER_CONTROLS}>
          <div className="lg:col-span-9 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2">
                  <option>100 - Paints</option>
                  <option>200 - Primers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
                <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2">
                  <option>Rosner_Acrylic</option>
                  <option>Rosner_PU</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gloss</label>
                <input type="number" value={gloss} onChange={(e) => setGloss(Number(e.target.value))} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3" data-section={CreateFormulaSections.LEFT_SIDEBAR}>
            <Field label="Date">
              <input type="date" value={meta.date} onChange={(e) => updateMeta('date', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
            </Field>
            <Field label="File No.">
              <input value={meta.fileNo} onChange={(e) => updateMeta('fileNo', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
            </Field>
            <Field label="Customer Name">
              <input value={meta.customerName} onChange={(e) => updateMeta('customerName', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
            </Field>
            <Field label="Color Code">
              <input value={meta.colorCode} onChange={(e) => updateMeta('colorCode', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
            </Field>
            <Field label="Color Name">
              <input value={meta.colorName} onChange={(e) => updateMeta('colorName', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
            </Field>
            <Field label="Customer Ref">
              <input value={meta.customerRef} onChange={(e) => updateMeta('customerRef', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
            </Field>
            <Field label="Project No">
              <input value={meta.projectNo} onChange={(e) => updateMeta('projectNo', e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2" />
            </Field>
          </aside>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
          <section className="xl:col-span-7 bg-white dark:bg-gray-800 rounded-lg shadow" data-section={CreateFormulaSections.TINTS_TABLE}>
            <TableHeader title="Tints" />
            <div className="grid grid-cols-12">
              {/* Left: SL No. + Tinter (code, series, name) */}
              <div className="col-span-8 overflow-x-auto border-r border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <Th>SL No.</Th>
                      <Th>Tinters</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tints.map((t, idx) => (
                      <tr key={t.id} className="text-sm">
                        <Td className="w-16">{idx + 1}</Td>
                        <Td>
                          <div className="flex items-center space-x-4">
                            <input value={t.code} placeholder="Code" onChange={(e) => updateTint(t.id, 'code', e.target.value)} className="w-28 bg-transparent outline-none border-b border-gray-300 dark:border-gray-600" />
                            <input value={t.series} placeholder="Series" onChange={(e) => updateTint(t.id, 'series', e.target.value)} className="w-24 bg-transparent outline-none border-b border-gray-300 dark:border-gray-600" />
                            <input value={t.name} placeholder="Tinter" onChange={(e) => updateTint(t.id, 'name', e.target.value)} className="flex-1 bg-transparent outline-none border-b border-gray-300 dark:border-gray-600" />
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right inside same card: Quantity => in Grams / in Volume */}
              <div className="col-span-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th colSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-600 dark:text-gray-300">Quantity</th>
                    </tr>
                    <tr>
                      <Th className="text-right">in Grams</Th>
                      <Th className="text-right">in Volume</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tints.map((t) => (
                      <tr key={t.id} className="text-sm">
                        <Td className="text-right">
                          <input readOnly value={t.grams} className="w-24 text-right bg-transparent outline-none" />
                        </Td>
                        <Td className="text-right">
                          <input readOnly value={t.volume} className="w-28 text-right bg-transparent outline-none" />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Right: 6 quantity inputs aligned by rows */}
          <section className="xl:col-span-5 bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3" data-section={CreateFormulaSections.QUANTITY_GRID}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Quantity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    {[1,2,3,4,5,6].map((n) => (
                      <th key={n} className="p-2 text-center text-gray-700 dark:text-gray-200">{n.toString().padStart(2,'0')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tints.map((t) => (
                    <tr key={t.id}>
                      {t.qty.map((q, i) => (
                        <td key={i} className="p-2">
                          <input type="number" value={q} onChange={(e) => updateTintQty(t.id, i, e.target.value)} className="w-24 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-right" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6" data-section={CreateFormulaSections.TOTALS_BINDERS_ADDITIVES}>
           <div className="xl:col-span-7 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <TableHeader title="Totals & Binders" />
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <RowTwoValues label="Total without Additives" rightPrimary={`${totalWithoutAdditives.toFixed(2)}`} rightSecondary={`${totalWithoutAdditivesVolume.toFixed(2)}`} secondaryLabel="in Volume" />

              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Binders</h4>
                  <button onClick={addBinder} className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Add Binder</button>
                </div>
                <div className="space-y-2">
                  {binders.map((b) => (
                    <div key={b.id} className="grid grid-cols-12 gap-2 items-center">
                      <input value={b.name} onChange={(e) => updateBinder(b.id, 'name', e.target.value)} placeholder="Name" className="col-span-6 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 px-3 py-2" />
                      <input type="number" value={b.grams} onChange={(e) => updateBinder(b.id, 'grams', Number(e.target.value))} placeholder="Grams" className="col-span-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 px-3 py-2 text-right" />
                      <input type="number" value={b.volume} onChange={(e) => updateBinder(b.id, 'volume', Number(e.target.value))} placeholder="Volume" className="col-span-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 px-3 py-2 text-right" />
                      <button onClick={() => removeBinder(b.id)} className="col-span-1 text-red-500 hover:text-red-600">Remove</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Additives
                    <span className="ml-2 text-xs text-gray-500">(percent and computed grams)</span>
                  </h4>
                  <button onClick={addAdditive} className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Add Additive</button>
                </div>
                <div className="space-y-2">
                  {additives.map((a) => (
                    <div key={a.id} className="grid grid-cols-12 gap-2 items-center">
                      <input value={a.name} onChange={(e) => updateAdditive(a.id, 'name', e.target.value)} placeholder="Name" className="col-span-6 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 px-3 py-2" />
                      <input type="number" value={a.percent} onChange={(e) => updateAdditive(a.id, 'percent', Number(e.target.value))} placeholder="%" className="col-span-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 px-3 py-2 text-right" />
                      <input type="number" value={a.grams} onChange={(e) => updateAdditive(a.id, 'grams', Number(e.target.value))} placeholder="Grams" className="col-span-3 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 px-3 py-2 text-right" />
                      <button onClick={() => removeAdditive(a.id)} className="col-span-1 text-red-500 hover:text-red-600">Remove</button>
                    </div>
                  ))}
                </div>
              </div>

               <RowTwoValues label="Total" rightPrimary={`${grandTotal.toFixed(2)}`} rightSecondary={`${grandTotalVolume.toFixed(2)}`} secondaryLabel="in Volume" isEmphasis />
            </div>
          </div>

          <div className="xl:col-span-5 bg-white dark:bg-gray-800 rounded-lg shadow p-4" data-section={CreateFormulaSections.REMARKS}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Remarks</h3>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={10} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3" placeholder="Enter remarks..." />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3" data-section={CreateFormulaSections.ATTACHMENTS}>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Attachments</h3>
            <label className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onAttach(e.target.files?.[0] || null)} />
              <span className="text-gray-600 dark:text-gray-300">Click to upload image</span>
            </label>
            {attachment.preview && (
              <img src={attachment.preview} alt="preview" className="rounded-lg object-cover w-full h-48" />
            )}
          </div>

          <div className="xl:col-span-9 grid sm:grid-cols-3 gap-4" data-section={CreateFormulaSections.METRICS}>
            <Metric label="Solid Content(%)" value={metrics.solidContent} suffix="%" />
            <Metric label="VOC (g/Ltr)" value={metrics.voc} />
            <Metric label="Density (g/Ltr)" value={metrics.density} />
          </div>
        </section>
      </main>
    </div>
  );
};

function TableHeader({ title, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      <div className="flex items-center space-x-2">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 ${className}`}>{children}</th>
  );
}
function Td({ children, className = '' }) {
  return <td className={`px-3 py-2 text-gray-800 dark:text-gray-100 ${className}`}>{children}</td>;
}

function Row({ label, right, isEmphasis = false }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${isEmphasis ? 'bg-gray-50 dark:bg-gray-700 rounded-b-lg' : ''}`}>
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <span className={`text-sm font-semibold ${isEmphasis ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>{right}</span>
    </div>
  );
}

function RowTwoValues({ label, rightPrimary, rightSecondary, secondaryLabel = '', isEmphasis = false }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${isEmphasis ? 'bg-gray-50 dark:bg-gray-700 rounded-b-lg' : ''}`}>
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <div className="flex items-center space-x-6">
        <span className={`text-sm font-semibold ${isEmphasis ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>{rightPrimary}</span>
        <div className="flex items-baseline space-x-2">
          <span className={`text-sm font-semibold ${isEmphasis ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>{rightSecondary}</span>
          {secondaryLabel ? (
            <span className="text-xs text-gray-500 dark:text-gray-300">{secondaryLabel}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, suffix }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <div className="flex items-center space-x-1">
        <input readOnly value={value} className="w-24 text-right bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-gray-900 dark:text-white" />
        {suffix ? <span className="text-sm text-gray-600 dark:text-gray-300">{suffix}</span> : null}
      </div>
    </div>
  );
}

export default CreateFormula;

