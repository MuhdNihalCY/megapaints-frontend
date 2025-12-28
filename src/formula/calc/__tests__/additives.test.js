/**
 * Unit Tests for Additive Calculations
 * Tests percentage-based calculations and volume formulas
 */

import { describe, it, expect } from "vitest";
import { computeAdditives } from "../additives";

describe("computeAdditives", () => {
    describe("Percentage-based Calculation", () => {
        it("should calculate additive mass from percentage", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 2.5,
                    Additive_Density: 1000,
                },
            ];

            const baseMass = 800; // tinters + binders
            const result = computeAdditives(additives, baseMass);

            // Expected: (800 * 2.5) / 100 = 20g
            expect(result.totalAdditiveGrams).toBe(20);
        });

        it("should handle multiple additives", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 2.5,
                    Additive_Density: 1000,
                },
                {
                    _id: "A2",
                    name: "Additive 2",
                    percent: 1.5,
                    Additive_Density: 1000,
                },
            ];

            const baseMass = 800;
            const result = computeAdditives(additives, baseMass);

            // Expected: (800 * 2.5 / 100) + (800 * 1.5 / 100) = 20 + 12 = 32g
            expect(result.totalAdditiveGrams).toBe(32);
        });

        it("should handle zero percentage", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 0,
                    Additive_Density: 1000,
                },
            ];

            const result = computeAdditives(additives, 800);

            expect(result.totalAdditiveGrams).toBe(0);
        });

        it("should handle fractional percentages", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 0.5, // Half a percent
                    Additive_Density: 1000,
                },
            ];

            const result = computeAdditives(additives, 1000);

            // Expected: (1000 * 0.5) / 100 = 5g
            expect(result.totalAdditiveGrams).toBe(5);
        });
    });

    describe("Volume Calculation (CRITICAL FIX)", () => {
        it("should calculate volume using correct formula: Volume = Mass / Density", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 2.5,
                    Additive_Density: 1000, // g/L
                },
            ];

            const baseMass = 800;
            const result = computeAdditives(additives, baseMass);

            // Mass = 20g (from previous test)
            // Volume = 20 / 1000 = 0.02 L
            expect(result.totalAdditiveVolumeL).toBeCloseTo(0.02, 4);
        });

        it("should handle high density additives", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Dense Additive",
                    percent: 2.5,
                    Additive_Density: 2000, // g/L (dense)
                },
            ];

            const baseMass = 800;
            const result = computeAdditives(additives, baseMass);

            // Mass = 20g
            // Volume = 20 / 2000 = 0.01 L
            expect(result.totalAdditiveVolumeL).toBeCloseTo(0.01, 4);
        });

        it("should handle low density additives", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Light Additive",
                    percent: 2.5,
                    Additive_Density: 500, // g/L (light)
                },
            ];

            const baseMass = 800;
            const result = computeAdditives(additives, baseMass);

            // Mass = 20g
            // Volume = 20 / 500 = 0.04 L
            expect(result.totalAdditiveVolumeL).toBeCloseTo(0.04, 4);
        });

        it("should return 0 volume when density is 0", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 2.5,
                    Additive_Density: 0, // Invalid density
                },
            ];

            const result = computeAdditives(additives, 800);

            expect(result.totalAdditiveVolumeL).toBe(0);
        });

        it("should use default density when not provided", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 2.5,
                    // Additive_Density not provided
                },
            ];

            const result = computeAdditives(additives, 800);

            // Should use default density of 1000 g/L
            // Mass = 20g, Volume = 20 / 1000 = 0.02 L
            expect(result.totalAdditiveVolumeL).toBeCloseTo(0.02, 4);
        });
    });

    describe("Individual Row Data", () => {
        it("should return detailed data for each additive", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 2.5,
                    Additive_Density: 1000,
                },
                {
                    _id: "A2",
                    name: "Additive 2",
                    percent: 1.5,
                    Additive_Density: 1200,
                },
            ];

            const result = computeAdditives(additives, 800);

            expect(result.rows).toHaveLength(2);

            // First additive
            expect(result.rows[0].id).toBe("A1");
            expect(result.rows[0].name).toBe("Additive 1");
            expect(result.rows[0].grams).toBe(20);
            expect(result.rows[0].volumeL).toBeCloseTo(0.02, 4);
            expect(result.rows[0].percent).toBe(2.5);
            expect(result.rows[0].density).toBe(1000);

            // Second additive
            expect(result.rows[1].id).toBe("A2");
            expect(result.rows[1].name).toBe("Additive 2");
            expect(result.rows[1].grams).toBe(12);
            expect(result.rows[1].volumeL).toBeCloseTo(0.01, 4);
            expect(result.rows[1].percent).toBe(1.5);
            expect(result.rows[1].density).toBe(1200);
        });

        it("should handle alternative name field (Additive_Name)", () => {
            const additives = [
                {
                    _id: "A1",
                    Additive_Name: "Additive via legacy field",
                    percent: 2.5,
                    Additive_Density: 1000,
                },
            ];

            const result = computeAdditives(additives, 800);

            expect(result.rows[0].name).toBe("Additive via legacy field");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty array", () => {
            const result = computeAdditives([], 800);

            expect(result.totalAdditiveGrams).toBe(0);
            expect(result.totalAdditiveVolumeL).toBe(0);
            expect(result.rows).toHaveLength(0);
        });

        it("should handle null input", () => {
            const result = computeAdditives(null, 800);

            expect(result.totalAdditiveGrams).toBe(0);
            expect(result.totalAdditiveVolumeL).toBe(0);
            expect(result.rows).toHaveLength(0);
        });

        it("should handle undefined input", () => {
            const result = computeAdditives(undefined, 800);

            expect(result.totalAdditiveGrams).toBe(0);
            expect(result.totalAdditiveVolumeL).toBe(0);
            expect(result.rows).toHaveLength(0);
        });

        it("should handle zero base mass", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    percent: 2.5,
                    Additive_Density: 1000,
                },
            ];

            const result = computeAdditives(additives, 0);

            expect(result.totalAdditiveGrams).toBe(0);
            expect(result.totalAdditiveVolumeL).toBe(0);
        });

        it("should handle missing percent field", () => {
            const additives = [
                {
                    _id: "A1",
                    name: "Additive 1",
                    // percent not provided
                    Additive_Density: 1000,
                },
            ];

            const result = computeAdditives(additives, 800);

            expect(result.totalAdditiveGrams).toBe(0);
        });
    });

    describe("Real-world Example", () => {
        it("should calculate correctly for typical formula", () => {
            const additives = [
                {
                    _id: "catalyst",
                    name: "Catalyst",
                    percent: 1.5,
                    Additive_Density: 950,
                },
                {
                    _id: "thinner",
                    name: "Thinner",
                    percent: 3.0,
                    Additive_Density: 800,
                },
            ];

            const baseMass = 1000; // 1kg of tinters + binders
            const result = computeAdditives(additives, baseMass);

            // Catalyst: 1000 * 1.5 / 100 = 15g
            // Thinner: 1000 * 3.0 / 100 = 30g
            // Total: 45g
            expect(result.totalAdditiveGrams).toBe(45);

            // Catalyst volume: 15 / 950 = 0.0158 L
            // Thinner volume: 30 / 800 = 0.0375 L
            // Total: 0.0533 L
            expect(result.totalAdditiveVolumeL).toBeCloseTo(0.0533, 4);
        });
    });
});
