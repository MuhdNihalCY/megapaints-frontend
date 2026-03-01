import { safeNumber, safeDivisor, safeDensity, volumeFromMassAndDensity } from "./validation.js";

/**
 * Computes binder requirements based on tinter totals and configuration
 *
 * @param {number} totalTinterGrams - Total grams from all tinters
 * @param {Object} cfg - Binder configuration object from subcategory
 * @param {string} [cfg.Binder1] - Binder 1 identifier (if configured)
 * @param {string} [cfg.Binder2] - Binder 2 identifier (if configured)
 * @param {number} [cfg.Binder1Avalue=0] - Binder 1 equation parameter A
 * @param {number} [cfg.Binder1Bvalue=0] - Binder 1 equation parameter B
 * @param {number} [cfg.Binder1Cvalue=0] - Binder 1 equation parameter C
 * @param {number} [cfg.Binder1dvalue=1] - Binder 1 equation parameter D (divisor)
 * @param {number} [cfg.Binder2Avalue=0] - Binder 2 equation parameter A
 * @param {string} [cfg.Binder2Equation='Eq1'] - Binder 2 equation type ('Eq1' or 'Eq2')
 * @param {number} [cfg.MattValue=1] - Matt/Gloss factor for Binder 1 calculation
 * @param {number} [cfg.Binder1_Density=1000] - Density for Binder 1 as ml/1000g
 * @param {number} [cfg.Binder2_Density=1000] - Density for Binder 2 as ml/1000g
 * @param {number} [cfg.Binder_Density=1000] - Fallback density as ml/1000g
 *
 * @returns {Object} Calculated binder amounts and totals
 * @returns {number} return.binder1 - Binder 1 mass in grams
 * @returns {number} return.binder2 - Binder 2 mass in grams
 * @returns {number} return.binder1VolumeL - Binder 1 volume in ml (V = m × (Density/1000))
 * @returns {number} return.binder2VolumeL - Binder 2 volume in ml
 * @returns {number} return.totalBinderGrams - Total binder mass in grams
 * @returns {number} return.totalBinderVolumeL - Total binder volume in ml
 *
 * @example
 * // With individual binder densities
 * const result = computeBinders(500, {
 *   Binder1: 'B1',
 *   Binder2: 'B2',
 *   Binder1Avalue: 0.5,
 *   Binder1Bvalue: 0.2,
 *   Binder1Cvalue: 0.3,
 *   Binder1dvalue: 0.9,
 *   Binder2Avalue: 0.6,
 *   Binder2Equation: 'Eq1',
 *   MattValue: 1,
 *   Binder1_Density: 1100,  // Individual density for Binder 1
 *   Binder2_Density: 900     // Individual density for Binder 2
 * });
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

    // Validate and sanitize equation parameters
    const A = safeNumber(cfg?.Binder1Avalue, 0);
    const B = safeNumber(cfg?.Binder1Bvalue, 0);
    const C = safeNumber(cfg?.Binder1Cvalue, 0);
    const D = safeDivisor(cfg?.Binder1dvalue, 1); // Prevent division by zero
    const A2 = safeNumber(cfg?.Binder2Avalue, 0);

    // Support for individual binder densities (with fallback to shared density)
    const sharedDensity = safeDensity(cfg?.Binder_Density, 1000); // Legacy/fallback density
    const binder1Density = safeDensity(
        cfg?.Binder1_Density || cfg?.Binder1Density,
        sharedDensity,
    );
    const binder2Density = safeDensity(
        cfg?.Binder2_Density || cfg?.Binder2Density,
        sharedDensity,
    );

    const matt = safeDivisor(cfg?.MattValue, 1); // Matt/Gloss factor, default 1
    const eq = cfg?.Binder2Equation === "Eq2" ? "Eq2" : "Eq1";

    // Calculate Binder1 only if configured
    const binder1 = hasBinder1
        ? Math.max(
              0,
              (totalTinterGrams * A * matt - B * C * totalTinterGrams) / D,
          )
        : 0;

    // Calculate Binder2 only if configured
    const binder2 = hasBinder2
        ? Math.max(
              0,
              eq === "Eq2"
                  ? totalTinterGrams * A2
                  : totalTinterGrams * A2 - binder1,
          )
        : 0;

    // Volume (ml) = mass (g) × (Density/1000); Density stored as ml/1000g
    const binder1VolumeL = volumeFromMassAndDensity(binder1, cfg?.Binder1_Density || cfg?.Binder1Density, sharedDensity);
    const binder2VolumeL = volumeFromMassAndDensity(binder2, cfg?.Binder2_Density || cfg?.Binder2Density, sharedDensity);

    const totalBinderGrams = binder1 + binder2;
    const totalBinderVolumeL = binder1VolumeL + binder2VolumeL;

    // Debug logging for binder calculations (development only)
    if (process.env.NODE_ENV === "development" && totalTinterGrams > 0) {
        console.log("[Binder Calc] Inputs:", {
            totalTinterGrams,
            hasBinder1,
            hasBinder2,
            A,
            B,
            C,
            D,
            A2,
            matt,
            eq,
            binder1Density,
            binder2Density,
            sharedDensity,
        });
        console.log("[Binder Calc] Results:", {
            binder1: binder1.toFixed(2),
            binder2: binder2.toFixed(2),
            binder1VolumeL: binder1VolumeL.toFixed(4),
            binder2VolumeL: binder2VolumeL.toFixed(4),
            totalBinderGrams: totalBinderGrams.toFixed(2),
            totalBinderVolumeL: totalBinderVolumeL.toFixed(4),
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
