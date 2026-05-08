const libPictViewClass = require('pict-view');

const html = String.raw;

const _TOKEN_TYPE_COLORS =
{
	'Token.Constant': '#2563eb',
	'Token.Operator': '#dc2626',
	'Token.VirtualSymbol': '#7c3aed',
	'Token.Symbol': '#059669',
	'Token.StateAddress': '#059669',
	'Token.Function': '#d97706',
	'Token.String': '#0891b2',
	'Token.Parenthesis': '#6b7280',
	'Token.LastResult': '#7c3aed'
};

const _TOKEN_TYPE_LABELS =
{
	'Token.Constant': 'Const',
	'Token.Operator': 'Op',
	'Token.VirtualSymbol': 'Virt',
	'Token.Symbol': 'Var',
	'Token.StateAddress': 'Addr',
	'Token.Function': 'Fn',
	'Token.String': 'Str',
	'Token.Parenthesis': 'Paren',
	'Token.LastResult': 'Last'
};

const _LAYER_COLORS =
[
	{ bg: '#f8fafc', border: '#cbd5e1', header: '#475569' },
	{ bg: '#eff6ff', border: '#93c5fd', header: '#1d4ed8' },
	{ bg: '#f0fdf4', border: '#86efac', header: '#15803d' },
	{ bg: '#fefce8', border: '#fde047', header: '#a16207' },
	{ bg: '#fdf2f8', border: '#f9a8d4', header: '#be185d' }
];

const default_configuration =
{
	"RenderOnLoad": true,
	"DefaultRenderable": "ExpressionTokenStack-Wrap",
	"DefaultDestinationAddress": "#ExpressionTokenStack-Container",

	"Templates": [
		{
			"Hash": "ExpressionTokenStack-Container",
			"Template": html`<div id="PictSectionEquation-ExpressionTokenStack" class="peq-ts"></div>`
		}
	],

	"Renderables": [
		{
			"RenderableHash": "ExpressionTokenStack-Wrap",
			"TemplateHash": "ExpressionTokenStack-Container",
			"DestinationAddress": "#ExpressionTokenStack-Container",
			"RenderType": "replace"
		}
	],

	"TargetElementAddress": "#ExpressionTokenStack-Container"
};

