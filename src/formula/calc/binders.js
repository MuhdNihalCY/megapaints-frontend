/**
 * Computes binder requirements based on tinter totals and configuration
 * @param {number} totalTinterGrams - Total grams from all tinters
 * @param {Object} cfg - Binder configuration object
 * @returns {Object} Calculated binder amounts and totals
 */
export function computeBinders(totalTinterGrams, cfg) {
  // Check if binders are configured for this subcategory
  const hasBinder1 = cfg?.Binder1;
  const hasBinder2 = cfg?.Binder2;
  
  // If no binders configured, return zeros
  if (!hasBinder1 && !hasBinder2) {
    return {
      binder1: 0,
      binder2: 0,
      binder1VolumeL: 0,
      binder2VolumeL: 0,
      totalBinderGrams: 0,
      totalBinderVolumeL: 0,
    };
  }
  
  const A = Number(cfg?.Binder1Avalue || 0);
  const B = Number(cfg?.Binder1Bvalue || 0);
  const C = Number(cfg?.Binder1Cvalue || 0);
  const D = Number(cfg?.Binder1dvalue || 1) || 1; // guard divide-by-zero
  const A2 = Number(cfg?.Binder2Avalue || 0);
  const binderDensity = Number(cfg?.Binder_Density || 1000); // Default density 1000 g/L
  const matt = Number(cfg?.MattValue || 1) || 1;
  const eq = cfg?.Binder2Equation === 'Eq2' ? 'Eq2' : 'Eq1';

  // Calculate Binder1 only if configured
  const binder1 = hasBinder1 ? Math.max(0, ((totalTinterGrams * A * matt) - (B * C * totalTinterGrams)) / D) : 0;
  
  // Calculate Binder2 only if configured
  const binder2 = hasBinder2 ? Math.max(0, eq === 'Eq2'
    ? (totalTinterGrams * A2)
    : ((totalTinterGrams * A2) - binder1)) : 0;

  // Binder_Density is in g/L - convert to volume in liters
  const binder1VolumeL = binderDensity > 0 ? (binder1 * binderDensity) / 1000 : 0; // Volume = (grams * density) / 1000
  const binder2VolumeL = binderDensity > 0 ? (binder2 * binderDensity) / 1000 : 0; // Volume = (grams * density) / 1000

  const totalBinderGrams = binder1 + binder2;
  const totalBinderVolumeL = binder1VolumeL + binder2VolumeL;

  // Debug logging for binder calculations
  if (totalTinterGrams > 0) {
    console.log('[Binder Calc] Inputs:', {
      totalTinterGrams,
      hasBinder1,
      hasBinder2,
      A, B, C, D, A2,
      matt,
      eq,
      binderDensity
    });
    console.log('[Binder Calc] Results:', {
      binder1,
      binder2,
      binder1VolumeL,
      binder2VolumeL,
      totalBinderGrams,
      totalBinderVolumeL
    });
  }

  return {
    binder1,
    binder2,
    binder1VolumeL,
    binder2VolumeL,
    totalBinderGrams,
    totalBinderVolumeL,
  };
}