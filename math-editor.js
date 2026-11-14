// Visual editing and safe typesetting only. The local engine owns all mathematics.
import { MathfieldElement } from './vendor/mathlive/mathlive.min.mjs';
import katex from './vendor/katex/katex.mjs';
import { toLatex } from './engine/latex.js';

MathfieldElement.fontsDirectory = new URL('./vendor/mathlive/fonts', import.meta.url).href;
MathfieldElement.soundsDirectory = null;
MathfieldElement.computeEngine = null;

let activeField = null;
let fallbackField = null;
let fieldNumber = 0;
let keypadInteraction = false;
const focusListeners = new Set();

export { toLatex };

export function renderMath(latex, { displayMode = false, className = '', tag = 'span' } = {}) {
  const element = document.createElement(tag);
  element.className = `rendered-math ${className}`.trim();
  const source = latex === null || latex === undefined ? '' : String(latex);
  try {
    katex.render(source, element, {
      displayMode, trust: false, throwOnError: true, strict: 'ignore',
      output: 'htmlAndMathml', maxExpand: 1000, maxSize: 25,
    });
  } catch {
    // An invalid expression stays inert and copyable. Never insert source as HTML.
    element.textContent = source;
    element.classList.add('math-render-error');
    element.setAttribute('aria-label', `Unrendered mathematical notation: ${source}`);
  }
  return element;
}

export function setActiveMathField(field) {
  if (!field) return;
  activeField = field;
  focusListeners.forEach((listener) => listener(field));
}

export function getActiveMathField() {
  const usable = (field) => field?.isConnected && !field.closest('[hidden]') && !field.readOnly;
  if (usable(activeField)) return activeField;
  if (usable(fallbackField)) return fallbackField;
  return [...document.querySelectorAll('math-field')].find(usable) || null;
}

export function setDefaultMathField(field) {
  fallbackField = field;
  if (field) setActiveMathField(field);
}

export function setMathFieldValue(field, value, { latex = false } = {}) {
  field.value = value === '' || value === null || value === undefined ? '' : latex ? String(value) : toLatex(value);
  field.dispatchEvent(new Event('math-value-set'));
}

export function createMathField(value = '', {
  onInput, ariaLabel = 'Mathematical expression', id, placeholder = '',
  className = '', describedBy, latex = false,
} = {}) {
  const field = new MathfieldElement();
  field.id = id || `math-expression-${++fieldNumber}`;
  field.className = `visual-math-field ${className}`.trim();
  field.setAttribute('aria-label', ariaLabel);
  if (describedBy) field.setAttribute('aria-describedby', describedBy);
  field.setAttribute('math-virtual-keyboard-policy', 'manual');
  field.mathVirtualKeyboardPolicy = 'manual';
  field.smartFence = true;
  field.smartMode = false;
  field.onScrollIntoView = () => {
    if (!keypadInteraction) field.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  };
  field.placeholder = placeholder;
  field.placeholderSymbol = '▢';
  field.addEventListener('mount', () => {
    field.inlineShortcuts = { ...field.inlineShortcuts, pi: '\\pi', infinity: '\\infty' };
    // MathLive keeps expression atoms in its shadow root. Only this fixed,
    // locally authored stylesheet is added; expression source is never HTML.
    if (!field.shadowRoot || field.shadowRoot.querySelector('[data-template-style]')) return;
    const style = document.createElement('style');
    style.dataset.templateStyle = '';
    style.textContent = `
      .ML__placeholder,.ML__box-placeholder{
        background:#e1e3e0!important;color:transparent!important;opacity:1!important;
        border-radius:3px;margin:0 .06em;padding:0 .32ex;
      }
      .ML__prompt-atom .ML__prompt,.ML__editablePromptBox,.ML__lockedPromptBox{
        background:#e1e3e0!important;border-radius:3px;outline:1px solid #b8beb4;
      }
      .ML__focused .ML__selected .ML__placeholder,.ML__placeholder-selected,
      .ML__focusedPromptBox{
        background:#cbd1c6!important;outline:2px solid #8e9a83!important;
      }
    `;
    field.shadowRoot.append(style);
  });
  field.addEventListener('focusin', () => setActiveMathField(field));
  field.addEventListener('pointerdown', () => setActiveMathField(field));
  if (onInput) field.addEventListener('input', (event) => onInput(field.value, event, field));
  setMathFieldValue(field, value, { latex });
  return field;
}

