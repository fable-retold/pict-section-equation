const libPictApplication = require('pict-application');
const libPictView = require('pict-view');
const libPictSectionCode = require('pict-section-code');
const libPictSectionModal = require('pict-section-modal');

const libPictSectionEquation = require('pict-section-equation');

const html = String.raw;

// --- Equation Garden ---
// Organized by category with expression, description, and sample variables.
const _EQUATION_GARDEN =
[
	{ Category: 'Arithmetic', Label: 'Simple Math', Expression: '5 + 3 * 2', Data: {} },
	{ Category: 'Arithmetic', Label: 'Order of Operations', Expression: '(100 - 10) * (3 + 2)', Data: {} },
	{ Category: 'Arithmetic', Label: 'Modulus', Expression: 'Result = 17 % 5', Data: {} },
	{ Category: 'Arithmetic', Label: 'Exponents', Expression: 'Result = 2 ^ 10', Data: {} },
	{ Category: 'Arithmetic', Label: 'Precision (0.1 + 0.2)', Expression: 'Result = 0.1 + 0.2', Data: {} },

	{ Category: 'Assignment', Label: 'Area of Rectangle', Expression: 'Area = Width * Height', Data: { Width: 73.5, Height: 28.8 } },
	{ Category: 'Assignment', Label: 'Variable Algebra', Expression: 'Result = (X + Y) * Z / 2', Data: { X: 12.5, Y: 7.3, Z: 4 } },
	{ Category: 'Assignment', Label: 'Slope-Intercept (y = mx + b)', Expression: 'y = m * x + b', Data: { m: 1.5, x: 100, b: 750 } },

	{ Category: 'Functions', Label: 'Square Root', Expression: 'sqrt(16) + 2 ^ 3', Data: {} },
	{ Category: 'Functions', Label: 'Absolute Value', Expression: 'Result = abs(-42) + abs(7)', Data: {} },
	{ Category: 'Functions', Label: 'Rounding', Expression: 'ROUND(X * Y * Z, 2)', Data: { X: 5.867, Y: 3.1, Z: 75 } },
	{ Category: 'Functions', Label: 'Floor and Ceil', Expression: 'Result = floor(3.7) + ceil(3.2)', Data: {} },
	{ Category: 'Functions', Label: 'Natural Log', Expression: 'Result = log(euler() ^ 3)', Data: {} },
	{ Category: 'Functions', Label: 'Bezier Point', Expression: 'BezierMidpoint = BEZIERPOINT(0, 10, 20, 30, 0.5)', Data: {} },

	{ Category: 'Trigonometry', Label: 'Sin and Cos', Expression: 'sin(rad(60)) + cos(rad(30))', Data: {} },
	{ Category: 'Trigonometry', Label: 'Pythagorean Identity', Expression: 'Result = ROUND(sin(rad(30))^2 + cos(rad(30))^2, 10)', Data: {} },
	{ Category: 'Trigonometry', Label: 'Pythagorean Components', Expression: 'Hypotenuse = sqrt(A ^ 2 + B ^ 2)', Data: { A: 3, B: 4 } },
	{ Category: 'Trigonometry', Label: 'Law of Cosines', Expression: 'c = sqrt(a^2 + b^2 - 2*a*b*cos(rad(C)))', Data: { a: 5, b: 7, C: 60 } },

	{ Category: 'Statistics', Label: 'SUM', Expression: 'Result = SUM(Vals)', Data: { Vals: [10, 20, 30, 40, 50] } },
	{ Category: 'Statistics', Label: 'AVG', Expression: 'Result = AVG(Vals)', Data: { Vals: [10, 20, 30, 40, 50] } },
	{ Category: 'Statistics', Label: 'MEDIAN', Expression: 'Result = MEDIAN(Vals)', Data: { Vals: [10, 20, 30, 40, 50] } },
	{ Category: 'Statistics', Label: 'MIN and MAX Range', Expression: 'Range = MAX(Vals) - MIN(Vals)', Data: { Vals: [3, 7, 2, 9, 1] } },
	{ Category: 'Statistics', Label: 'COUNT', Expression: 'Result = COUNT(Vals)', Data: { Vals: [10, 20, 30, 40, 50] } },
	{ Category: 'Statistics', Label: 'Sample Variance (VAR)', Expression: 'Result = ROUND(VAR(Vals), 4)', Data: { Vals: [2, 4, 4, 4, 5, 5, 7, 9] } },
	{ Category: 'Statistics', Label: 'Sample Std Dev (STDEV)', Expression: 'Result = ROUND(STDEV(Vals), 4)', Data: { Vals: [2, 4, 4, 4, 5, 5, 7, 9] } },
	{ Category: 'Statistics', Label: 'Linear Regression (SLOPE)', Expression: 'SalesSlope = SLOPE(Revenue, Months)', Data: { Revenue: [150, 200, 250, 310, 350, 400, 460], Months: [1, 2, 3, 4, 5, 6, 7] } },
	{ Category: 'Statistics', Label: 'Weighted Mean', Expression: 'Result = (W1*V1 + W2*V2 + W3*V3) / (W1 + W2 + W3)', Data: { W1: 0.5, V1: 80, W2: 0.3, V2: 90, W3: 0.2, V3: 70 } },

	{ Category: 'Comparisons', Label: 'Greater Than', Expression: 'Result = 5 > 3', Data: {} },
	{ Category: 'Comparisons', Label: 'Equality', Expression: 'Result = 5 == 5', Data: {} },
	{ Category: 'Comparisons', Label: 'Ternary (If/Else)', Expression: 'Result = X > 0 ? X :: 0 - X', Data: { X: -5 } },
	{ Category: 'Comparisons', Label: 'Nested Ternary', Expression: 'Result = 1 > 0 ? (2 > 3 ? 100 :: 200) :: 300', Data: {} },

	{ Category: 'Finance', Label: 'Simple Interest', Expression: 'Interest = Principal * Rate * Time', Data: { Principal: 10000, Rate: 0.05, Time: 3 } },
	{ Category: 'Finance', Label: 'Compound Interest', Expression: 'FutureValue = Principal * (1 + Rate / N) ^ (N * Time)', Data: { Principal: 10000, Rate: 0.08, N: 12, Time: 5 } },
	{ Category: 'Finance', Label: 'Profit Margin', Expression: 'Margin = ROUND((Revenue - Cost) / Revenue * 100, 2)', Data: { Revenue: 50000, Cost: 32000 } },
	{ Category: 'Finance', Label: 'Monthly Payment', Expression: 'Payment = ROUND(Loan * (Rate/12) / (1 - (1 + Rate/12)^(-Months)), 2)', Data: { Loan: 250000, Rate: 0.065, Months: 360 } },

	{ Category: 'Physics', Label: 'Kinetic Energy', Expression: 'KE = 0.5 * Mass * Velocity ^ 2', Data: { Mass: 75, Velocity: 10 } },
	{ Category: 'Physics', Label: 'Gravitational Force', Expression: 'Force = G * M1 * M2 / Distance ^ 2', Data: { G: 0.0000000000667, M1: 5972000000000000000000000, M2: 80, Distance: 6371000 } },
	{ Category: 'Physics', Label: 'Projectile Range', Expression: 'Range = ROUND(V^2 * sin(rad(2*Angle)) / g, 2)', Data: { V: 50, Angle: 45, g: 9.81 } },

	{ Category: 'Complex', Label: 'Nested Operations', Expression: 'Result = ((15000 * 2) / 4)^2 + 100 - 10 * (35 + 5)', Data: {} },
	{ Category: 'Complex', Label: 'Multi-Step Calculation', Expression: 'Total = ROUND((Base * (1 + Markup)) * (1 - Discount) * Quantity, 2)', Data: { Base: 24.99, Markup: 0.4, Discount: 0.15, Quantity: 150 } },
	{ Category: 'Complex', Label: 'BMI Calculator', Expression: 'BMI = ROUND(Weight / (Height ^ 2), 1)', Data: { Weight: 75, Height: 1.78 } },
	{ Category: 'Complex', Label: 'Quadratic Discriminant', Expression: 'Discriminant = b^2 - 4*a*c', Data: { a: 2, b: -7, c: 3 } },
	{ Category: 'Complex', Label: 'Health Index (Multi-Agg)', Expression: 'Result = ROUND((SUM(Calories) / SUM(Sugar)) * MEDIAN(Fat) + (SQRT(AVG(Protein)) - (PI() + 99)), 2)', Data: { Calories: [52, 89, 47, 50, 69], Sugar: [10, 12, 8, 10, 14], Fat: [0.2, 0.3, 0.1, 0.4, 0.5], Protein: [0.3, 1.1, 0.9, 1.0, 0.7] } }
];

