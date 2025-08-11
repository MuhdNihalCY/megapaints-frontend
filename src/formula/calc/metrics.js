// Final totals and quality metrics

export function computeFinalTotals(tinterTotals, binderTotals, additiveTotals) {
  const finalGrams = Number(tinterTotals?.totalGrams || 0) + Number(binderTotals?.totalBinderGrams || 0) + Number(additiveTotals?.totalAdditiveGrams || 0);
  const finalVolumeL = Number(tinterTotals?.totalVolumeL || 0) + Number(binderTotals?.totalBinderVolumeL || 0) + Number(additiveTotals?.totalAdditiveVolumeL || 0);
  return { finalGrams, finalVolumeL };
}

export function computeQualityMetrics({ finalGrams, finalVolumeL, totalSolidMass, totalVOCmass }) {
  if (!(finalGrams > 0) || !(finalVolumeL > 0)) {
    return {
      solidsPercent: NaN,
      density_gPerL: NaN,
      voc_gPerL: NaN,
    };
  }
  const solidsPercent = (totalSolidMass / finalGrams) * 100;
  const density_gPerL = (finalGrams / finalVolumeL) * 1000;
  const voc_gPerL = (totalVOCmass / finalGrams) * 10 * (density_gPerL / 1000);
  return { solidsPercent, density_gPerL, voc_gPerL };
}


