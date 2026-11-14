# Local graph workspace

The graph is an owned numerical canvas renderer. It requires no Desmos service, account, key, subscription, or remote runtime. Its visual math fields and fonts are served locally with the rest of Math Lab. A deployed site still needs ordinary static hosting; the code does not impose a per-use service fee.

## Connect immediately

Open [the graph workspace](http://127.0.0.1:8080/math-lab.html#graph) after `npm start`.

To embed the entire local workbench on another page served from the same site:

```html
<iframe src="/math-lab.html#graph" title="Math graph workspace"
        style="width:100%;height:900px;border:0"></iframe>
```

To attach only the graph to your own UI:

```html
<link rel="stylesheet" href="/vendor/katex/katex.min.css">
<link rel="stylesheet" href="/graph/plotter.css">
<div id="my-graph"></div>
<script type="module">
  import { createGraph } from '/graph/plotter.js';
  import { latexToInput } from '/engine/latex.js';
  import { createMathField } from '/math-editor.js';

  const graph = createGraph(document.querySelector('#my-graph'), {
    expressions: ['y=x^2', 'y=2x+1', 'x^2+y^2=9'],
    readExpression: latexToInput,
    createExpressionField(value, onChange) {
      return createMathField(value, { onInput: onChange });
    },
  });
  // graph.addExpression('y=1/x');
  // graph.setViewport({ xMin:-5, xMax:5, yMin:-5, yMax:5 });
</script>
```

Serve the entire vendor, graph, engine, and editor paths shown above. Copying just a single script without its fonts and module dependencies is not a complete embed.

## Features

- Multiple editable curves with visibility toggles, colors, and deletion
- Explicit functions in either orientation, vertical/horizontal lines, coordinate points, and implicit curves
- Numerical inequality shading and supported piecewise expressions
- Parameter sliders for `a`, `b`, and `c`
- Numbered major/minor grid lines and equal axis-unit aspect
- Pointer drag to pan, anchored wheel zoom, touch pinch, and zoom/reset/fit buttons
- Keyboard arrows to pan, plus/minus to zoom, and Home to reset
- Coordinate readout, click-to-trace, editable window bounds, and PNG export

The factory returns `addExpression`, `setExpressions`, `getState`, `setViewport`, `zoom`, `reset`, `resize`, and `destroy`. Call `resize()` after revealing a graph that was mounted in a hidden tab, and `destroy()` when removing a graph permanently.

Sampling and contours are bounded. Explicit sampling avoids connecting known poles; implicit contour edges require root-convergence checks rather than sign changes alone. The graph is a numerical exploration tool, not a proof. Features below the sample resolution can be missed; the symbolic verifier remains the authority for mathematical results.

MathLive and KaTeX are pinned, locally bundled MIT-licensed presentation dependencies. Their notices are retained in [the vendor assets](../vendor/). They are not the owned solver or proof checker.
