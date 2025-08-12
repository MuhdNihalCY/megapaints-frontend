/**
 * Computes values for a single tinter row
 * @param {Object} row - Tinter row with qty, coefficient, Product_Density, SolidContent, VOC
 * @returns {Object} Calculated grams, volume, solids and VOC percentages
 */
export function computeTinterRow(row) {
  const quantities = Array.isArray(row?.qty) ? row.qty : [0, 0, 0, 0, 0, 0];
  const sum = quantities.reduce((s, n) => s + Number(n || 0), 0);
  const coefficient = Number(row?.coefficient || 0) > 0 ? Number(row.coefficient) : 1;
  const grams = sum * coefficient;
  
  // Density is in ml/1000g - convert to volume in liters
  const density_ml_per_1000g = Number(row?.Product_Density || 0);
  const volume_ml = density_ml_per_1000g > 0 ? (grams * density_ml_per_1000g) / 1000 : 0; // Convert to milliliters
  const volumeL = volume_ml / 1000; // Convert milliliters to liters
  
  // Debug logging for density conversion
  if (grams > 0 && density_ml_per_1000g > 0) {
    console.log('[Density Debug] Product:', row?.name || 'Unknown', 'Density (ml/1000g):', density_ml_per_1000g, 'Grams:', grams, 'Volume (ml):', volume_ml, 'Volume (L):', volumeL);
  }
  
  return {
    grams,
    volumeL,
    solidsPercent: Number(row?.SolidContent || 0),
    vocPercent: Number(row?.VOC || 0),
  };
}

/**
 * Computes totals for all tinter rows
 * @param {Array} rows - Array of tinter row objects
 * @returns {Object} Total grams, volume, solid mass, and VOC mass
 */
export function computeTinters(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  let totalGrams = 0;
  let totalVolumeL = 0;
  let totalSolidMass = 0;
  let totalVOCMass = 0;

  for (const r of safeRows) {
    const { grams, volumeL, solidsPercent, vocPercent } = computeTinterRow(r);
    totalGrams += grams;
    totalVolumeL += volumeL;
    totalSolidMass += grams * (solidsPercent / 100);
    totalVOCMass += grams * (vocPercent / 100);
  }

  return { totalGrams, totalVolumeL, totalSolidMass, totalVOCMass };
}
