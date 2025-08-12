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
    const density = Number(a?.Additive_Density || 1000); // Default density 1000 g/L
    const grams = (baseMass * percent) / 100;
    const volumeL = density > 0 ? (grams / density) : 0;
    
    totalAdditiveGrams += grams;
    totalAdditiveVolumeL += volumeL;
    
    rows.push({ 
      id: a._id || a.id, 
      name: a.name || a.Additive_Name, 
      grams, 
      volumeL, 
      percent, 
      density 
    });
  }

  return { rows, totalAdditiveGrams, totalAdditiveVolumeL };
}