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
    // Additive_Density is in ml/1000g - convert to volume in liters
    const density_ml_per_1000g = Number(a?.Additive_Density || 1000); // Default density 1000 ml/1000g
    const grams = (baseMass * percent) / 100;
    const volume_ml = density_ml_per_1000g > 0 ? (grams * density_ml_per_1000g) / 1000 : 0; // Convert to milliliters
    const volumeL = volume_ml / 1000; // Convert milliliters to liters
    
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