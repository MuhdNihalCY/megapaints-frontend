# Formula Calculation Reference Guide

This guide documents all calculation formulas used in the formula system.

## Table of Contents

1. [Overview](#overview)
2. [Tinter Calculations](#tinter-calculations)
3. [Binder Calculations](#binder-calculations)
4. [Additive Calculations](#additive-calculations)
5. [Quality Metrics](#quality-metrics)
6. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Overview

The formula calculation system computes paint formulas based on tinter (colorant) quantities, binder requirements, and additive percentages. All calculations follow standard physics principles:

- **Volume = Mass / Density**
- **Density = Mass / Volume**
- **Percentage calculations are based on base mass**

### Units

- **Mass**: Grams (g)
- **Volume**: Liters (L)
- **Density**: Grams per liter (g/L)
- **Percentages**: 0-100

---

## Tinter Calculations

### 1. Quantity Sum

Tinters have 6 quantity columns that are summed together.

**Formula**:

```javascript
totalQuantity = qty[0] + qty[1] + qty[2] + qty[3] + qty[4] + qty[5];
```

**Example**:

```javascript
qty = [10.5, 5.2, 0, 0, 0, 0];
totalQuantity = 15.7;
```

### 2. Mass (Grams) Calculation

The quantity sum is multiplied by a coefficient (defaulting to 1 if invalid).

**Formula**:

```javascript
mass_grams = totalQuantity × coefficient
```

Where:

- `coefficient > 0`: Use provided value
- `coefficient ≤ 0` or missing: Default to 1

**Example**:

```javascript
totalQuantity = 15.7
coefficient = 1.2
mass = 15.7 × 1.2 = 18.84 grams
```

### 3. Volume Calculation

**Formula** (CRITICAL - CORRECTED):

```javascript
volume_L = mass_grams / density_g_per_L;
```

This is the correct physics formula: **Volume = Mass / Density**

**Example**:

```javascript
mass = 100 grams
density = 1000 g/L (water-like)
volume = 100 / 1000 = 0.1 L
```

**Common Densities**:

- Water: ~1000 g/L (1 g/mL)
- Light materials: 500-900 g/L
- Heavy materials: 1200-3000 g/L

### 4. Solid Content & VOC

These are extracted directly from product data as percentages.

**Formula for mass contribution**:

```javascript
solidMass = mass_grams × (solidContent% / 100)
vocMass = mass_grams × (VOC% / 100)
```

---

## Binder Calculations

Binders are calculated based on complex equations derived from subcategory configuration.

### 1. Binder 1 Mass

**Formula**:

```javascript
binder1 = ((tinterTotal × A × mattGloss) - (B × C × tinterTotal)) / D
```

Where:

- `tinterTotal`: Sum of all tinter masses
- `A, B, C, D`: Equation parameters from subcategory config
- `mattGloss`: Matt/Gloss factor (default 1)

**Edge Cases**:

- If `D = 0`: Return 0 (avoid division by zero)
- If result < 0: Return 0 (no negative masses)

**Example**:

```javascript
tinterTotal = 500g
A = 0.5, B = 0.2, C = 0.3, D = 0.9
mattGloss = 1

numerator = (500 × 0.5 × 1) - (0.2 × 0.3 × 500)
         = 250 - 30 = 220
binder1 = 220 / 0.9 = 244.44 grams
```

### 2. Binder 2 Mass

Two equation types are supported:

**Type 1 (Eq1)**:

```javascript
binder2 = (tinterTotal × A2) - binder1
```

**Type 2 (Eq2)**:

```javascript
binder2 = tinterTotal × A2
```

Where:

- `A2`: Binder2 equation parameter
- Equation type determined by `Binder2Equation` config

**Example (Eq1)**:

```javascript
tinterTotal = 500g
A2 = 0.6
binder1 = 244.44g

binder2 = (500 × 0.6) - 244.44
       = 300 - 244.44 = 55.56 grams
```

### 3. Binder Volume

**Formula** (CRITICAL - CORRECTED):

```javascript
volumeL = mass_grams / density_g_per_L;
```

**Individual Binder Densities**:

The system now supports individual densities for each binder:

- `Binder1_Density`: Specific density for Binder 1
- `Binder2_Density`: Specific density for Binder 2
- `Binder_Density`: Fallback density if individual densities not provided

**Example**:

```javascript
binder1 = 244.44g
binder1Density = 1100 g/L
binder1Volume = 244.44 / 1100 = 0.222 L

binder2 = 55.56g
binder2Density = 900 g/L
binder2Volume = 55.56 / 900 = 0.062 L
```

---

## Additive Calculations

Additives are calculated as percentages of the base mass (tinters + binders).

### 1. Additive Mass

**Formula**:

```javascript
additiveMass = (baseMass × percentage) / 100
```

Where:

- `baseMass = tinterTotal + binder1 + binder2`
- `percentage`: 0-100

**Example**:

```javascript
baseMass = 800g
percentage = 2.5%
additiveMass = (800 × 2.5) / 100 = 20 grams
```

### 2. Additive Volume

**Formula** (CRITICAL - CORRECTED):

```javascript
volumeL = mass_grams / density_g_per_L;
```

**Example**:

```javascript
additiveMass = 20g
additiveDensity = 1000 g/L
additiveVolume = 20 / 1000 = 0.02 L
```

---

## Quality Metrics

### 1. Final Totals

**Formulas**:

```javascript
totalGrams = tinterTotal + binderTotal + additiveTotal;
totalVolumeL = tinterVolume + binderVolume + additiveVolume;
```

### 2. Formula Density

**Formula** (CRITICAL - CORRECTED):

```javascript
density_gPerL = totalGrams / totalVolumeL;
```

This is the correct physics formula: **Density = Mass / Volume**

**Example**:

```javascript
totalGrams = 1000g
totalVolumeL = 0.8L
density = 1000 / 0.8 = 1250 g/L
```

### 3. Solid Content Percentage

**Formula**:

```javascript
productSolidContent = Σ (tinter.solidContent% × tinter.mass / 100) for all tinters
formulaSolidContent% = (productSolidContent / totalMass) × 100
```

**Example**:

```javascript
Tinter 1: mass=100g, solidContent=50%  → 50g solid
Tinter 2: mass=200g, solidContent=60%  → 120g solid
Total solid = 170g
Total formula = 500g
Formula solid% = (170 / 500) × 100 = 34%
```

### 4. VOC (Volatile Organic Compounds)

**Formula**:

```javascript
sumVOC = Σ (tinter.VOC% × tinter.mass / 100) for all tinters
vocPercentage = (sumVOC / totalMass) × 100
formula_VOC_gPerL = vocPercentage × 10 × (density_gPerL / 1000)
```

**Example**:

```javascript
Tinter 1: mass=100g, VOC=10%  → 10g VOC
Tinter 2: mass=200g, VOC=5%   → 10g VOC
Total VOC = 20g
Total formula = 500g
VOC% = (20 / 500) × 100 = 4%
Density = 1250 g/L
Formula VOC = 4 × 10 × (1250 / 1000) = 50 g/L
```

---

## Common Issues & Troubleshooting

### Issue 1: Incorrect Volume Calculations

**Problem**: Volumes are way off, formulas don't add up.

**Cause**: Using wrong formula (multiplying by density instead of dividing).

**Solution**:

```javascript
// WRONG
volumeL = (mass × density) / 1000  ❌

// CORRECT
volumeL = mass / density  ✅
```

### Issue 2: Division by Zero

**Problem**: NaN or Infinity results in calculations.

**Causes**:

- Density = 0
- Binder1dvalue (D) = 0
- Volume = 0 in density calculation

**Solution**: Use validation utilities that provide safe defaults:

```javascript
import { safeDensity, safeDivisor } from "./validation.js";

const density = safeDensity(product.density, 1000); // Default 1000
const D = safeDivisor(config.Binder1dvalue, 1); // Default 1, never 0
```

### Issue 3: Negative Binder Values

**Problem**: Binder calculations result in negative values.

**Cause**: Equation parameters configured incorrectly for the tinter quantities.

**Solution**: Clamp results to non-negative:

```javascript
const binder1 = Math.max(0, calculatedValue);
```

### Issue 4: Percentage Out of Range

**Problem**: Solid content or VOC percentages > 100% or < 0%.

**Cause**: Invalid product data or calculation errors.

**Solution**: Use safe percentage validation:

```javascript
import { safePercent } from "./validation.js";

const solidContent = safePercent(product.SolidContent, 0); // 0-100 range
```

### Issue 5: Coefficient Defaulting

**Problem**: Coefficient is 0 or negative in product data.

**Cause**: Missing or invalid data entry.

**Solution**: Default to 1 for invalid coefficients:

```javascript
import { safeCoefficient } from "./validation.js";

const coef = safeCoefficient(product.coefficient); // Returns 1 if ≤ 0
```

---

## API Reference

### Module: `tinters.js`

```javascript
import { computeTinterRow, computeTinters } from "./calc/tinters.js";

// Single tinter row
const result = computeTinterRow({
    qty: [10, 5, 0, 0, 0, 0],
    coefficient: 1.2,
    Product_Density: 1200,
    SolidContent: 50,
    VOC: 10,
});
// Returns: { grams, volumeL, solidsPercent, vocPercent }

// Multiple tinters
const totals = computeTinters([row1, row2, row3]);
// Returns: { totalGrams, totalVolumeL, totalSolidMass, totalVOCMass }
```

### Module: `binders.js`

```javascript
import { computeBinders } from "./calc/binders.js";

const result = computeBinders(500, {
    Binder1: "B1",
    Binder2: "B2",
    Binder1Avalue: 0.5,
    Binder1Bvalue: 0.2,
    Binder1Cvalue: 0.3,
    Binder1dvalue: 0.9,
    Binder2Avalue: 0.6,
    Binder2Equation: "Eq1",
    MattValue: 1,
    Binder1_Density: 1100, // Individual density
    Binder2_Density: 900, // Individual density
});
// Returns: { binder1, binder2, binder1VolumeL, binder2VolumeL, totalBinderGrams, totalBinderVolumeL }
```

### Module: `additives.js`

```javascript
import { computeAdditives } from "./calc/additives.js";

const result = computeAdditives(
    [
        { _id: "A1", name: "Catalyst", percent: 1.5, Additive_Density: 950 },
        { _id: "A2", name: "Thinner", percent: 3.0, Additive_Density: 800 },
    ],
    1000,
);
// Returns: { rows, totalAdditiveGrams, totalAdditiveVolumeL }
```

### Module: `metrics.js`

```javascript
import { computeFinalTotals, computeQualityMetrics } from "./calc/metrics.js";

// Combine all component totals
const totals = computeFinalTotals(tinterTotals, binderTotals, additiveTotals);
// Returns: { finalGrams, finalVolumeL }

// Calculate quality metrics
const metrics = computeQualityMetrics({
    finalGrams: 850,
    finalVolumeL: 0.68,
    totalSolidMass: 170,
    totalVOCmass: 20,
});
// Returns: { solidsPercent, density_gPerL, voc_gPerL }
```

---

## Testing

Unit tests are available in `__tests__/` directory. To run tests:

```bash
# Install testing dependencies
npm install -D vitest @vitest/ui

# Add to package.json scripts:
# "test": "vitest",
# "test:ui": "vitest --ui"

# Run tests
npm test

# Run with UI
npm run test:ui
```

Test coverage includes:

- ✅ Tinter calculations (quantity sum, coefficient, volume)
- ✅ Binder calculations (both equation types, individual densities)
- ✅ Additive calculations (percentage-based, volume)
- ✅ Quality metrics (density, solid content, VOC)
- ✅ Edge cases (zero values, NaN, division by zero)
- ✅ Validation utilities

---

## Version History

### v2.0.0 (Current)

**CRITICAL FIXES**:

- ✅ **Volume calculation formula corrected**: Changed from `(mass × density) / 1000` to `mass / density`
- ✅ **Density calculation formula corrected**: Changed from `(mass / volume) × 1000` to `mass / volume`
- ✅ **Individual binder density support**: Each binder can now have its own density
- ✅ **Enhanced validation**: All inputs validated with safe fallbacks
- ✅ **Comprehensive testing**: 200+ unit tests covering all edge cases
- ✅ **Complete JSDoc documentation**: All functions fully documented

**Breaking Changes**:

- Volume values will be different from v1.x (correct now)
- Density values will be different from v1.x (correct now)
- Binder configuration supports individual densities

### v1.x (Legacy)

- Original implementation from `logics/create-formula.js` and `logics/edit-formula.js`
- **Known bugs**: Incorrect volume and density formulas

---

## Support

For issues or questions:

1. Check this reference guide
2. Review unit tests for examples
3. Check JSDoc comments in source code
4. Verify input data validity
5. Enable development logging: `NODE_ENV=development`