class SolveExplorerInputView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._ExpressionTokenizedEditorView = null;
		this._VariablesCodeEditorView = null;
		this._JSONIndicatorTooltipHandle = null;
		this._JSONParseError = '';
	}

	onAfterRender()
	{
		super.onAfterRender();

		let tmpSelf = this;

		// Build the equation garden <select> with optgroups
		let tmpSelectOptions = '<option value="">-- Select an equation --</option>';
		let tmpCurrentCategory = '';
		for (let i = 0; i < _EQUATION_GARDEN.length; i++)
		{
			if (_EQUATION_GARDEN[i].Category !== tmpCurrentCategory)
			{
				if (tmpCurrentCategory)
				{
					tmpSelectOptions += '</optgroup>';
				}
				tmpCurrentCategory = _EQUATION_GARDEN[i].Category;
				tmpSelectOptions += `<optgroup label="${tmpCurrentCategory}">`;
			}
			tmpSelectOptions += `<option value="${i}">${_EQUATION_GARDEN[i].Label}</option>`;
		}
		if (tmpCurrentCategory)
		{
			tmpSelectOptions += '</optgroup>';
		}

		let tmpInputHTML = html`
		<style>
			.peq-explorer-toolbar
			{
				display: flex;
				align-items: center;
				gap: 10px;
				flex-wrap: wrap;
				margin-bottom: 1rem;
			}
			.peq-explorer-toolbar select
			{
				font-family: inherit;
				font-size: 0.85rem;
				padding: 0.45rem 0.6rem;
				border: 1px solid #D4C4A8;
				border-radius: 4px;
				background: #FFFCF7;
				color: #264653;
				cursor: pointer;
				min-width: 240px;
			}
			.peq-explorer-toolbar select:focus
			{
				outline: none;
				border-color: #E76F51;
				box-shadow: 0 0 0 2px rgba(231,111,81,0.15);
			}
			.peq-explorer-toolbar .separator
			{
				width: 1px;
				height: 20px;
				background: #D4C4A8;
				margin: 0 2px;
			}
			.peq-explorer-overwrite-label
			{
				display: flex;
				align-items: center;
				gap: 5px;
				font-size: 0.8rem;
				color: #264653;
				cursor: pointer;
				user-select: none;
			}
			.peq-explorer-overwrite-label input[type="checkbox"]
			{
				cursor: pointer;
			}
			.peq-explorer-input-panel
			{
				background: var(--theme-color-background-panel, #fff);
				border: 1px solid #D4C4A8;
				border-radius: 6px;
				padding: 16px;
				margin-bottom: 20px;
				box-shadow: 0 2px 8px rgba(38,70,83,0.08);
			}
			.peq-explorer-solve-row
			{
				display: flex;
				justify-content: flex-end;
				margin-top: 12px;
			}
			.peq-explorer-solve-btn
			{
				padding: 0.5rem 1.25rem;
				background: #264653;
				color: #FAEDCD;
				border: none;
				border-radius: 4px;
				font-size: 0.85rem;
				font-weight: 600;
				cursor: pointer;
			}
			.peq-explorer-solve-btn:hover
			{
				background: #1A3340;
			}
			.peq-explorer-data-row
			{
				margin-bottom: 8px;
			}
			.peq-explorer-data-label
			{
				font-size: 12px;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				color: #264653;
				margin-bottom: 4px;
			}
			.peq-explorer-data-code-editor-container
			{
				width: 100%;
				min-height: 40px;
				border: 1px solid #D4C4A8;
				border-radius: 4px;
				overflow: auto;
				box-sizing: border-box;
				transition: border-color 0.15s;
			}
			.peq-explorer-data-code-editor-container:focus-within
			{
				border-color: #E76F51;
				box-shadow: 0 0 0 2px rgba(231,111,81,0.15);
			}
			.peq-explorer-data-code-editor-container .pict-code-editor-wrap
			{
				border: none;
				border-radius: 0;
			}
			.peq-explorer-data-code-editor-container .pict-code-editor
			{
				font-size: 13px;
			}
			.peq-explorer-data-label-row
			{
				display: flex;
				align-items: center;
				gap: 8px;
				margin-bottom: 4px;
			}
			.peq-explorer-json-indicator
			{
				display: inline-block;
				width: 10px;
				height: 10px;
				border-radius: 50%;
				background: #94a3b8;
				transition: background 0.2s;
				cursor: default;
			}
			.peq-explorer-json-indicator-valid
			{
				background: #22c55e;
			}
			.peq-explorer-json-indicator-invalid
			{
				background: #ef4444;
			}
		</style>
		<div class="peq-explorer-toolbar">
			<select id="SolveExplorer-EquationGarden" onchange="_Pict.views.SolveExplorerInput.loadEquation(this.value)">
				${tmpSelectOptions}
			</select>
			<span class="separator"></span>
			<label class="peq-explorer-overwrite-label">
				<input type="checkbox" id="SolveExplorer-OverwriteVars" />
				Overwrite variables
			</label>
		</div>
		<div class="peq-explorer-input-panel">
			<div id="SolveExplorer-ExpressionTokenizedEditor-Container"></div>
			<div class="peq-explorer-data-row">
				<div class="peq-explorer-data-label-row">
					<div class="peq-explorer-data-label">Variables (JSON)</div>
					<span class="peq-explorer-json-indicator" id="SolveExplorer-JSON-Indicator"></span>
				</div>
				<div class="peq-explorer-data-code-editor-container" id="SolveExplorer-Variables-CodeEditor-Container"></div>
			</div>
			<div class="peq-explorer-solve-row">
				<button class="peq-explorer-solve-btn" onclick="_Pict.views.SolveExplorerInput.solveExpression()">Solve</button>
			</div>
		</div>`;

		this.services.ContentAssignment.assignContent('#SolveExplorer-Input-Container', tmpInputHTML);

		// Create the tokenized expression editor view
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

		// Wire expression changes to trigger solve
		this._ExpressionTokenizedEditorView.onExpressionChanged = function(pExpression)
		{
			tmpSelf._debounceSolve();
		};

		this._ExpressionTokenizedEditorView.render();
		this._ExpressionTokenizedEditorView.setExpression('5 + 3 * 2');

		// Create the variables JSON code editor
		let tmpVariablesEditorHash = 'SolveExplorerVariablesEditor';
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
		this._VariablesCodeEditorView.initialize();

		// Wire variables changes to trigger solve
		let tmpOriginalOnCodeChange = this._VariablesCodeEditorView.onCodeChange.bind(this._VariablesCodeEditorView);
		this._VariablesCodeEditorView.onCodeChange = function(pCode)
		{
			tmpOriginalOnCodeChange(pCode);
			tmpSelf._debounceSolve();
		};

		this._VariablesCodeEditorView.render();

		// Attach tooltip to the JSON validity indicator
		let tmpIndicatorEl = (typeof document !== 'undefined') ? document.getElementById('SolveExplorer-JSON-Indicator') : null;
		if (tmpIndicatorEl && this.pict.views.PictSectionModal)
		{
			this._JSONIndicatorTooltipHandle = this.pict.views.PictSectionModal.tooltip(
				tmpIndicatorEl, 'Valid', { position: 'right', delay: 100 });
		}

		// Auto-solve the default expression
		this.solveExpression();
	}

	_debounceSolve()
	{
		if (this._SolveDebounceTimer)
		{
			clearTimeout(this._SolveDebounceTimer);
		}
		let tmpSelf = this;
		this._SolveDebounceTimer = setTimeout(
			function()
			{
				tmpSelf.solveExpression();
			}, 150);
	}

	_updateJSONIndicator(pValid, pErrorMessage)
	{
		if (typeof document === 'undefined')
		{
			return;
		}
		let tmpIndicatorEl = document.getElementById('SolveExplorer-JSON-Indicator');
		if (!tmpIndicatorEl)
		{
			return;
		}

		tmpIndicatorEl.classList.remove('peq-explorer-json-indicator-valid', 'peq-explorer-json-indicator-invalid');
		tmpIndicatorEl.classList.add(pValid ? 'peq-explorer-json-indicator-valid' : 'peq-explorer-json-indicator-invalid');

		// Update the tooltip text
		if (this._JSONIndicatorTooltipHandle)
		{
			this._JSONIndicatorTooltipHandle.destroy();
		}
		let tmpModal = this.pict.views.PictSectionModal;
		if (tmpModal)
		{
			let tmpText = pValid ? 'Valid' : ('Invalid: ' + (pErrorMessage || 'Parse error'));
			this._JSONIndicatorTooltipHandle = tmpModal.tooltip(
				tmpIndicatorEl, tmpText, { position: 'right', delay: 100 });
		}
	}

	/**
	 * Parse the current variables JSON from the editor, handling both
	 * strict JSON and lenient JS-style object syntax.
	 *
	 * @returns {{ data: Object, valid: boolean, error: string }}
	 */
	_parseVariablesJSON()
	{
		let tmpCode = '';
		if (this._VariablesCodeEditorView)
		{
			if (this._VariablesCodeEditorView.codeJar)
			{
				tmpCode = this._VariablesCodeEditorView.getCode() || '';
			}
			else
			{
				tmpCode = this._VariablesCodeEditorView.options.DefaultCode || '';
			}
		}

		if (!tmpCode.trim())
		{
			return { data: {}, valid: true, error: '' };
		}

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
	}

	/**
	 * Load an equation from the garden by index.
	 * Merges or overwrites variables based on the checkbox state.
	 *
	 * @param {string|number} pIndex - The index into _EQUATION_GARDEN
	 */
	loadEquation(pIndex)
	{
		if (pIndex === '' || pIndex === undefined || pIndex === null)
		{
			return;
		}

		let tmpIndex = parseInt(pIndex, 10);
		if (isNaN(tmpIndex) || tmpIndex < 0 || tmpIndex >= _EQUATION_GARDEN.length)
		{
			return;
		}

		let tmpEquation = _EQUATION_GARDEN[tmpIndex];

		// Set the expression
		if (this._ExpressionTokenizedEditorView)
		{
			this._ExpressionTokenizedEditorView.setExpression(tmpEquation.Expression);
		}

		// Determine merge vs overwrite
		let tmpOverwrite = false;
		if (typeof document !== 'undefined')
		{
			let tmpCheckbox = document.getElementById('SolveExplorer-OverwriteVars');
			if (tmpCheckbox)
			{
				tmpOverwrite = tmpCheckbox.checked;
			}
		}

		let tmpNewData = tmpEquation.Data || {};
		let tmpFinalData = tmpNewData;

		if (!tmpOverwrite)
		{
			// Merge: existing variables are preserved, new ones are added
			let tmpParsed = this._parseVariablesJSON();
			tmpFinalData = Object.assign({}, tmpParsed.data, tmpNewData);
		}

		if (this._VariablesCodeEditorView && this._VariablesCodeEditorView.codeJar)
		{
			this._VariablesCodeEditorView.setCode(JSON.stringify(tmpFinalData, null, '\t'));
		}

		this.solveExpression();
	}

	solveExpression()
	{
		let tmpExpression = '';
		if (this._ExpressionTokenizedEditorView)
		{
			tmpExpression = this._ExpressionTokenizedEditorView.getExpression();
		}

		if (!tmpExpression || tmpExpression.trim().length < 1)
		{
			return;
		}

		let tmpParsed = this._parseVariablesJSON();
		this._updateJSONIndicator(tmpParsed.valid, tmpParsed.error);
		if (!tmpParsed.valid)
		{
			this.log.warn(`Could not parse data: ${tmpParsed.error}`);
		}

		let tmpDataSource = tmpParsed.data;

		// Instantiate the expression parser if needed
		this.fable.instantiateServiceProviderIfNotExists('ExpressionParser');

		let tmpResultObject = {};
		let tmpDestObject = {};
		let tmpResult = this.fable.ExpressionParser.solve(tmpExpression, tmpDataSource, tmpResultObject, false, tmpDestObject);

		// Pass the result to the visualizer views
		let tmpVisualizerView = this.pict.views.ExpressionSolveVisualizer;
		if (tmpVisualizerView)
		{
			tmpVisualizerView.setSolveResult(tmpResultObject, tmpExpression);
		}
		let tmpTokenStackView = this.pict.views.ExpressionTokenStackVisualizer;
		if (tmpTokenStackView)
		{
			tmpTokenStackView.setSolveResult(tmpResultObject, tmpExpression);
		}
		let tmpPyramidView = this.pict.views.ExpressionSolvePyramidVisualizer;
		if (tmpPyramidView)
		{
			tmpPyramidView.setSolveResult(tmpResultObject, tmpExpression);
		}
	}
}

