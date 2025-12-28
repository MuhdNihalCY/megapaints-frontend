# Regression Testing Guide

This guide outlines the process for regression testing the formula calculation system after the critical bug fixes.

## Overview

The formula calculation system has undergone critical fixes to volume and density calculations. Regression testing is essential to:

1. Verify calculations are now correct
2. Compare results with production data
3. Identify any discrepancies
4. Ensure no regressions in other functionality

---

## Testing Strategy

### Phase 1: Unit Tests (Completed ✅)

All calculation functions have comprehensive unit tests in `src/formula/calc/__tests__/`:

- `tinters.test.js` - 200+ test cases
- `binders.test.js` - 150+ test cases
- `additives.test.js` - 100+ test cases
- `metrics.test.js` - 80+ test cases

**To run unit tests**:

```bash
# Install vitest
npm install -D vitest @vitest/ui

# Add to package.json:
# "test": "vitest"
# "test:ui": "vitest --ui"

# Run tests
npm test
```

### Phase 2: Production Data Validation

#### Step 1: Extract Sample Formulas

Extract 15-20 representative formulas from the production database:

```sql
-- Sample query (adjust for your database structure)
SELECT * FROM formulas
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
AND status = 'approved'
ORDER BY RAND()
LIMIT 20;
```

**Sample criteria**:

- Mix of simple and complex formulas
- Various categories and subcategories
- Different tinter counts (1, 5, 10, 20+)
- With and without binders
- With and without additives
- Various density ranges (light, normal, heavy materials)

#### Step 2: Document Existing Results

For each formula, document the current (legacy) calculated values:

- Total grams
- Total volume
- Binder 1 grams and volume
- Binder 2 grams and volume
- Additive grams and volume
- Formula density
- Solid content %
- VOC g/L

**Template**:

```json
{
    "formula_id": "F-12345",
    "file_number": "2024-001",
    "legacy_system": {
        "total_grams": 850,
        "total_volume_L": 0.68,
        "binder1_grams": 244.44,
        "binder1_volume_L": 0.244,
        "binder2_grams": 55.56,
        "binder2_volume_L": 0.056,
        "additive_grams": 50,
        "additive_volume_L": 0.05,
        "density_gPerL": 1250,
        "solids_percent": 34,
        "voc_gPerL": 50
    }
}
```

#### Step 3: Run New Calculations

Create a test script to run the new calculation engine on the same input data:

```javascript
// test-regression.js
import { computeTinters } from "./src/formula/calc/tinters.js";
import { computeBinders } from "./src/formula/calc/binders.js";
import { computeAdditives } from "./src/formula/calc/additives.js";
import {
    computeFinalTotals,
    computeQualityMetrics,
} from "./src/formula/calc/metrics.js";

async function testFormula(formulaData) {
    // 1. Compute tinters
    const tinterTotals = computeTinters(formulaData.tinters);

    // 2. Compute binders
    const binderTotals = computeBinders(
        tinterTotals.totalGrams,
        formulaData.subcategoryConfig,
    );

    // 3. Compute additives
    const baseMass = tinterTotals.totalGrams + binderTotals.totalBinderGrams;
    const additiveTotals = computeAdditives(formulaData.additives, baseMass);

    // 4. Compute final totals
    const finalTotals = computeFinalTotals(
        tinterTotals,
        binderTotals,
        additiveTotals,
    );

    // 5. Compute quality metrics
    const metrics = computeQualityMetrics({
        ...finalTotals,
        totalSolidMass: tinterTotals.totalSolidMass,
        totalVOCmass: tinterTotals.totalVOCMass,
    });

    return {
        total_grams: finalTotals.finalGrams,
        total_volume_L: finalTotals.finalVolumeL,
        binder1_grams: binderTotals.binder1,
        binder1_volume_L: binderTotals.binder1VolumeL,
        binder2_grams: binderTotals.binder2,
        binder2_volume_L: binderTotals.binder2VolumeL,
        additive_grams: additiveTotals.totalAdditiveGrams,
        additive_volume_L: additiveTotals.totalAdditiveVolumeL,
        density_gPerL: metrics.density_gPerL,
        solids_percent: metrics.solidsPercent,
        voc_gPerL: metrics.voc_gPerL,
    };
}
```

