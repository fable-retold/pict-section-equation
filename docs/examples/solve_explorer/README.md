# Expression Solve Explorer — A Tour of the Fable Expression Parser

<!-- docuserve:example-launch:start -->
> **[&#9654; Launch the live app](examples/solve%5Fexplorer/index.html)** — runs in your browser, opens in a new tab.
<!-- docuserve:example-launch:end -->

The Solve Explorer is a complete `pict-section-equation` host wired up
to a curated catalog of expressions. Pick an equation from the
dropdown, watch the **step-by-step solve**, the **postfix token
stack**, and the **nested-pyramid visualization** all repaint in
parallel. Edit the expression directly; edit the variables JSON;
flip "overwrite variables" and switch equations to seed fresh
inputs. Every solve uses the real
[fable-expression-parser](https://github.com/stevenvelozo/fable-expression-parser)
under the hood — what you see on screen is exactly what your code
would see.

The example proves out three claims about pict-section-equation:

1. The three visualizer views (`PictViewExpressionSolve`,
   `PictViewExpressionTokenStack`,
   `PictViewExpressionSolvePyramid`) share a single result shape.
   Push one result to all three with `setSolveResult(...)`.
2. The tokenized editor view (`PictViewExpressionTokenizedEditor`)
   is the interactive front end — type into it, get a callback,
   re-solve.
3. The whole pipeline survives any expression you can throw at it —
   from `5 + 3 * 2` through `SLOPE(Revenue, Months)` to a multi-step
   `ROUND((Base * (1 + Markup)) * (1 - Discount) * Quantity, 2)`.

## What it demonstrates

| Capability | Where you see it |
|------------|------------------|
| Tokenized expression editor (live highlight) | `PictViewExpressionTokenizedEditor` mounted into `#SolveExplorer-ExpressionTokenizedEditor-Container` |
| Step-by-step solve visualizer | `PictViewExpressionSolve` (the default export); shows each operator + operand + intermediate result |
| Postfix token stack visualizer | `PictViewExpressionTokenStack` — color-coded tokens, RPN order, nested layer colors |
| Nested-pyramid visualizer | `PictViewExpressionSolvePyramid` — operator hierarchy with aligned original / resolved rows |
| External JSON variable source | `pict-section-code` mounts a JSON editor; both strict JSON and JS-style objects parse |
| Live JSON validity indicator | The dot beside "Variables (JSON)" turns red on a parse error and surfaces the error via `pict-section-modal` tooltip |
| Debounced live solve | Edits to the expression or variables fire `_debounceSolve()` (150ms) → `solveExpression()` |
| Equation garden with category grouping | `<optgroup>` per category; selecting an entry loads its expression + variables |
| Merge vs. overwrite variable strategy | "Overwrite variables" checkbox — unchecked merges into existing keys; checked replaces them |
| Real ExpressionParser solve | `fable.ExpressionParser.solve(expr, data, resultObject, false, destObject)` — the actual production solver |
| Multi-view fan-out from one result | `setSolveResult(resultObject, expression)` on all three visualizers; each renders from the same shape |

## Key files

- `source/Pict-Application-SolveExplorer.js` — the entire example
  in one file. Holds the equation garden, the input view, the
  layout view, and the application class.
- `html/index.html` — Red-Rock-Mesa-themed HTML shell. Loads
  `codejar.js` (CodeJar is the editor library that `pict-section-code`
  drives), `pict.min.js`, and the application bundle.
- `html/codejar.js` — symlinked from `pict-section-code`'s example
  HTML; supplies the tiny code-editor surface the JSON variables
  pane uses.

## The data model

The Solve Explorer's app state is intentionally minimal — almost
all state lives **inside the visualizer views** because they are
the source of truth for their own DOM. The application contributes:

- A built-in `_EQUATION_GARDEN` array — `{ Category, Label,
  Expression, Data }` per row. Used to populate the `<select>` and
  to seed `expression + variables` when the user picks one.
- A single in-flight solve result object built fresh on every
  invocation. Not persisted to AppData — the visualizers hold it
  for their own re-renders.

The solve API is sync, lives on `fable.ExpressionParser`, and looks
like this:

```js
this.fable.instantiateServiceProviderIfNotExists('ExpressionParser');
let tmpResultObject = {};
let tmpDestObject = {};
let tmpResult = this.fable.ExpressionParser.solve(
    tmpExpression, tmpDataSource, tmpResultObject, false, tmpDestObject);
```

`tmpResultObject` is what the visualizers consume. The arguments
in order: expression, data source (variable values), result object
to fill (steps, virtual symbols, token list, final result), debug
mode flag, destination object (LHS write target for `Foo = ...`-style
expressions).

---

## Feature 1 — Tokenized expression editor view

The expression editor is the framework's `PictViewExpressionTokenizedEditor`.
The host registers it with explicit configuration so it lands inside
the input panel, then wires a callback for "user edited":

```js
this._ExpressionTokenizedEditorView = this.pict.addView(
    'SolveExplorerTokenizedEditor',
    Object.assign({}, libPictSectionEquation.PictViewExpressionTokenizedEditor.default_configuration,
    {
        ViewIdentifier: 'SolveExplorerTokenizedEditor',
        DefaultDestinationAddress: '#SolveExplorer-ExpressionTokenizedEditor-Container',
        AutoRender: false,
        RenderOnLoad: false
    }),
    libPictSectionEquation.PictViewExpressionTokenizedEditor
);
this._ExpressionTokenizedEditorView.initialize();

this._ExpressionTokenizedEditorView.onExpressionChanged = function(pExpression)
{
    tmpSelf._debounceSolve();
};

this._ExpressionTokenizedEditorView.render();
this._ExpressionTokenizedEditorView.setExpression('5 + 3 * 2');
```

`onExpressionChanged` is the public hook for "the user typed
something". The editor calls back with the latest expression
string after each edit; the host fans that out to its own solve
loop. `setExpression(...)` seeds the editor programmatically — the
equation garden uses it when the user picks a preset.

The editor itself uses `pict-section-code` under the hood with
expression-specific tokenization. The color-coded inline tokens
mirror the legend used in the token stack visualizer, so what the
user types and what the visualizer shows are visually consistent.

---

## Feature 2 — The three visualizer views, registered side by side

The application registers all three visualizers up-front, each
pointing at its own destination div. All three are real Pict views
with their own render lifecycle:

```js
this.pict.addView('ExpressionSolveVisualizer',
    Object.assign({}, libPictSectionEquation.default_configuration,
    {
        "DefaultDestinationAddress": "#ExpressionSolve-Container"
    }),
    libPictSectionEquation);

this.pict.addView('ExpressionTokenStackVisualizer',
    Object.assign({}, libPictSectionEquation.PictViewExpressionTokenStack.default_configuration,
    {
        "DefaultDestinationAddress": "#ExpressionTokenStack-Container"
    }),
    libPictSectionEquation.PictViewExpressionTokenStack);

this.pict.addView('ExpressionSolvePyramidVisualizer',
    Object.assign({}, libPictSectionEquation.PictViewExpressionSolvePyramid.default_configuration,
    {
        "DefaultDestinationAddress": "#ExpressionSolvePyramid-Container"
    }),
    libPictSectionEquation.PictViewExpressionSolvePyramid);
```

Notice the module's `default_configuration` export **is** the solve
visualizer's config — the same default a single-view drop-in would
get, and the same default the host overrides here for its custom
destination. The two siblings export `PictViewExpressionTokenStack`
and `PictViewExpressionSolvePyramid` as static properties of the
main export, so a host only requires `pict-section-equation` once.

---

## Feature 3 — Fan-out solve via `setSolveResult`

The host owns the solve. After the parser returns, the host pushes
the same result object into each visualizer:

```js
solveExpression()
{
    let tmpExpression = this._ExpressionTokenizedEditorView.getExpression();
    if (!tmpExpression || tmpExpression.trim().length < 1) return;

    let tmpParsed = this._parseVariablesJSON();
    this._updateJSONIndicator(tmpParsed.valid, tmpParsed.error);
    let tmpDataSource = tmpParsed.data;

    this.fable.instantiateServiceProviderIfNotExists('ExpressionParser');
    let tmpResultObject = {};
    let tmpDestObject = {};
    let tmpResult = this.fable.ExpressionParser.solve(
        tmpExpression, tmpDataSource, tmpResultObject, false, tmpDestObject);

    let tmpVisualizerView = this.pict.views.ExpressionSolveVisualizer;
    if (tmpVisualizerView) tmpVisualizerView.setSolveResult(tmpResultObject, tmpExpression);

    let tmpTokenStackView = this.pict.views.ExpressionTokenStackVisualizer;
    if (tmpTokenStackView) tmpTokenStackView.setSolveResult(tmpResultObject, tmpExpression);

    let tmpPyramidView = this.pict.views.ExpressionSolvePyramidVisualizer;
    if (tmpPyramidView) tmpPyramidView.setSolveResult(tmpResultObject, tmpExpression);
}
```

`setSolveResult(resultObject, expression)` is the **only** API the
visualizers expose. Each view's implementation keeps the two values
on itself (`this.solveResultObject`, `this.solveExpression`) and
calls `render()` against its template. The shape of `resultObject`
is the same shape `fable-expression-parser` emits, so a host can
drive these views from a saved solve, a server result, or — as
here — a live solve.

---

## Feature 4 — Variables JSON via a `pict-section-code` editor

The variables pane is a `pict-section-code` view configured for
JSON editing, mounted into a container next to the expression
editor:

```js
this._VariablesCodeEditorView = this.pict.addView(
    tmpVariablesEditorHash,
    {
        ViewIdentifier: tmpVariablesEditorHash,
        TargetElementAddress: '#SolveExplorer-Variables-CodeEditor-Container',
        Language: 'json',
        ReadOnly: false,
        LineNumbers: true,
        DefaultCode: '{}',
        AddClosing: true,
        IndentOn: /[{[]$/,
        MoveToNewLine: /^[}\]]/,
        AutoRender: false,
        RenderOnLoad: false,
        DefaultRenderable: 'VariablesCodeEditor-Wrap',
        DefaultDestinationAddress: '#SolveExplorer-Variables-CodeEditor-Container',
        Renderables:
        [
            {
                RenderableHash: 'VariablesCodeEditor-Wrap',
                TemplateHash: 'CodeEditor-Container',
                DestinationAddress: '#SolveExplorer-Variables-CodeEditor-Container'
            }
        ]
    },
    libPictSectionCode
);
```

The host monkey-patches the editor's `onCodeChange` to chain its own
debounced solve onto the framework's existing callback:

```js
let tmpOriginalOnCodeChange = this._VariablesCodeEditorView.onCodeChange.bind(this._VariablesCodeEditorView);
this._VariablesCodeEditorView.onCodeChange = function(pCode)
{
    tmpOriginalOnCodeChange(pCode);
    tmpSelf._debounceSolve();
};
```

That pattern — call the original, then add your own behaviour — is
the right way to extend a section view's hook without subclassing it.

The parser inside `_parseVariablesJSON()` tries strict JSON first,
then falls back to `new Function('return (' + tmpCode + ')')()` for
JS-style object literals — so the user can paste `{ a: 1 }`
(no quotes around `a`) and it still solves. The fallback is
classified as "valid" because the expression parser doesn't care
which path produced the object:

```js
try
{
    return { data: JSON.parse(tmpCode), valid: true, error: '' };
}
catch(pError)
{
    try
    {
        return { data: (new Function('return (' + tmpCode + ')'))(), valid: true, error: '' };
    }
    catch(pError2)
    {
        return { data: {}, valid: false, error: pError.message };
    }
}
```

A real parse failure surfaces the original strict-JSON message,
which is what gets shown in the indicator tooltip.

---

## Feature 5 — Live JSON validity indicator + `pict-section-modal` tooltip

The dot next to "Variables (JSON)" is the at-a-glance state. The
host updates it on every solve, then attaches a `pict-section-modal`
tooltip with the validity message:

```js
_updateJSONIndicator(pValid, pErrorMessage)
{
    let tmpIndicatorEl = document.getElementById('SolveExplorer-JSON-Indicator');
    if (!tmpIndicatorEl) return;

    tmpIndicatorEl.classList.remove('peq-explorer-json-indicator-valid', 'peq-explorer-json-indicator-invalid');
    tmpIndicatorEl.classList.add(pValid ? 'peq-explorer-json-indicator-valid' : 'peq-explorer-json-indicator-invalid');

    if (this._JSONIndicatorTooltipHandle) this._JSONIndicatorTooltipHandle.destroy();
    let tmpModal = this.pict.views.PictSectionModal;
    if (tmpModal)
    {
        let tmpText = pValid ? 'Valid' : ('Invalid: ' + (pErrorMessage || 'Parse error'));
        this._JSONIndicatorTooltipHandle = tmpModal.tooltip(
            tmpIndicatorEl, tmpText, { position: 'right', delay: 100 });
    }
}
```

`modal.tooltip(element, text, options)` returns a handle with a
`destroy()` method — exactly the pattern a host needs to swap
tooltip text dynamically. (The naive approach is to set a
`title` attribute and live with the browser's slow default
tooltip; the modal version is themable, positionable, and styled
consistently with the rest of the app.)

The host destroys the previous handle before creating the new one
to avoid handle leaks across many solves.

---

## Feature 6 — Debounced live solve

Both the expression editor and the variables editor trigger
`_debounceSolve()`, which waits 150ms after the last keystroke
before running the actual solver. This keeps the visualizer DOM
updates calm during typing:

```js
_debounceSolve()
{
    if (this._SolveDebounceTimer)
    {
        clearTimeout(this._SolveDebounceTimer);
    }
    let tmpSelf = this;
    this._SolveDebounceTimer = setTimeout(
        function() { tmpSelf.solveExpression(); }, 150);
}
```

150ms is below human perception of "slow" but above the typing
cadence of all but the fastest typists, so users see the solve
update between deliberate edits rather than character-by-character.
Picking an expression from the dropdown bypasses the debounce
because `loadEquation()` calls `solveExpression()` directly.

---

## Feature 7 — Equation garden with merge-vs-overwrite

The `_EQUATION_GARDEN` array is the curated catalog. Each entry
declares `Category` (for `<optgroup>` grouping), `Label` (the
display text), `Expression` (verbatim parser input), and `Data`
(the variable map):

```js
{ Category: 'Statistics', Label: 'Linear Regression (SLOPE)',
  Expression: 'SalesSlope = SLOPE(Revenue, Months)',
  Data: { Revenue: [150, 200, 250, 310, 350, 400, 460], Months: [1, 2, 3, 4, 5, 6, 7] } }
```

The select is built with `<optgroup>` per category so the dropdown
visually clusters arithmetic, assignments, functions, trig,
statistics, comparisons, finance, physics, and complex:

```js
let tmpSelectOptions = '<option value="">-- Select an equation --</option>';
let tmpCurrentCategory = '';
for (let i = 0; i < _EQUATION_GARDEN.length; i++)
{
    if (_EQUATION_GARDEN[i].Category !== tmpCurrentCategory)
    {
        if (tmpCurrentCategory) tmpSelectOptions += '</optgroup>';
        tmpCurrentCategory = _EQUATION_GARDEN[i].Category;
        tmpSelectOptions += `<optgroup label="${tmpCurrentCategory}">`;
    }
    tmpSelectOptions += `<option value="${i}">${_EQUATION_GARDEN[i].Label}</option>`;
}
if (tmpCurrentCategory) tmpSelectOptions += '</optgroup>';
```

The "Overwrite variables" checkbox controls how a preset's `Data`
combines with the current pane contents:

```js
let tmpNewData = tmpEquation.Data || {};
let tmpFinalData = tmpNewData;

if (!tmpOverwrite)
{
    // Merge: existing variables are preserved, new ones are added
    let tmpParsed = this._parseVariablesJSON();
    tmpFinalData = Object.assign({}, tmpParsed.data, tmpNewData);
}
```

Unchecked (the default): the preset's keys are layered on top of
whatever the user already had — useful for exploring "what does
this expression do with the same variables I had before". Checked:
the preset's `Data` replaces the pane entirely — useful for
starting fresh.

---

## Running the example

```bash
cd example_applications/solve_explorer
npm install
npm run build
# serve ./dist and open index.html
# (or `cd dist && python3 -m http.server 8000`)
```

## Things to try in the running app

- **Pick an equation** — start with "Slope-Intercept (y = mx + b)".
  Watch the three visualizations update in parallel.
- **Edit the expression** — change `m * x + b` to `m * x * x + b`.
  The solve, token stack, and pyramid all reflect the squared term.
- **Edit a variable** — change `m` from `1.5` to `3`. Each solve
  step shows the substituted value.
- **Break the JSON** — delete the closing `}`. The indicator dot
  goes red, the tooltip surfaces "Unexpected end of JSON input"
  (or your engine's flavor of that message). The visualizers
  freeze on the last valid solve.
- **Switch to a multi-aggregate** — pick "Health Index (Multi-Agg)"
  under Complex. The token stack visualizer shows the nested
  `SUM`/`MEDIAN`/`AVG`/`SQRT` calls in their RPN order; the pyramid
  shows them aligned with their original-expression slices.
- **Toggle "Overwrite variables"** — switch between equations.
  Unchecked: previous variables carry forward; checked: each
  preset starts clean.

## Takeaways

1. **Three views, one shape.** `PictViewExpressionSolve`,
   `PictViewExpressionTokenStack`, and `PictViewExpressionSolvePyramid`
   all consume the same `resultObject` via the same `setSolveResult`
   method. Hosts pick whichever (or all) suits their UI.
2. **The host owns the solve.** The section views do not solve —
   they visualize. Hosts call `fable.ExpressionParser.solve(...)`
   and push the result. That separation makes it trivial to drive
   the visualizers from cached or server-side solves.
3. **The tokenized editor's `onExpressionChanged` is the seam.**
   It is the single hook for "user just edited". Hosts attach
   their own solve logic; the editor stays decoupled.
4. **`pict-section-code` is reusable for any text input.** The
   variables JSON pane is a fully-fledged code editor — line
   numbers, indent rules, closing-bracket auto-insertion —
   configured purely through options. No DOM wiring, no listeners.
5. **The expression parser handles a real range of inputs.** Look
   at `_EQUATION_GARDEN`: arithmetic, assignments, functions, trig,
   statistics, conditionals, finance, physics, multi-step. The
   visualizers tell you exactly how each one decomposed.

## Related documentation

- [Guide](../../Guide.md) — usage and configuration reference for
  `pict-section-equation`'s views.
- [pict-section-code](https://github.com/stevenvelozo/pict-section-code) —
  the editor section used for the variables JSON pane.
- [pict-section-modal](https://github.com/stevenvelozo/pict-section-modal) —
  the modal / toast / tooltip surface used for the JSON validity
  tooltip.
- [fable-expression-parser](https://github.com/stevenvelozo/fable-expression-parser) —
  the parser whose `solve(...)` API drives every visualization here.