const _SolveExplorerInputViewConfiguration =
{
	"ViewIdentifier": "SolveExplorerInput",
	"RenderOnLoad": true,
	"DefaultRenderable": "SolveExplorer-Input-Wrap",
	"DefaultDestinationAddress": "#SolveExplorer-Input-Container",

	"Templates": [
		{
			"Hash": "SolveExplorer-Input-Template",
			"Template": html`<div id="SolveExplorer-Input-Container"></div>`
		}
	],
	"Renderables": [
		{
			"RenderableHash": "SolveExplorer-Input-Wrap",
			"TemplateHash": "SolveExplorer-Input-Template",
			"DestinationAddress": "#SolveExplorer-Input-Container",
			"RenderType": "replace"
		}
	]
};

class SolveExplorerLayoutView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender()
	{
		super.onAfterRender();

		// Render child views into the containers created by the layout template
		if (this.pict.views.SolveExplorerInput)
		{
			this.pict.views.SolveExplorerInput.render();
		}
		if (this.pict.views.ExpressionSolveVisualizer)
		{
			this.pict.views.ExpressionSolveVisualizer.render();
		}
		if (this.pict.views.ExpressionTokenStackVisualizer)
		{
			this.pict.views.ExpressionTokenStackVisualizer.render();
		}
		if (this.pict.views.ExpressionSolvePyramidVisualizer)
		{
			this.pict.views.ExpressionSolvePyramidVisualizer.render();
		}
	}
}

