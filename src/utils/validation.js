export function validateTinters(rows) {
  const errors = [];
  const seen = new Set();
  for (let i = 0; i < (rows?.length || 0); i += 1) {
    const r = rows[i];
    if (!r) continue;
    if (r.productId) {
      if (seen.has(r.productId)) {
        errors.push({ type: 'duplicate-product', index: i, message: 'Duplicate tinter product selected' });
      }
      seen.add(r.productId);
    }
    const density = Number(r?.Product_Density || 0);
    if (!(density > 0)) {
      errors.push({ type: 'missing-density', index: i, message: 'Missing or invalid product density' });
    }
  }
  return errors;
}

export function validateBinders(cfg) {
  const errors = [];
  const density = Number(cfg?.Binder_Density || 0);
  if (!(density > 0)) errors.push({ type: 'missing-binder-density', message: 'Missing or invalid binder density' });
  return errors;
}

export function validateMetrics({ solidsPercent, density_gPerL, voc_gPerL }) {
  const warnings = [];
  if (!(density_gPerL > 0)) warnings.push({ type: 'density-nonpositive', message: 'Density is non-positive' });
  if (solidsPercent < 0 || solidsPercent > 100) warnings.push({ type: 'solids-out-of-range', message: 'Solids% out of range (0–100)' });
  if (voc_gPerL < 0) warnings.push({ type: 'voc-negative', message: 'VOC is negative' });
  return warnings;
}


