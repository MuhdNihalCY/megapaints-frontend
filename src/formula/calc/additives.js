// Additives calculations
// BaseMass = TotalTinterGrams + TotalBinderGrams

export function computeAdditives(additives, baseMass) {
  const safe = Array.isArray(additives) ? additives : [];
  let totalAdditiveGrams = 0;
  let totalAdditiveVolumeL = 0;
  const rows = [];
  for (const a of safe) {
    const percent = Number(a?.percent || 0);
    const density = Number(a?.Additive_Density || 0); // g/mL
    const grams = (baseMass * percent) / 100;
    const volumeL = (grams * density) / 1000;
    totalAdditiveGrams += grams;
    totalAdditiveVolumeL += volumeL;
    rows.push({ id: a.id, name: a.name, grams, volumeL, percent, density });
  }
  return { rows, totalAdditiveGrams, totalAdditiveVolumeL };
}


