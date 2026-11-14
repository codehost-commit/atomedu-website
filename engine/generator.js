import { difficultyToInt, estimateDifficulty } from './difficulty.js';

export const TOPICS = Object.freeze([
  { id: 'linear', label: 'Linear equations', subject: 'algebra_1' },
  { id: 'distribution', label: 'Equations with distribution', subject: 'algebra_1' },
  { id: 'quadratic', label: 'Quadratic equations', subject: 'algebra_2' },
  { id: 'rational_equation', label: 'Rational equations', subject: 'algebra_2' },
  { id: 'rational_function', label: 'Rational function features', subject: 'algebra_2' },
  { id: 'polynomial_simplification', label: 'Polynomial simplification', subject: 'algebra_1' },
  { id: 'systems', label: 'Systems of linear equations', subject: 'algebra_1' },
  { id: 'exponential', label: 'Exponential equations', subject: 'algebra_2' },
  { id: 'radical', label: 'Radical equations', subject: 'algebra_2' },
  { id: 'logarithmic', label: 'Logarithmic equations (base 10)', subject: 'algebra_2' },
  { id: 'absolute_value', label: 'Absolute value equations', subject: 'algebra_1' },
  { id: 'inequalities', label: 'Linear inequalities', subject: 'algebra_1' },
  { id: 'arithmetic_sequence', label: 'Arithmetic sequences', subject: 'algebra_1' },
  { id: 'geometric_sequence', label: 'Geometric sequences', subject: 'algebra_2' },
  { id: 'distance', label: 'Coordinate distance', subject: 'geometry' },
  { id: 'pythagorean', label: 'Pythagorean theorem', subject: 'geometry' },
].map(topic => Object.freeze(topic)));

const ALIASES = Object.freeze({
  linear_equation: 'linear', linear_equations: 'linear',
  rational: 'rational_equation', polynomial: 'polynomial_simplification',
  system: 'systems', log: 'logarithmic', logarithm: 'logarithmic',
  abs: 'absolute_value', inequality: 'inequalities',
  arithmetic: 'arithmetic_sequence', geometric: 'geometric_sequence',
  pythagoras: 'pythagorean',
});

function hash(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  }
  return value >>> 0;
}