class PictViewExpressionTokenStack extends libPictViewClass
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, default_configuration, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this.solveResultObject = false;
		this.solveExpression = '';
	}

	getTokenColor(pType)
	{
		return _TOKEN_TYPE_COLORS[pType] || '#374151';
	}

	getTokenLabel(pType)
	{
		return _TOKEN_TYPE_LABELS[pType] || pType;
	}

	getLayerColor(pDepth)
	{
		let tmpIndex = pDepth % _LAYER_COLORS.length;
		return _LAYER_COLORS[tmpIndex];
	}

	escapeHTML(pString)
	{
		if (typeof(pString) !== 'string')
		{
			return String(pString);
		}
		return pString
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	/**
	 * Format a numeric value for display, truncating excessive decimal precision.
	 * Numbers with more than 10 digits after the decimal are truncated with an
	 * italic ellipsis showing remaining digit count.  Integers longer than 15
	 * digits use scientific notation.
	 */
	formatNumericValue(pValue)
	{
		if (pValue === undefined || pValue === null)
		{
			return '';
		}
		let tmpStr = String(pValue);
		// Check if the string representation is numeric (handles number, Big.js, numeric strings)
		if (!/^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(tmpStr))
		{
			return this.escapeHTML(tmpStr);
		}
		let tmpDotIndex = tmpStr.indexOf('.');
		if (tmpDotIndex >= 0)
		{
			// Check for exponent notation in the string (e.g. from Big.js)
			let tmpEIndex = tmpStr.search(/e/i);
			let tmpDecimalPart = (tmpEIndex >= 0) ? tmpStr.substring(tmpDotIndex + 1, tmpEIndex) : tmpStr.substring(tmpDotIndex + 1);
			if (tmpDecimalPart.length > 10)
			{
				let tmpTruncated = tmpStr.substring(0, tmpDotIndex + 11);
				let tmpRemaining = tmpDecimalPart.length - 10;
				let tmpFullEscaped = this.escapeHTML(tmpStr);
				return `<span class="peq-truncated-value" data-full-value="${tmpFullEscaped}" data-total-digits="${tmpStr.length}" style="cursor:pointer;">${tmpTruncated}<i style="color:#6b7280; font-style:italic;">...${tmpRemaining} more...</i></span>`;
			}
			return tmpStr;
		}
		// Large integers: use scientific notation
		let tmpAbsDigits = tmpStr.replace('-', '').length;
		if (tmpAbsDigits > 15)
		{
			let tmpSciNotation = '';
			if (typeof(pValue) === 'number')
			{
				tmpSciNotation = pValue.toExponential(10);
			}
			else
			{
				// For Big.js or string values, format manually
				let tmpSign = tmpStr.startsWith('-') ? '-' : '';
				let tmpDigits = tmpStr.replace('-', '');
				let tmpMantissa = tmpDigits[0] + '.' + tmpDigits.substring(1, 11);
				let tmpExponent = tmpDigits.length - 1;
				tmpSciNotation = `${tmpSign}${tmpMantissa}e+${tmpExponent}`;
			}
			let tmpFullEscaped = this.escapeHTML(tmpStr);
			return `<span class="peq-truncated-value" data-full-value="${tmpFullEscaped}" data-total-digits="${tmpStr.length}" style="cursor:pointer;">${tmpSciNotation}</span>`;
		}
		return tmpStr;
	}

	/**
	 * Attach richTooltip from PictSectionModal to all truncated value spans
	 * within the given container element.
	 */
	attachTruncatedValueTooltips(pContainerSelector)
	{
		if (typeof document === 'undefined')
		{
			return;
		}
		let tmpModal = this.pict.views.PictSectionModal;
		if (!tmpModal)
		{
			return;
		}

		// Clean up any previously attached tooltips
		if (!this._truncatedValueTooltips)
		{
			this._truncatedValueTooltips = [];
		}
		for (let i = 0; i < this._truncatedValueTooltips.length; i++)
		{
			this._truncatedValueTooltips[i].destroy();
		}
		this._truncatedValueTooltips = [];

		let tmpContainer = document.querySelector(pContainerSelector);
		if (!tmpContainer)
		{
			return;
		}
		let tmpSpans = tmpContainer.querySelectorAll('.peq-truncated-value');
		for (let i = 0; i < tmpSpans.length; i++)
		{
			let tmpSpan = tmpSpans[i];
			let tmpFullValue = tmpSpan.getAttribute('data-full-value');
			let tmpTotalDigits = tmpSpan.getAttribute('data-total-digits');
			let tmpTooltipHTML = `<div style="font-family:'SF Mono','Fira Code','Cascadia Code',monospace; font-size:12px; line-height:1.6; max-width:400px;"><div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">${tmpTotalDigits} characters</div><div style="word-break:break-all; color:#f1f5f9;">${tmpFullValue}</div></div>`;
			let tmpHandle = tmpModal.richTooltip(tmpSpan, tmpTooltipHTML, { position: 'top', delay: 100, maxWidth: '450px', interactive: true });
			this._truncatedValueTooltips.push(tmpHandle);
		}
	}

	/**
	 * Group PostfixTokenObjects by SolveLayerStack, preserving order.
	 * Returns an array of { layerId, depth, tokens[] } sorted deepest-first.
	 */
	groupTokensByLayer(pResultObject)
	{
		if (!pResultObject || !pResultObject.PostfixTokenObjects)
		{
			return [];
		}

		let tmpLayerMap = {};
		let tmpLayerOrder = [];

		for (let i = 0; i < pResultObject.PostfixTokenObjects.length; i++)
		{
			let tmpToken = pResultObject.PostfixTokenObjects[i];
			let tmpLayerId = tmpToken.SolveLayerStack || 'SolveSet_0_D_0';
			let tmpDepth = (typeof(tmpToken.Depth) === 'number') ? tmpToken.Depth : 0;

			// Skip parenthesis tokens themselves — they are layer boundaries
			if (tmpToken.Type === 'Token.Parenthesis')
			{
				continue;
			}

			if (!(tmpLayerId in tmpLayerMap))
			{
				tmpLayerMap[tmpLayerId] = { layerId: tmpLayerId, depth: tmpDepth, tokens: [] };
				tmpLayerOrder.push(tmpLayerId);
			}

			tmpLayerMap[tmpLayerId].tokens.push(tmpToken);
		}

		// Sort deepest first (highest depth at top of the visual stack)
		let tmpLayers = tmpLayerOrder.map((pId) => { return tmpLayerMap[pId]; });
		tmpLayers.sort((a, b) => { return b.depth - a.depth; });

		return tmpLayers;
	}

	/**
	 * Get the resolved value for a layer from the PostfixLayerstackMap and VirtualSymbols.
	 */
	getLayerResolvedValue(pLayerId, pResultObject)
	{
		if (!pResultObject)
		{
			return '';
		}

		let tmpVirtualSymbolName = '';

		if (pResultObject.PostfixLayerstackMap && (pLayerId in pResultObject.PostfixLayerstackMap))
		{
			tmpVirtualSymbolName = pResultObject.PostfixLayerstackMap[pLayerId];
		}

		if (tmpVirtualSymbolName && pResultObject.VirtualSymbols && (tmpVirtualSymbolName in pResultObject.VirtualSymbols))
		{
			let tmpValue = pResultObject.VirtualSymbols[tmpVirtualSymbolName];
			if (typeof(tmpValue) === 'object' && !Array.isArray(tmpValue))
			{
				return `{${Object.keys(tmpValue).length} keys}`;
			}
			if (Array.isArray(tmpValue))
			{
				return `[${tmpValue.length} items]`;
			}
			return this.formatNumericValue(tmpValue);
		}

		return '';
	}

	buildCSS()
	{
		return html`
		<style>
			.peq-ts
			{
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				color: #1f2937;
				line-height: 1.5;
			}
			.peq-ts-section
			{
				margin-bottom: 20px;
			}
			.peq-ts-section-title
			{
				font-size: 13px;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				color: #475569;
				margin-bottom: 8px;
				padding-bottom: 4px;
				border-bottom: 2px solid #e2e8f0;
			}
			.peq-ts-expression
			{
				padding: 10px 14px;
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: 6px;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 14px;
				font-weight: 600;
				color: #0f172a;
				margin-bottom: 16px;
			}
			.peq-ts-stack
			{
				display: flex;
				flex-direction: column;
				gap: 0;
			}
			.peq-ts-frame
			{
				border: 2px solid #cbd5e1;
				border-radius: 8px;
				margin-bottom: 8px;
				overflow: hidden;
			}
			.peq-ts-frame-header
			{
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 6px 12px;
				font-size: 11px;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.05em;
			}
			.peq-ts-frame-depth
			{
				display: inline-flex;
				align-items: center;
				gap: 6px;
			}
			.peq-ts-frame-depth-badge
			{
				display: inline-block;
				padding: 1px 6px;
				border-radius: 3px;
				background: rgba(0,0,0,0.1);
				font-size: 10px;
			}
			.peq-ts-frame-value
			{
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 13px;
				font-weight: 700;
				color: #059669;
			}
			.peq-ts-frame-tokens
			{
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
				padding: 10px 12px;
				align-items: center;
			}
			.peq-ts-token
			{
				display: inline-flex;
				flex-direction: column;
				align-items: center;
				gap: 1px;
				padding: 4px 8px;
				border-radius: 4px;
				border: 1px solid #e2e8f0;
				background: white;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				min-width: 32px;
				text-align: center;
			}
			.peq-ts-token-value
			{
				font-size: 14px;
				font-weight: 600;
			}
			.peq-ts-token-label
			{
				font-size: 8px;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				opacity: 0.6;
			}
			.peq-ts-token-vref
			{
				background: #f5f3ff;
				border-color: #c4b5fd;
			}
			.peq-ts-arrow
			{
				display: flex;
				justify-content: center;
				padding: 2px 0;
				color: #94a3b8;
				font-size: 16px;
			}
			.peq-ts-eval-steps
			{
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			.peq-ts-eval-step
			{
				display: flex;
				align-items: stretch;
				gap: 12px;
				padding: 8px 12px;
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: 6px;
			}
			.peq-ts-eval-step-num
			{
				display: flex;
				align-items: center;
				justify-content: center;
				width: 28px;
				min-width: 28px;
				font-size: 11px;
				font-weight: 700;
				color: #94a3b8;
			}
			.peq-ts-eval-step-op
			{
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: center;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 13px;
			}
			.peq-ts-eval-step-expr
			{
				font-weight: 600;
				color: #1e293b;
			}
			.peq-ts-eval-step-resolved
			{
				font-size: 12px;
				color: #64748b;
			}
			.peq-ts-eval-step-stack
			{
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
				align-items: center;
				padding-left: 12px;
				border-left: 2px solid #e2e8f0;
				min-width: 120px;
			}
			.peq-ts-eval-sym
			{
				display: inline-block;
				padding: 2px 6px;
				border-radius: 3px;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 11px;
				font-weight: 600;
			}
			.peq-ts-eval-sym-new
			{
				background: #dcfce7;
				color: var(--theme-color-status-success, #15803d);
				border: 1px solid #86efac;
			}
			.peq-ts-eval-sym-existing
			{
				background: #f1f5f9;
				color: #475569;
				border: 1px solid #e2e8f0;
			}
			.peq-ts-eval-stack-badge
			{
				display: inline-block;
				padding: 2px 8px;
				border-radius: 10px;
				font-size: 10px;
				font-weight: 600;
				background: #e2e8f0;
				color: #475569;
				cursor: default;
				letter-spacing: 0.02em;
			}
			.peq-ts-empty
			{
				text-align: center;
				padding: 24px 16px;
				color: #94a3b8;
				font-style: italic;
			}
		</style>`;
	}

	buildTokenHTML(pToken, pResultObject)
	{
		let tmpColor = this.getTokenColor(pToken.Type);
		let tmpLabel = this.getTokenLabel(pToken.Type);
		let tmpTokenText = this.escapeHTML(pToken.Token);

		// Check if this token is a virtual symbol reference (inner layer result)
		let tmpIsVRef = (pToken.Type === 'Token.VirtualSymbol') ||
			(pToken.VirtualSymbolName && pToken.Type === 'Token.Parenthesis');
		let tmpVRefClass = tmpIsVRef ? ' peq-ts-token-vref' : '';

		// Show resolved value for symbols/addresses
		let tmpResolvedDisplay = '';
		if (pToken.Value !== undefined && pToken.Value !== null && String(pToken.Value) !== pToken.Token)
		{
			tmpResolvedDisplay = `<div style="font-size:10px; color:#059669; font-weight:600;">${this.formatNumericValue(pToken.Value)}</div>`;
		}

		return `<div class="peq-ts-token${tmpVRefClass}" style="border-color:${tmpColor}40">
			<div class="peq-ts-token-value" style="color:${tmpColor}">${tmpTokenText}</div>
			${tmpResolvedDisplay}
			<div class="peq-ts-token-label" style="color:${tmpColor}">${tmpLabel}</div>
		</div>`;
	}

	buildLayerFrameHTML(pLayer, pResultObject)
	{
		let tmpColors = this.getLayerColor(pLayer.depth);
		let tmpResolvedValue = this.getLayerResolvedValue(pLayer.layerId, pResultObject);

		let tmpValueDisplay = '';
		if (tmpResolvedValue)
		{
			tmpValueDisplay = `<span class="peq-ts-frame-value">= ${tmpResolvedValue}</span>`;
		}

		let tmpTokensHTML = '';
		for (let i = 0; i < pLayer.tokens.length; i++)
		{
			tmpTokensHTML += this.buildTokenHTML(pLayer.tokens[i], pResultObject);
		}

		let tmpLayerLabel = pLayer.layerId;
		if (pLayer.layerId.startsWith('SolveSet'))
		{
			tmpLayerLabel = 'Root';
		}
		else if (pLayer.layerId.startsWith('Pr_'))
		{
			tmpLayerLabel = `( ${pLayer.layerId} )`;
		}

		return `<div class="peq-ts-frame" style="border-color:${tmpColors.border}; margin-left:${pLayer.depth * 16}px;">
			<div class="peq-ts-frame-header" style="background:${tmpColors.bg}; color:${tmpColors.header};">
				<span class="peq-ts-frame-depth">
					${this.escapeHTML(tmpLayerLabel)}
					<span class="peq-ts-frame-depth-badge">depth ${pLayer.depth}</span>
				</span>
				${tmpValueDisplay}
			</div>
			<div class="peq-ts-frame-tokens">
				${tmpTokensHTML}
			</div>
		</div>`;
	}

	buildTokenStackHTML(pResultObject)
	{
		let tmpLayers = this.groupTokensByLayer(pResultObject);

		if (tmpLayers.length < 1)
		{
			return '<div class="peq-ts-empty">No token layers to display</div>';
		}

		let tmpHTML = '<div class="peq-ts-stack">';
		for (let i = 0; i < tmpLayers.length; i++)
		{
			if (i > 0)
			{
				tmpHTML += '<div class="peq-ts-arrow">&#x25BC;</div>';
			}
			tmpHTML += this.buildLayerFrameHTML(tmpLayers[i], pResultObject);
		}
		tmpHTML += '</div>';

		return tmpHTML;
	}

	getVirtualSymbolValue(pVirtualSymbolName, pResultObject)
	{
		if (!pResultObject || !pResultObject.VirtualSymbols)
		{
			return '';
		}
		if (pVirtualSymbolName in pResultObject.VirtualSymbols)
		{
			let tmpVal = pResultObject.VirtualSymbols[pVirtualSymbolName];
			if (typeof(tmpVal) === 'object' && !Array.isArray(tmpVal))
			{
				return `{${Object.keys(tmpVal).length}}`;
			}
			if (Array.isArray(tmpVal))
			{
				return `[${tmpVal.length}]`;
			}
			return this.formatNumericValue(tmpVal);
		}
		return '';
	}

	buildOperandText(pToken)
	{
		if (!pToken)
		{
			return '';
		}
		return this.escapeHTML(pToken.Token);
	}

	buildResolvedOperandText(pToken, pResultObject)
	{
		if (!pToken)
		{
			return '';
		}
		if ((pToken.Type === 'Token.Symbol' || pToken.Type === 'Token.Constant') && pToken.Value !== undefined)
		{
			return this.formatNumericValue(pToken.Value);
		}
		if (pToken.Type === 'Token.VirtualSymbol' || pToken.Type === 'Token.Parenthesis')
		{
			let tmpName = pToken.VirtualSymbolName || pToken.Token;
			let tmpVal = this.getVirtualSymbolValue(tmpName, pResultObject);
			if (tmpVal)
			{
				return tmpVal;
			}
		}
		return this.escapeHTML(pToken.Token);
	}

	buildEvalStepsHTML(pResultObject)
	{
		if (!pResultObject || !pResultObject.PostfixSolveList || pResultObject.PostfixSolveList.length < 1)
		{
			return '<div class="peq-ts-empty">No evaluation steps</div>';
		}

		let tmpSymbolsSoFar = [];
		let tmpHTML = '<div class="peq-ts-eval-steps">';

		for (let i = 0; i < pResultObject.PostfixSolveList.length; i++)
		{
			let tmpOp = pResultObject.PostfixSolveList[i];
			let tmpVName = tmpOp.VirtualSymbolName || '';
			let tmpOpToken = tmpOp.Operation ? tmpOp.Operation.Token : '';
			let tmpVPrefix = tmpVName.substring(0, 3);

			// Build the symbolic expression
			let tmpExprHTML = '';
			if (tmpOpToken === '=')
			{
				tmpExprHTML = `<span style="color:#7c3aed">${this.escapeHTML(tmpVName)}</span> <span style="color:var(--theme-color-status-error, #dc2626)">=</span> ${this.buildOperandText(tmpOp.LeftValue)}`;
			}
			else if (tmpVPrefix === 'VFE')
			{
				tmpExprHTML = `<span style="color:#7c3aed">${this.escapeHTML(tmpVName)}</span> <span style="color:var(--theme-color-status-error, #dc2626)">=</span> <span style="color:var(--theme-color-status-warning, #d97706)">${this.escapeHTML(tmpOpToken)}</span>(${this.buildOperandText(tmpOp.LeftValue)})`;
			}
			else
			{
				tmpExprHTML = `<span style="color:#7c3aed">${this.escapeHTML(tmpVName)}</span> <span style="color:var(--theme-color-status-error, #dc2626)">=</span> ${this.buildOperandText(tmpOp.LeftValue)} <span style="color:var(--theme-color-status-error, #dc2626)">${this.escapeHTML(tmpOpToken)}</span> ${this.buildOperandText(tmpOp.RightValue)}`;
			}

			// Build the resolved expression
			let tmpResolvedHTML = '';
			let tmpResultVal = this.getVirtualSymbolValue(tmpVName, pResultObject);
			if (tmpOpToken === '=')
			{
				tmpResolvedHTML = `${this.buildResolvedOperandText(tmpOp.LeftValue, pResultObject)} &rarr; <span style="color:#059669; font-weight:600;">${tmpResultVal}</span>`;
			}
			else if (tmpVPrefix === 'VFE')
			{
				tmpResolvedHTML = `${this.escapeHTML(tmpOpToken)}(${this.buildResolvedOperandText(tmpOp.LeftValue, pResultObject)}) &rarr; <span style="color:#059669; font-weight:600;">${tmpResultVal}</span>`;
			}
			else
			{
				tmpResolvedHTML = `${this.buildResolvedOperandText(tmpOp.LeftValue, pResultObject)} ${this.escapeHTML(tmpOpToken)} ${this.buildResolvedOperandText(tmpOp.RightValue, pResultObject)} &rarr; <span style="color:#059669; font-weight:600;">${tmpResultVal}</span>`;
			}

			// Build the growing symbol stack (stored as data for tooltip)
			tmpSymbolsSoFar.push(tmpVName);
			let tmpTooltipLines = [];
			for (let j = 0; j < tmpSymbolsSoFar.length; j++)
			{
				let tmpSymVal = this.getVirtualSymbolValue(tmpSymbolsSoFar[j], pResultObject);
				let tmpIsNew = (j === tmpSymbolsSoFar.length - 1);
				tmpTooltipLines.push({ name: tmpSymbolsSoFar[j], value: tmpSymVal, isNew: tmpIsNew });
			}

			// Show the newly assigned symbol as a chip, plus a count badge for the full stack
			let tmpResultVal2 = this.getVirtualSymbolValue(tmpVName, pResultObject);
			let tmpStackHTML = `<span class="peq-ts-eval-sym peq-ts-eval-sym-new">${this.escapeHTML(tmpVName)} = ${tmpResultVal2}</span>`;
			if (tmpSymbolsSoFar.length > 1)
			{
				tmpStackHTML += `<span class="peq-ts-eval-stack-badge" id="peq-ts-eval-stack-${i}" data-tooltip-lines="${this.escapeHTML(JSON.stringify(tmpTooltipLines))}">${tmpSymbolsSoFar.length} vars</span>`;
			}

			tmpHTML += `<div class="peq-ts-eval-step">
				<div class="peq-ts-eval-step-num">${i}</div>
				<div class="peq-ts-eval-step-op">
					<div class="peq-ts-eval-step-expr">${tmpExprHTML}</div>
					<div class="peq-ts-eval-step-resolved">${tmpResolvedHTML}</div>
				</div>
				<div class="peq-ts-eval-step-stack">${tmpStackHTML}</div>
			</div>`;
		}

		tmpHTML += '</div>';
		return tmpHTML;
	}

	buildVisualizationHTML()
	{
		let tmpResultObject = this.solveResultObject;

		if (!tmpResultObject)
		{
			return `${this.buildCSS()}<div class="peq-ts-empty">No expression data. Use setSolveResult() to provide data.</div>`;
		}

		let tmpExpression = ('RawExpression' in tmpResultObject) ? tmpResultObject.RawExpression : this.solveExpression;

		return `${this.buildCSS()}
		<div class="peq-ts-expression">${this.escapeHTML(tmpExpression)}</div>
		<div class="peq-ts-section">
			<div class="peq-ts-section-title">Token Stack (by Depth Layer)</div>
			${this.buildTokenStackHTML(tmpResultObject)}
		</div>
		<div class="peq-ts-section">
			<div class="peq-ts-section-title">Postfix Evaluation Stack</div>
			${this.buildEvalStepsHTML(tmpResultObject)}
		</div>`;
	}

	setSolveResult(pResultObject, pExpression)
	{
		this.solveResultObject = (typeof(pResultObject) === 'object') ? pResultObject : false;
		this.solveExpression = (typeof(pExpression) === 'string') ? pExpression : '';
		this.renderVisualization();
	}

	renderVisualization()
	{
		let tmpContent = this.buildVisualizationHTML();
		this.services.ContentAssignment.assignContent('#PictSectionEquation-ExpressionTokenStack', tmpContent);
		this.attachTruncatedValueTooltips('#PictSectionEquation-ExpressionTokenStack');
		this._attachStackTooltips();
	}

	/**
	 * Attach pict-section-modal tooltips to the stack badges
	 * showing the full variable state at each evaluation step.
	 */
	_attachStackTooltips()
	{
		if (typeof document === 'undefined')
		{
			return;
		}

		// Clean up any previously attached tooltips
		if (this._stackTooltipHandles)
		{
			for (let i = 0; i < this._stackTooltipHandles.length; i++)
			{
				this._stackTooltipHandles[i].destroy();
			}
		}
		this._stackTooltipHandles = [];

		let tmpModal = this.pict.views.PictSectionModal;
		if (!tmpModal)
		{
			return;
		}

		let tmpBadges = document.querySelectorAll('.peq-ts-eval-stack-badge');
		for (let i = 0; i < tmpBadges.length; i++)
		{
			let tmpBadge = tmpBadges[i];
			let tmpDataAttr = tmpBadge.getAttribute('data-tooltip-lines');
			if (!tmpDataAttr)
			{
				continue;
			}
			try
			{
				let tmpLines = JSON.parse(tmpDataAttr);
				let tmpTooltipHTML = '<div style="font-family: monospace; font-size: 12px; line-height: 1.6;">';
				for (let j = 0; j < tmpLines.length; j++)
				{
					let tmpLine = tmpLines[j];
					let tmpColor = tmpLine.isNew ? '#4ade80' : '#d4d4d8';
					let tmpWeight = tmpLine.isNew ? '700' : '400';
					let tmpPrefix = tmpLine.isNew ? '\u25B6 ' : '';
					tmpTooltipHTML += `<div style="color:${tmpColor}; font-weight:${tmpWeight};">${tmpPrefix}${tmpLine.name} = ${tmpLine.value}</div>`;
				}
				tmpTooltipHTML += '</div>';

				let tmpHandle = tmpModal.richTooltip(tmpBadge, tmpTooltipHTML,
				{
					position: 'left',
					delay: 100,
					interactive: true,
					maxWidth: '400px'
				});
				this._stackTooltipHandles.push(tmpHandle);
			}
			catch (pError)
			{
				// Graceful degradation — no tooltip if data is malformed
			}
		}
	}

	onAfterRender()
	{
		super.onAfterRender();
		if (this.solveResultObject)
		{
			this.renderVisualization();
		}
	}
}

module.exports = PictViewExpressionTokenStack;
module.exports.default_configuration = default_configuration;
