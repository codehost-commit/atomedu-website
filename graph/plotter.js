/**
 * Dependency-free numerical canvas workspace. Include graph/plotter.css.
 * createGraph(container, {
 *   expressions: ['y=x^2', 'x^2+y^2=9'], readExpression: latexToInput,
 *   createExpressionField(value, onChange) { return createMathField(value, { onInput: onChange }); },
 *   onChange(state) {}, viewport, equalAspect: true, parameters: { a: 1, b: 0, c: 0 },
 *   showExport: true, compact: false, height: 520,
 * })
 * Editor values/callbacks are strings (LaTeX with a supplied editor/reader).
 * readExpression may also return {kind:'piecewise', variable:'x'|'y', pieces:
 * [{expression: internalString, condition: comparisonString|'otherwise'}]}.
 * setExpressions accepts strings or { expression, id?, color?, visible? }.
 * getState/onChange return detached JSON-safe state: expressions (with error/kind),
 * viewport, parameters, equalAspect, trace. No sampled result is a proof.
 * zoom(factor, anchor?) uses factor > 1 to zoom in and a WORLD-coordinate anchor.
 * addExpression returns its row id. setViewport validates and expands the window
 * to equal units when equalAspect is enabled. destroy removes only this workspace.
 */
import {
  DEFAULT_VIEWPORT, DEFAULT_PARAMETERS, GRAPH_LIMITS, validateViewport,
  niceStep, getTicks, worldToScreen, screenToWorld, zoomViewport, panViewport,
  equalizeViewport, compileGraphExpression, sampleExplicit, contourSegments,
} from './model.js';

const COLORS = ['#bf5a2e', '#3265a5', '#398064', '#8952aa', '#be4769', '#8b7426', '#24858a', '#5b59b3'];
let instanceNumber = 0;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const format = n => {
  if (Math.abs(n) < 1e-12) return '0';
  if (Math.abs(n) >= 1e6 || Math.abs(n) < .0001) return n.toExponential(3).replace(/\.0+(?=e)/, '');
  return Number(n.toPrecision(7)).toLocaleString('en-US', { maximumFractionDigits: 9, useGrouping: false });
};