function randomSource(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function fraction(numerator, denominator = 1) {
  if (denominator === 0) throw new RangeError('A denominator cannot be zero.');
  if (denominator < 0) { numerator = -numerator; denominator = -denominator; }
  let a = Math.abs(numerator);
  let b = denominator;
  while (b) [a, b] = [b, a % b];
  numerator /= a;
  denominator /= a;
  return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;
}

function sum(left, right) {
  return right === 0 ? left : `${left} ${right < 0 ? '-' : '+'} ${Math.abs(right)}`;
}

function polynomial(coefficients) {
  const terms = [];
  for (let power = coefficients.length - 1; power >= 0; power--) {
    const coefficient = coefficients[power];
    if (!coefficient) continue;
    const magnitude = Math.abs(coefficient);
    const monomial = power === 0 ? String(magnitude)
      : `${magnitude === 1 ? '' : `${magnitude}*`}x${power === 1 ? '' : `^${power}`}`;
    terms.push(`${terms.length ? (coefficient < 0 ? ' - ' : ' + ') : (coefficient < 0 ? '-' : '')}${monomial}`);
  }
  return terms.join('') || '0';
}

const linearExpression = (a, b = 0) => polynomial([b, a]);
const equation = (a, b, rhs) => `${linearExpression(a, b)} = ${rhs}`;
const step = (before, after, rule, explanation) => ({ before, after, rule, explanation });
const mistake = (before, after, error_category, explanation) => ({ before, after, error_category, explanation });
const solutions = values => ({ kind: 'solutions', variable: 'x', solutions: [...new Set(values.map(String))] });

function linear(ctx) {
  const { int, signed, score, magnitude } = ctx;
  const denominator = score >= 650 ? int(2, 6) : 1;
  const numerator = signed(1, magnitude);
  const a = signed(2, magnitude) * denominator;
  const b = score < 180 ? 0 : signed(1, magnitude);
  const c = score >= 650 ? signed(1, magnitude) : 0;
  const rhs = a * numerator / denominator + b;
  const input = `${linearExpression(a + c, b)} = ${linearExpression(c, rhs)}`;
  const isolated = equation(a, b, rhs);
  const multiplied = equation(a, 0, rhs - b);
  const answer = fraction(numerator, denominator);
  const referenceSteps = [];
  if (c) referenceSteps.push(step(input, isolated, 'subtract_same_term_from_both_sides', 'Collect the variable terms on the left.'));
  if (b) referenceSteps.push(step(isolated, multiplied, 'subtract_same_value_from_both_sides', `Subtract ${b} from both sides.`));
  referenceSteps.push(step(multiplied, `x = ${answer}`, 'divide_both_sides', `Divide both sides by ${a}.`));
  return { input, task: 'Solve for x.', expected: solutions([answer]), referenceSteps,
    intentional_errors: [mistake(multiplied, `x = ${fraction(numerator + denominator, denominator)}`, 'incorrect_division', 'The quotient is one larger than the result of dividing both sides by the coefficient.')] };
}

function distribution(ctx) {
  const { signed, score, magnitude } = ctx;
  const a = signed(2, magnitude);
  const b = signed(1, magnitude);
  const c = score >= 400 ? signed(1, magnitude) : 0;
  const x = signed(1, magnitude);
  const rhs = a * (x + b) + c;
  const input = `${sum(`${a}*(${sum('x', b)})`, c)} = ${rhs}`;
  const expanded = equation(a, a * b + c, rhs);
  const isolated = equation(a, 0, rhs - a * b - c);
  return { input, task: 'Distribute, then solve for x.', expected: solutions([x]),
    referenceSteps: [
      step(input, expanded, 'distributive_property', 'Multiply every term inside the parentheses by the outside coefficient, then combine constants.'),
      step(expanded, isolated, 'subtract_same_value_from_both_sides', 'Remove the constant term from both sides.'),
      step(isolated, `x = ${x}`, 'divide_both_sides', `Divide both sides by ${a}.`),
    ],
    intentional_errors: [mistake(input, equation(a, b + c, rhs), 'incomplete_distribution', 'The outside coefficient must multiply the constant inside the parentheses as well as x.')] };
}

function quadratic(ctx) {
  const { int, signed, score, magnitude } = ctx;
  const first = signed(1, magnitude);
  let second = signed(1, magnitude);
  if (second === first) second += 1;
  const a = score >= 500 ? int(2, 6) : 1;
  const input = `${polynomial([a * first * second, -a * (first + second), a])} = 0`;
  const monic = `${polynomial([first * second, -first - second, 1])} = 0`;
  const factored = `(${sum('x', -first)})*(${sum('x', -second)}) = 0`;
  const referenceSteps = [];
  if (a !== 1) referenceSteps.push(step(input, monic, 'divide_both_sides', `Divide both sides by ${a}.`));
  referenceSteps.push(step(monic, factored, 'factor_quadratic', 'Factor using two numbers whose sum and product match the coefficients.'));
  referenceSteps.push(step(factored, `x = ${first} or x = ${second}`, 'zero_product_property', 'At least one of the factors must be zero.'));
  return { input, task: 'Find all real solutions for x.', expected: solutions([first, second].sort((a, b) => a - b)), referenceSteps,
    intentional_errors: [mistake(factored, `x = ${first}`, 'lost_solution', 'Setting only one factor equal to zero loses the other distinct root.')] };
}

function rationalEquation(ctx) {
  const { signed, magnitude } = ctx;
  const h = signed(1, magnitude);
  const offset = signed(1, magnitude);
  const b = signed(2, magnitude);
  const a = b * offset;
  const denominator = sum('x', -h);
  const input = `${a}/(${denominator}) = ${b}`;
  const multiplied = `${a} = ${b}*(${denominator})`;
  const divided = `${offset} = ${denominator}`;
  const x = h + offset;
  return { input, task: 'Solve for x and preserve the denominator restriction.', expected: solutions([x]),
    restrictions: [`x != ${h}`],
    referenceSteps: [
      step(input, multiplied, 'multiply_both_sides', `Multiply both sides by ${denominator}, which is nonzero on the domain.`),
      step(multiplied, divided, 'divide_both_sides', `Divide both sides by ${b}.`),
      step(divided, `x = ${x}`, 'isolate_variable', `Add ${h} to both sides and write x first.`),
    ],
    intentional_errors: [mistake(divided, `x = ${offset - h}`, 'sign_error', 'Moving the denominator shift uses the wrong sign.')] };
}

function rationalFunction(ctx) {
  const { int, signed, score, magnitude } = ctx;
  const a = signed(1, magnitude);
  const h = score < 200 ? 0 : signed(1, magnitude);
  const k = signed(1, score < 400 ? 3 : magnitude);
  const denominator = sum('x', -h);
  const input = `f(x) = ${sum(`${a}/(${denominator})`, k)}`;
  const shifted = `${sum('f(x)', -k)} = ${a}/(${denominator})`;
  const relation = `(${denominator})*(${sum('f(x)', -k)}) = ${a}`;
  return { input, task: 'Find the domain, range, asymptotes, intercepts, and transformations from 1/x.',
    expected: {
      kind: 'rational_function', a, h, k, parent: '1/x',
      domain: { variable: 'x', excluded: [String(h)] },
      range: { variable: 'y', excluded: [String(k)] },
      verticalAsymptote: `x = ${h}`, horizontalAsymptote: `y = ${k}`,
      xIntercept: fraction(h * k - a, k),
      yIntercept: h === 0 ? null : fraction(k * h - a, h),
      transformations: { horizontalShift: h, verticalScale: a, verticalShift: k },
    }, restrictions: [`x != ${h}`],
    referenceSteps: [
      step(input, shifted, 'subtract_same_value_from_both_sides', `Subtract the vertical shift ${k} from both sides.`),
      step(shifted, relation, 'multiply_both_sides', `Multiply by ${denominator} on the restricted domain. Since ${a} is nonzero, neither factor can be zero.`),
    ].map(reference => ({ ...reference, relation: 'transformation' })),
    intentional_errors: [mistake(input, `x = ${h + int(1, 3)}`, 'incorrect_vertical_asymptote', 'The vertical asymptote occurs where the original denominator is zero.')] };
}

function polynomialSimplification(ctx) {
  const { signed, score, magnitude } = ctx;
  if (score >= 650) {
    const a = signed(1, magnitude), b = signed(1, magnitude);
    const c = signed(1, magnitude);
    let d = signed(1, magnitude);
    if (a * d + b * c === 0) d += 1;
    const input = `(${linearExpression(a, b)})*(${linearExpression(c, d)})`;
    const coefficients = [b * d, a * d + b * c, a * c];
    const expanded = `${polynomial([0, a * d, a * c])} + (${polynomial([b * d, b * c])})`;
    const expression = polynomial(coefficients);
    return { input, task: 'Expand and combine like terms.', expected: { kind: 'expression', expression, coefficients },
      referenceSteps: [
        step(input, expanded, 'distributive_property', 'Multiply each term in the first factor by each term in the second.'),
        step(expanded, expression, 'combine_like_terms', 'Add coefficients of terms with the same power of x.'),
      ], intentional_errors: [mistake(input, polynomial([b * d, 0, a * c]), 'missing_cross_terms', 'Multiplying only the leading and constant terms omits both cross products.')] };
  }
  const left = [signed(1, magnitude), signed(1, magnitude), signed(1, magnitude)];
  const right = [signed(1, magnitude), signed(1, magnitude), signed(1, magnitude)];
  const coefficients = left.map((value, index) => value + right[index]);
  const input = `(${polynomial(left)}) + (${polynomial(right)})`;
  const expression = polynomial(coefficients);
  return { input, task: 'Simplify by combining like terms.', expected: { kind: 'expression', expression, coefficients },
    referenceSteps: [step(input, expression, 'combine_like_terms', 'Add the coefficients of matching powers of x.')],
    intentional_errors: [mistake(input, sum(expression, 1), 'incorrect_combination', 'The constant coefficient is one larger than the sum of the original constants.')] };
}

function system(ctx) {
  const { signed, magnitude } = ctx;
  const x = signed(1, magnitude), y = signed(1, magnitude);
  const a = signed(1, magnitude), b = signed(1, magnitude), c = signed(1, magnitude);
  let d = signed(1, magnitude);
  if (a * d === b * c) d += 1;
  const rhs1 = a * x + b * y, rhs2 = c * x + d * y;
  const eq = (u, v, rhs) => `${linearExpression(u)} ${v < 0 ? '-' : '+'} ${Math.abs(v)}*y = ${rhs}`;
  const input = { kind: 'system', equations: [eq(a, b, rhs1), eq(c, d, rhs2)], variables: ['x', 'y'] };
  const determinant = a * d - b * c;
  const triangular = { ...input, equations: [input.equations[0], `${determinant}*y = ${a * rhs2 - c * rhs1}`] };
  const normalized = { ...input, equations: [input.equations[0], `y = ${y}`] };
  const substituted = { ...input, equations: [`${a}*x = ${rhs1 - b * y}`, `y = ${y}`] };
  const solved = { ...input, equations: [`x = ${x}`, `y = ${y}`] };
  return { input, task: 'Solve the system for x and y.', expected: { kind: 'system', solutions: { x: String(x), y: String(y) } },
    referenceSteps: [
      step(input, triangular, 'elimination', `Replace the second equation with ${a} times the second minus ${c} times the first; the first equation is retained.`),
      step(triangular, normalized, 'divide_both_sides', `Divide the second equation by the nonzero coefficient ${determinant}; retain the first equation.`),
      step(normalized, substituted, 'substitution', 'Substitute the isolated value of y into the first equation and retain y as a constraint.'),
      step(substituted, solved, 'divide_both_sides', 'Divide the remaining nonzero coefficient to isolate x.'),
    ], intentional_errors: [mistake(substituted, { ...input, equations: [`x = ${x + 1}`, `y = ${y}`] }, 'incorrect_substitution', 'The reported x value does not satisfy the retained first equation.')] };
}

function exponential(ctx) {
  const { int, score } = ctx;
  const base = [2, 3, 5][int(0, 2)];
  const exponent = int(1, score < 400 ? 3 : 6) * (score >= 650 && int(0, 1) ? -1 : 1);
  const rhs = exponent < 0 ? fraction(1, base ** -exponent) : String(base ** exponent);
  const input = `${base}^x = ${rhs}`;
  const rewritten = `${base}^x = ${base}^(${exponent})`;
  return { input, task: 'Solve for x using equal bases.', expected: solutions([exponent]),
    referenceSteps: [
      step(input, rewritten, 'rewrite_as_power', 'Express the right side as a power of the same positive base.'),
      step(rewritten, `x = ${exponent}`, 'equal_exponents', 'Powers of the same positive base other than 1 are equal only when their exponents are equal.'),
    ], intentional_errors: [mistake(rewritten, `x = ${exponent + 1}`, 'incorrect_exponent', 'The exponent is one larger than the exponent on the right.')] };
}

function radical(ctx) {
  const { int, signed, magnitude } = ctx;
  const a = signed(1, magnitude), b = int(2, magnitude);
  const input = `sqrt(${sum('x', a)}) = ${b}`;
  const squared = `${sum('x', a)} = ${b * b}`;
  const x = b * b - a;
  return { input, task: 'Solve for x and check the original square root domain.', expected: solutions([x]),
    restrictions: [`${sum('x', a)} >= 0`],
    referenceSteps: [
      step(input, squared, 'square_both_sides', 'Both sides are nonnegative, so squaring is reversible on the stated domain.'),
      step(squared, `x = ${x}`, 'subtract_same_value_from_both_sides', `Subtract ${a} from both sides. Substitution gives sqrt(${b * b}) = ${b}.`),
    ], intentional_errors: [mistake(input, `${sum('x', a)} = ${b}`, 'unsquared_right_side', 'Removing a square root requires squaring the right side as well.')] };
}

function logarithmic(ctx) {
  const { int, signed, score, magnitude } = ctx;
  const exponent = int(score >= 650 ? -3 : 0, score < 400 ? 2 : 4);
  const shift = score >= 400 ? signed(1, magnitude) : 0;
  const argument = sum('x', shift);
  const denominator = exponent < 0 ? 10 ** -exponent : 1;
  const numerator = exponent < 0 ? 1 : 10 ** exponent;
  const power = fraction(numerator, denominator);
  const answer = fraction(numerator - shift * denominator, denominator);
  const input = `log(${argument}) = ${exponent}`;
  const exponentialForm = `${argument} = 10^(${exponent})`;
  const evaluated = `${argument} = ${power}`;
  const referenceSteps = [
      step(input, exponentialForm, 'logarithm_definition', 'A base-10 logarithm equals the exponent to which 10 must be raised.'),
      step(exponentialForm, evaluated, 'evaluate_power', 'Evaluate the power of 10; the logarithm argument is positive.'),
  ];
  if (shift) referenceSteps.push(step(evaluated, `x = ${answer}`, 'subtract_same_value_from_both_sides', `Subtract ${shift} from both sides.`));
  return { input, task: 'Solve for x; log denotes the base-10 logarithm.', expected: { ...solutions([answer]), base: 10 }, restrictions: [`${argument} > 0`],
    referenceSteps,
    intentional_errors: [mistake(input, `${argument} = ${exponent}`, 'logarithm_as_identity', 'A logarithm is not the identity function; exponentiation by the base is required.')] };
}

function absoluteValue(ctx) {
  const { int, signed, score, magnitude } = ctx;
  const h = signed(1, magnitude), radius = int(1, magnitude);
  const a = score >= 650 ? int(2, 5) : 1;
  const k = score >= 650 ? signed(1, magnitude) : 0;
  const absolute = `abs(${sum('x', -h)})`;
  const input = `${sum(`${a === 1 ? '' : `${a}*`}${absolute}`, k)} = ${a * radius + k}`;
  const isolated = `${absolute} = ${radius}`;
  const referenceSteps = [];
  if (a !== 1) {
    const shifted = `${a}*${absolute} = ${a * radius}`;
    referenceSteps.push(step(input, shifted, 'subtract_same_value_from_both_sides', `Subtract ${k} from both sides.`));
    referenceSteps.push(step(shifted, isolated, 'divide_both_sides', `Divide both sides by the positive coefficient ${a}.`));
  }
  referenceSteps.push(step(isolated, `${sum('x', -h)} = ${radius} or ${sum('x', -h)} = ${-radius}`, 'absolute_value_cases', 'A positive absolute value has a positive and a negative case.'));
  referenceSteps.push(step(referenceSteps.at(-1).after, `x = ${h - radius} or x = ${h + radius}`, 'solve_each_case', 'Isolate x in both cases.'));
  return { input, task: 'Find all real solutions for x.', expected: solutions([h - radius, h + radius]), referenceSteps,
    intentional_errors: [mistake(isolated, `x = ${h + radius}`, 'lost_absolute_value_case', 'Using only the positive case loses the distinct negative case.')] };
}

const reversed = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };

