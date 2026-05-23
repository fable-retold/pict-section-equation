# pict-section-equation

> **[&#9654; Read the Pict-Section-Equation Documentation](https://stevenvelozo.github.io/pict-section-equation/)** &mdash; interactive docs with the full API reference.

Pict section views for creating, editing and visualizing Fable Expression Parser solves. Drop a solve visualizer into any Pict application to see step-by-step expression evaluation, intermediate values, and token structure.

## Installation

```bash
npm install pict-section-equation
```

## Usage

```javascript
const libPict = require('pict');
const libPictSectionEquation = require('pict-section-equation');

let _Pict = new libPict();

// Register the visualizer view
_Pict.addView('ExpressionSolveVisualizer',
    libPictSectionEquation.default_configuration,
    libPictSectionEquation);

// Solve an expression
_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');
let tmpResultObject = {};
_Pict.ExpressionParser.solve('5 + 3 * 2', {}, tmpResultObject);

// Display the solve visualization
_Pict.views.ExpressionSolveVisualizer.setSolveResult(tmpResultObject, '5 + 3 * 2');
```

## Views

### PictViewExpressionSolve

Renders expression parser solve results as an interactive step-by-step display showing:

- The original expression and final result
- Each solve step with operation, operands, and intermediate results
- Virtual symbol values table
- Postfix token list with color-coded types

**API:**

- `setSolveResult(pResultObject, pExpression)` -- set the solve data and re-render

## Example Application

See `example_applications/solve_explorer/` for a complete working example with an expression input box and preset expressions.

```bash
cd example_applications/solve_explorer
npm install
npm run build
# Open dist/index.html in a browser
```
