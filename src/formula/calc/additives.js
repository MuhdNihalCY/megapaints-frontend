import { safeNumber, safeDensity, safePercent } from "./validation.js";

/**
 * Computes additive requirements based on percentage and base mass
 * BaseMass = TotalTinterGrams + TotalBinderGrams
 *
 * @param {Array<Object>} additives - Array of additive objects
 * @param {string} additives[]._id - Additive ID
 * @param {string} [additives[].name] - Additive name
 * @param {number} additives[].percent - Additive percentage (0-100)
 * @param {number} [additives[].Additive_Density=1000] - Additive density in g/L
 * @param {number} baseMass - Base mass for percentage calculations (tinters + binders)
 *
 * @returns {Object} Calculated additive totals and individual rows
 * @returns {Array<Object>} return.rows - Detailed data for each additive
 * @returns {number} return.totalAdditiveGrams - Total additive mass in grams
 * @returns {number} return.totalAdditiveVolumeL - Total additive volume in liters
 *
 * @example
 * const additives = [
 *   { _id: 'A1', name: 'Catalyst', percent: 1.5, Additive_Density: 950 },
 *   { _id: 'A2', name: 'Thinner', percent: 3.0, Additive_Density: 800 }
 * ];
 * const result = computeAdditives(additives, 1000);
 * // result.totalAdditiveGrams = 45, result.totalAdditiveVolumeL ≈ 0.0533
 */
export function computeAdditives(additives, baseMass) {
    const safe = Array.isArray(additives) ? additives : [];
    let totalAdditiveGrams = 0;
    let totalAdditiveVolumeL = 0;
    const rows = [];

    for (const a of safe) {
        // Validate and sanitize inputs
        const percent = safePercent(a?.percent, 0); // 0-100 range

        // FIXED: Density is in g/L - Volume (L) = Mass (g) / Density (g/L)
        // Correct physics formula: Volume = Mass / Density
        const density_g_per_l = safeDensity(a?.Additive_Density, 1000); // Default density 1000 g/L
        const grams = (baseMass * percent) / 100;
        const volumeL = density_g_per_l > 0 ? grams / density_g_per_l : 0;

        totalAdditiveGrams += grams;
        totalAdditiveVolumeL += volumeL;

        rows.push({
            id: a._id || a.id,
            name: a.name || a.Additive_Name,
            grams,
            volumeL,
            percent,
            density: density_g_per_l,
        });
    }

    // Debug logging for additive calculations (development only)
    if (
        process.env.NODE_ENV === "development" &&
        baseMass > 0 &&
        safe.length > 0
    ) {
        console.log("[Additive Calc] Inputs:", {
            baseMass: baseMass.toFixed(2),
            additivesCount: safe.length,
            additives: safe.map((a) => ({
                name: a.name,
                percent: a.percent,
                density: a.Additive_Density,
            })),
        });
        console.log("[Additive Calc] Results:", {
            totalAdditiveGrams: totalAdditiveGrams.toFixed(2),
            totalAdditiveVolumeL: totalAdditiveVolumeL.toFixed(4),
            rows: rows.map((r) => ({
                name: r.name,
                grams: r.grams.toFixed(2),
                volumeL: r.volumeL.toFixed(4),
            })),
        });
    }

    return { rows, totalAdditiveGrams, totalAdditiveVolumeL };
}