function inequalities(ctx) {
  const { int, signed, score, magnitude } = ctx;
  const a = int(2, magnitude) * (score >= 400 ? -1 : 1);
  const b = signed(1, magnitude), boundary = signed(1, magnitude);
  const relation = ['<', '<=', '>', '>='][int(0, 3)];
  const resultRelation = a < 0 ? reversed[relation] : relation;
  const rhs = a * boundary + b;
  const input = `${linearExpression(a, b)} ${relation} ${rhs}`;
  const isolated = `${linearExpression(a)} ${relation} ${rhs - b}`;
  const answer = `x ${resultRelation} ${boundary}`;
  return { input, task: 'Solve the inequality for x.',
    expected: { kind: 'inequality', variable: 'x', relation: resultRelation, boundary: String(boundary), expression: answer },
    referenceSteps: [
      step(input, isolated, 'subtract_same_value_from_both_sides', `Subtract ${b} from both sides.`),
      step(isolated, answer, a < 0 ? 'divide_negative_reverse_inequality' : 'divide_positive_inequality', `Divide both sides by ${a}${a < 0 ? ' and reverse the inequality direction' : ''}.`),
    ], intentional_errors: [mistake(isolated, `x ${relation} ${a < 0 ? boundary : boundary + 1}`, a < 0 ? 'inequality_not_reversed' : 'incorrect_division', a < 0 ? 'Dividing by a negative coefficient must reverse the inequality.' : 'The boundary is not the quotient of the two sides.')] };
}

