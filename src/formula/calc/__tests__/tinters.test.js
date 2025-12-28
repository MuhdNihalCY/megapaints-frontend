/**
 * Unit Tests for Tinter Calculations
 * Tests the correct physics formula: Volume = Mass / Density
 *
 * To run these tests, install vitest:
 * npm install -D vitest @vitest/ui
 *
 * Add to package.json scripts:
 * "test": "vitest",
 * "test:ui": "vitest --ui"
 */

import { describe, it, expect } from "vitest";
import { computeTinterRow, computeTinters } from "../tinters";

describe("computeTinterRow", () => {
    describe("Quantity Sum", () => {
        it("should sum all 6 quantity values", () => {
            const result = computeTinterRow({
                qty: [10, 5, 3, 2, 1, 0],
                coefficient: 1,
                Product_Density: 1000,
                SolidContent: 50,
                VOC: 10,
            });

            expect(result.grams).toBe(21); // 10+5+3+2+1+0 = 21
        });

        it("should handle empty or missing quantities", () => {
            const result = computeTinterRow({
                qty: [],
                coefficient: 1,
                Product_Density: 1000,
            });

            expect(result.grams).toBe(0);
        });

        it("should handle null/undefined quantity values", () => {
            const result = computeTinterRow({
                qty: [10, null, undefined, "", 5, 0],
                coefficient: 1,
                Product_Density: 1000,
            });

            expect(result.grams).toBe(15); // 10 + 5 = 15
        });
    });

    describe("Coefficient Application", () => {
        it("should apply coefficient when greater than 0", () => {
            const result = computeTinterRow({
                qty: [10, 5, 0, 0, 0, 0],
                coefficient: 1.5,
                Product_Density: 1000,
            });

            expect(result.grams).toBe(22.5); // 15 * 1.5 = 22.5
        });

        it("should default to coefficient 1 when coefficient is 0", () => {
            const result = computeTinterRow({
                qty: [10, 5, 0, 0, 0, 0],
                coefficient: 0,
                Product_Density: 1000,
            });

            expect(result.grams).toBe(15); // 15 * 1 = 15
        });

        it("should default to coefficient 1 when coefficient is negative", () => {
            const result = computeTinterRow({
                qty: [10, 5, 0, 0, 0, 0],
                coefficient: -2,
                Product_Density: 1000,
            });

            expect(result.grams).toBe(15); // 15 * 1 = 15
        });

        it("should default to coefficient 1 when coefficient is undefined", () => {
            const result = computeTinterRow({
                qty: [10, 5, 0, 0, 0, 0],
                Product_Density: 1000,
            });

            expect(result.grams).toBe(15); // 15 * 1 = 15
        });
    });

    describe("Volume Calculation (CRITICAL FIX)", () => {
        it("should calculate volume using correct formula: Volume = Mass / Density", () => {
            const result = computeTinterRow({
                qty: [100, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 1000, // g/L (water-like)
            });

            // Expected: volume = 100g / 1000 g/L = 0.1 L
            expect(result.volumeL).toBeCloseTo(0.1, 4);
        });

        it("should handle high density materials (denser than water)", () => {
            const result = computeTinterRow({
                qty: [100, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 2000, // g/L (dense material)
            });

            // Expected: volume = 100g / 2000 g/L = 0.05 L
            expect(result.volumeL).toBeCloseTo(0.05, 4);
        });

        it("should handle low density materials (less dense than water)", () => {
            const result = computeTinterRow({
                qty: [100, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 500, // g/L (light material)
            });

            // Expected: volume = 100g / 500 g/L = 0.2 L
            expect(result.volumeL).toBeCloseTo(0.2, 4);
        });

        it("should return 0 volume when density is 0", () => {
            const result = computeTinterRow({
                qty: [100, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 0,
            });

            expect(result.volumeL).toBe(0);
        });

        it("should return 0 volume when density is negative", () => {
            const result = computeTinterRow({
                qty: [100, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: -1000,
            });

            expect(result.volumeL).toBe(0);
        });

        it("should return 0 volume when mass is 0", () => {
            const result = computeTinterRow({
                qty: [0, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 1000,
            });

            expect(result.volumeL).toBe(0);
        });
    });

    describe("Quality Metrics", () => {
        it("should extract solid content percentage", () => {
            const result = computeTinterRow({
                qty: [10, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 1000,
                SolidContent: 65,
            });

            expect(result.solidsPercent).toBe(65);
        });

        it("should extract VOC percentage", () => {
            const result = computeTinterRow({
                qty: [10, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 1000,
                VOC: 15,
            });

            expect(result.vocPercent).toBe(15);
        });

        it("should default to 0 for missing metrics", () => {
            const result = computeTinterRow({
                qty: [10, 0, 0, 0, 0, 0],
                coefficient: 1,
                Product_Density: 1000,
            });

            expect(result.solidsPercent).toBe(0);
            expect(result.vocPercent).toBe(0);
        });
    });

    describe("Real-world Example", () => {
        it("should calculate correctly for typical paint tinter", () => {
            const result = computeTinterRow({
                qty: [15.7, 0, 0, 0, 0, 0],
                coefficient: 1.2,
                Product_Density: 1200, // g/L
                SolidContent: 50,
                VOC: 10,
            });

            const expectedMass = 15.7 * 1.2; // = 18.84g
            const expectedVolume = 18.84 / 1200; // = 0.0157 L

            expect(result.grams).toBeCloseTo(expectedMass, 2);
            expect(result.volumeL).toBeCloseTo(expectedVolume, 4);
            expect(result.solidsPercent).toBe(50);
            expect(result.vocPercent).toBe(10);
        });
    });
});

describe("computeTinters", () => {
    describe("Multiple Tinters Aggregation", () => {
        it("should sum grams and volumes from multiple tinters", () => {
            const tinters = [
                {
                    qty: [10, 0, 0, 0, 0, 0],
                    coefficient: 1,
                    Product_Density: 1000,
                    SolidContent: 50,
                    VOC: 10,
                },
                {
                    qty: [20, 0, 0, 0, 0, 0],
                    coefficient: 1,
                    Product_Density: 1000,
                    SolidContent: 60,
                    VOC: 15,
                },
            ];

            const result = computeTinters(tinters);

            expect(result.totalGrams).toBe(30); // 10 + 20
            expect(result.totalVolumeL).toBeCloseTo(0.03, 4); // 0.01 + 0.02
        });

        it("should handle empty array", () => {
            const result = computeTinters([]);

            expect(result.totalGrams).toBe(0);
            expect(result.totalVolumeL).toBe(0);
            expect(result.totalSolidMass).toBe(0);
            expect(result.totalVOCMass).toBe(0);
        });

        it("should handle null/undefined input", () => {
            const result1 = computeTinters(null);
            const result2 = computeTinters(undefined);

            expect(result1.totalGrams).toBe(0);
            expect(result2.totalGrams).toBe(0);
        });
    });

    describe("Solid Content Calculation", () => {
        it("should calculate total solid mass correctly", () => {
            const tinters = [
                {
                    qty: [100, 0, 0, 0, 0, 0], // 100g
                    coefficient: 1,
                    Product_Density: 1000,
                    SolidContent: 50, // 50% solids = 50g solid
                },
                {
                    qty: [200, 0, 0, 0, 0, 0], // 200g
                    coefficient: 1,
                    Product_Density: 1000,
                    SolidContent: 60, // 60% solids = 120g solid
                },
            ];

            const result = computeTinters(tinters);

            // Total solid = 50g + 120g = 170g
            expect(result.totalSolidMass).toBeCloseTo(170, 2);
        });
    });

    describe("VOC Calculation", () => {
        it("should calculate total VOC mass correctly", () => {
            const tinters = [
                {
                    qty: [100, 0, 0, 0, 0, 0], // 100g
                    coefficient: 1,
                    Product_Density: 1000,
                    VOC: 10, // 10% VOC = 10g VOC
                },
                {
                    qty: [200, 0, 0, 0, 0, 0], // 200g
                    coefficient: 1,
                    Product_Density: 1000,
                    VOC: 5, // 5% VOC = 10g VOC
                },
            ];

            const result = computeTinters(tinters);

            // Total VOC = 10g + 10g = 20g
            expect(result.totalVOCMass).toBeCloseTo(20, 2);
        });
    });
});
