// Binder calculations
// Inputs:
// - totals.totalTinterGrams
// - config: { Binder1Avalue, Binder1Bvalue, Binder1Cvalue, Binder1Dvalue, Binder2Avalue, Binder_Density, Binder2Equation, MattValue }

export function computeBinders(totalTinterGrams, cfg) {
  const A = Number(cfg?.Binder1Avalue || 0);
  const B = Number(cfg?.Binder1Bvalue || 0);
  const C = Number(cfg?.Binder1Cvalue || 0);
  const D = Number(cfg?.Binder1Dvalue || 1) || 1; // guard divide-by-zero
  const A2 = Number(cfg?.Binder2Avalue || 0);
  const binderDensity = Number(cfg?.Binder_Density || 0);
  const matt = Number(cfg?.MattValue || 1) || 1;
  const eq = cfg?.Binder2Equation === 'Eq2' ? 'Eq2' : 'Eq1';

  const binder1 = ((totalTinterGrams * A * matt) - (B * C * totalTinterGrams)) / D;
  const binder2 = eq === 'Eq2'
    ? (totalTinterGrams * A2)
    : ((totalTinterGrams * A2) - binder1);

  const binder1VolumeL = (binder1 * binderDensity) / 1000;
  const binder2VolumeL = (binder2 * binderDensity) / 1000;

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