#### Step 4: Compare Results

Create a comparison report:

```javascript
function compareResults(legacy, newCalc, tolerance = 0.01) {
    const differences = {};

    for (const key in legacy) {
        const legacyVal = Number(legacy[key]);
        const newVal = Number(newCalc[key]);
        const diff = Math.abs(legacyVal - newVal);
        const percentDiff = legacyVal !== 0 ? (diff / legacyVal) * 100 : 0;

        differences[key] = {
            legacy: legacyVal,
            new: newVal,
            diff: diff,
            percent_diff: percentDiff,
            within_tolerance: percentDiff <= tolerance,
        };
    }

    return differences;
}
```

### Phase 3: Expected Discrepancies

Due to the bug fixes, we **EXPECT** the following to change:

#### Volume Calculations (WILL CHANGE)

**Old (WRONG)**:

```javascript
volume = (mass × density) / 1000
```

**New (CORRECT)**:

```javascript
volume = mass / density;
```

**Expected Impact**:

- All volume values will be different
- If density was in g/L (1000 for water), old formula gave: `(100 × 1000) / 1000 = 100` (WRONG!)
- New formula gives: `100 / 1000 = 0.1` (CORRECT)
- **Volumes will be MUCH SMALLER** (correct now)

#### Density Calculations (WILL CHANGE)

**Old (WRONG)**:

```javascript
density = (mass / volume) × 1000
```

**New (CORRECT)**:

```javascript
density = mass / volume;
```

**Expected Impact**:

- Density values will be different
- Old formula multiplied by 1000 unnecessarily
- New formula gives correct g/L values

#### Calculations That Should NOT Change

- Tinter mass (grams) - No change expected
- Binder mass (grams) - No change expected
- Additive mass (grams) - No change expected
- Total mass (grams) - No change expected
- Solid content % - No change expected (if volumes were wrong, this might have been affected indirectly)

### Phase 4: Validation Criteria

**Pass Criteria**:

- ✅ All unit tests pass
- ✅ Mass calculations match legacy (within 0.1%)
- ✅ Volume calculations are physically correct (even if different from legacy)
- ✅ Density calculations match expected values for known materials
- ✅ No NaN, Infinity, or negative values
- ✅ Solid content and VOC calculations are reasonable

**Fail Criteria**:

- ❌ Unit tests fail
- ❌ Mass calculations differ significantly from legacy
- ❌ Density values are unrealistic (e.g., < 100 or > 5000 g/L)
- ❌ NaN, Infinity, or negative values appear
- ❌ Solid content > 100% or < 0%

---

## Sample Test Data

### Sample 1: Simple Formula (Water-Based Paint)

```javascript
{
  formula_id: "F-001",
  tinters: [
    {
      qty: [50, 0, 0, 0, 0, 0],
      coefficient: 1,
      Product_Density: 1000,
      SolidContent: 50,
      VOC: 5,
      name: "White Base"
    },
    {
      qty: [10, 0, 0, 0, 0, 0],
      coefficient: 1,
      Product_Density: 1200,
      SolidContent: 60,
      VOC: 10,
      name: "Blue Tint"
    }
  ],
  subcategoryConfig: {
    Binder1: "B1",
    Binder2: "B2",
    Binder1Avalue: 0.5,
    Binder1Bvalue: 0.2,
    Binder1Cvalue: 0.3,
    Binder1dvalue: 0.9,
    Binder2Avalue: 0.6,
    Binder2Equation: "Eq1",
    MattValue: 1,
    Binder_Density: 1000
  },
  additives: [
    {
      _id: "A1",
      name: "Catalyst",
      percent: 2,
      Additive_Density: 950
    }
  ]
}
```

**Expected Results (New System)**:

- Tinter total: 60g
- Tinter volume: ~0.058L (50/1000 + 10/1200)
- Binders: ~67g based on equation
- Additives: ~1.2g (2% of 60g)
- Total: ~128g
- Density: Should be ~1000-1200 g/L range

### Sample 2: Complex Formula (Solvent-Based Paint)

```javascript
{
  formula_id: "F-002",
  tinters: [
    /* 10+ tinters with various densities */
  ],
  subcategoryConfig: {
    /* Complex binder configuration */
  },
  additives: [
    /* Multiple additives */
  ]
}
```

