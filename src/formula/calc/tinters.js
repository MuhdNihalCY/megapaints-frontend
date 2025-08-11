// Pure functions for tinter row and totals calculations.
// Units: mass in grams, density in g/mL, volume in liters.

export function computeTinterRow(row) {
  const quantities = Array.isArray(row?.qty) ? row.qty : [0, 0, 0, 0, 0, 0];
  const sum = quantities.reduce((s, n) => s + Number(n || 0), 0);
  const coefficient = Number(row?.coefficient || 0) > 0 ? Number(row.coefficient) : 1;
  const grams = sum * coefficient;
  const productDensity = Number(row?.Product_Density || 0); // g/mL per spec
  const volumeL = (grams * productDensity) / 1000; // per spec note
  return {
    grams,
    volumeL,
    solidsPercent: Number(row?.SolidContent || 0),
    vocPercent: Number(row?.VOC || 0),
  };
}

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