function sequence(ctx, type) {
  const { int, signed, score, magnitude } = ctx;
  const first = signed(1, magnitude), n = int(2, score < 400 ? 5 : 9);
  const change = type === 'arithmetic' ? signed(1, magnitude)
    : int(2, score >= 650 ? 4 : 3) * (score >= 650 && int(0, 1) ? -1 : 1);
  const input = { kind: 'sequence', type, first, [type === 'arithmetic' ? 'step' : 'ratio']: change, n };
  const value = type === 'arithmetic' ? first + (n - 1) * change : first * change ** (n - 1);
  const formula = type === 'arithmetic' ? `${first} + (${n} - 1)*(${change})` : `${first}*(${change})^(${n} - 1)`;
  const substituted = `a_${n} = ${formula}`;
  const wrong = type === 'arithmetic' ? first + n * change : first * change ** n;
  return { input, task: `Find term ${n} of the ${type} sequence (the first term has index 1).`,
    expected: { kind: 'sequence', type, n, value, exact: String(value) },
    referenceSteps: [
      step(input, substituted, `${type}_sequence_formula`, `There are ${n - 1} ${type === 'arithmetic' ? 'additions of the common difference' : 'multiplications by the common ratio'} after the first term.`),
      step(substituted, `a_${n} = ${value}`, 'evaluate_expression', 'Evaluate the substituted nth-term formula.'),
    ], intentional_errors: [mistake(input, `a_${n} = ${wrong}`, 'sequence_off_by_one', 'Using n changes instead of n - 1 shifts the answer by one term.')] };
}

