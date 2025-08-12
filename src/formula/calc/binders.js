/**
 * Computes binder requirements based on tinter totals and configuration
 * @param {number} totalTinterGrams - Total grams from all tinters
 * @param {Object} cfg - Binder configuration object
 * @returns {Object} Calculated binder amounts and totals
 */
export function computeBinders(totalTinterGrams, cfg) {
  const A = Number(cfg?.Binder1Avalue || 0);
  const B = Number(cfg?.Binder1Bvalue || 0);
  const C = Number(cfg?.Binder1Cvalue || 0);
  const D = Number(cfg?.Binder1dvalue || 1) || 1; // guard divide-by-zero
  const A2 = Number(cfg?.Binder2Avalue || 0);
  const binderDensity = Number(cfg?.Binder_Density || 1000); // Default density 1000 g/L
  const matt = Number(cfg?.MattValue || 1) || 1;
  const eq = cfg?.Binder2Equation === 'Eq2' ? 'Eq2' : 'Eq1';

  const binder1 = Math.max(0, ((totalTinterGrams * A * matt) - (B * C * totalTinterGrams)) / D);
  const binder2 = Math.max(0, eq === 'Eq2'
    ? (totalTinterGrams * A2)
    : ((totalTinterGrams * A2) - binder1));

  // Binder_Density is in g/L - convert to volume in liters
  const binder1VolumeL = binderDensity > 0 ? (binder1 * binderDensity) / 1000 : 0; // Volume = (grams * density) / 1000
  const binder2VolumeL = binderDensity > 0 ? (binder2 * binderDensity) / 1000 : 0; // Volume = (grams * density) / 1000

  const totalBinderGrams = binder1 + binder2;
  const totalBinderVolumeL = binder1VolumeL + binder2VolumeL;

  return {
    binder1,
    binder2,
    binder1VolumeL,
    binder2VolumeL,
    totalBinderGrams,
    totalBinderVolumeL,
  };
}