export function createGraph(container, options = {}) {
  if (!container?.ownerDocument) throw new TypeError('createGraph requires a DOM container.');
  const doc = container.ownerDocument, win = doc.defaultView, prefix = `atom-graph-${++instanceNumber}`;
  const root = doc.createElement('section');
  root.className = `atom-graph${options.compact ? ' graph-compact' : ''}`;
  root.setAttribute('aria-label', options.ariaLabel || 'Numerical graph workspace');
  if (Number.isFinite(options.height)) root.style.setProperty('--graph-height', `${clamp(options.height, 240, 1600)}px`);
  root.innerHTML = `
    <header class="graph-toolbar">
      <div class="graph-heading"><strong>Graph</strong><span class="graph-numerical-badge">Numerical view</span></div>
      <div class="graph-actions">
        <button type="button" data-graph-action="zoom-in" aria-label="Zoom in" title="Zoom in (+)">+</button>
        <button type="button" data-graph-action="zoom-out" aria-label="Zoom out" title="Zoom out (−)">−</button>
        <button type="button" data-graph-action="reset" title="Reset window (Home)">Reset</button>
        <button type="button" data-graph-action="fit" title="Fit visible sampled curves">Fit</button>
        <button type="button" data-graph-action="export" title="Download this numerical graph as a PNG">Save PNG</button>
      </div>
    </header>
    <div class="graph-body">
      <aside class="graph-sidebar" aria-label="Graph expressions">
        <div class="graph-list-heading"><span>Expressions</span><span class="graph-count"></span></div>
        <div class="graph-expression-list"></div>
        <button class="graph-add" type="button" data-graph-action="add">+ Add expression</button>
        <label class="graph-example-label">Try an example
          <select class="graph-examples" aria-label="Add a graph example">
            <option value="">Choose a curve…</option>
            <option value="y=x^2">Parabola · y = x²</option>
            <option value="y=sin(x)">Wave · y = sin(x)</option>
            <option value="y=1/x">Reciprocal · y = 1/x</option>
            <option value="x^2+y^2=9">Circle · x² + y² = 9</option>
            <option value="y&lt;x^2">Inequality · y &lt; x²</option>
            <option value="y=a*x^2+b*x+c">Parameters · ax² + bx + c</option>
            <option value="(2,3)">Point · (2, 3)</option>
          </select>
        </label>
        <section class="graph-parameters" aria-label="Expression parameters" hidden></section>
        <details class="graph-window">
          <summary>Window settings</summary>
          <form class="graph-window-form">
            <div class="graph-window-inputs"></div>
            <label class="graph-equal-label"><input type="checkbox" class="graph-equal" checked> Equal axis units</label>
            <button type="submit" class="graph-apply">Apply window</button>
            <p class="graph-window-error" role="status"></p>
          </form>
        </details>
        <p class="graph-expression-help">Use y = f(x), x = g(y), an equation, inequality, or (x, y) point. Parameters a, b, c get sliders.</p>
      </aside>
      <div class="graph-plot-area">
        <div class="graph-stage">
          <canvas class="graph-canvas" tabindex="0" role="img" aria-label="Interactive numerical coordinate graph. Drag to pan, scroll or pinch to zoom. Plus and minus zoom, arrow keys pan, Home resets."></canvas>
          <output class="graph-coordinate-readout" aria-label="Pointer coordinates">x: — &nbsp; y: —</output>
          <div class="graph-trace" role="status" aria-live="polite" hidden></div>
        </div>
        <div class="graph-plot-help"><span>Drag to pan · scroll / pinch to zoom · click a curve to trace</span><span>+ / − · arrows · Home</span></div>
      </div>
    </div>
    <footer class="graph-disclaimer">Numerical approximation, not a proof. Shading and traces are sampled; undefined samples are omitted. Region edges, tiny features, and discontinuities may be unresolved.</footer>`;
  container.append(root);
  const $ = selector => root.querySelector(selector);
  const list = $('.graph-expression-list'), stage = $('.graph-stage'), canvas = $('.graph-canvas');
  const ctx = canvas.getContext('2d'), background = doc.createElement('canvas'), bg = background.getContext('2d');
  if (!ctx || !bg) { root.remove(); throw new Error('This browser does not provide a 2D canvas context.'); }
  const readout = $('.graph-coordinate-readout'), traceOutput = $('.graph-trace'), parameterSection = $('.graph-parameters');
  const fields = {}, listeners = [], pointers = new Map(), geometries = new Map();
  let rows = [], rowNumber = 0, width = 800, height = 520, dpr = 1, frame = null, sized = false;
  let destroyed = false, sceneDirty = true, pendingChange = false, pointer = null, drag = null, pinch = null, trace = null;
  let equalAspect = options.equalAspect !== false, viewport = validateViewport(options.viewport || DEFAULT_VIEWPORT);
  const homeViewport = { ...viewport }, parameters = { ...DEFAULT_PARAMETERS };
  for (const name of ['a', 'b', 'c']) if (Number.isFinite(options.parameters?.[name])) parameters[name] = clamp(options.parameters[name], -100, 100);
  $('.graph-equal').checked = equalAspect;
  $('[data-graph-action="export"]').hidden = options.showExport === false;
  const on = (target, name, handler, config) => { target.addEventListener(name, handler, config); listeners.push(() => target.removeEventListener(name, handler, config)); };
  const state = () => ({
    expressions: rows.map(row => ({ id: row.id, expression: row.expression, color: row.color, visible: row.visible, error: row.error, kind: row.compiled?.kind || null })),
    viewport: { ...viewport }, parameters: { ...parameters }, equalAspect, trace: trace ? { ...trace } : null,
  });
  function schedule(change = false, scene = true) {
    if (destroyed) return;
    sceneDirty ||= scene; pendingChange ||= change;
    if (frame === null) frame = win.requestAnimationFrame(render);
  }
  function setView(next, { equalize = false, notify = true } = {}) {
    viewport = equalize && equalAspect ? equalizeViewport(next, width, height) : validateViewport(next);
    syncWindow(); schedule(notify);
  }
  function syncWindow() {
    for (const key of Object.keys(fields)) if (doc.activeElement !== fields[key]) fields[key].value = String(Number(viewport[key].toPrecision(12)));
  }
  for (const [key, label] of [['xMin', 'x min'], ['xMax', 'x max'], ['yMin', 'y min'], ['yMax', 'y max']]) {
    const wrapper = doc.createElement('label'); wrapper.textContent = label;
    const field = doc.createElement('input'); field.type = 'number'; field.step = 'any'; field.name = key; field.id = `${prefix}-${key}`;
    field.setAttribute('aria-label', `${label} window bound`); wrapper.append(field); $('.graph-window-inputs').append(wrapper); fields[key] = field;
  }
  syncWindow();
  on($('.graph-window-form'), 'submit', event => {
    event.preventDefault();
    try {
      const next = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value.trim() ? Number(field.value) : NaN]));
      validateViewport(next); equalAspect = $('.graph-equal').checked; setView(next, { equalize: true }); syncWindow();
      $('.graph-window-error').textContent = '';
    } catch (error) { $('.graph-window-error').textContent = error.message; }
  });

  function updateCount() {
    $('.graph-count').textContent = `${rows.length} / ${GRAPH_LIMITS.expressions}`;
    $('[data-graph-action="add"]').disabled = rows.length >= GRAPH_LIMITS.expressions;
    $('.graph-examples').disabled = rows.length >= GRAPH_LIMITS.expressions;
  }
  function updateParameters() {
    const used = [...new Set(rows.flatMap(row => row.compiled?.parameters || []))].sort();
    const existing = [...parameterSection.querySelectorAll('[data-parameter]')].map(node => node.dataset.parameter);
    parameterSection.hidden = !used.length;
    if (used.join() === existing.join()) return;
    parameterSection.replaceChildren();
    const title = doc.createElement('h3'); title.textContent = 'Parameters'; parameterSection.append(title);
    for (const name of used) {
      const group = doc.createElement('div'); group.className = 'graph-parameter'; group.dataset.parameter = name;
      const label = doc.createElement('label'); label.htmlFor = `${prefix}-parameter-${name}`; label.textContent = `${name} = `;
      const output = doc.createElement('output'); output.textContent = format(parameters[name]); label.append(output);
      const slider = doc.createElement('input'); slider.type = 'range'; slider.min = '-10'; slider.max = '10'; slider.step = '.05';
      // Honor configured values outside the usual slider range.
      slider.min = String(Math.min(-10, parameters[name])); slider.max = String(Math.max(10, parameters[name]));
      slider.value = parameters[name]; slider.id = label.htmlFor; slider.setAttribute('aria-label', `Parameter ${name}`);
      slider.addEventListener('input', () => { parameters[name] = Number(slider.value); output.textContent = format(parameters[name]); clearTrace(); schedule(true); });
      const limits = doc.createElement('span'); limits.className = 'graph-parameter-limits'; limits.textContent = `${slider.min} to ${slider.max}`;
      group.append(label, slider, limits); parameterSection.append(group);
    }
  }
  function compileRow(row) {
    row.compiled = null; row.error = null;
    if (row.expression.trim()) {
      try { row.compiled = compileGraphExpression(row.expression, { readExpression: options.readExpression }); }
      catch (error) { row.error = error.message || 'This expression could not be graphed.'; }
    }
    row.errorNode.textContent = row.error || (row.compiled?.kind === 'inequality' ? 'Approximate shading · undefined samples omitted; edges may have gaps' : row.compiled?.piecewise ? 'Piecewise · first matching branch; open endpoints excluded' : '');
    row.errorNode.classList.toggle('graph-expression-error', !!row.error);
    row.field.setAttribute('aria-invalid', row.error ? 'true' : 'false');
    row.element.classList.toggle('graph-row-hidden', !row.visible);
    updateParameters(); clearTrace(); schedule(true);
  }
  function makeRow(expression, config = {}) {
    const element = doc.createElement('div'); element.className = 'graph-expression-row';
    const id = typeof config.id === 'string' && config.id && !rows.some(row => row.id === config.id) ? config.id : `${prefix}-curve-${++rowNumber}`;
    const color = /^#[0-9a-f]{6}$/i.test(config.color || '') ? config.color : COLORS[rows.length % COLORS.length];
    const row = { id, expression, color, visible: config.visible !== false, error: null, compiled: null, element };
    const controls = doc.createElement('div'); controls.className = 'graph-expression-controls';
    const visible = doc.createElement('input'); visible.type = 'checkbox'; visible.checked = row.visible; visible.className = 'graph-visibility'; visible.title = 'Show or hide curve'; visible.setAttribute('aria-label', 'Show expression');
    const picker = doc.createElement('input'); picker.type = 'color'; picker.value = color; picker.className = 'graph-color'; picker.title = 'Curve color'; picker.setAttribute('aria-label', 'Curve color');
    const number = doc.createElement('span'); number.className = 'graph-expression-number'; number.textContent = String(rows.length + 1);
    const remove = doc.createElement('button'); remove.type = 'button'; remove.className = 'graph-delete'; remove.textContent = '×'; remove.title = 'Delete expression'; remove.setAttribute('aria-label', 'Delete expression');
    controls.append(visible, picker, number, remove);
    const field = options.createExpressionField ? options.createExpressionField(expression, value => {
      if (destroyed || !rows.includes(row)) return;
      row.expression = typeof value === 'string' ? value : String(value?.target?.value ?? '');
      compileRow(row);
    }) : doc.createElement('input');
    if (!field?.setAttribute || !field?.classList) throw new TypeError('createExpressionField must return an HTMLElement.');
    if (!options.createExpressionField) {
      field.type = 'text'; field.value = expression; field.placeholder = 'e.g. y=x^2'; field.maxLength = GRAPH_LIMITS.expressionLength; field.autocomplete = 'off'; field.spellcheck = false;
      field.addEventListener('input', () => { row.expression = field.value; compileRow(row); });
    }
    field.classList.add('graph-expression-field'); field.setAttribute('aria-label', 'Graph expression');
    const errorNode = doc.createElement('p'); errorNode.className = 'graph-expression-message'; errorNode.id = `${prefix}-message-${++rowNumber}`; errorNode.setAttribute('role', 'status');
    field.setAttribute('aria-describedby', errorNode.id);
    Object.assign(row, { field, errorNode }); element.style.setProperty('--curve-color', color); element.append(controls, field, errorNode);
    visible.addEventListener('change', () => { row.visible = visible.checked; element.classList.toggle('graph-row-hidden', !row.visible); clearTrace(); schedule(true); });
    picker.addEventListener('input', () => { row.color = picker.value; element.style.setProperty('--curve-color', row.color); schedule(true); });
    remove.addEventListener('click', () => {
      rows = rows.filter(other => other !== row); disposeRow(row); updateCount(); updateParameters(); clearTrace();
      rows.forEach((other, i) => { other.element.querySelector('.graph-expression-number').textContent = String(i + 1); });
      schedule(true); $('[data-graph-action="add"]').focus();
    });
    rows.push(row); list.append(element); compileRow(row); updateCount();
    return row;
  }
  function disposeRow(row) { row.field.destroy?.(); row.element.remove(); }
  function addExpression(expression = '', config = {}) {
    if (destroyed) return null;
    if (rows.length >= GRAPH_LIMITS.expressions) throw new RangeError(`A graph can contain at most ${GRAPH_LIMITS.expressions} expressions.`);
    if (typeof expression !== 'string') throw new TypeError('Graph expressions must be strings.');
    return makeRow(expression, config).id;
  }
  function setExpressions(expressions) {
    if (destroyed) return;
    if (!Array.isArray(expressions) || expressions.length > GRAPH_LIMITS.expressions) throw new RangeError(`Supply an array of at most ${GRAPH_LIMITS.expressions} graph expressions.`);
    const entries = expressions.map(entry => typeof entry === 'string' ? { expression: entry } : entry);
    if (entries.some(entry => !entry || typeof entry.expression !== 'string')) throw new TypeError('Each expression must be a string or an object with an expression string.');
    rows.forEach(disposeRow); rows = []; clearTrace();
    entries.forEach(entry => makeRow(entry.expression, entry)); updateCount(); updateParameters(); schedule(true);
  }

  function grid(context) {
    context.clearRect(0, 0, width, height); context.fillStyle = '#fffefa'; context.fillRect(0, 0, width, height);
    const xSpan = viewport.xMax - viewport.xMin, ySpan = viewport.yMax - viewport.yMin;
    const xTarget = Math.max(2, width / 85), yTarget = Math.max(2, height / 65);
    const xStep = niceStep(xSpan, xTarget), yStep = niceStep(ySpan, yTarget);
    // getTicks chooses a nice step; request the matching subdivision count.
    const xt = getTicks(viewport.xMin, viewport.xMax, xTarget), yt = getTicks(viewport.yMin, viewport.yMax, yTarget);
    const line = (x1, y1, x2, y2) => { context.moveTo(x1, y1); context.lineTo(x2, y2); };
    context.lineWidth = 1;
    for (const minor of [true, false]) {
      context.beginPath(); context.strokeStyle = minor ? '#f0efe9' : '#e1e1d9';
      const xs = minor ? xStep / 5 : xStep, ys = minor ? yStep / 5 : yStep;
      // Use integer indexes, capped independently of potentially huge bounds.
      const xi = Math.ceil(viewport.xMin / xs), yi = Math.ceil(viewport.yMin / ys);
      for (let n = 0; n < Math.min(600, Math.floor(viewport.xMax / xs) - xi + 1); n++) {
        const x = worldToScreen({ x: (xi + n) * xs, y: 0 }, viewport, width, height).x;
        line(x, 0, x, height);
      }
      for (let n = 0; n < Math.min(600, Math.floor(viewport.yMax / ys) - yi + 1); n++) {
        const y = worldToScreen({ x: 0, y: (yi + n) * ys }, viewport, width, height).y;
        line(0, y, width, y);
      }
      context.stroke();
    }
    const origin = worldToScreen({ x: 0, y: 0 }, viewport, width, height);
    context.beginPath(); context.lineWidth = 1.3; context.strokeStyle = '#848c88';
    if (origin.x >= 0 && origin.x <= width) line(origin.x, 0, origin.x, height);
    if (origin.y >= 0 && origin.y <= height) line(0, origin.y, width, origin.y);
    context.stroke(); context.font = '11px system-ui, sans-serif'; context.fillStyle = '#626b68';
    const yLabel = clamp(origin.y + 5, 6, height - 20), xLabel = clamp(origin.x - 7, 34, width - 12);
    context.textBaseline = 'top'; context.textAlign = 'center';
    for (const value of xt) {
      const p = worldToScreen({ x: value, y: 0 }, viewport, width, height);
      if (p.x < 22 || p.x > width - 22 || (value === 0 && origin.x > 20 && origin.x < width - 20)) continue;
      context.fillText(format(value), p.x, yLabel);
    }
    context.textAlign = 'right'; context.textBaseline = 'middle';
    for (const value of yt) {
      const p = worldToScreen({ x: 0, y: value }, viewport, width, height);
      if (p.y < 15 || p.y > height - 15 || (value === 0 && origin.y >= 0 && origin.y <= height)) continue;
      context.fillText(format(value), xLabel, p.y);
    }
    context.font = 'italic 13px system-ui, sans-serif'; context.textAlign = 'right'; context.textBaseline = 'bottom';
    context.fillText('x', width - 10, clamp(origin.y - 7, 20, height - 8));
    context.fillText('y', clamp(origin.x + 17, 18, width - 8), 20);
  }
  function shade(row, budget) {
    // A tile is shaded only if its center and all four corners satisfy the
    // relation. This leaves a conservative gap along sampled domain boundaries
    // and sign changes, rather than spreading a valid center across invalid x/y.
    const step = Math.max(5, Math.ceil(Math.sqrt(width * height / Math.max(1, budget / 5))));
    let columns = Math.max(1, Math.ceil(width / step)), lines = Math.max(1, Math.ceil(height / step));
    const scale = Math.min(1, Math.sqrt(Math.floor(budget / 5) / (columns * lines)));
    columns = Math.max(1, Math.floor(columns * scale)); lines = Math.max(1, Math.floor(lines * scale));
    const dx = width / columns, dy = height / lines;
    const contains = (x, y) => { const p = screenToWorld({ x, y }, viewport, width, height); return row.compiled.contains(p.x, p.y, parameters); };
    bg.fillStyle = row.color; bg.globalAlpha = .12;
    for (let j = 0; j < lines; j++) for (let i = 0; i < columns; i++) {
      const x = i * dx, y = j * dy, right = (i + 1) * dx, bottom = (j + 1) * dy;
      if (contains(x + dx / 2, y + dy / 2) && contains(x, y) && contains(right, y) && contains(x, bottom) && contains(right, bottom)) bg.fillRect(x, y, dx, dy);
    }
    bg.globalAlpha = 1;
  }
  function drawPaths(context, paths, color, dashed = false) {
    context.beginPath(); context.lineWidth = 2.2; context.strokeStyle = color; context.lineJoin = 'round'; context.lineCap = 'round'; context.setLineDash(dashed ? [6, 4] : []);
    for (const path of paths) for (let i = 0; i < path.length; i++) {
      const p = worldToScreen(path[i], viewport, width, height);
      if (i === 0) context.moveTo(p.x, p.y); else context.lineTo(p.x, p.y);
    }
    context.stroke(); context.setLineDash([]);
  }
  function drawScene() {
    grid(bg); geometries.clear();
    const active = rows.filter(row => row.visible && row.compiled), count = Math.max(1, active.length);
    // Total frame work remains bounded even at the expression-count limit.
    const explicitBudget = Math.max(500, Math.min(6500, Math.floor(36000 / count)));
    const implicitBudget = Math.max(600, Math.min(22000, Math.floor(60000 / count)));
    const shadeBudget = Math.max(200, Math.min(5000, Math.floor(14000 / count)));
    for (const row of active) if (row.compiled.kind === 'inequality') shade(row, shadeBudget);
    bg.save(); bg.beginPath(); bg.rect(0, 0, width, height); bg.clip();
    for (const row of active) {
      const descriptor = row.compiled;
      if (descriptor.kind === 'point') {
        const p = descriptor.point(parameters);
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        const s = worldToScreen(p, viewport, width, height);
        if (Math.abs(s.x) > 1e6 || Math.abs(s.y) > 1e6) continue;
        bg.beginPath(); bg.arc(s.x, s.y, 5, 0, Math.PI * 2); bg.fillStyle = row.color; bg.fill(); bg.lineWidth = 1.5; bg.strokeStyle = '#fffefa'; bg.stroke();
        bg.font = '11px system-ui, sans-serif'; bg.fillStyle = row.color; bg.textAlign = 'left'; bg.textBaseline = 'bottom'; bg.fillText(`(${format(p.x)}, ${format(p.y)})`, s.x + 9, s.y - 6);
        geometries.set(row.id, [[p]]); continue;
      }
      const config = { width, height, parameters, maxSamples: descriptor.kind === 'explicit' ? explicitBudget : implicitBudget };
      const paths = descriptor.kind === 'explicit' ? sampleExplicit(descriptor, viewport, config) : contourSegments(descriptor, viewport, config);
      geometries.set(row.id, paths);
      drawPaths(bg, paths, row.color, descriptor.kind === 'inequality' && ['<', '>'].includes(descriptor.relation));
      for (const endpoint of descriptor.endpoints?.(parameters) || []) {
        const p = worldToScreen(endpoint, viewport, width, height);
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < -6 || p.x > width + 6 || p.y < -6 || p.y > height + 6) continue;
        bg.beginPath(); bg.arc(p.x, p.y, 4.5, 0, Math.PI * 2); bg.lineWidth = 1.8;
        bg.fillStyle = endpoint.open ? '#fffefa' : row.color; bg.strokeStyle = row.color; bg.fill(); bg.stroke();
        if (!endpoint.open) paths.push([{ x: endpoint.x, y: endpoint.y }]);
      }
    }
    bg.restore();
    bg.fillStyle = '#737a73'; bg.font = '10px system-ui, sans-serif'; bg.textAlign = 'right'; bg.textBaseline = 'bottom';
    bg.fillText('Numerical view · not a proof', width - 9, height - 7);
  }
  function drawOverlay() {
    ctx.clearRect(0, 0, width, height); ctx.drawImage(background, 0, 0, width, height);
    if (pointer && !drag && !pinch) {
      ctx.save(); ctx.strokeStyle = '#62746d77'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath();
      ctx.moveTo(pointer.x, 0); ctx.lineTo(pointer.x, height); ctx.moveTo(0, pointer.y); ctx.lineTo(width, pointer.y); ctx.stroke(); ctx.restore();
    }
    if (trace) {
      const p = worldToScreen(trace, viewport, width, height), row = rows.find(row => row.id === trace.expressionId);
      if (row && p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fillStyle = row.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  }
  function render() {
    frame = null;
    if (destroyed) return;
    if (sceneDirty) { drawScene(); sceneDirty = false; }
    drawOverlay();
    if (pendingChange) { pendingChange = false; options.onChange?.(state()); }
  }
  function resize() {
    if (destroyed) return;
    const bounds = stage.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return; // A hidden tab will be observed again when revealed.
    const oldWidth = width, oldHeight = height;
    width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
    dpr = clamp(win.devicePixelRatio || 1, 1, 3);
    const backingWidth = Math.round(width * dpr), backingHeight = Math.round(height * dpr);
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = background.width = backingWidth; canvas.height = background.height = backingHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); bg.setTransform(dpr, 0, 0, dpr, 0, 0);
    const viewChanged = equalAspect && (!sized || oldWidth !== width || oldHeight !== height);
    if (viewChanged && !sized) viewport = equalizeViewport(viewport, width, height);
    else if (viewChanged) {
      // Keep the vertical window stable on resize; horizontal units follow it.
      const cx = (viewport.xMin + viewport.xMax) / 2, span = Math.min(2e12, (viewport.yMax - viewport.yMin) * width / height);
      let next = { ...viewport, xMin: cx - span / 2, xMax: cx + span / 2 };
      if (Math.abs(next.xMin) > 1e12 || Math.abs(next.xMax) > 1e12 || next.xMax - next.xMin < GRAPH_LIMITS.minSpan) next = equalizeViewport(viewport, width, height);
      viewport = validateViewport(next); syncWindow();
    }
    sized = true; syncWindow(); schedule(viewChanged);
  }
  function zoom(factor, anchor) { if (!destroyed) setView(zoomViewport(viewport, factor, anchor)); }
  function reset() { if (!destroyed) { clearTrace(); setView(homeViewport, { equalize: true }); } }
  function fit() {
    if (sceneDirty) { drawScene(); sceneDirty = false; }
    let points = [...geometries.values()].flat(2).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    // Try a bounded wider survey so offscreen points/ordinary curves can be found.
    const survey = { xMin: -20, xMax: 20, yMin: -20, yMax: 20 };
    for (const row of rows.filter(row => row.visible && row.compiled)) {
      if (row.compiled.kind === 'point') points.push(row.compiled.point(parameters));
      else if (row.compiled.kind === 'explicit') {
        points.push(...sampleExplicit(row.compiled, survey, { width: 400, height: 300, parameters, maxSamples: 1200 }).flat());
        // Include offscreen values: otherwise even a horizontal y=1000 line
        // could never be discovered by a visible-samples-only fit.
        const axis = row.compiled.axis, min = axis === 'y' ? viewport.xMin : viewport.yMin, max = axis === 'y' ? viewport.xMax : viewport.yMax;
        for (let i = 0; i <= 80; i++) {
          const t = min + (max - min) * i / 80, value = row.compiled.sample(t, parameters);
          if (Number.isFinite(value)) points.push(axis === 'y' ? { x: t, y: value } : { x: value, y: t });
        }
      }
      else points.push(...contourSegments(row.compiled, survey, { width: 300, height: 220, parameters, maxSamples: 1500 }).flat());
    }
    points = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) < 1e11 && Math.abs(p.y) < 1e11);
    if (!points.length) { traceOutput.textContent = 'No visible samples to fit. Try another window.'; traceOutput.hidden = false; return; }
    // Quantiles keep reciprocal tails from making the fitted graph unreadable.
    const xs = points.map(p => p.x).sort((a, b) => a - b), ys = points.map(p => p.y).sort((a, b) => a - b);
    const trim = points.length > 200 ? Math.floor(points.length * .02) : 0;
    let x0 = xs[trim], x1 = xs[xs.length - 1 - trim], y0 = ys[trim], y1 = ys[ys.length - 1 - trim];
    // Deliberately entered points must survive the curve-tail quantile trim.
    for (const row of rows.filter(row => row.visible && row.compiled?.kind === 'point')) {
      const p = row.compiled.point(parameters);
      if (Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) < 1e11 && Math.abs(p.y) < 1e11) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    }
    const xPad = Math.max(.5, (x1 - x0) * .12), yPad = Math.max(.5, (y1 - y0) * .12);
    clearTrace(); setView({ xMin: x0 - xPad, xMax: x1 + xPad, yMin: y0 - yPad, yMax: y1 + yPad }, { equalize: true });
  }
  function exportPNG() {
    if (sceneDirty) { drawScene(); sceneDirty = false; }
    const link = doc.createElement('a'); link.download = 'atom-numerical-graph.png'; link.href = background.toDataURL('image/png');
    link.hidden = true; doc.body.append(link); link.click(); link.remove();
  }
  function clearTrace() { trace = null; traceOutput.hidden = true; }
  function traceAt(screen) {
    if (sceneDirty) { drawScene(); sceneDirty = false; }
    let best = null, distance = 25;
    for (const row of rows.filter(row => row.visible && row.compiled)) for (const path of geometries.get(row.id) || []) {
      for (let i = 0; i < path.length; i++) {
        const a = worldToScreen(path[i], viewport, width, height), b = i ? worldToScreen(path[i - 1], viewport, width, height) : a;
        const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
        const t = length ? clamp(((screen.x - a.x) * dx + (screen.y - a.y) * dy) / length, 0, 1) : 0;
        const p = { x: a.x + t * dx, y: a.y + t * dy }, d = Math.hypot(screen.x - p.x, screen.y - p.y);
        if (d < distance) { distance = d; best = { row, point: screenToWorld(p, viewport, width, height) }; }
      }
    }
    clearTrace();
    if (best) {
      const p = best.point, descriptor = best.row.compiled;
      if (descriptor.kind === 'explicit') {
        if (descriptor.axis === 'y') p.y = descriptor.sample(p.x, parameters); else p.x = descriptor.sample(p.y, parameters);
      }
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
        trace = { expressionId: best.row.id, x: p.x, y: p.y };
        traceOutput.textContent = `Trace ≈ (${format(p.x)}, ${format(p.y)}) · numerical`; traceOutput.hidden = false;
      }
    }
    schedule(true, false);
  }
  const local = event => { const bounds = canvas.getBoundingClientRect(); return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; };
  function showPointer(p) { pointer = p; const world = screenToWorld(p, viewport, width, height); readout.textContent = `x: ${format(world.x)}   y: ${format(world.y)}`; }
  on(canvas, 'wheel', event => {
    event.preventDefault(); const p = local(event); showPointer(p);
    const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    zoom(Math.exp(-clamp(dy, -600, 600) * .0018), screenToWorld(p, viewport, width, height)); showPointer(p);
  }, { passive: false });
  on(canvas, 'pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture?.(event.pointerId);
    const p = local(event); pointers.set(event.pointerId, p);
    if (pointers.size === 1) drag = { start: p, viewport: { ...viewport }, moved: false };
    else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pinch = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), viewport: { ...viewport }, anchor: screenToWorld(midpoint, viewport, width, height) };
      if (drag) drag.moved = true;
    }
    root.classList.add('graph-dragging'); schedule(false, false);
  });
  on(canvas, 'pointermove', event => {
    const p = local(event); showPointer(p);
    if (pointers.has(event.pointerId)) {
      pointers.set(event.pointerId, p);
      if (pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()], midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const next = zoomViewport(pinch.viewport, Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) / pinch.distance, pinch.anchor);
        const currentAnchor = screenToWorld(midpoint, next, width, height);
        setView(panViewport(next, pinch.anchor.x - currentAnchor.x, pinch.anchor.y - currentAnchor.y));
      } else if (drag) {
        const dx = p.x - drag.start.x, dy = p.y - drag.start.y;
        drag.moved ||= Math.hypot(dx, dy) > 4;
        if (drag.moved) setView(panViewport(drag.viewport, -dx / width * (drag.viewport.xMax - drag.viewport.xMin), dy / height * (drag.viewport.yMax - drag.viewport.yMin)));
      }
      showPointer(p);
    }
    schedule(false, false);
  });
  function endPointer(event, cancelled = false) {
    if (!pointers.has(event.pointerId)) return;
    const clicked = !cancelled && pointers.size === 1 && drag && !drag.moved && !pinch;
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 1) drag = { start: [...pointers.values()][0], viewport: { ...viewport }, moved: true };
    else { drag = null; root.classList.remove('graph-dragging'); }
    if (clicked) traceAt(local(event));
    if (cancelled || event.pointerType === 'touch') pointer = null;
    schedule(false, false);
  }
  on(canvas, 'pointerup', event => endPointer(event));
  on(canvas, 'pointercancel', event => endPointer(event, true));
  on(canvas, 'lostpointercapture', event => endPointer(event, true));
  on(canvas, 'pointerleave', () => { if (!pointers.size) { pointer = null; readout.textContent = 'x: —   y: —'; schedule(false, false); } });
  on(canvas, 'keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const dx = (viewport.xMax - viewport.xMin) * .1, dy = (viewport.yMax - viewport.yMin) * .1;
    const actions = { '+': () => zoom(1.25), '=': () => zoom(1.25), '-': () => zoom(.8), '_': () => zoom(.8), Home: reset,
      ArrowLeft: () => setView(panViewport(viewport, -dx, 0)), ArrowRight: () => setView(panViewport(viewport, dx, 0)),
      ArrowUp: () => setView(panViewport(viewport, 0, dy)), ArrowDown: () => setView(panViewport(viewport, 0, -dy)),
      Escape: () => { clearTrace(); schedule(true, false); } };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  });
  on(root, 'click', event => {
    const action = event.target.closest('[data-graph-action]')?.dataset.graphAction;
    if (action === 'zoom-in') zoom(1.3);
    if (action === 'zoom-out') zoom(1 / 1.3);
    if (action === 'reset') reset();
    if (action === 'fit') fit();
    if (action === 'export') exportPNG();
    if (action === 'add' && rows.length < GRAPH_LIMITS.expressions) { addExpression(''); rows.at(-1).field.focus(); }
  });
  on($('.graph-examples'), 'change', event => {
    if (!event.target.value) return;
    // Example source is internal plain text. Hosts may convert it to LaTeX.
    const value = options.writeExpression ? options.writeExpression(event.target.value) : event.target.value;
    addExpression(value); event.target.value = '';
  });
  on(win, 'resize', resize);
  const observer = win.ResizeObserver ? new win.ResizeObserver(resize) : null; observer?.observe(stage);
  // A resolution media query also catches moving between monitors without a resize.
  let resolutionQuery = null;
  function observeResolution() {
    resolutionQuery?.removeEventListener?.('change', resolutionChanged);
    resolutionQuery = win.matchMedia?.(`(resolution: ${win.devicePixelRatio || 1}dppx)`);
    resolutionQuery?.addEventListener?.('change', resolutionChanged, { once: true });
  }
  function resolutionChanged() { resize(); observeResolution(); }
  observeResolution();
  setExpressions(options.expressions || []); resize(); schedule();
  return {
    addExpression, setExpressions, getState: state,
    setViewport(next) { if (!destroyed) setView(validateViewport(next), { equalize: true }); },
    zoom, reset, resize,
    destroy() {
      if (destroyed) return;
      destroyed = true; if (frame !== null) win.cancelAnimationFrame(frame);
      observer?.disconnect(); resolutionQuery?.removeEventListener?.('change', resolutionChanged);
      listeners.forEach(remove => remove()); rows.forEach(disposeRow); rows = []; pointers.clear(); geometries.clear(); root.remove();
    },
  };
}
