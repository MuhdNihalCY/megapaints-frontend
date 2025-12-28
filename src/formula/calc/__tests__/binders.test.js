/**
 * Unit Tests for Binder Calculations
 * Tests complex binder equations and volume calculations
 */

import { describe, it, expect } from "vitest";
import { computeBinders } from "../binders";

describe("computeBinders", () => {
    describe("No Binders Configured", () => {
        it("should return all zeros when no binders are configured", () => {
            const result = computeBinders(500, {});

            expect(result.binder1).toBe(0);
            expect(result.binder2).toBe(0);
            expect(result.binder1VolumeL).toBe(0);
            expect(result.binder2VolumeL).toBe(0);
            expect(result.totalBinderGrams).toBe(0);
            expect(result.totalBinderVolumeL).toBe(0);
        });
    });

    describe("Binder 1 Calculation", () => {
        it("should calculate Binder 1 using correct equation", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Formula: ((500 * 0.5 * 1) - (0.2 * 0.3 * 500)) / 0.9
            // = (250 - 30) / 0.9
            // = 220 / 0.9
            // = 244.44
            expect(result.binder1).toBeCloseTo(244.44, 2);
        });

        it("should apply matt/gloss factor in Binder 1 calculation", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                MattValue: 2, // Matt factor = 2
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Formula: ((500 * 0.5 * 2) - (0.2 * 0.3 * 500)) / 0.9
            // = (500 - 30) / 0.9
            // = 470 / 0.9
            // = 522.22
            expect(result.binder1).toBeCloseTo(522.22, 2);
        });

        it("should return 0 when D (denominator) is 0", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0, // Division by zero
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            expect(result.binder1).toBe(0);
        });

        it("should handle missing equation parameters gracefully", () => {
            const config = {
                Binder1: "B1",
                // Missing equation parameters
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // With all parameters = 0 (except D defaults to 1):
            // ((500 * 0 * 1) - (0 * 0 * 500)) / 1 = 0
            expect(result.binder1).toBe(0);
        });

        it("should not allow negative binder 1 values", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.1, // Small A
                Binder1Bvalue: 0.5, // Large B
                Binder1Cvalue: 0.5,
                Binder1dvalue: 0.5,
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Formula could result in negative, but should be clamped to 0
            expect(result.binder1).toBeGreaterThanOrEqual(0);
        });
    });

    describe("Binder 2 Calculation", () => {
        it("should calculate Binder 2 using Equation Type 1 (Eq1)", () => {
            const config = {
                Binder1: "B1",
                Binder2: "B2",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                Binder2Avalue: 0.6,
                Binder2Equation: "Eq1", // Type 1
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Binder1 = 244.44 (from previous test)
            // Binder2 (Eq1) = (500 * 0.6) - 244.44
            // = 300 - 244.44
            // = 55.56
            expect(result.binder1).toBeCloseTo(244.44, 2);
            expect(result.binder2).toBeCloseTo(55.56, 2);
        });

        it("should calculate Binder 2 using Equation Type 2 (Eq2)", () => {
            const config = {
                Binder1: "B1",
                Binder2: "B2",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                Binder2Avalue: 0.3,
                Binder2Equation: "Eq2", // Type 2
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Binder1 = 244.44 (from previous test)
            // Binder2 (Eq2) = 500 * 0.3
            // = 150
            expect(result.binder1).toBeCloseTo(244.44, 2);
            expect(result.binder2).toBeCloseTo(150, 2);
        });

        it("should default to Eq1 when equation type is not specified", () => {
            const config = {
                Binder1: "B1",
                Binder2: "B2",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                Binder2Avalue: 0.6,
                // Binder2Equation not specified
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Should use Eq1 by default
            expect(result.binder2).toBeCloseTo(55.56, 2);
        });

        it("should not allow negative binder 2 values", () => {
            const config = {
                Binder1: "B1",
                Binder2: "B2",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                Binder2Avalue: 0.1, // Small A2, will result in negative
                Binder2Equation: "Eq1",
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Binder2 = (500 * 0.1) - 244.44 = 50 - 244.44 = -194.44
            // Should be clamped to 0
            expect(result.binder2).toBe(0);
        });
    });

    describe("Binder Volume Calculation (CRITICAL FIX)", () => {
        it("should calculate binder volume using correct formula: Volume = Mass / Density", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                MattValue: 1,
                Binder_Density: 1000, // g/L
            };

            const result = computeBinders(500, config);

            // Binder1 mass = 244.44g
            // Volume = 244.44 / 1000 = 0.24444 L
            expect(result.binder1VolumeL).toBeCloseTo(0.24444, 4);
        });

        it("should handle high density binders", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                MattValue: 1,
                Binder_Density: 2000, // g/L (dense binder)
            };

            const result = computeBinders(500, config);

            // Binder1 mass = 244.44g
            // Volume = 244.44 / 2000 = 0.12222 L
            expect(result.binder1VolumeL).toBeCloseTo(0.12222, 4);
        });

        it("should return 0 volume when density is 0", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                MattValue: 1,
                Binder_Density: 0, // Invalid density
            };

            const result = computeBinders(500, config);

            expect(result.binder1VolumeL).toBe(0);
        });
    });

    describe("Total Calculations", () => {
        it("should sum binder grams correctly", () => {
            const config = {
                Binder1: "B1",
                Binder2: "B2",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                Binder2Avalue: 0.6,
                Binder2Equation: "Eq1",
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Total = Binder1 + Binder2 = 244.44 + 55.56 = 300
            expect(result.totalBinderGrams).toBeCloseTo(300, 2);
        });

        it("should sum binder volumes correctly", () => {
            const config = {
                Binder1: "B1",
                Binder2: "B2",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                Binder2Avalue: 0.6,
                Binder2Equation: "Eq1",
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            // Total volume = 0.24444 + 0.05556 = 0.3 L
            expect(result.totalBinderVolumeL).toBeCloseTo(0.3, 4);
        });
    });

    describe("Edge Cases", () => {
        it("should handle zero tinter total", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(0, config);

            expect(result.binder1).toBe(0);
            expect(result.totalBinderGrams).toBe(0);
        });

        it("should handle only Binder1 configured", () => {
            const config = {
                Binder1: "B1",
                Binder1Avalue: 0.5,
                Binder1Bvalue: 0.2,
                Binder1Cvalue: 0.3,
                Binder1dvalue: 0.9,
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            expect(result.binder1).toBeGreaterThan(0);
            expect(result.binder2).toBe(0);
        });

        it("should handle only Binder2 configured", () => {
            const config = {
                Binder2: "B2",
                Binder2Avalue: 0.3,
                Binder2Equation: "Eq2",
                MattValue: 1,
                Binder_Density: 1000,
            };

            const result = computeBinders(500, config);

            expect(result.binder1).toBe(0);
            expect(result.binder2).toBeGreaterThan(0);
        });
    });
});
