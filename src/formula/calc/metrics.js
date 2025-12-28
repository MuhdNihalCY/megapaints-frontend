import { safeNumber, safePositive } from "./validation.js";

/**
 * Computes final totals combining all components
 *
 * @param {Object} tinterTotals - Tinter totals from computeTinters
 * @param {number} tinterTotals.totalGrams - Total tinter mass in grams
 * @param {number} tinterTotals.totalVolumeL - Total tinter volume in liters
 * @param {Object} binderTotals - Binder totals from computeBinders
 * @param {number} binderTotals.totalBinderGrams - Total binder mass in grams
 * @param {number} binderTotals.totalBinderVolumeL - Total binder volume in liters
 * @param {Object} additiveTotals - Additive totals from computeAdditives
 * @param {number} additiveTotals.totalAdditiveGrams - Total additive mass in grams
 * @param {number} additiveTotals.totalAdditiveVolumeL - Total additive volume in liters
 *
 * @returns {Object} Final combined totals
 * @returns {number} return.finalGrams - Total formula mass in grams
 * @returns {number} return.finalVolumeL - Total formula volume in liters
 *
 * @example
 * const tinterTotals = { totalGrams: 500, totalVolumeL: 0.5 };
 * const binderTotals = { totalBinderGrams: 300, totalBinderVolumeL: 0.3 };
 * const additiveTotals = { totalAdditiveGrams: 50, totalAdditiveVolumeL: 0.05 };
 * const result = computeFinalTotals(tinterTotals, binderTotals, additiveTotals);
 * // result.finalGrams = 850, result.finalVolumeL = 0.85
 */
export function computeFinalTotals(tinterTotals, binderTotals, additiveTotals) {
    const finalGrams =
        safePositive(tinterTotals?.totalGrams, 0) +
        safePositive(binderTotals?.totalBinderGrams, 0) +
        safePositive(additiveTotals?.totalAdditiveGrams, 0);

    const finalVolumeL =
        safePositive(tinterTotals?.totalVolumeL, 0) +
        safePositive(binderTotals?.totalBinderVolumeL, 0) +
        safePositive(additiveTotals?.totalAdditiveVolumeL, 0);

    return { finalGrams, finalVolumeL };
}

/**
 * Computes quality metrics for the final formula
 *
 * @param {Object} params - Quality metrics input parameters
 * @param {number} params.finalGrams - Total formula mass in grams
 * @param {number} params.finalVolumeL - Total formula volume in liters
 * @param {number} params.totalSolidMass - Total solid mass from tinters in grams
 * @param {number} params.totalVOCmass - Total VOC mass from tinters in grams
 *
 * @returns {Object} Quality metrics
 * @returns {number} return.solidsPercent - Solid content percentage (0-100)
 * @returns {number} return.density_gPerL - Formula density in g/L
 * @returns {number} return.voc_gPerL - VOC content in g/L
 *
 * @example
 * const params = {
 *   finalGrams: 850,
 *   finalVolumeL: 0.68,
 *   totalSolidMass: 170,
 *   totalVOCmass: 20
 * };
 * const result = computeQualityMetrics(params);
 * // result.solidsPercent = 20, result.density_gPerL = 1250, result.voc_gPerL ≈ 29.41
 */
export function computeQualityMetrics({
    finalGrams,
    finalVolumeL,
    totalSolidMass,
    totalVOCmass,
}) {
    // Validate inputs using safe functions
    const mass = safePositive(finalGrams, 0);
    const volume = safePositive(finalVolumeL, 0);
    const solidMass = safePositive(totalSolidMass, 0);
    const vocMass = safePositive(totalVOCmass, 0);

    // Return zeros if invalid inputs
    if (!(mass > 0) || !(volume > 0)) {
        return {
            solidsPercent: 0,
            density_gPerL: 0,
            voc_gPerL: 0,
        };
    }

    // FIXED: Density (g/L) = Mass (g) / Volume (L)
    // Correct physics formula: Density = Mass / Volume
    const density_gPerL = mass / volume;

    // SolidContent = Σ(tinter_solid_content% * tinter_quantity) / TotalGram * 100
    const solidsPercent = (solidMass / mass) * 100;

    // VOC = (Σ(tinter_VOC% * tinter_quantity) / TotalGram) * 100 * 10 * (Density/1000)
    const vocPercent = (vocMass / mass) * 100;
    const voc_gPerL = vocPercent * 10 * (density_gPerL / 1000);

    return {
        solidsPercent: Math.max(0, solidsPercent),
        density_gPerL: Math.max(0, density_gPerL),
        voc_gPerL: Math.max(0, voc_gPerL),
    };
}