export function createLatexDisclosure(field, { label = 'Edit LaTeX source' } = {}) {
  const details = document.createElement('details');
  details.className = 'latex-disclosure';
  const summary = document.createElement('summary');
  summary.textContent = label;
  const input = document.createElement('textarea');
  input.className = 'latex-source';
  input.rows = 2;
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('aria-label', `${field.getAttribute('aria-label')} LaTeX source`);
  input.maxLength = 20000;
  input.value = field.value;
  const sync = () => { if (document.activeElement !== input) input.value = field.value; };
  input.addEventListener('focus', () => setActiveMathField(field));
  input.addEventListener('blur', sync);
  field.addEventListener('input', sync);
  field.addEventListener('math-value-set', sync);
  input.addEventListener('input', () => {
    setMathFieldValue(field, input.value, { latex: true });
    field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  });
  const hint = document.createElement('p');
  hint.className = 'field-help';
  hint.textContent = 'This source stays synchronized with the visual expression.';
  details.append(summary, input, hint);
  return details;
}

const BOX = '\\colorbox{#e3e5e2}{\\phantom{x}}';
const key = (label, insert, preview = insert, extra = {}) => ({ label, insert, preview, ...extra });
const BASIC = [
  key('Fraction', '\\frac{#0}{#?}', `\\frac{${BOX}}{${BOX}}`),
  key('Square root', '\\sqrt{#0}', `\\sqrt{${BOX}}`),
  key('Power', '{#0}^{#?}', `${BOX}^{${BOX}}`),
  key('Square', '{#0}^{2}', `${BOX}^{2}`),
  key('Parentheses', '\\left(#0\\right)', `\\left(${BOX}\\right)`),
  key('Absolute value', '\\left|#0\\right|', `\\left|${BOX}\\right|`),
  key('x', 'x'), key('y', 'y'), key('a', 'a'), key('b', 'b'), key('n', 'n'), key('t', 't'),
  key('Less than', '<'), key('Greater than', '>'), key('Less than or equal', '\\le'),
  key('Greater than or equal', '\\ge'), key('Not equal', '\\ne'), key('Approximately equal', '\\approx'),
  key('Pi', '\\pi'), key('Infinity', '\\infty'), key('Imaginary unit', 'i'),
  key('Euler’s number', 'e'), key('Percent', '\\%'), key('Factorial', '!'),
];
const ALGEBRA = [
  BASIC[0], BASIC[2], BASIC[3], BASIC[1],
  key('Nth root', '\\sqrt[#?]{#0}', `\\sqrt[${BOX}]{${BOX}}`),
  key('Reciprocal', '\\frac{1}{#0}', `\\frac{1}{${BOX}}`),
  key('Subscript', '{#0}_{#?}', `${BOX}_{${BOX}}`),
  key('Function', 'f\\left(#0\\right)', `f\\left(${BOX}\\right)`),
  key('Function definition', 'f(x)=#0', 'f(x)='),
  key('Scientific notation', '#0\\times10^{#?}', `${BOX}\\times10^{${BOX}}`),
  key('Plus or minus', '\\pm'), key('Proportional to', '\\propto'),
  key('2 by 2 matrix', '\\begin{bmatrix}#0&#?\\\\#?&#?\\end{bmatrix}', `\\begin{bmatrix}${BOX}&${BOX}\\\\${BOX}&${BOX}\\end{bmatrix}`),
  key('Piecewise cases', '\\begin{cases}#0&#?\\\\#?&#?\\end{cases}', `\\begin{cases}${BOX}&${BOX}\\\\${BOX}&${BOX}\\end{cases}`),
  key('System of equations', '\\begin{cases}#0=#?\\\\#?=#?\\end{cases}', `\\begin{cases}${BOX}=${BOX}\\\\${BOX}=${BOX}\\end{cases}`),
  key('Binomial coefficient', '\\binom{#0}{#?}', `\\binom{${BOX}}{${BOX}}`),
  key('Summation with bounds', '\\sum_{#?}^{#?}#0', `\\sum_{${BOX}}^{${BOX}}${BOX}`),
  key('Product with bounds', '\\prod_{#?}^{#?}#0', `\\prod_{${BOX}}^{${BOX}}${BOX}`),
  key('Interval', '\\left[#0,#?\\right]', `\\left[${BOX},${BOX}\\right]`),
  key('Set', '\\left\\{#0\\right\\}', `\\left\\{${BOX}\\right\\}`),
  key('Union', '\\cup'), key('Intersection', '\\cap'), key('Member of', '\\in'), key('Real numbers', '\\mathbb{R}'),
];
const FUNCTIONS = [
  key('Sine', '\\sin\\left(#0\\right)', `\\sin(${BOX})`),
  key('Cosine', '\\cos\\left(#0\\right)', `\\cos(${BOX})`),
  key('Tangent', '\\tan\\left(#0\\right)', `\\tan(${BOX})`),
  key('Inverse sine', '\\arcsin\\left(#0\\right)', `\\arcsin(${BOX})`),
  key('Inverse cosine', '\\arccos\\left(#0\\right)', `\\arccos(${BOX})`),
  key('Inverse tangent', '\\arctan\\left(#0\\right)', `\\arctan(${BOX})`),
  key('Logarithm', '\\log\\left(#0\\right)', `\\log(${BOX})`),
  key('Natural logarithm', '\\ln\\left(#0\\right)', `\\ln(${BOX})`),
  key('Logarithm with base', '\\log_{#?}\\left(#0\\right)', `\\log_{${BOX}}(${BOX})`),
  key('Exponential', 'e^{#0}', `e^{${BOX}}`),
  key('Power of ten', '10^{#0}', `10^{${BOX}}`),
  key('Absolute value', '\\left|#0\\right|', `\\left|${BOX}\\right|`),
  key('Sine squared', '\\sin^{2}\\left(#0\\right)', `\\sin^2(${BOX})`),
  key('Hyperbolic sine', '\\sinh\\left(#0\\right)', `\\sinh(${BOX})`),
  key('Hyperbolic cosine', '\\cosh\\left(#0\\right)', `\\cosh(${BOX})`),
  key('Floor', '\\left\\lfloor#0\\right\\rfloor', `\\lfloor ${BOX} \\rfloor`),
  key('Ceiling', '\\left\\lceil#0\\right\\rceil', `\\lceil ${BOX} \\rceil`),
  key('Bounded integral notation', '\\int_{#?}^{#?}#0\\,\\mathrm{d}x', `\\int_{${BOX}}^{${BOX}}${BOX}\\,\\mathrm{d}x`),
  key('Integral notation', '\\int #0\\,\\mathrm{d}x', `\\int ${BOX}\\,\\mathrm{d}x`),
  key('Limit notation', '\\lim_{x\\to#?}#0', `\\lim_{x\\to${BOX}}${BOX}`),
  key('Derivative notation', '\\frac{\\mathrm{d}}{\\mathrm{d}x}#0', `\\frac{\\mathrm{d}}{\\mathrm{d}x}${BOX}`),
  key('Degree', '^{\\circ}', '30^{\\circ}'), key('Theta', '\\theta'), key('Lambda', '\\lambda'),
];
const SYMBOLS = [
  key('Pi', '\\pi'), key('Infinity', '\\infty'), key('Theta', '\\theta'), key('Alpha', '\\alpha'), key('Beta', '\\beta'), key('Delta', '\\Delta'),
  key('Right arrow', '\\to'), key('Left arrow', '\\leftarrow'), key('Implies', '\\Rightarrow'), key('Equivalent to', '\\Leftrightarrow'), key('Therefore', '\\therefore'), key('Because', '\\because'),
  key('Less than or equal', '\\le'), key('Greater than or equal', '\\ge'), key('Not equal', '\\ne'), key('Approximately equal', '\\approx'), key('Plus or minus', '\\pm'), key('Congruent', '\\cong'),
  key('Real numbers', '\\mathbb{R}'), key('Complex numbers', '\\mathbb{C}'), key('Integers', '\\mathbb{Z}'), key('Natural numbers', '\\mathbb{N}'),
  key('Angle', '\\angle'), key('Triangle', '\\triangle'), key('Parallel', '\\parallel'), key('Perpendicular', '\\perp'),
  key('Member of', '\\in'), key('Not a member of', '\\notin'), key('Empty set', '\\varnothing'), key('For all', '\\forall'),
];
const NUMBERS = [
  key('7', '7'), key('8', '8'), key('9', '9'), key('Divide', '\\div'),
  key('4', '4'), key('5', '5'), key('6', '6'), key('Multiply', '\\times'),
  key('1', '1'), key('2', '2'), key('3', '3'), key('Subtract', '-'),
  key('0', '0'), key('Decimal point', '.'), key('Equals', '='), key('Add', '+'),
];

