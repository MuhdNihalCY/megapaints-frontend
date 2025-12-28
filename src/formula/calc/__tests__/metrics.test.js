/**
 * Unit Tests for Quality Metrics Calculations
 * Tests formula totals, density, solid content, and VOC calculations
 */

import { describe, it, expect } from "vitest";
import { computeFinalTotals, computeQualityMetrics } from "../metrics";

describe("computeFinalTotals", () => {
    it("should sum grams from all components", () => {
        const tinterTotals = { totalGrams: 500, totalVolumeL: 0.5 };
        const binderTotals = { totalBinderGrams: 300, totalBinderVolumeL: 0.3 };
        const additiveTotals = {
            totalAdditiveGrams: 50,
            totalAdditiveVolumeL: 0.05,
        };

        const result = computeFinalTotals(
            tinterTotals,
            binderTotals,
            additiveTotals,
        );

        expect(result.finalGrams).toBe(850); // 500 + 300 + 50
    });

    it("should sum volumes from all components", () => {
        const tinterTotals = { totalGrams: 500, totalVolumeL: 0.5 };
        const binderTotals = { totalBinderGrams: 300, totalBinderVolumeL: 0.3 };
        const additiveTotals = {
            totalAdditiveGrams: 50,
            totalAdditiveVolumeL: 0.05,
        };

        const result = computeFinalTotals(
            tinterTotals,
            binderTotals,
            additiveTotals,
        );

        expect(result.finalVolumeL).toBeCloseTo(0.85, 2); // 0.5 + 0.3 + 0.05
    });

    it("should handle missing components", () => {
        const tinterTotals = { totalGrams: 500, totalVolumeL: 0.5 };

        const result = computeFinalTotals(tinterTotals, {}, {});

        expect(result.finalGrams).toBe(500);
        expect(result.finalVolumeL).toBeCloseTo(0.5, 2);
    });

    it("should handle null/undefined inputs", () => {
        const result = computeFinalTotals(null, undefined, {});

        expect(result.finalGrams).toBe(0);
        expect(result.finalVolumeL).toBe(0);
    });
});

