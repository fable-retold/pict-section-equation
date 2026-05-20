const libPictViewClass = require('pict-view');
const libPictSectionCode = require('pict-section-code');

const html = String.raw;

const default_configuration =
{
	"RenderOnLoad": true,
	"DefaultRenderable": "ExpressionTokenizedEditor-Wrap",
	"DefaultDestinationAddress": "#ExpressionTokenizedEditor-Container",

	"Templates":
	[
		{
			"Hash": "ExpressionTokenizedEditor-Container",
			"Template": html`<div id="PictSectionEquation-ExpressionTokenizedEditor"></div>`
		}
	],
	"Renderables":
	[
		{
			"RenderableHash": "ExpressionTokenizedEditor-Wrap",
			"TemplateHash": "ExpressionTokenizedEditor-Container",
			"DestinationAddress": "#ExpressionTokenizedEditor-Container",
			"RenderType": "replace"
		}
	]
};

class PictViewExpressionTokenizedEditor extends libPictViewClass
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._Expression = '';
		this._ExpressionCodeEditorView = null;
		this._LinterDebounceTimer = null;

		// Callback for when the expression changes
		this.onExpressionChanged = null;
	}

	onAfterRender()
	{
		super.onAfterRender();

		let tmpContainerSelector = `#PictSectionEquation-ExpressionTokenizedEditor`;
		if (this.options.ContainerID)
		{
			tmpContainerSelector = `#${this.options.ContainerID}`;
		}

		let tmpSelf = this;

		// Build the editor DOM
		let tmpEditorHTML = this._buildCSS();
		tmpEditorHTML += html`
		<div class="peq-te-wrapper">
			<div class="peq-te-label">Expression</div>
			<div class="peq-te-code-editor-container" id="PEQ-TE-CodeEditor-${this.Hash}"></div>
			<div class="peq-te-linter-output" id="PEQ-TE-Linter-${this.Hash}"></div>
		</div>`;

		this.services.ContentAssignment.assignContent(tmpContainerSelector, tmpEditorHTML);

		// Create the code editor child view
		let tmpCodeEditorHash = `${this.Hash}-ExpressionCodeEditor`;
		this._ExpressionCodeEditorView = this.pict.addView(
			tmpCodeEditorHash,
			{
				ViewIdentifier: tmpCodeEditorHash,
				TargetElementAddress: `#PEQ-TE-CodeEditor-${this.Hash}`,
				Language: 'javascript',
				ReadOnly: false,
				LineNumbers: false,
				DefaultCode: this._Expression || '',
				AddClosing: false,
				IndentOn: false,
				MoveToNewLine: false,
				AutoRender: false,
				RenderOnLoad: false,
				DefaultRenderable: 'ExpressionCodeEditor-Wrap',
				DefaultDestinationAddress: `#PEQ-TE-CodeEditor-${this.Hash}`,
				Renderables:
				[
					{
						RenderableHash: 'ExpressionCodeEditor-Wrap',
						TemplateHash: 'CodeEditor-Container',
						DestinationAddress: `#PEQ-TE-CodeEditor-${this.Hash}`
					}
				]
			},
			libPictSectionCode
		);
		this._ExpressionCodeEditorView.initialize();

		// Set a custom solver DSL highlight function
		this._ExpressionCodeEditorView.setHighlightFunction(this._buildSolverHighlightFunction());

		// Wire up code change handler
		let tmpOriginalOnCodeChange = this._ExpressionCodeEditorView.onCodeChange.bind(this._ExpressionCodeEditorView);
		this._ExpressionCodeEditorView.onCodeChange = function(pCode)
		{
			tmpOriginalOnCodeChange(pCode);
			tmpSelf._Expression = pCode || '';
			tmpSelf._debounceLinterRefresh();

			if (typeof tmpSelf.onExpressionChanged === 'function')
			{
				tmpSelf.onExpressionChanged(tmpSelf._Expression);
			}
		};

		this._ExpressionCodeEditorView.render();

		if (this._Expression)
		{
			this._ExpressionCodeEditorView.setCode(this._Expression);
		}

		this._refreshLinter();
	}

	/**
	 * Set the expression and update both the code editor and linter.
	 *
	 * @param {string} pExpression - The expression string
	 */
	setExpression(pExpression)
	{
		this._Expression = pExpression || '';
		if (this._ExpressionCodeEditorView && this._ExpressionCodeEditorView.codeJar)
		{
			this._ExpressionCodeEditorView.setCode(this._Expression);
		}
		this._refreshLinter();
	}

	/**
	 * Get the current expression from the code editor.
	 *
	 * @returns {string} The current expression
	 */
	getExpression()
	{
		if (this._ExpressionCodeEditorView && this._ExpressionCodeEditorView.codeJar)
		{
			return this._ExpressionCodeEditorView.getCode() || '';
		}
		return this._Expression || '';
	}

	/**
	 * Debounce linter refreshes so we don't tokenize on every keystroke.
	 */
	_debounceLinterRefresh()
	{
		if (this._LinterDebounceTimer)
		{
			clearTimeout(this._LinterDebounceTimer);
		}
		let tmpSelf = this;
		this._LinterDebounceTimer = setTimeout(
			function()
			{
				tmpSelf._refreshLinter();
			}, 80);
	}

	/**
	 * Refresh the linter output panel.
	 */
	_refreshLinter()
	{
		let tmpLinterElement = (typeof document !== 'undefined') ? document.getElementById(`PEQ-TE-Linter-${this.Hash}`) : null;
		if (!tmpLinterElement)
		{
			return;
		}
		tmpLinterElement.innerHTML = this._renderLinterOutput();
	}

	/**
	 * Render linter output: token chips + lint messages.
	 *
	 * @returns {string} HTML string
	 */
	_renderLinterOutput()
	{
		let tmpHTML = '';
		let tmpExpression = this._Expression || '';

		if (!tmpExpression.trim())
		{
			tmpHTML += '<div class="peq-te-linter-empty">Enter an expression to see linter results.</div>';
			return tmpHTML;
		}

		// Get the expression parser
		this.fable.instantiateServiceProviderIfNotExists('ExpressionParser');
		let tmpParser = this.fable.ExpressionParser;
		if (!tmpParser)
		{
			tmpHTML += '<div class="peq-te-linter-empty">Expression parser is initializing\u2026</div>';
			return tmpHTML;
		}

		// Tokenize and lint
		let tmpResultObject = { ExpressionParserLog: [] };
		let tmpTokens = tmpParser.tokenize(tmpExpression, tmpResultObject);
		let tmpLintResults = tmpParser.lintTokenizedExpression(tmpTokens, tmpResultObject);

		// Render token chips
		tmpHTML += '<div class="peq-te-linter-section-label">Tokens</div>';
		tmpHTML += '<div class="peq-te-linter-tokens">';
		if (Array.isArray(tmpTokens) && tmpTokens.length > 0)
		{
			let tmpTokenMap = tmpParser.tokenMap || {};
			let tmpFunctionMap = tmpParser.functionMap || {};
			for (let i = 0; i < tmpTokens.length; i++)
			{
				let tmpTokenType = this._classifyToken(tmpTokens[i], i, tmpTokens, tmpTokenMap, tmpFunctionMap);
				let tmpTokenHTML = this._escapeHTML(tmpTokens[i]);
				tmpHTML += `<span class="peq-te-linter-token peq-te-linter-token-${tmpTokenType}">${tmpTokenHTML}</span>`;
			}
		}
		tmpHTML += '</div>';

		// Render lint messages
		tmpHTML += '<div class="peq-te-linter-section-label">Lint Results</div>';
		tmpHTML += '<div class="peq-te-linter-messages">';
		if (Array.isArray(tmpLintResults) && tmpLintResults.length > 0)
		{
			for (let i = 0; i < tmpLintResults.length; i++)
			{
				let tmpMessage = tmpLintResults[i];
				let tmpMsgClass = 'peq-te-linter-message';
				if (typeof tmpMessage === 'string')
				{
					if (tmpMessage.indexOf('ERROR:') === 0)
					{
						tmpMsgClass += ' peq-te-linter-message-error';
					}
					else if (tmpMessage.indexOf('WARNING:') === 0)
					{
						tmpMsgClass += ' peq-te-linter-message-warning';
					}
				}
				tmpHTML += `<div class="${tmpMsgClass}">${this._escapeHTML(String(tmpMessage))}</div>`;
			}
		}
		else
		{
			tmpHTML += '<div class="peq-te-linter-ok">No issues found.</div>';
		}
		tmpHTML += '</div>';

		return tmpHTML;
	}

	/**
	 * Classify a token into one of several types for color-coded display.
	 *
	 * @param {string} pToken - The raw token string
	 * @param {number} pIndex - Index in the tokens array
	 * @param {Array} pTokens - The full tokens array
	 * @param {Object} pTokenMap - The parser's token map
	 * @param {Object} pFunctionMap - The parser's function map
	 * @returns {string} Token type identifier
	 */
	_classifyToken(pToken, pIndex, pTokens, pTokenMap, pFunctionMap)
	{
		// State address: wrapped in {}
		if (pToken.charAt(0) === '{' && pToken.charAt(pToken.length - 1) === '}')
		{
			return 'stateaddress';
		}

		// String: wrapped in ""
		if (pToken.charAt(0) === '"' && pToken.charAt(pToken.length - 1) === '"')
		{
			return 'string';
		}

		// Check tokenMap for operators, assignments, parentheses
		if (pTokenMap && pTokenMap[pToken])
		{
			let tmpType = pTokenMap[pToken].Type;
			if (tmpType === 'Operator')
			{
				return 'operator';
			}
			if (tmpType === 'Assignment')
			{
				return 'assignment';
			}
			if (tmpType === 'Parenthesis')
			{
				return 'parenthesis';
			}
		}

		// Constant: numeric value
		if (/^-?\d*\.?\d+$/.test(pToken))
		{
			return 'constant';
		}

		// Function: a symbol followed by (
		if (pIndex < pTokens.length - 1 && pTokens[pIndex + 1] === '(')
		{
			return 'function';
		}

		// Check functionMap for known functions (case insensitive)
		if (pFunctionMap && pFunctionMap[pToken.toUpperCase()])
		{
			return 'function';
		}

		// Default: symbol (variable name)
		return 'symbol';
	}

	/**
	 * Build a custom highlight function for the solver DSL.
	 * Uses single-pass tokenization on raw text to avoid cascading regex on HTML.
	 *
	 * @returns {Function} Highlight function for CodeJar
	 */
	_buildSolverHighlightFunction()
	{
		// Single combined tokenizer — order matters:
		// Group 1: string literals
		// Group 2: state addresses {...}
		// Group 3: known function keywords
		// Group 4: dot-path references (e.g. Section.Group.Field)
		// Group 5: numbers
		// Group 6: operators
		let tmpTokenizer = new RegExp(
			'("(?:[^"\\\\]|\\\\.)*")' +
			'|(\\{[^}]+\\})' +
			'|\\b(abs|sqrt|round|tofixed|floor|ceil|exp|log|sin|cos|tan|rad|pi|euler|compare|percent' +
			'|sum|avg|mean|median|mode|min|max|var|vara|varp|stdev|stdeva|stdevp|count|countset' +
			'|if|when|concat|join|getvalue|setvalue|match' +
			'|randominteger|randomfloat' +
			')\\b' +
			'|([a-zA-Z_]\\w*(?:\\.\\w+)+)' +
			'|(\\b\\d+\\.?\\d*(?:e[+-]?\\d+)?\\b)' +
			'|([=+\\-*/%^<>!?:,]+)',
			'gi');

		function escapeHTML(pString)
		{
			return pString
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
		}

		return function highlightSolverExpression(pElement)
		{
			let tmpCode = pElement.textContent;

			let tmpResult = '';
			let tmpLastIndex = 0;
			let tmpMatch;

			tmpTokenizer.lastIndex = 0;

			while ((tmpMatch = tmpTokenizer.exec(tmpCode)) !== null)
			{
				// Emit any plain text before this token
				if (tmpMatch.index > tmpLastIndex)
				{
					tmpResult += escapeHTML(tmpCode.substring(tmpLastIndex, tmpMatch.index));
				}

				let tmpFullMatch = tmpMatch[0];

				if (tmpMatch[1])
				{
					tmpResult += '<span class="string">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[2])
				{
					tmpResult += '<span class="property">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[3])
				{
					tmpResult += '<span class="keyword">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[4])
				{
					tmpResult += '<span class="property">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[5])
				{
					tmpResult += '<span class="number">' + escapeHTML(tmpFullMatch) + '</span>';
				}
				else if (tmpMatch[6])
				{
					tmpResult += '<span class="operator">' + escapeHTML(tmpFullMatch) + '</span>';
				}

				tmpLastIndex = tmpMatch.index + tmpFullMatch.length;
			}

			// Emit any trailing plain text
			if (tmpLastIndex < tmpCode.length)
			{
				tmpResult += escapeHTML(tmpCode.substring(tmpLastIndex));
			}

			pElement.innerHTML = tmpResult;
		};
	}

	/**
	 * Escape HTML special characters for safe rendering.
	 *
	 * @param {string} pString - The string to escape
	 * @returns {string} Escaped string
	 */
	_escapeHTML(pString)
	{
		if (typeof pString !== 'string')
		{
			return '';
		}
		return pString
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	/**
	 * Build the CSS styles for the tokenized editor.
	 *
	 * @returns {string} Style tag HTML
	 */
	_buildCSS()
	{
		return html`<style>
.peq-te-wrapper
{
	margin-bottom: 12px;
}
.peq-te-label
{
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--theme-color-text-muted, #64748b);
	margin-bottom: 4px;
}
.peq-te-code-editor-container
{
	width: 100%;
	min-height: 40px;
	border: 2px solid var(--theme-color-border-light, #e2e8f0);
	border-radius: 6px;
	overflow: auto;
	margin-bottom: 8px;
	box-sizing: border-box;
	transition: border-color 0.15s;
}
.peq-te-code-editor-container:focus-within
{
	border-color: var(--theme-color-brand-primary, #6366f1);
}
.peq-te-code-editor-container .pict-code-editor-wrap
{
	border: none;
	border-radius: 0;
}
.peq-te-code-editor-container .pict-code-editor
{
	font-size: 14px;
}
.peq-te-linter-output
{
	padding: 8px 0;
}
.peq-te-linter-section-label
{
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--theme-color-text-muted, #94a3b8);
	margin-bottom: 4px;
}
.peq-te-linter-tokens + .peq-te-linter-section-label,
.peq-te-linter-messages + .peq-te-linter-section-label
{
	margin-top: 14px;
}
.peq-te-linter-tokens
{
	display: flex;
	flex-wrap: wrap;
	gap: 3px;
	padding: 6px 8px;
	background: var(--theme-color-background-panel, #FDFCFA);
	border: 1px solid var(--theme-color-background-tertiary, #E8E3DA);
	border-radius: 4px;
	margin-bottom: 10px;
	min-height: 24px;
	align-items: center;
}
.peq-te-linter-token
{
	display: inline-block;
	padding: 2px 6px;
	border-radius: 3px;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
	font-size: 12px;
	line-height: 1.4;
	white-space: nowrap;
}
.peq-te-linter-token-constant
{
	background: color-mix(in srgb, var(--theme-color-status-warning, #FDF6EC) 10%, transparent);
	color: var(--theme-color-status-warning, #986801);
}
.peq-te-linter-token-symbol
{
	background: color-mix(in srgb, var(--theme-color-status-info, #EEF3FF) 10%, transparent);
	color: var(--theme-color-brand-primary, #4078F2);
}
.peq-te-linter-token-operator
{
	background: color-mix(in srgb, var(--theme-color-status-info, #EAF5F8) 10%, transparent);
	color: var(--theme-color-status-info, #0184BC);
	font-weight: 600;
}
.peq-te-linter-token-function
{
	background: var(--theme-color-background-secondary, #F5ECE4);
	color: var(--theme-color-brand-primary, #9E6B47);
	font-weight: 600;
}
.peq-te-linter-token-string
{
	background: color-mix(in srgb, var(--theme-color-status-success, #EEF7EE) 10%, transparent);
	color: var(--theme-color-status-success, #50A14F);
}
.peq-te-linter-token-stateaddress
{
	background: color-mix(in srgb, var(--theme-color-brand-accent, #F0E8F5) 15%, transparent);
	color: var(--theme-color-brand-primary, #7C3AED);
}
.peq-te-linter-token-assignment
{
	background: var(--theme-color-background-secondary, #F5ECE4);
	color: var(--theme-color-brand-primary, #9E6B47);
	font-weight: 700;
}
.peq-te-linter-token-parenthesis
{
	background: var(--theme-color-background-secondary, #F0ECE4);
	color: #8A7F72;
	font-weight: 600;
}
.peq-te-linter-messages
{
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.peq-te-linter-message
{
	font-size: 11px;
	padding: 5px 8px;
	border-radius: 3px;
	line-height: 1.4;
}
.peq-te-linter-message-error
{
	background: #FEF2F2;
	color: var(--theme-color-status-error, #991B1B);
	border-left: 3px solid var(--theme-color-status-error, #DC2626);
}
.peq-te-linter-message-warning
{
	background: color-mix(in srgb, var(--theme-color-status-warning, #FFFBEB) 8%, transparent);
	color: color-mix(in srgb, var(--theme-color-status-warning, #92400E) 100%, transparent);
	border-left: 3px solid var(--theme-color-status-warning, #F59E0B);
}
.peq-te-linter-ok
{
	font-size: 11px;
	color: var(--theme-color-status-success, #166534);
	background: var(--theme-color-background-hover, #F0FDF4);
	padding: 5px 8px;
	border-radius: 3px;
	border-left: 3px solid var(--theme-color-status-success, #22C55E);
}
.peq-te-linter-empty
{
	font-size: 11px;
	color: #B0A89E;
	font-style: italic;
	padding: 8px 0;
}
</style>`;
	}
}

PictViewExpressionTokenizedEditor.default_configuration = default_configuration;

module.exports = PictViewExpressionTokenizedEditor;
