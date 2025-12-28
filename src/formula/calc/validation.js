/**
 * Validation utilities for formula calculations
 * Provides robust validation and fallback handling for numeric inputs
 */

/**
 * Validates and safely converts a value to a number
 * @param {*} value - Value to validate
 * @param {number} defaultValue - Default value if validation fails
 * @param {number} [min] - Minimum allowed value (optional)
 * @param {number} [max] - Maximum allowed value (optional)
 * @returns {number} Validated number or default value
 */
export function safeNumber(
    value,
    defaultValue = 0,
    min = undefined,
    max = undefined,
) {
    const num = Number(value);

    // Check if NaN or invalid
    if (!Number.isFinite(num)) {
        return defaultValue;
    }

    // Apply min constraint
    if (min !== undefined && num < min) {
        return defaultValue;
    }

    // Apply max constraint
    if (max !== undefined && num > max) {
        return defaultValue;
    }

    return num;
}

/**
 * Validates a positive number (greater than 0)
 * @param {*} value - Value to validate
 * @param {number} defaultValue - Default value if validation fails
 * @returns {number} Validated positive number or default value
 */
export function safePositive(value, defaultValue = 0) {
    return safeNumber(value, defaultValue, 0);
}

/**
 * Validates a percentage (0-100)
 * @param {*} value - Value to validate
 * @param {number} defaultValue - Default value if validation fails
 * @returns {number} Validated percentage or default value
 */
export function safePercent(value, defaultValue = 0) {
    return safeNumber(value, defaultValue, 0, 100);
}

/**
 * Validates an array of quantities (6 values for tinter rows)
 * @param {Array} quantities - Array of quantity values
 * @returns {Array} Validated array with 6 numeric values
 */
export function safeQuantities(quantities) {
    if (!Array.isArray(quantities)) {
        return [0, 0, 0, 0, 0, 0];
    }

    // Ensure exactly 6 values
    const safe = [...quantities];
    while (safe.length < 6) {
        safe.push(0);
    }

    // Convert all to safe numbers
    return safe.slice(0, 6).map((q) => safeNumber(q, 0));
}

/**
 * Validates density value (must be positive, with reasonable limits)
 * @param {*} value - Density value to validate
 * @param {number} defaultValue - Default density (1000 g/L for water-like)
 * @returns {number} Validated density or default
 */
export function safeDensity(value, defaultValue = 1000) {
    // Densities typically range from 500 (light) to 3000 (heavy) g/L
    return safeNumber(value, defaultValue, 1, 10000);
}

/**
 * Validates coefficient (must be positive, default to 1)
 * @param {*} value - Coefficient value to validate
 * @returns {number} Validated coefficient (default 1)
 */
export function safeCoefficient(value) {
    const coef = safeNumber(value, 0);
    return coef > 0 ? coef : 1; // Default to 1 if invalid or <= 0
}

/**
 * Validates divisor (must be positive to avoid division by zero)
 * @param {*} value - Divisor value to validate
 * @param {number} defaultValue - Default divisor
 * @returns {number} Validated divisor (never 0)
 */
export function safeDivisor(value, defaultValue = 1) {
    const divisor = safeNumber(value, defaultValue);
    return divisor !== 0 ? divisor : defaultValue;
}

/**
 * Validates tinter row data structure
 * @param {Object} row - Tinter row object
 * @returns {Object} Validation result with errors array
 */
export function validateTinterRow(row) {
    const errors = [];

    if (!row || typeof row !== "object") {
        errors.push("Tinter row must be an object");
        return { valid: false, errors };
    }

    // Validate quantities
    if (!Array.isArray(row.qty)) {
        errors.push("Quantities must be an array");
    }

    // Validate density
    const density = Number(row.Product_Density);
    if (!Number.isFinite(density) || density <= 0) {
        errors.push("Invalid or missing Product_Density");
    }

    // Validate coefficient (warning only, will default to 1)
    const coef = Number(row.coefficient);
    if (Number.isFinite(coef) && coef <= 0) {
        errors.push("Warning: coefficient <= 0, will default to 1");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validates binder configuration
 * @param {Object} cfg - Binder configuration object
 * @returns {Object} Validation result with errors array
 */
export function validateBinderConfig(cfg) {
    const errors = [];

    if (!cfg || typeof cfg !== "object") {
        errors.push("Binder configuration must be an object");
        return { valid: false, errors };
    }

    // If Binder1 is configured, validate equation parameters
    if (cfg.Binder1) {
        const d = Number(cfg.Binder1dvalue);
        if (d === 0) {
            errors.push("Binder1dvalue cannot be 0 (division by zero)");
        }

        // Validate density
        const density = Number(cfg.Binder1_Density || cfg.Binder_Density);
        if (!Number.isFinite(density) || density <= 0) {
            errors.push("Invalid Binder1 density");
        }
    }

    // If Binder2 is configured, validate parameters
    if (cfg.Binder2) {
        const density = Number(cfg.Binder2_Density || cfg.Binder_Density);
        if (!Number.isFinite(density) || density <= 0) {
            errors.push("Invalid Binder2 density");
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validates additive data
 * @param {Object} additive - Additive object
 * @returns {Object} Validation result with errors array
 */
export function validateAdditive(additive) {
    const errors = [];

    if (!additive || typeof additive !== "object") {
        errors.push("Additive must be an object");
        return { valid: false, errors };
    }

    // Validate percentage
    const percent = Number(additive.percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        errors.push("Invalid percentage (must be 0-100)");
    }

    // Validate density
    const density = Number(additive.Additive_Density);
    if (Number.isFinite(density) && density <= 0) {
        errors.push("Invalid Additive_Density (must be > 0)");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validates quality metrics inputs
 * @param {Object} params - Quality metrics parameters
 * @returns {Object} Validation result with errors array
 */
export function validateQualityMetrics(params) {
    const errors = [];

    if (!params || typeof params !== "object") {
        errors.push("Quality metrics parameters must be an object");
        return { valid: false, errors };
    }

    // Validate mass
    const mass = Number(params.finalGrams);
    if (!Number.isFinite(mass) || mass < 0) {
        errors.push("Invalid finalGrams (must be >= 0)");
    }

    // Validate volume
    const volume = Number(params.finalVolumeL);
    if (!Number.isFinite(volume) || volume < 0) {
        errors.push("Invalid finalVolumeL (must be >= 0)");
    }

    // Check for division by zero in density calculation
    if (mass > 0 && volume === 0) {
        errors.push("Cannot calculate density: volume is 0 but mass is > 0");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