describe("computeQualityMetrics", () => {
    describe("Density Calculation (CRITICAL FIX)", () => {
        it("should calculate density using correct formula: Density = Mass / Volume", () => {
            const params = {
                finalGrams: 1000,
                finalVolumeL: 0.8,
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            // Expected: density = 1000g / 0.8L = 1250 g/L
            expect(result.density_gPerL).toBeCloseTo(1250, 2);
        });

        it("should calculate density for water-like substances", () => {
            const params = {
                finalGrams: 1000,
                finalVolumeL: 1.0, // 1 liter
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            // Expected: density = 1000g / 1L = 1000 g/L (water)
            expect(result.density_gPerL).toBeCloseTo(1000, 2);
        });

        it("should calculate density for dense materials", () => {
            const params = {
                finalGrams: 2000,
                finalVolumeL: 1.0,
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            // Expected: density = 2000g / 1L = 2000 g/L
            expect(result.density_gPerL).toBeCloseTo(2000, 2);
        });

        it("should return 0 when volume is 0", () => {
            const params = {
                finalGrams: 1000,
                finalVolumeL: 0, // Division by zero
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.density_gPerL).toBe(0);
        });

        it("should return 0 when mass is 0", () => {
            const params = {
                finalGrams: 0,
                finalVolumeL: 1.0,
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.density_gPerL).toBe(0);
        });
    });

    describe("Solid Content Percentage", () => {
        it("should calculate solid content percentage correctly", () => {
            const params = {
                finalGrams: 500,
                finalVolumeL: 0.5,
                totalSolidMass: 170, // From plan example
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            // Expected: (170 / 500) * 100 = 34%
            expect(result.solidsPercent).toBeCloseTo(34, 2);
        });

        it("should handle 100% solid content", () => {
            const params = {
                finalGrams: 500,
                finalVolumeL: 0.4,
                totalSolidMass: 500, // All solid
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.solidsPercent).toBeCloseTo(100, 2);
        });

        it("should handle 0% solid content", () => {
            const params = {
                finalGrams: 500,
                finalVolumeL: 0.5,
                totalSolidMass: 0, // No solids
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.solidsPercent).toBe(0);
        });

        it("should not allow negative solid content", () => {
            const params = {
                finalGrams: 500,
                finalVolumeL: 0.5,
                totalSolidMass: -10, // Invalid negative
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.solidsPercent).toBeGreaterThanOrEqual(0);
        });
    });

    describe("VOC Calculation", () => {
        it("should calculate VOC correctly from plan example", () => {
            const params = {
                finalGrams: 500,
                finalVolumeL: 0.4, // Gives density of 1250 g/L
                totalSolidMass: 0,
                totalVOCmass: 20, // From plan example
            };

            const result = computeQualityMetrics(params);

            // VOC% = (20 / 500) * 100 = 4%
            // Density = 500 / 0.4 = 1250 g/L
            // Formula VOC = 4 * 10 * (1250 / 1000) = 40 * 1.25 = 50 g/L
            expect(result.voc_gPerL).toBeCloseTo(50, 2);
        });

        it("should handle zero VOC", () => {
            const params = {
                finalGrams: 500,
                finalVolumeL: 0.5,
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.voc_gPerL).toBe(0);
        });

        it("should calculate VOC for typical paint formula", () => {
            const params = {
                finalGrams: 1000,
                finalVolumeL: 0.8, // Density = 1250 g/L
                totalSolidMass: 0,
                totalVOCmass: 50, // 5% VOC
            };

            const result = computeQualityMetrics(params);

            // VOC% = (50 / 1000) * 100 = 5%
            // Density = 1000 / 0.8 = 1250 g/L
            // Formula VOC = 5 * 10 * (1250 / 1000) = 50 * 1.25 = 62.5 g/L
            expect(result.voc_gPerL).toBeCloseTo(62.5, 2);
        });

        it("should not allow negative VOC", () => {
            const params = {
                finalGrams: 500,
                finalVolumeL: 0.5,
                totalSolidMass: 0,
                totalVOCmass: -10, // Invalid negative
            };

            const result = computeQualityMetrics(params);

            expect(result.voc_gPerL).toBeGreaterThanOrEqual(0);
        });
    });

    describe("Edge Cases", () => {
        it("should return all zeros for invalid inputs", () => {
            const params = {
                finalGrams: 0,
                finalVolumeL: 0,
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.solidsPercent).toBe(0);
            expect(result.density_gPerL).toBe(0);
            expect(result.voc_gPerL).toBe(0);
        });

        it("should handle NaN inputs gracefully", () => {
            const params = {
                finalGrams: NaN,
                finalVolumeL: NaN,
                totalSolidMass: NaN,
                totalVOCmass: NaN,
            };

            const result = computeQualityMetrics(params);

            expect(result.solidsPercent).toBe(0);
            expect(result.density_gPerL).toBe(0);
            expect(result.voc_gPerL).toBe(0);
        });

        it("should handle negative volume", () => {
            const params = {
                finalGrams: 1000,
                finalVolumeL: -0.5, // Invalid negative
                totalSolidMass: 0,
                totalVOCmass: 0,
            };

            const result = computeQualityMetrics(params);

            expect(result.density_gPerL).toBe(0);
        });
    });

    describe("Complete Formula Example", () => {
        it("should calculate all metrics correctly for realistic formula", () => {
            // Formula composition:
            // - Tinters: 500g with 170g solids and 20g VOC
            // - Binders: 300g
            // - Additives: 50g
            // Total: 850g, 0.68L (calculated based on individual densities)

            const params = {
                finalGrams: 850,
                finalVolumeL: 0.68,
                totalSolidMass: 170,
                totalVOCmass: 20,
            };

            const result = computeQualityMetrics(params);

            // Solid content: (170 / 850) * 100 = 20%
            expect(result.solidsPercent).toBeCloseTo(20, 1);

            // Density: 850 / 0.68 = 1250 g/L
            expect(result.density_gPerL).toBeCloseTo(1250, 0);

            // VOC: (20 / 850) * 100 = 2.35%
            // VOC g/L = 2.35 * 10 * (1250 / 1000) = 29.41 g/L
            expect(result.voc_gPerL).toBeCloseTo(29.41, 1);
        });
    });
});