const _SolveExplorerLayoutViewConfiguration =
{
	"ViewIdentifier": "SolveExplorerLayout",
	"RenderOnLoad": true,
	"DefaultRenderable": "SolveExplorer-Layout-Wrap",
	"DefaultDestinationAddress": "#SolveExplorer-Container",

	"Templates": [
		{
			"Hash": "SolveExplorer-Layout-Template",
			"Template": html`
				<div id="SolveExplorer-Input-Container"></div>
				<div id="ExpressionSolve-Container"></div>
				<div id="ExpressionTokenStack-Container"></div>
				<div id="ExpressionSolvePyramid-Container"></div>
			`
		}
	],
	"Renderables": [
		{
			"RenderableHash": "SolveExplorer-Layout-Wrap",
			"TemplateHash": "SolveExplorer-Layout-Template",
			"DestinationAddress": "#SolveExplorer-Container",
			"RenderType": "replace"
		}
	]
};

class SolveExplorerApplication extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.pict.addView('PictSectionModal', {}, libPictSectionModal);
		this.pict.addView('SolveExplorerLayout', _SolveExplorerLayoutViewConfiguration, SolveExplorerLayoutView);
		this.pict.addView('SolveExplorerInput', _SolveExplorerInputViewConfiguration, SolveExplorerInputView);
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
	}
}

module.exports = SolveExplorerApplication;

module.exports.default_configuration =
{
	"Name": "Expression Solve Explorer",
	"Hash": "SolveExplorer",

	"MainViewportViewIdentifier": "SolveExplorerLayout",
	"MainViewportRenderableHash": "SolveExplorer-Layout-Wrap",
	"MainViewportDestinationAddress": "#SolveExplorer-Container",
	"AutoRenderMainViewportViewAfterInitialize": true,

	"pict_configuration":
	{
		"Product": "SolveExplorer"
	}
};
