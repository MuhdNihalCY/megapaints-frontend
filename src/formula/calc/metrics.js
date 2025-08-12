/**
 * Computes final totals combining all components
 * @param {Object} tinterTotals - Tinter totals object
 * @param {Object} binderTotals - Binder totals object  
 * @param {Object} additiveTotals - Additive totals object
 * @returns {Object} Final combined totals
 */
export function computeFinalTotals(tinterTotals, binderTotals, additiveTotals) {
  const finalGrams = Number(tinterTotals?.totalGrams || 0) + 
                    Number(binderTotals?.totalBinderGrams || 0) + 
                    Number(additiveTotals?.totalAdditiveGrams || 0);
  
  const finalVolumeL = Number(tinterTotals?.totalVolumeL || 0) + 
                      Number(binderTotals?.totalBinderVolumeL || 0) + 
                      Number(additiveTotals?.totalAdditiveVolumeL || 0);
  
  return { finalGrams, finalVolumeL };
}

/**
 * Computes quality metrics for the final formula
 * @param {Object} params - Object with finalGrams, finalVolumeL, totalSolidMass, totalVOCmass
 * @returns {Object} Quality metrics including solids percent, density, VOC
 */
export function computeQualityMetrics({ finalGrams, finalVolumeL, totalSolidMass, totalVOCmass }) {
  if (!(finalGrams > 0) || !(finalVolumeL > 0)) {
    return {
      solidsPercent: 0,
      density_gPerL: 0,
      voc_gPerL: 0,
    };
  }

  const solidsPercent = (Number(totalSolidMass || 0) / finalGrams) * 100;
  const density_gPerL = (finalGrams / finalVolumeL) * 1000; // Convert to g/L
  const voc_gPerL = (Number(totalVOCmass || 0) / finalVolumeL) * 1000; // Convert to g/L

  return { 
    solidsPercent: Math.max(0, solidsPercent), 
    density_gPerL: Math.max(0, density_gPerL), 
    voc_gPerL: Math.max(0, voc_gPerL) 
  };
}