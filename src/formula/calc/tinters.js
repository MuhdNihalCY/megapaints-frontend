import {
    safeQuantities,
    safeCoefficient,
    safeDensity,
    safePercent,
} from "./validation.js";

/**
 * Computes values for a single tinter row
 *
 * @param {Object} row - Tinter row data
 * @param {Array<number>} row.qty - Array of 6 quantity values
 * @param {number} [row.coefficient=1] - Coefficient multiplier
 * @param {number} [row.Product_Density=1000] - Product density in g/L
 * @param {number} [row.SolidContent=0] - Solid content percentage (0-100)
 * @param {number} [row.VOC=0] - VOC percentage (0-100)
 * @param {string} [row.name] - Product name (for logging)
 *
 * @returns {Object} Calculated values
 * @returns {number} return.grams - Total mass in grams
 * @returns {number} return.volumeL - Total volume in liters
 * @returns {number} return.solidsPercent - Solid content percentage
 * @returns {number} return.vocPercent - VOC percentage
 *
 * @example
 * const result = computeTinterRow({
 *   qty: [10, 5, 0, 0, 0, 0],
 *   coefficient: 1.2,
 *   Product_Density: 1200,
 *   SolidContent: 50,
 *   VOC: 10
 * });
 */
export function computeTinterRow(row) {
    // Validate and sanitize inputs
    const quantities = safeQuantities(row?.qty);
    const sum = quantities.reduce((s, n) => s + n, 0);
    const coefficient = safeCoefficient(row?.coefficient);
    const grams = sum * coefficient;

    // FIXED: Density is in g/L - Volume (L) = Mass (g) / Density (g/L)
    // Correct physics formula: Volume = Mass / Density
    const density_g_per_l = safeDensity(row?.Product_Density, 1000);
    const volumeL = density_g_per_l > 0 ? grams / density_g_per_l : 0;

    // Validate quality metrics (0-100 range)
    const solidsPercent = safePercent(row?.SolidContent, 0);
    const vocPercent = safePercent(row?.VOC, 0);

    // Debug logging for density conversion (development only)
    if (
        process.env.NODE_ENV === "development" &&
        grams > 0 &&
        density_g_per_l > 0
    ) {
        console.log(
            "[Tinter Calc] Product:",
            row?.name || "Unknown",
            "Mass:",
            grams.toFixed(2),
            "g",
            "Density:",
            density_g_per_l,
            "g/L",
            "Volume:",
            volumeL.toFixed(4),
            "L",
            "Solids:",
            solidsPercent + "%",
            "VOC:",
            vocPercent + "%",
        );
    }

    return {
        grams,
        volumeL,
        solidsPercent,
        vocPercent,
    };
}

/**
 * Computes totals for all tinter rows
 *
 * @param {Array<Object>} rows - Array of tinter row objects
 * @returns {Object} Aggregated totals
 * @returns {number} return.totalGrams - Total mass of all tinters in grams
 * @returns {number} return.totalVolumeL - Total volume of all tinters in liters
 * @returns {number} return.totalSolidMass - Total solid mass in grams
 * @returns {number} return.totalVOCMass - Total VOC mass in grams
 *
 * @example
 * const tinters = [
 *   { qty: [10, 0, 0, 0, 0, 0], coefficient: 1, Product_Density: 1000, SolidContent: 50, VOC: 10 },
 *   { qty: [20, 0, 0, 0, 0, 0], coefficient: 1, Product_Density: 1200, SolidContent: 60, VOC: 15 }
 * ];
 * const result = computeTinters(tinters);
 * // result.totalGrams = 30, result.totalVolumeL ≈ 0.0267
 */
export function computeTinters(rows) {
    const safeRows = Array.isArray(rows) ? rows : [];
    let totalGrams = 0;
    let totalVolumeL = 0;
    let totalSolidMass = 0;
    let totalVOCMass = 0;

    for (const r of safeRows) {
        const { grams, volumeL, solidsPercent, vocPercent } =
            computeTinterRow(r);
        totalGrams += grams;
        totalVolumeL += volumeL;
        totalSolidMass += grams * (solidsPercent / 100);
        totalVOCMass += grams * (vocPercent / 100);
    }

    return { totalGrams, totalVolumeL, totalSolidMass, totalVOCMass };
}