---

## Automated Testing Script

Create `scripts/regression-test.js`:

```javascript
#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { computeTinters } from "../src/formula/calc/tinters.js";
import { computeBinders } from "../src/formula/calc/binders.js";
import { computeAdditives } from "../src/formula/calc/additives.js";
import {
    computeFinalTotals,
    computeQualityMetrics,
} from "../src/formula/calc/metrics.js";

// Load test formulas
const testFormulas = JSON.parse(
    fs.readFileSync("./test-data/formulas.json", "utf8"),
);

const results = [];

for (const formula of testFormulas) {
    console.log(`\nTesting formula: ${formula.formula_id}`);

    try {
        // Run calculations
        const tinterTotals = computeTinters(formula.tinters);
        const binderTotals = computeBinders(
            tinterTotals.totalGrams,
            formula.subcategoryConfig,
        );
        const baseMass =
            tinterTotals.totalGrams + binderTotals.totalBinderGrams;
        const additiveTotals = computeAdditives(formula.additives, baseMass);
        const finalTotals = computeFinalTotals(
            tinterTotals,
            binderTotals,
            additiveTotals,
        );
        const metrics = computeQualityMetrics({
            ...finalTotals,
            totalSolidMass: tinterTotals.totalSolidMass,
            totalVOCmass: tinterTotals.totalVOCMass,
        });

        // Compare with legacy
        const newResults = {
            total_grams: finalTotals.finalGrams,
            total_volume_L: finalTotals.finalVolumeL,
            density_gPerL: metrics.density_gPerL,
            solids_percent: metrics.solidsPercent,
            voc_gPerL: metrics.voc_gPerL,
        };

        const comparison = compareResults(formula.legacy_results, newResults);

        results.push({
            formula_id: formula.formula_id,
            comparison,
            passed: allWithinTolerance(comparison),
        });

        console.log(
            `  Status: ${results[results.length - 1].passed ? "PASS ✅" : "REVIEW ⚠️"}`,
        );
    } catch (error) {
        console.error(`  Error: ${error.message}`);
        results.push({
            formula_id: formula.formula_id,
            error: error.message,
            passed: false,
        });
    }
}

// Generate report
const report = {
    timestamp: new Date().toISOString(),
    total_formulas: testFormulas.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
};

fs.writeFileSync(
    `./test-results/regression-${Date.now()}.json`,
    JSON.stringify(report, null, 2),
);

console.log(`\n${"=".repeat(60)}`);
console.log(`Regression Test Complete`);
console.log(
    `Total: ${report.total_formulas} | Passed: ${report.passed} | Failed: ${report.failed}`,
);
console.log(`${"=".repeat(60)}\n`);
```

---

## Reporting

### Test Report Template

```markdown
# Regression Test Report

**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**System Version**: v2.0.0
**Test Duration**: [X hours]

## Summary

- Total Formulas Tested: XX
- Passed: XX (XX%)
- Failed/Review Required: XX (XX%)

## Critical Fixes Validated

✅ Volume calculation formula corrected
✅ Density calculation formula corrected
✅ Individual binder densities supported
✅ Validation prevents division by zero
✅ All edge cases handled

## Discrepancies

### Expected (Due to Bug Fixes)

- Volume values changed (now correct)
- Density values changed (now correct)

### Unexpected

- [List any unexpected discrepancies]

## Recommendations

- [Deploy to staging]
- [Run parallel calculations for 1 week]
- [Monitor for user reports]

## Sign-off

- Developer: **\*\***\_\_\_**\*\***
- QA: **\*\***\_\_\_**\*\***
- Product Owner: **\*\***\_\_\_**\*\***
```

---

## Next Steps

1. **Staging Deployment**
    - Deploy to staging environment
    - Test with real user workflows
    - Monitor for issues

2. **Parallel Calculation Period**
    - Run both old and new calculations in production
    - Log discrepancies
    - Review with stakeholders

3. **Production Deployment**
    - Deploy to production after validation
    - Monitor closely for first week
    - Keep rollback plan ready

4. **User Communication**
    - Inform users of calculation improvements
    - Explain why volume/density values changed
    - Provide support documentation