function geometry(ctx, topic) {
  const { int, score, magnitude } = ctx;
  const triple = [[3, 4, 5], [5, 12, 13], [8, 15, 17]][int(0, score < 400 ? 0 : 2)];
  const scale = int(1, score < 400 ? 2 : 5);
  const [a, b, c] = triple.map(value => value * scale);
  let input, before, variable;
  if (topic === 'distance') {
    const x = int(-magnitude, magnitude), y = int(-magnitude, magnitude);
    const dx = a * (int(0, 1) ? 1 : -1), dy = b * (int(0, 1) ? 1 : -1);
    input = { kind: 'geometry', topic, points: [[x, y], [x + dx, y + dy]] };
    before = `d^2 = (${sum(String(x + dx), -x)})^2 + (${sum(String(y + dy), -y)})^2`;
    variable = 'd';
  } else {
    input = { kind: 'geometry', topic, a, b };
    before = `c^2 = ${a}^2 + ${b}^2`;
    variable = 'c';
  }
  const squared = `${variable}^2 = ${c * c}`;
  return { input, task: topic === 'distance' ? 'Find the distance between the two points.' : 'Find the hypotenuse of the right triangle with legs a and b.',
    expected: { kind: 'geometry', topic, value: c, exact: String(c) }, restrictions: [`${variable} >= 0`],
    referenceSteps: [
      step(input, before, topic === 'distance' ? 'distance_formula' : 'pythagorean_theorem', 'The square of the required length is the sum of the two squared perpendicular components.'),
      step(before, squared, 'evaluate_expression', 'Square the components and add them.'),
      step(squared, `${variable} = ${c}`, 'nonnegative_square_root', 'A length is nonnegative, so take the positive square root.'),
    ], intentional_errors: [mistake(input, `${variable} = ${a + b}`, 'adding_perpendicular_lengths', 'Adding perpendicular lengths does not give the straight-line distance or the hypotenuse.')] };
}