export function createKeypad(container, { announce = () => {} } = {}) {
  const heading = document.createElement('div');
  heading.className = 'keypad-heading';
  const titleGroup = document.createElement('div');
  const title = document.createElement('h2');
  title.id = 'math-keypad-heading';
  title.textContent = 'Build it like you write it.';
  const hint = document.createElement('p');
  hint.textContent = 'Choose a template. Fill the gray boxes. Keep going.';
  titleGroup.append(title, hint);
  const target = document.createElement('span');
  target.className = 'keypad-target';
  heading.append(titleGroup, target);
  const preview = document.createElement('div');
  preview.className = 'keypad-preview';
  const previewLabel = document.createElement('span');
  previewLabel.className = 'keypad-preview-label';
  previewLabel.textContent = 'Active expression';
  const previewContent = document.createElement('div');
  previewContent.className = 'keypad-preview-content';
  previewContent.setAttribute('aria-label', 'Live preview of the active expression');
  const returnToField = document.createElement('button');
  returnToField.type = 'button';
  returnToField.className = 'text-button keypad-return';
  returnToField.textContent = 'Return to field ↑';
  returnToField.addEventListener('click', () => {
    keypadInteraction = false;
    getActiveMathField()?.focus();
  });
  preview.append(previewLabel, previewContent, returnToField);
  let previewField = null;
  const updatePreview = () => {
    const source = previewField?.value || '';
    if (!source) {
      previewContent.textContent = 'Your expression will appear here as you type.';
      previewContent.classList.add('is-empty');
      return;
    }
    previewContent.classList.remove('is-empty');
    // MathLive's empty template slots are rendered as inert gray boxes in KaTeX.
    const latex = source.replace(/\\placeholder(?:\[[^\]]*\])?\{\}/g, BOX);
    previewContent.replaceChildren(renderMath(latex, { tag: 'div', className: 'keypad-preview-math' }));
  };
  const updateTarget = (field) => {
    target.textContent = `Editing: ${field?.getAttribute('aria-label') || 'choose an expression'}`;
    returnToField.disabled = !field;
    if (previewField !== field) {
      previewField?.removeEventListener('input', updatePreview);
      previewField?.removeEventListener('math-value-set', updatePreview);
      previewField = field;
      previewField?.addEventListener('input', updatePreview);
      previewField?.addEventListener('math-value-set', updatePreview);
    }
    updatePreview();
  };
  focusListeners.add(updateTarget);
  updateTarget(getActiveMathField());
  const endKeypadInteraction = (event) => {
    if (!container.contains(event.target)) keypadInteraction = false;
  };
  document.addEventListener('pointerdown', endKeypadInteraction, true);
  document.addEventListener('keydown', endKeypadInteraction, true);
  const tablist = document.createElement('div');
  tablist.className = 'keypad-tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Math keyboard categories');
  const layout = document.createElement('div');
  layout.className = 'keypad-layout';
  const templates = document.createElement('div');
  templates.className = 'keypad-templates';
  templates.id = 'keypad-templates';
  templates.setAttribute('role', 'tabpanel');
  const numberPad = document.createElement('div');
  numberPad.className = 'keypad-numbers';
  numberPad.setAttribute('role', 'group');
  numberPad.setAttribute('aria-label', 'Numbers and arithmetic');
  const commands = document.createElement('div');
  commands.className = 'keypad-commands';
  commands.setAttribute('role', 'group');
  commands.setAttribute('aria-label', 'Edit expression');

  function makeButton(data) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `math-key ${data.command ? 'math-key-command' : ''}`;
    button.setAttribute('aria-label', data.label);
    button.title = data.label;
    if (data.text) button.textContent = data.text;
    else button.append(renderMath(data.preview));
    // Preserve the math selection when a pointer taps the pad.
    button.addEventListener('pointerdown', (event) => event.preventDefault());
    button.addEventListener('click', () => {
      const field = getActiveMathField();
      if (!field) { announce('Choose a math expression first.'); return; }
      keypadInteraction = true;
      const scrollPosition = { left: window.scrollX, top: window.scrollY, behavior: 'instant' };
      // MathLive's focus() has no public preventScroll argument. Its scroll hook
      // above keeps the page still for focus and cursor commands from this pad.
      if (!field.hasFocus()) field.focus();
      const before = field.value;
      if (data.command) field.executeCommand(data.command);
      else field.insert(data.insert, { selectionMode: 'placeholder', format: 'latex', focus: false, scrollIntoView: false });
      if (field.value !== before) field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      setActiveMathField(field);
      window.scrollTo(scrollPosition);
      requestAnimationFrame(() => { if (keypadInteraction) window.scrollTo(scrollPosition); });
      announce(`${data.label}. Editing ${field.getAttribute('aria-label')}.`);
    });
    return button;
  }

  const categories = [['basic', 'Basic', BASIC], ['algebra', 'Algebra', ALGEBRA], ['functions', 'Functions', FUNCTIONS], ['symbols', 'Symbols', SYMBOLS]];
  const tabButtons = categories.map(([id, label]) => {
    const button = document.createElement('button');
    button.id = `keypad-tab-${id}`;
    button.type = 'button';
    button.className = 'keypad-tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', templates.id);
    button.textContent = label;
    tablist.append(button);
    return button;
  });
  const chooseTab = (index, focus = false) => {
    tabButtons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
    templates.setAttribute('aria-labelledby', tabButtons[index].id);
    templates.replaceChildren(...categories[index][2].map(makeButton));
    if (focus) tabButtons[index].focus();
  };
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => chooseTab(index));
    button.addEventListener('keydown', (event) => {
      const next = { ArrowRight: (index + 1) % 4, ArrowLeft: (index + 3) % 4, Home: 0, End: 3 }[event.key];
      if (next !== undefined) { event.preventDefault(); chooseTab(next, true); }
    });
  });
  NUMBERS.forEach((data) => numberPad.append(makeButton(data)));
  [
    { label: 'Move cursor left', command: 'moveToPreviousChar', text: '←' },
    { label: 'Move cursor right', command: 'moveToNextChar', text: '→' },
    { label: 'Backspace', command: 'deleteBackward', text: '⌫' },
    { label: 'Next placeholder', command: 'moveToNextPlaceholder', text: 'Next box ⇥' },
    { label: 'Undo', command: 'undo', text: '↶ Undo' },
    { label: 'Redo', command: 'redo', text: '↷ Redo' },
  ].forEach((data) => commands.append(makeButton(data)));
  [templates, numberPad, commands].forEach((group) => {
    group.addEventListener('keydown', (event) => {
      if (!event.target.matches('button')) return;
      const buttons = [...group.querySelectorAll('button')];
      const current = buttons.indexOf(event.target);
      const columns = getComputedStyle(group).gridTemplateColumns.split(' ').length;
      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : offsets[event.key] !== undefined ? (current + offsets[event.key] + buttons.length) % buttons.length : null;
      if (next !== null) { event.preventDefault(); buttons[next].focus(); }
    });
  });
  layout.append(templates, numberPad, commands);
  const footnote = document.createElement('p');
  footnote.className = 'keypad-footnote';
  footnote.textContent = 'Use Tab to move through template boxes. Integral and limit templates enter notation; solving depends on the engine’s listed coverage.';
  container.setAttribute('aria-labelledby', title.id);
  container.append(heading, preview, tablist, layout, footnote);
  chooseTab(0);
  return { destroy() {
    focusListeners.delete(updateTarget);
    previewField?.removeEventListener('input', updatePreview);
    previewField?.removeEventListener('math-value-set', updatePreview);
    document.removeEventListener('pointerdown', endKeypadInteraction, true);
    document.removeEventListener('keydown', endKeypadInteraction, true);
    keypadInteraction = false;
    container.replaceChildren();
  } };
}
