/**
 * Computes additive requirements based on percentage and base mass
 * BaseMass = TotalTinterGrams + TotalBinderGrams
 * @param {Array} additives - Array of additive objects with percent and density
 * @param {number} baseMass - Base mass for percentage calculations
 * @returns {Object} Calculated additive totals and individual rows
 */
export function computeAdditives(additives, baseMass) {
  const safe = Array.isArray(additives) ? additives : [];
  let totalAdditiveGrams = 0;
  let totalAdditiveVolumeL = 0;
  const rows = [];

  for (const a of safe) {
    const percent = Number(a?.percent || 0);
    // Additive_Density is in g/L - convert to volume in liters
    const density_g_per_l = Number(a?.Additive_Density || 1000); // Default density 1000 g/L
    const grams = (baseMass * percent) / 100;
    const volumeL = density_g_per_l > 0 ? (grams * density_g_per_l) / 1000 : 0; // Volume = (grams × density) / 1000
    
    totalAdditiveGrams += grams;
    totalAdditiveVolumeL += volumeL;
    
    rows.push({ 
      id: a._id || a.id, 
      name: a.name || a.Additive_Name, 
      grams, 
      volumeL, 
      percent, 
      density: density_g_per_l
    });
  }

  // Debug logging for additive calculations
  if (baseMass > 0 && safe.length > 0) {
    console.log('[Additive Calc] Inputs:', {
      baseMass,
      additivesCount: safe.length,
      additives: safe.map(a => ({ name: a.name, percent: a.percent, density: a.Additive_Density }))
    });
    console.log('[Additive Calc] Results:', {
      totalAdditiveGrams,
      totalAdditiveVolumeL,
      rows: rows.map(r => ({ name: r.name, grams: r.grams, volumeL: r.volumeL }))
    });
  }

  return { rows, totalAdditiveGrams, totalAdditiveVolumeL };
}