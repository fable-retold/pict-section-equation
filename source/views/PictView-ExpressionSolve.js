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
	'Token.Constant': 'Constant',
	'Token.Operator': 'Operator',
	'Token.VirtualSymbol': 'Virtual',
	'Token.Symbol': 'Variable',
	'Token.StateAddress': 'Address',
	'Token.Function': 'Function',
	'Token.String': 'String',
	'Token.Parenthesis': 'Paren',
	'Token.LastResult': 'LastResult'
};

const default_configuration =
{
	"RenderOnLoad": true,
	"DefaultRenderable": "ExpressionSolve-Wrap",
	"DefaultDestinationAddress": "#ExpressionSolve-Container",

	"Templates": [
		{
			"Hash": "ExpressionSolve-Container",
			"Template": html`<div id="PictSectionEquation-ExpressionSolve" class="peq-expression-solve"></div>`
		}
	],

	"Renderables": [
		{
			"RenderableHash": "ExpressionSolve-Wrap",
			"TemplateHash": "ExpressionSolve-Container",
			"DestinationAddress": "#ExpressionSolve-Container",
			"RenderType": "replace"
		}
	],

	"TargetElementAddress": "#ExpressionSolve-Container"
};

class PictViewExpressionSolve extends libPictViewClass
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

	getVirtualSymbolValue(pToken, pResultObject)
	{
		if (!pToken || !pResultObject)
		{
			return '';
		}

		if ((pToken.Type === 'Token.Symbol' || pToken.Type === 'Token.Constant') && ('Value' in pToken))
		{
			return this.formatNumericValue(pToken.Value);
		}

		let tmpVirtualSymbolName = ('VirtualSymbolName' in pToken) ? pToken.VirtualSymbolName
			: (pToken.Type === 'Token.VirtualSymbol') ? pToken.Token
			: false;

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

		return String(pToken.Token);
	}

	buildCSS()
	{
		return html`
		<style>
			.peq-expression-solve
			{
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
				color: #1f2937;
				line-height: 1.5;
			}
			.peq-header
			{
				padding: 12px 16px;
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: 8px;
				margin-bottom: 16px;
			}
			.peq-header-label
			{
				font-size: 11px;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				color: #64748b;
				margin-bottom: 4px;
			}
			.peq-header-expression
			{
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 16px;
				font-weight: 600;
				color: #0f172a;
				word-break: break-all;
			}
			.peq-header-result
			{
				margin-top: 8px;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 14px;
				color: #059669;
				font-weight: 600;
			}
			.peq-section
			{
				margin-bottom: 16px;
			}
			.peq-section-title
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
			.peq-steps-table
			{
				width: 100%;
				border-collapse: collapse;
				font-size: 13px;
			}
			.peq-steps-table th
			{
				text-align: left;
				padding: 6px 10px;
				background: #f1f5f9;
				border-bottom: 2px solid #cbd5e1;
				font-weight: 600;
				color: #475569;
				font-size: 11px;
				text-transform: uppercase;
				letter-spacing: 0.05em;
			}
			.peq-steps-table td
			{
				padding: 6px 10px;
				border-bottom: 1px solid #e2e8f0;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 12px;
				vertical-align: top;
			}
			.peq-steps-table tr:hover td
			{
				background: #f8fafc;
			}
			.peq-step-num
			{
				color: #94a3b8;
				font-weight: 600;
				width: 40px;
			}
			.peq-step-symbol
			{
				color: #7c3aed;
				font-weight: 600;
			}
			.peq-step-op
			{
				color: var(--theme-color-status-error, #dc2626);
				font-weight: 700;
				text-align: center;
				width: 40px;
			}
			.peq-step-result
			{
				color: #059669;
				font-weight: 600;
			}
			.peq-token-badge
			{
				display: inline-block;
				padding: 1px 6px;
				border-radius: 4px;
				font-size: 11px;
				font-weight: 500;
				margin-right: 4px;
			}
			.peq-symbols-table
			{
				width: 100%;
				border-collapse: collapse;
				font-size: 13px;
			}
			.peq-symbols-table th
			{
				text-align: left;
				padding: 6px 10px;
				background: #f1f5f9;
				border-bottom: 2px solid #cbd5e1;
				font-weight: 600;
				color: #475569;
				font-size: 11px;
				text-transform: uppercase;
				letter-spacing: 0.05em;
			}
			.peq-symbols-table td
			{
				padding: 4px 10px;
				border-bottom: 1px solid #e2e8f0;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 12px;
			}
			.peq-symbols-table tr:hover td
			{
				background: #f8fafc;
			}
			.peq-tokens-list
			{
				display: flex;
				flex-wrap: wrap;
				gap: 4px;
				padding: 8px;
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: 6px;
			}
			.peq-token-item
			{
				display: inline-flex;
				align-items: center;
				gap: 4px;
				padding: 3px 8px;
				border-radius: 4px;
				border: 1px solid #e2e8f0;
				background: white;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 12px;
			}
			.peq-token-type-label
			{
				font-size: 9px;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				opacity: 0.7;
			}
			.peq-empty-state
			{
				text-align: center;
				padding: 32px 16px;
				color: #94a3b8;
				font-style: italic;
			}
			.peq-log-list
			{
				list-style: none;
				padding: 8px;
				margin: 0;
				background: #1e293b;
				border-radius: 6px;
				font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
				font-size: 12px;
				max-height: 200px;
				overflow-y: auto;
			}
			.peq-log-list li
			{
				padding: 2px 8px;
				color: #e2e8f0;
			}
			.peq-log-list li:nth-child(odd)
			{
				background: rgba(255, 255, 255, 0.03);
			}
		</style>`;
	}

	buildOperandHTML(pToken, pResultObject)
	{
		if (!pToken)
		{
			return '';
		}
		let tmpTokenText = this.escapeHTML(pToken.Token);
		let tmpValue = this.getVirtualSymbolValue(pToken, pResultObject);
		let tmpColor = this.getTokenColor(pToken.Type);

		if (tmpValue && tmpValue !== tmpTokenText)
		{
			return `<span style="color:${tmpColor}">${tmpTokenText}</span> <span style="color:#94a3b8">=</span> <span style="color:#0f172a">${tmpValue}</span>`;
		}
		return `<span style="color:${tmpColor}">${tmpTokenText}</span>`;
	}

	buildStepRow(pIndex, pOperation, pResultObject)
	{
		if (!pOperation)
		{
			return '';
		}

		let tmpVirtualSymbolName = ('VirtualSymbolName' in pOperation) ? pOperation.VirtualSymbolName : '';
		let tmpOperationToken = pOperation.Operation ? pOperation.Operation.Token : '';
		let tmpVirtualSymbolPrefix = tmpVirtualSymbolName.substring(0, 3);

		let tmpResultValue = '';
		if (pResultObject && pResultObject.VirtualSymbols && (tmpVirtualSymbolName in pResultObject.VirtualSymbols))
		{
			let tmpRawResult = pResultObject.VirtualSymbols[tmpVirtualSymbolName];
			if (typeof(tmpRawResult) === 'object' && !Array.isArray(tmpRawResult))
			{
				tmpResultValue = `{${Object.keys(tmpRawResult).length} keys}`;
			}
			else if (Array.isArray(tmpRawResult))
			{
				tmpResultValue = `[${tmpRawResult.length} items]`;
			}
			else
			{
				tmpResultValue = this.formatNumericValue(tmpRawResult);
			}
		}

		let tmpExpressionHTML = '';

		if (tmpOperationToken === '=')
		{
			// Assignment
			tmpExpressionHTML = this.buildOperandHTML(pOperation.LeftValue, pResultObject);
		}
		else if (tmpVirtualSymbolPrefix === 'VFE')
		{
			// Function call
			tmpExpressionHTML = `<span style="color:var(--theme-color-status-warning, #d97706)">${this.escapeHTML(tmpOperationToken)}</span>(<span>${this.buildOperandHTML(pOperation.LeftValue, pResultObject)}</span>)`;
		}
		else
		{
			// Binary operation
			tmpExpressionHTML = `${this.buildOperandHTML(pOperation.LeftValue, pResultObject)} <span class="peq-step-op">${this.escapeHTML(tmpOperationToken)}</span> ${this.buildOperandHTML(pOperation.RightValue, pResultObject)}`;
		}

		return `<tr>
			<td class="peq-step-num">${pIndex}</td>
			<td class="peq-step-symbol">${this.escapeHTML(tmpVirtualSymbolName)}</td>
			<td>${tmpExpressionHTML}</td>
			<td class="peq-step-result">${tmpResultValue}</td>
		</tr>`;
	}

	buildSolveStepsHTML(pResultObject)
	{
		if (!pResultObject || !pResultObject.PostfixSolveList || pResultObject.PostfixSolveList.length < 1)
		{
			return '<div class="peq-empty-state">No solve steps available</div>';
		}

		let tmpRows = '';
		for (let i = 0; i < pResultObject.PostfixSolveList.length; i++)
		{
			tmpRows += this.buildStepRow(i, pResultObject.PostfixSolveList[i], pResultObject);
		}

		return `<table class="peq-steps-table">
			<thead><tr>
				<th>#</th>
				<th>Symbol</th>
				<th>Expression</th>
				<th>Result</th>
			</tr></thead>
			<tbody>${tmpRows}</tbody>
		</table>`;
	}

	buildVirtualSymbolsHTML(pResultObject)
	{
		if (!pResultObject || !pResultObject.VirtualSymbols)
		{
			return '<div class="peq-empty-state">No virtual symbols</div>';
		}

		let tmpKeys = Object.keys(pResultObject.VirtualSymbols);
		if (tmpKeys.length < 1)
		{
			return '<div class="peq-empty-state">No virtual symbols</div>';
		}

		let tmpRows = '';
		for (let i = 0; i < tmpKeys.length; i++)
		{
			let tmpKey = tmpKeys[i];
			let tmpValue = pResultObject.VirtualSymbols[tmpKey];
			let tmpDisplayValue = '';

			if (typeof(tmpValue) === 'object' && !Array.isArray(tmpValue))
			{
				tmpDisplayValue = `{${Object.keys(tmpValue).length} keys}`;
			}
			else if (Array.isArray(tmpValue))
			{
				tmpDisplayValue = `[${tmpValue.length} items]`;
			}
			else
			{
				tmpDisplayValue = this.formatNumericValue(tmpValue);
			}

			tmpRows += `<tr>
				<td style="color:#7c3aed; font-weight:600;">${this.escapeHTML(tmpKey)}</td>
				<td>${tmpDisplayValue}</td>
			</tr>`;
		}

		return `<table class="peq-symbols-table">
			<thead><tr>
				<th>Symbol</th>
				<th>Value</th>
			</tr></thead>
			<tbody>${tmpRows}</tbody>
		</table>`;
	}

	buildTokensHTML(pResultObject)
	{
		if (!pResultObject || !pResultObject.PostfixTokenObjects || pResultObject.PostfixTokenObjects.length < 1)
		{
			return '<div class="peq-empty-state">No tokens</div>';
		}

		let tmpTokens = '';
		for (let i = 0; i < pResultObject.PostfixTokenObjects.length; i++)
		{
			let tmpToken = pResultObject.PostfixTokenObjects[i];
			let tmpColor = this.getTokenColor(tmpToken.Type);
			let tmpLabel = this.getTokenLabel(tmpToken.Type);

			tmpTokens += `<span class="peq-token-item" style="border-color:${tmpColor}40">
				<span class="peq-token-type-label" style="color:${tmpColor}">${this.escapeHTML(tmpLabel)}</span>
				<span style="color:${tmpColor}; font-weight:600;">${this.escapeHTML(tmpToken.Token)}</span>
			</span>`;
		}

		return `<div class="peq-tokens-list">${tmpTokens}</div>`;
	}

	buildLogHTML(pResultObject)
	{
		if (!pResultObject || !pResultObject.ExpressionParserLog || pResultObject.ExpressionParserLog.length < 1)
		{
			return '';
		}

		let tmpItems = '';
		for (let i = 0; i < pResultObject.ExpressionParserLog.length; i++)
		{
			tmpItems += `<li>${this.escapeHTML(pResultObject.ExpressionParserLog[i])}</li>`;
		}

		return `<div class="peq-section">
			<div class="peq-section-title">Parser Log</div>
			<ul class="peq-log-list">${tmpItems}</ul>
		</div>`;
	}

	buildVisualizationHTML()
	{
		let tmpResultObject = this.solveResultObject;

		if (!tmpResultObject)
		{
			return `${this.buildCSS()}<div class="peq-empty-state">No expression solve result to display. Use setSolveResult() to provide data.</div>`;
		}

		let tmpExpression = ('RawExpression' in tmpResultObject) ? tmpResultObject.RawExpression : this.solveExpression;
		let tmpRawResult = ('RawResult' in tmpResultObject) ? tmpResultObject.RawResult : '';
		let tmpAssignmentAddress = ('PostfixedAssignmentAddress' in tmpResultObject) ? tmpResultObject.PostfixedAssignmentAddress : '';

		let tmpResultDisplay = '';
		if (tmpRawResult !== '')
		{
			let tmpFormattedResult = this.formatNumericValue(tmpRawResult);
			let tmpResultLabel = tmpAssignmentAddress ? `${this.escapeHTML(tmpAssignmentAddress)} = ${tmpFormattedResult}` : `Result: ${tmpFormattedResult}`;
			tmpResultDisplay = `<div class="peq-header-result">${tmpResultLabel}</div>`;
		}

		return `${this.buildCSS()}
		<div class="peq-header">
			<div class="peq-header-label">Expression</div>
			<div class="peq-header-expression">${this.escapeHTML(tmpExpression)}</div>
			${tmpResultDisplay}
		</div>
		<div class="peq-section">
			<div class="peq-section-title">Solve Steps</div>
			${this.buildSolveStepsHTML(tmpResultObject)}
		</div>
		<div class="peq-section">
			<div class="peq-section-title">Virtual Symbols</div>
			${this.buildVirtualSymbolsHTML(tmpResultObject)}
		</div>
		<div class="peq-section">
			<div class="peq-section-title">Postfix Tokens</div>
			${this.buildTokensHTML(tmpResultObject)}
		</div>
		${this.buildLogHTML(tmpResultObject)}`;
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
		this.services.ContentAssignment.assignContent('#PictSectionEquation-ExpressionSolve', tmpContent);
		this.attachTruncatedValueTooltips('#PictSectionEquation-ExpressionSolve');
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

module.exports = PictViewExpressionSolve;
module.exports.default_configuration = default_configuration;
