/*
	Unit tests for Pict Section: Equation
*/

const libBrowserEnv = require('browser-env');
libBrowserEnv();

const Chai = require('chai');
const Expect = Chai.expect;

const libPict = require('pict');

const libPictSectionEquation = require('../source/Pict-Section-Equation.js');
const libPictViewExpressionSolve = require('../source/views/PictView-ExpressionSolve.js');
const libPictViewExpressionTokenStack = require('../source/views/PictView-ExpressionTokenStack.js');
const libPictViewExpressionSolvePyramid = require('../source/views/PictView-ExpressionSolvePyramid.js');

suite
(
	'Pict Section: Equation',
	() =>
	{
		setup(() => { });

		suite
		(
			'Module Exports',
			() =>
			{
				test
				(
					'Default export is PictViewExpressionSolve',
					(fDone) =>
					{
						Expect(libPictSectionEquation).to.be.a('function');
						Expect(libPictSectionEquation.PictViewExpressionSolve).to.be.a('function');
						Expect(libPictSectionEquation).to.equal(libPictSectionEquation.PictViewExpressionSolve);
						return fDone();
					}
				);
				test
				(
					'PictViewExpressionTokenStack is exported',
					(fDone) =>
					{
						Expect(libPictSectionEquation.PictViewExpressionTokenStack).to.be.a('function');
						Expect(libPictSectionEquation.PictViewExpressionTokenStack).to.equal(libPictViewExpressionTokenStack);
						return fDone();
					}
				);
				test
				(
					'default_configuration is exported for ExpressionSolve',
					(fDone) =>
					{
						Expect(libPictViewExpressionSolve.default_configuration).to.be.an('object');
						Expect(libPictViewExpressionSolve.default_configuration.DefaultRenderable).to.equal('ExpressionSolve-Wrap');
						return fDone();
					}
				);
				test
				(
					'default_configuration is exported for ExpressionTokenStack',
					(fDone) =>
					{
						Expect(libPictViewExpressionTokenStack.default_configuration).to.be.an('object');
						Expect(libPictViewExpressionTokenStack.default_configuration.DefaultRenderable).to.equal('ExpressionTokenStack-Wrap');
						return fDone();
					}
				);
				test
				(
					'PictViewExpressionSolvePyramid is exported',
					(fDone) =>
					{
						Expect(libPictSectionEquation.PictViewExpressionSolvePyramid).to.be.a('function');
						Expect(libPictSectionEquation.PictViewExpressionSolvePyramid).to.equal(libPictViewExpressionSolvePyramid);
						return fDone();
					}
				);
				test
				(
					'default_configuration is exported for ExpressionSolvePyramid',
					(fDone) =>
					{
						Expect(libPictViewExpressionSolvePyramid.default_configuration).to.be.an('object');
						Expect(libPictViewExpressionSolvePyramid.default_configuration.DefaultRenderable).to.equal('ExpressionSolvePyramid-Wrap');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'View Initialization',
			() =>
			{
				test
				(
					'Create and initialize the view',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						Expect(tmpView).to.be.an('object');
						Expect(tmpView.solveResultObject).to.equal(false);
						Expect(tmpView.solveExpression).to.equal('');

						tmpView.render();
						return fDone();
					}
				);
				test
				(
					'Create with custom configuration',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve',
						{
							"DefaultDestinationAddress": "#CustomContainer"
						}, libPictViewExpressionSolve);

						Expect(tmpView).to.be.an('object');
						Expect(tmpView.options.DefaultDestinationAddress).to.equal('#CustomContainer');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Expression Solve Visualization',
			() =>
			{
				test
				(
					'Render empty state when no result is set',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.be.a('string');
						Expect(tmpHTML).to.contain('No expression solve result');
						return fDone();
					}
				);
				test
				(
					'Render a simple expression solve (5 + 3 * 2)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						let tmpResult = _Pict.ExpressionParser.solve('5 + 3 * 2', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.setSolveResult(tmpResultObject, '5 + 3 * 2');

						let tmpHTML = tmpView.buildVisualizationHTML();

						// Should contain the expression
						Expect(tmpHTML).to.contain('5 + 3 * 2');
						// Should contain solve steps
						Expect(tmpHTML).to.contain('Solve Steps');
						// Should contain virtual symbols
						Expect(tmpHTML).to.contain('Virtual Symbols');
						// Should contain token display
						Expect(tmpHTML).to.contain('Postfix Tokens');
						// Should have the result
						Expect(tmpHTML).to.contain('11');
						return fDone();
					}
				);
				test
				(
					'Render an expression with assignment (Area = 5 * 10)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						let tmpDest = {};
						let tmpResult = _Pict.ExpressionParser.solve('Area = 5 * 10', {}, tmpResultObject, false, tmpDest);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.setSolveResult(tmpResultObject);

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('Area');
						Expect(tmpHTML).to.contain('50');
						return fDone();
					}
				);
				test
				(
					'Render an expression with function (sqrt(16) + 2)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						let tmpResult = _Pict.ExpressionParser.solve('sqrt(16) + 2', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.setSolveResult(tmpResultObject, 'sqrt(16) + 2');

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('sqrt');
						Expect(tmpHTML).to.contain('6');
						return fDone();
					}
				);
				test
				(
					'Render an expression with variables',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						let tmpResult = _Pict.ExpressionParser.solve('X * Y + Z', { X: 5, Y: 3, Z: 10 }, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.setSolveResult(tmpResultObject, 'X * Y + Z');

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('X');
						Expect(tmpHTML).to.contain('Y');
						Expect(tmpHTML).to.contain('Z');
						Expect(tmpHTML).to.contain('25');
						return fDone();
					}
				);
				test
				(
					'Handle null result object gracefully',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.setSolveResult(null);

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('No expression solve result');
						return fDone();
					}
				);
				test
				(
					'Handle empty result object gracefully',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.setSolveResult({});

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('No solve steps');
						Expect(tmpHTML).to.contain('No virtual symbols');
						return fDone();
					}
				);
				test
				(
					'setSolveResult updates the data and expression',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.render();

						// First solve
						let tmpResult1 = {};
						_Pict.ExpressionParser.solve('1 + 1', {}, tmpResult1);
						tmpView.setSolveResult(tmpResult1, '1 + 1');

						Expect(tmpView.solveResultObject).to.equal(tmpResult1);
						Expect(tmpView.solveExpression).to.equal('1 + 1');

						let tmpHTML1 = tmpView.buildVisualizationHTML();
						Expect(tmpHTML1).to.contain('1 + 1');

						// Second solve replaces the first
						let tmpResult2 = {};
						_Pict.ExpressionParser.solve('2 ^ 10', {}, tmpResult2);
						tmpView.setSolveResult(tmpResult2, '2 ^ 10');

						Expect(tmpView.solveResultObject).to.equal(tmpResult2);
						Expect(tmpView.solveExpression).to.equal('2 ^ 10');

						let tmpHTML2 = tmpView.buildVisualizationHTML();
						Expect(tmpHTML2).to.contain('2 ^ 10');
						Expect(tmpHTML2).to.contain('1024');
						return fDone();
					}
				);
				test
				(
					'Render a complex expression with parentheses',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						let tmpResult = _Pict.ExpressionParser.solve('(100 - 10) * (3 + 2)', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);
						tmpView.setSolveResult(tmpResultObject);

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('450');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'HTML Helper Methods',
			() =>
			{
				test
				(
					'escapeHTML prevents XSS',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);

						Expect(tmpView.escapeHTML('<script>alert("xss")</script>')).to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
						Expect(tmpView.escapeHTML('normal text')).to.equal('normal text');
						Expect(tmpView.escapeHTML(42)).to.equal('42');
						return fDone();
					}
				);
				test
				(
					'getTokenColor returns correct colors',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);

						// Colors are now theme-token-wrapped with a hex fallback.
						Expect(tmpView.getTokenColor('Token.Constant')).to.equal('var(--theme-color-status-info, #2563eb)');
						Expect(tmpView.getTokenColor('Token.Operator')).to.equal('var(--theme-color-status-error, #dc2626)');
						Expect(tmpView.getTokenColor('Unknown.Type')).to.equal('var(--theme-color-text-secondary, #374151)');
						return fDone();
					}
				);
				test
				(
					'getTokenLabel returns correct labels',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolve', {}, libPictViewExpressionSolve);

						Expect(tmpView.getTokenLabel('Token.Constant')).to.equal('Constant');
						Expect(tmpView.getTokenLabel('Token.Function')).to.equal('Function');
						Expect(tmpView.getTokenLabel('Token.Symbol')).to.equal('Variable');
						Expect(tmpView.getTokenLabel('Unknown.Type')).to.equal('Unknown.Type');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Token Stack View Initialization',
			() =>
			{
				test
				(
					'Create and initialize the token stack view',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						Expect(tmpView).to.be.an('object');
						Expect(tmpView.solveResultObject).to.equal(false);
						Expect(tmpView.solveExpression).to.equal('');

						tmpView.render();
						return fDone();
					}
				);
				test
				(
					'Create with custom configuration',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack',
						{
							"DefaultDestinationAddress": "#CustomTokenStack"
						}, libPictViewExpressionTokenStack);

						Expect(tmpView).to.be.an('object');
						Expect(tmpView.options.DefaultDestinationAddress).to.equal('#CustomTokenStack');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Token Stack Visualization',
			() =>
			{
				test
				(
					'Render empty state when no result is set',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.be.a('string');
						Expect(tmpHTML).to.contain('No expression data');
						return fDone();
					}
				);
				test
				(
					'Handle null result object gracefully',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						tmpView.setSolveResult(null);

						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('No expression data');
						return fDone();
					}
				);
				test
				(
					'Handle empty result object',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						tmpView.setSolveResult({});

						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('No token layers');
						Expect(tmpHTML).to.contain('No evaluation steps');
						return fDone();
					}
				);
				test
				(
					'Render simple expression token stack (5 + 3 * 2)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('5 + 3 * 2', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						tmpView.setSolveResult(tmpResultObject, '5 + 3 * 2');

						let tmpHTML = tmpView.buildVisualizationHTML();

						// Should contain expression
						Expect(tmpHTML).to.contain('5 + 3 * 2');
						// Should contain section titles
						Expect(tmpHTML).to.contain('Token Stack');
						Expect(tmpHTML).to.contain('Postfix Evaluation Stack');
						// Should contain the result
						Expect(tmpHTML).to.contain('11');
						return fDone();
					}
				);
				test
				(
					'Render expression with parentheses showing multiple layers ((100 - 10) * (3 + 2))',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('(100 - 10) * (3 + 2)', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						tmpView.setSolveResult(tmpResultObject, '(100 - 10) * (3 + 2)');

						let tmpHTML = tmpView.buildVisualizationHTML();

						// Should contain the result
						Expect(tmpHTML).to.contain('450');
						// Should contain depth badges
						Expect(tmpHTML).to.contain('depth');
						return fDone();
					}
				);
				test
				(
					'Render expression with function (sqrt(16) + 2)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('sqrt(16) + 2', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						tmpView.setSolveResult(tmpResultObject, 'sqrt(16) + 2');

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('sqrt');
						Expect(tmpHTML).to.contain('6');
						return fDone();
					}
				);
				test
				(
					'Render expression with variables',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('X * Y + Z', { X: 5, Y: 3, Z: 10 }, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						tmpView.setSolveResult(tmpResultObject, 'X * Y + Z');

						let tmpHTML = tmpView.buildVisualizationHTML();

						Expect(tmpHTML).to.contain('25');
						return fDone();
					}
				);
				test
				(
					'setSolveResult updates data and re-renders',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						tmpView.render();

						// First solve
						let tmpResult1 = {};
						_Pict.ExpressionParser.solve('1 + 1', {}, tmpResult1);
						tmpView.setSolveResult(tmpResult1, '1 + 1');

						Expect(tmpView.solveResultObject).to.equal(tmpResult1);
						Expect(tmpView.solveExpression).to.equal('1 + 1');

						// Second solve replaces
						let tmpResult2 = {};
						_Pict.ExpressionParser.solve('2 ^ 10', {}, tmpResult2);
						tmpView.setSolveResult(tmpResult2, '2 ^ 10');

						Expect(tmpView.solveResultObject).to.equal(tmpResult2);
						Expect(tmpView.solveExpression).to.equal('2 ^ 10');

						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('1024');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Solve Pyramid View Initialization',
			() =>
			{
				test
				(
					'Create and initialize the pyramid view',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						Expect(tmpView).to.be.an('object');
						Expect(tmpView.solveResultObject).to.equal(false);
						Expect(tmpView.solveExpression).to.equal('');

						tmpView.render();
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Solve Pyramid Dependency Tree',
			() =>
			{
				test
				(
					'buildDependencyTree returns null for empty result',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						let tmpTree = tmpView.buildDependencyTree(null);
						Expect(tmpTree).to.equal(null);

						tmpTree = tmpView.buildDependencyTree({});
						Expect(tmpTree).to.equal(null);
						return fDone();
					}
				);
				test
				(
					'buildDependencyTree for simple expression (5 + 3 * 2)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('5 + 3 * 2', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						let tmpTree = tmpView.buildDependencyTree(tmpResultObject);

						Expect(tmpTree).to.be.an('object');
						Expect(tmpTree.operation).to.equal('+');
						Expect(tmpTree.resolvedValue).to.equal('11');
						// Right child should be the multiplication
						Expect(tmpTree.right).to.be.an('object');
						Expect(tmpTree.right.operation).to.equal('*');
						Expect(tmpTree.right.resolvedValue).to.equal('6');
						return fDone();
					}
				);
				test
				(
					'buildDependencyTree for parenthesized expression ((100 - 10) * (3 + 2))',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('(100 - 10) * (3 + 2)', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						let tmpTree = tmpView.buildDependencyTree(tmpResultObject);

						Expect(tmpTree).to.be.an('object');
						Expect(tmpTree.operation).to.equal('*');
						Expect(tmpTree.resolvedValue).to.equal('450');
						// Both children should be sub-operations
						Expect(tmpTree.left).to.be.an('object');
						Expect(tmpTree.left.resolvedValue).to.equal('90');
						Expect(tmpTree.right).to.be.an('object');
						Expect(tmpTree.right.resolvedValue).to.equal('5');
						return fDone();
					}
				);
				test
				(
					'getTreeDepth returns correct depth',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);

						// Empty
						Expect(tmpView.getTreeDepth(null)).to.equal(0);

						// Simple: 5 + 3 * 2 → depth 2 (root + one child)
						let tmpResult1 = {};
						_Pict.ExpressionParser.solve('5 + 3 * 2', {}, tmpResult1);
						let tmpTree1 = tmpView.buildDependencyTree(tmpResult1);
						Expect(tmpView.getTreeDepth(tmpTree1)).to.be.at.least(2);

						return fDone();
					}
				);
				test
				(
					'leafSpan is calculated correctly',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);

						// (100 - 10) * (3 + 2) — root spans 4 operand columns (2 per leaf op)
						let tmpResult = {};
						_Pict.ExpressionParser.solve('(100 - 10) * (3 + 2)', {}, tmpResult);
						let tmpTree = tmpView.buildDependencyTree(tmpResult);
						Expect(tmpTree.leafSpan).to.equal(4);
						Expect(tmpTree.left.leafSpan).to.equal(2);
						Expect(tmpTree.right.leafSpan).to.equal(2);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Solve Pyramid Visualization',
			() =>
			{
				test
				(
					'Render empty state',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('No expression data');
						return fDone();
					}
				);
				test
				(
					'Render simple expression pyramid (5 + 3 * 2)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('5 + 3 * 2', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						tmpView.setSolveResult(tmpResultObject, '5 + 3 * 2');

						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('5 + 3 * 2');
						Expect(tmpHTML).to.contain('Solve Pyramid');
						Expect(tmpHTML).to.contain('11');
						Expect(tmpHTML).to.contain('table');
						return fDone();
					}
				);
				test
				(
					'Render parenthesized expression pyramid',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('(100 - 10) * (3 + 2)', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						tmpView.setSolveResult(tmpResultObject, '(100 - 10) * (3 + 2)');

						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('450');
						Expect(tmpHTML).to.contain('90');
						Expect(tmpHTML).to.contain('5');
						return fDone();
					}
				);
				test
				(
					'Render expression with function (sqrt(16) + 2)',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('sqrt(16) + 2', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						tmpView.setSolveResult(tmpResultObject, 'sqrt(16) + 2');

						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('sqrt');
						Expect(tmpHTML).to.contain('6');
						return fDone();
					}
				);
				test
				(
					'setSolveResult updates and re-renders',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpView = _Pict.addView('ExpressionSolvePyramid', {}, libPictViewExpressionSolvePyramid);
						tmpView.render();

						let tmpResult1 = {};
						_Pict.ExpressionParser.solve('2 + 2', {}, tmpResult1);
						tmpView.setSolveResult(tmpResult1, '2 + 2');
						Expect(tmpView.solveExpression).to.equal('2 + 2');

						let tmpResult2 = {};
						_Pict.ExpressionParser.solve('10 * 10', {}, tmpResult2);
						tmpView.setSolveResult(tmpResult2, '10 * 10');

						let tmpHTML = tmpView.buildVisualizationHTML();
						Expect(tmpHTML).to.contain('100');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Token Stack Helpers',
			() =>
			{
				test
				(
					'groupTokensByLayer groups tokens correctly',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('(100 - 10) * (3 + 2)', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						let tmpLayers = tmpView.groupTokensByLayer(tmpResultObject);

						// Should have multiple layers (parenthesis groups at depth 1, root at depth 0)
						Expect(tmpLayers).to.be.an('array');
						Expect(tmpLayers.length).to.be.greaterThan(1);

						// Deepest layers should come first
						for (let i = 1; i < tmpLayers.length; i++)
						{
							Expect(tmpLayers[i - 1].depth).to.be.at.least(tmpLayers[i].depth);
						}
						return fDone();
					}
				);
				test
				(
					'groupTokensByLayer returns empty for null input',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);
						let tmpLayers = tmpView.groupTokensByLayer(null);

						Expect(tmpLayers).to.be.an('array');
						Expect(tmpLayers.length).to.equal(0);
						return fDone();
					}
				);
				test
				(
					'getLayerColor returns colors by depth',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);

						let tmpColor0 = tmpView.getLayerColor(0);
						let tmpColor1 = tmpView.getLayerColor(1);

						Expect(tmpColor0).to.have.property('bg');
						Expect(tmpColor0).to.have.property('border');
						Expect(tmpColor0).to.have.property('header');
						Expect(tmpColor0.bg).to.not.equal(tmpColor1.bg);
						return fDone();
					}
				);
				test
				(
					'escapeHTML prevents XSS in token stack view',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);

						Expect(tmpView.escapeHTML('<script>')).to.equal('&lt;script&gt;');
						Expect(tmpView.escapeHTML(42)).to.equal('42');
						return fDone();
					}
				);
				test
				(
					'getLayerResolvedValue looks up virtual symbol values',
					(fDone) =>
					{
						let _Pict = new libPict();
						let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
						_Pict.instantiateServiceProviderIfNotExists('ExpressionParser');

						let tmpResultObject = {};
						_Pict.ExpressionParser.solve('(10 + 5)', {}, tmpResultObject);

						let tmpView = _Pict.addView('ExpressionTokenStack', {}, libPictViewExpressionTokenStack);

						// Should return empty for unknown layer
						Expect(tmpView.getLayerResolvedValue('NonExistentLayer', tmpResultObject)).to.equal('');
						// Should return empty for null result
						Expect(tmpView.getLayerResolvedValue('SomeLayer', null)).to.equal('');
						return fDone();
					}
				);
			}
		);
	}
);