const FAMILIES = {
  linear, distribution, quadratic, rational_equation: rationalEquation,
  rational_function: rationalFunction, polynomial_simplification: polynomialSimplification,
  systems: system, exponential, radical, logarithmic, absolute_value: absoluteValue, inequalities,
  arithmetic_sequence: ctx => sequence(ctx, 'arithmetic'),
  geometric_sequence: ctx => sequence(ctx, 'geometric'),
  distance: ctx => geometry(ctx, 'distance'), pythagorean: ctx => geometry(ctx, 'pythagorean'),
};

/** Deterministic templates propose reference paths; only a verifier can accept them. */
export function generateProblem(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Generator options must be an object.');
  }
  const { topic: requestedTopic = 'linear', difficulty = '0.500', seed = 0 } = options;
  const score = difficultyToInt(difficulty);
  if (typeof requestedTopic !== 'string') throw new TypeError('Topic must be a string.');
  const topic = Object.hasOwn(ALIASES, requestedTopic) ? ALIASES[requestedTopic] : requestedTopic;
  const record = TOPICS.find(candidate => candidate.id === topic);
  if (!record) throw new RangeError(`Unknown generator topic: ${requestedTopic}`);
  if (!(typeof seed === 'string' || (typeof seed === 'number' && Number.isFinite(seed)))) {
    throw new TypeError('Seed must be a string or a finite number.');
  }
  const identity = JSON.stringify([topic, difficulty, typeof seed, seed]);
  const fingerprint = hash(identity);
  const random = randomSource(fingerprint);
  const int = (low, high) => low + Math.floor(random() * (high - low + 1));
  const magnitude = 4 + Math.floor(score * 16 / 1000);
  const signed = (low, high) => int(low, high) * (score >= 250 && int(0, 1) ? -1 : 1);
  const generated = FAMILIES[topic]({ int, signed, score, magnitude });
  const estimate = estimateDifficulty(generated.input);
  const problem = typeof generated.input === 'string' ? `${generated.task} ${generated.input}`
    : generated.input.kind === 'system' ? `${generated.task} ${generated.input.equations.join('; ')}`
    : generated.input.kind === 'sequence' ? `${generated.task} First term: ${generated.input.first}; ${generated.input.type === 'arithmetic' ? `common difference: ${generated.input.step}` : `common ratio: ${generated.input.ratio}`}.`
    : topic === 'distance' ? `${generated.task} ${generated.input.points.map(point => `(${point.join(', ')})`).join(' and ')}.`
    : `${generated.task} a = ${generated.input.a}, b = ${generated.input.b}.`;
  // JSON cloning prevents a consumer changing one path from changing another.
  const clone = value => JSON.parse(JSON.stringify(value));
  return {
    id: `${topic}-${difficulty}-${fingerprint.toString(16).padStart(8, '0')}`,
    subject: record.subject, topic, problem, input: clone(generated.input), task: generated.task,
    difficulty,
    features: { ...estimate.features, intended_difficulty_score: score,
      estimated_learning_difficulty: estimate.difficulty, estimated_engine: estimate.engine },
    expected: generated.expected, referenceSteps: clone(generated.referenceSteps),
    restrictions: generated.restrictions ?? [],
    checkpoints: clone(generated.referenceSteps),
    intentional_errors: clone(generated.intentional_errors), seed,
  };
}
