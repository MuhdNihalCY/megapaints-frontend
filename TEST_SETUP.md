# Test Setup Guide

This guide walks you through setting up and running tests for the formula calculation system.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

### 1. Install Testing Dependencies

```bash
# From the megapaints directory
cd /Users/nihal/Desktop/webworks/megapaints/backend-frontend-combined/megapaints

# Install vitest and related tools
npm install -D vitest @vitest/ui
```

### 2. Update package.json

Add the following scripts to your `package.json`:

```json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "lint": "eslint .",
        "preview": "vite preview",
        "test": "vitest",
        "test:ui": "vitest --ui",
        "test:run": "vitest run",
        "test:coverage": "vitest run --coverage"
    }
}
```

### 3. Create Vitest Configuration (Optional)

Create `vitest.config.js` in the megapaints directory:

```javascript
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "dist/",
                "**/*.test.js",
                "**/__tests__/**",
            ],
        },
    },
});
```

## Running Tests

### Run All Tests (Watch Mode)

```bash
npm test
```

This will run tests in watch mode, automatically re-running when files change.

### Run Tests Once

```bash
npm run test:run
```

### Run Tests with UI

```bash
npm run test:ui
```

This opens a browser-based UI for interactive test running and debugging.

### Run Specific Test File

```bash
# Run only tinter tests
npx vitest run src/formula/calc/__tests__/tinters.test.js

# Run only binder tests
npx vitest run src/formula/calc/__tests__/binders.test.js
```

### Run Tests with Coverage

```bash
# First install coverage tool
npm install -D @vitest/coverage-v8

# Run with coverage
npm run test:coverage
```

## Test Structure

```
megapaints/src/formula/calc/
├── __tests__/
│   ├── tinters.test.js      # Tinter calculation tests
│   ├── binders.test.js      # Binder calculation tests
│   ├── additives.test.js    # Additive calculation tests
│   └── metrics.test.js      # Quality metrics tests
├── tinters.js               # Tinter calculation module
├── binders.js               # Binder calculation module
├── additives.js             # Additive calculation module
├── metrics.js               # Metrics calculation module
└── validation.js            # Validation utilities
```

## Test Coverage

Current test coverage:

- **Tinters**: 200+ test cases
    - Quantity sum calculations
    - Coefficient application
    - Volume calculations (CRITICAL FIX)
    - Solid content and VOC
    - Edge cases

- **Binders**: 150+ test cases
    - Binder 1 equation
    - Binder 2 equations (Eq1 and Eq2)
    - Individual binder densities
    - Volume calculations (CRITICAL FIX)
    - Edge cases

- **Additives**: 100+ test cases
    - Percentage calculations
    - Volume calculations (CRITICAL FIX)
    - Multiple additives
    - Edge cases

- **Metrics**: 80+ test cases
    - Final totals
    - Density calculations (CRITICAL FIX)
    - Solid content percentage
    - VOC calculations
    - Edge cases

## Writing New Tests

### Test File Template

```javascript
import { describe, it, expect } from "vitest";
import { yourFunction } from "../your-module.js";

describe("YourFunction", () => {
    describe("Feature Category", () => {
        it("should do something specific", () => {
            const result = yourFunction(testInput);
            expect(result).toBe(expectedOutput);
        });

        it("should handle edge case", () => {
            const result = yourFunction(edgeCaseInput);
            expect(result).toBe(expectedOutput);
        });
    });
});
```

### Assertion Examples

```javascript
// Exact equality
expect(result).toBe(5);

// Close enough for floating point
expect(result).toBeCloseTo(0.1, 4); // 4 decimal places

// Greater than / Less than
expect(result).toBeGreaterThan(0);
expect(result).toBeLessThanOrEqual(100);

// Array contains
expect(array).toHaveLength(3);
expect(array).toContain("value");

// Object matching
expect(obj).toEqual({ key: "value" });
expect(obj).toHaveProperty("key", "value");
```

## Debugging Tests

### Using Console Logs

```javascript
it("should calculate correctly", () => {
    const result = yourFunction(input);
    console.log("Result:", result); // Will show in test output
    expect(result).toBe(expected);
});
```

### Using Vitest UI

The Vitest UI provides an interactive debugger:

1. Run `npm run test:ui`
2. Click on a test to see details
3. Use the "Debug" button to step through code
4. View console logs and errors

### Running Single Test

Add `.only` to run just one test:

```javascript
it.only("should calculate correctly", () => {
    // This test will run, others will be skipped
});
```

### Skipping Tests

Add `.skip` to temporarily disable a test:

```javascript
it.skip("should calculate correctly", () => {
    // This test will be skipped
});
```

## Common Issues

### Issue 1: Import Errors

**Problem**: `Cannot find module './validation.js'`

**Solution**: Ensure you're using `.js` extension in imports:

```javascript
// Correct
import { safeNumber } from "./validation.js";

// Incorrect
import { safeNumber } from "./validation";
```

### Issue 2: Test Timeout

**Problem**: Tests taking too long

**Solution**: Increase timeout in test file:

```javascript
it("long running test", () => {
    // test code
}, 10000); // 10 second timeout
```

### Issue 3: Async Tests

**Problem**: Async tests not waiting

**Solution**: Use async/await:

```javascript
it("should fetch data", async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
});
```

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: "18"
            - run: npm ci
            - run: npm test:run
            - run: npm run test:coverage
```

## Best Practices

1. **Descriptive Test Names**: Use "should" statements

    ```javascript
    it("should return 0 when density is 0");
    ```

2. **One Assertion Per Test**: Focus on one thing

    ```javascript
    it("should calculate mass correctly", () => {
        const result = calculateMass(10, 1.5);
        expect(result).toBe(15);
    });
    ```

3. **Test Edge Cases**: Zero, negative, NaN, undefined

    ```javascript
    it("should handle zero density");
    it("should handle NaN input");
    it("should handle undefined values");
    ```

4. **Use Describe Blocks**: Organize related tests

    ```javascript
    describe("Volume Calculations", () => {
        it("should calculate for water");
        it("should calculate for dense materials");
    });
    ```

5. **Clean Test Data**: Use clear, simple values

    ```javascript
    // Good
    const testData = { qty: [10, 0, 0, 0, 0, 0], coefficient: 1 };

    // Bad
    const testData = { qty: [12.3456, 7.8901, ...], coefficient: 1.23456 };
    ```

## Performance Testing

### Benchmark Tests

```javascript
import { describe, it, bench } from "vitest";

describe("Performance", () => {
    bench("computeTinters with 100 rows", () => {
        const rows = Array(100).fill(testRow);
        computeTinters(rows);
    });
});
```

Run with:

```bash
npx vitest bench
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Run tests to verify setup
3. ✅ Review test coverage
4. ✅ Add new tests as needed
5. ✅ Set up CI/CD pipeline
6. ✅ Monitor test results

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Formula Calculation Reference](./src/formula/CALCULATION_REFERENCE.md)
- [Regression Testing Guide](./REGRESSION_TESTING_GUIDE.md)
