// Application Code for the Expression Equation playground.
//
// `Base` is the synthesized PictApplication wrapper that registers the
// ExpressionSolve view from your Pict Config (under `ExpressionSolveViewConfig`)
// and seeds it via `BootstrapMethod: "playgroundSeed"` with the value at
// `AppData.EquationSeed`.
//
// The seed in `appdata.json` is a `{ expression, resultObject }` payload —
// the resultObject is what Fable's ExpressionParser produces for that
// expression.  To experiment with a different equation, either:
//
//   1. Edit `AppData.EquationSeed.expression` + `AppData.EquationSeed.resultObject`
//      in the AppData tab (paste a freshly-solved object), or
//   2. Override `onAfterInitialize` here to compute a result at runtime if
//      your iframe has access to Fable.
//
return class extends Base
{
	onAfterInitialize()
	{
		super.onAfterInitialize();
		console.log('[playground] EquationSeed =', this.pict.AppData.EquationSeed);
	}
};
