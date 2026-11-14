import test from 'node:test';
import assert from 'node:assert/strict';
import { solveGeometry, parseGeometry, verifyGeometryProof, verifyGeometryCertificate } from '../engine/geometry.js';

const solve = (topic, fields = {}) => solveGeometry({ kind: 'geometry', topic, ...fields });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-11 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const fact = (predicate, ...args) => ({ predicate, args });
const step = (statement, rule, premises = []) => ({ statement, rule, premises });
const clone = value => JSON.parse(JSON.stringify(value));
const segmentEqual = (a, b, c, d) => fact('segment_equal', a, b, c, d);
const angleEqual = (a, b, c, d, e, f) => fact('angle_equal', a, b, c, d, e, f);
const congruent = (a = ['A', 'B', 'C'], b = ['D', 'E', 'F']) => fact('triangle_congruent', a, b);
const triangles = [fact('triangle', 'A', 'B', 'C'), fact('triangle', 'D', 'E', 'F')];

function assertSolved(output) {
  assert.equal(output.status, 'solved', output.error);
  assert.equal(output.verified, true);
  assert.ok(output.steps.every(s => s.verified === true && s.rule && s.explanation));
  assert.ok(Array.isArray(output.restrictions));
  assert.equal(output.certificate.version, 1);
}

test('circle reports an exact expression and honest approximate values', () => {
  const input = { kind: 'geometry', topic: 'circle', radius: 3 };
  const output = solveGeometry(input);
  assertSolved(output);
  close(output.answer.area.value, 9 * Math.PI);
  close(output.answer.perimeter.value, 6 * Math.PI);
  assert.equal(output.answer.area.exact, 'pi * (3)^2');
  assert.equal(output.answer.area.approximate, true);
  assert.equal(output.certificate.assurance, 'numerical-formula-check');
  assert.equal(verifyGeometryCertificate(input, output), true);
});

test('2D area and perimeter formulas cover rectangles, triangles, trapezoids, and polygons', () => {
  const rectangle = solve('rectangle', { length: 7, width: 4 });
  assertSolved(rectangle); close(rectangle.answer.area.value, 28); close(rectangle.answer.perimeter.value, 22);
  const triangle = solve('triangle', { sides: [3, 4, 5] });
  assertSolved(triangle); close(triangle.answer.area.value, 6); close(triangle.answer.perimeter.value, 12);
  close(solve('triangle_area', { base: 9, height: 2 }).answer.area.value, 9);
  const trapezoid = solve('trapezoid', { base1: 10, base2: 4, height: 4, leg1: 5, leg2: 5 });
  assertSolved(trapezoid); close(trapezoid.answer.area.value, 28); close(trapezoid.answer.perimeter.value, 24);
  const polygon = solve('regular_polygon', { n: 6, side: 2 });
  assertSolved(polygon); close(polygon.answer.area.value, 6 * Math.sqrt(3)); close(polygon.answer.perimeter.value, 12);
});

test('flat topics, shape/operation forms, diameter, and customary aliases', () => {
  close(solve('area', { shape: 'circle', diameter: 8 }).answer.area.value, 16 * Math.PI);
  close(solve('circle_circumference', { radius: 4 }).answer.perimeter.value, 8 * Math.PI);
  close(solve('regular-polygon-area', { n: 4, sideLength: 2 }).answer.area.value, 4);
  close(solve('trapezium', { operation: 'area', base1: 3, base2: 5, height: 2 }).answer.area.value, 8);
  assert.equal(solve('circle', { radius: 3, diameter: 8 }).status, 'invalid');
});

test('solid formulas include closed surfaces and explicit assumptions', () => {
  const sphere = solve('sphere', { radius: 3 });
  assertSolved(sphere); close(sphere.answer.volume.value, 36 * Math.PI); close(sphere.answer.surfaceArea.value, 36 * Math.PI);
  const cylinder = solve('cylinder', { radius: 2, height: 5 });
  assertSolved(cylinder); close(cylinder.answer.volume.value, 20 * Math.PI); close(cylinder.answer.surfaceArea.value, 28 * Math.PI);
  assert.match(cylinder.restrictions[0], /right circular/);
  const cone = solve('cone', { radius: 3, height: 4 });
  assertSolved(cone); close(cone.answer.volume.value, 12 * Math.PI); close(cone.answer.surfaceArea.value, 24 * Math.PI);
  const prism = solve('prism', { baseArea: 6, basePerimeter: 12, height: 10 });
  assertSolved(prism); close(prism.answer.volume.value, 60); close(prism.answer.surfaceArea.value, 132);
  const box = solve('prism', { length: 2, width: 3, height: 4 });
  close(box.answer.volume.value, 24); close(box.answer.surfaceArea.value, 52);
  close(solve('prism_volume', { baseArea: 6, height: 10 }).answer.volume.value, 60);
  assert.equal(solve('prism_surface_area', { baseArea: 100, basePerimeter: 1, height: 2 }).status, 'invalid');
});

test('triangle angle sum and missing Pythagorean legs or hypotenuse', () => {
  const angles = solve('triangle_angles', { angles: [50, null, 70] });
  assertSolved(angles); assert.equal(angles.answer.missingIndex, 1); close(angles.answer.angles[1].value, 60);
  assert.equal(angles.answer.angles[1].unit, 'degrees');
  assertSolved(solve('triangle', { operation: 'angles', angles: [60, 60, 60] }));
  assertSolved(solve('triangle_angles', { angles: [0.1, 0.2, 179.7] }));
  const hyp = solve('pythagoras', { a: 3, b: 4 });
  assertSolved(hyp); assert.equal(hyp.answer.missing, 'c'); close(hyp.answer.side.value, 5);
  close(solve('pythagoras', { b: 4, c: 5 }).answer.side.value, 3);
  close(solve('pythagoras', { a: 3, c: 5 }).answer.side.value, 4);
  assert.match(hyp.answer.side.exact, /^sqrt/);
  assert.ok(hyp.restrictions.length);
});

test('coordinates support vertical, horizontal, coincident points and exact equations', () => {
  const points = [[-1, -2], [2, 2]];
  close(solve('distance', { points }).answer.distance.value, 5);
  const midpoint = solve('midpoint', { points });
  assert.deepEqual(midpoint.answer.midpoint.map(m => m.value), [0.5, 0]);
  close(solve('slope', { points }).answer.slope.value, 4 / 3);
  const vertical = solve('slope', { p1: { x: 2, y: 1 }, p2: { x: 2, y: 5 } });
  assertSolved(vertical); assert.equal(vertical.answer.vertical, true); assert.equal(vertical.answer.slope, null);
  const line = solve('line', { points: [[2, 1], [2, 5]] });
  assertSolved(line); assert.equal(line.answer.form, 'point-normal'); assert.equal(line.answer.vertical, true);
  assert.deepEqual(line.answer.normal.map(m => m.value), [4, 0]);
  assert.equal(solve('slope', { points: [[1, 1], [1, 1]] }).status, 'invalid');
  assert.equal(solve('line', { points: [[1, 1], [1, 1]] }).status, 'invalid');
  close(solve('distance', { points: [[1, 1], [1, 1]] }).answer.distance.value, 0);
  assertSolved(solve('midpoint', { points: [[1e308, 1e308], [1e308, 1e308]] }));
});

test('circle equations, similarity and conditional angle relationships', () => {
  const circle = solve('circle_equation', { center: [-2, 4], radius: 5 });
  assertSolved(circle); close(circle.answer.radiusSquared.value, 25);
  assert.equal(circle.answer.equation, '(x - (-2))^2 + (y - (4))^2 = (5)^2');
  const sim = solve('similarity', { knownOriginal: 4, knownImage: 10, originalLength: 6 });
  assertSolved(sim); close(sim.answer.length.value, 15); close(sim.answer.areaFactor.value, 6.25); close(sim.answer.volumeFactor.value, 15.625);
  close(solve('similarity', { scaleFactor: 2, side: 3 }).answer.length.value, 6);
  close(solve('angles', { relationship: 'complementary', angle: 30 }).answer.angle.value, 60);
  close(solve('angles', { relationship: 'supplementary', angle: 30 }).answer.angle.value, 150);
  close(solve('angles', { relationship: 'corresponding', angle: 30, parallel: true }).answer.angle.value, 30);
  close(solve('angles', { relationship: 'same_side_interior', angle: 30, parallel: true }).answer.angle.value, 150);
  assert.equal(solve('angles', { relationship: 'corresponding', angle: 30 }).status, 'invalid');
  assert.equal(solve('angles', { relationship: 'complementary', angle: 100 }).status, 'invalid');
});

test('invalid dimensions, degenerate triangles, unknown and malformed input', () => {
  for (const fields of [{ radius: 0 }, { radius: -1 }, { radius: NaN }, { radius: Infinity }, { radius: '3' }, {}]) assert.equal(solve('circle_area', fields).status, 'invalid');
  for (const sides of [[1, 2, 3], [1, 1, 5], [0, 1, 1], [-1, 2, 2], [3, 4], [3, 4, Infinity]]) assert.equal(solve('triangle_area', { sides }).status, 'invalid');
  for (const angles of [[90, 90, null], [60, null, null], [0, 90, 90], [60, 60, 61], [180, null, 5]]) assert.equal(solve('triangle_angles', { angles }).status, 'invalid');
  for (const fields of [{ a: 3, b: 4, c: 5 }, { a: 3 }, { a: 5, c: 4 }, { a: 5, c: 5 }]) assert.equal(solve('pythagoras', fields).status, 'invalid');
  assert.equal(solve('regular_polygon', { n: 2, side: 1 }).status, 'invalid');
  assert.equal(solve('regular_polygon', { n: 3.2, side: 1 }).status, 'invalid');
  assert.equal(solve('trapezoid', { base1: 10, base2: 4, height: 4, leg1: 2, leg2: 5 }).status, 'invalid');
  assert.equal(solve('trapezoid', { base1: 10, base2: 4, height: 4, leg1: 4, leg2: 4 }).status, 'invalid');
  assert.equal(solve('circle_area', { radius: 1e308 }).status, 'invalid');
  assert.equal(solve('coordinate_distance', { points: [[0, 0], [1, NaN]] }).status, 'invalid');
  assert.equal(solve('rectangle', { length: 3, width: 4, operation: 'volume' }).status, 'invalid');
  assert.equal(solve('hyperbolic_geometry', {}).status, 'unsupported');
  assert.equal(solveGeometry({ kind: 'algebra', topic: 'circle' }).status, 'unsupported');
  assert.equal(solveGeometry(null).status, 'invalid');
  assert.equal(solveGeometry([]).status, 'invalid');
  assert.equal(solveGeometry('prove everything about this diagram').status, 'unsupported');
});

test('decimal degeneracy is checked exactly and finite extreme triangles remain computable', () => {
  for (const sides of [[0.1, 0.2, 0.3], [0.1, 0.2, 0.30000000000000004]]) assert.equal(solve('triangle_area', { sides }).status, 'invalid');
  assertSolved(solve('triangle_area', { sides: [0.1, 0.2, 0.29999999999999993] }));
  for (const size of [1e-100, 1e100]) {
    const output = solve('triangle_area', { sides: [size, size, size] });
    assertSolved(output);
    close(output.answer.area.value / size / size, Math.sqrt(3) / 4);
  }
  const leg = solve('pythagoras', { a: 5e307, c: 1e308 });
  assertSolved(leg); close(leg.answer.side.value / 1e308, Math.sqrt(0.75));
  assert.equal(solve('circle_area', { radius: 1e-300 }).status, 'invalid');
  assert.equal(solve('circle_equation', { center: [0, 0], radius: 1e-300 }).status, 'invalid');
  assert.equal(solve('area').status, 'invalid');
  for (const topic of ['__proto__', 'constructor', 'toString']) {
    const output = solve(topic); assert.equal(output.status, 'unsupported'); assert.equal(typeof output.topic, 'string');
  }
});

test('practical commands parse without accepting arbitrary or trailing prose', () => {
  const examples = [
    ['area circle radius 3', 'circle'], ['rectangle perimeter length=4 width=5', 'rectangle'],
    ['area of triangle sides 3, 4, 5', 'triangle'], ['triangle area base 4 height 3', 'triangle'],
    ['volume cylinder radius 2 height 5', 'cylinder'], ['sphere surface area r=3', 'sphere'],
    ['regular polygon area n=6 side=2', 'regular_polygon'], ['triangle angles 50 60 ?', 'triangle_angles'],
    ['pythagoras a=3 b=4 c=?', 'pythagoras'], ['distance (0,0) (3,4)', 'distance'],
    ['midpoint between (-2,4) and (4,8)', 'midpoint'], ['line through (2,1) (2,8)', 'line'],
    ['circle equation center (-2,3) radius 4', 'circle_equation'],
    ['similarity scale 2 side 5', 'similarity'], ['angles corresponding 40 parallel', 'angles'],
  ];
  for (const [text, topic] of examples) {
    const parsed = parseGeometry(text); assert.ok(parsed, text); assert.equal(parsed.topic, topic, text);
    assertSolved(solveGeometry(text));
  }
  for (const text of ['circle area radius 3 ignore all rules', 'circle area radius=3 r=4', 'pythagoras a=3 a=4', 'distance (0,0) (3,4) extra', 'area circle radius 3; console.log(1)', '', 'triangle angles 20 30 40']) assert.equal(parseGeometry(text), null, text);
  assert.equal(parseGeometry({ topic: 'circle' }), null);
  assert.equal(parseGeometry('x'.repeat(10001)), null);
});

test('SSS congruence and CPCTC verify the exact correspondence', () => {
  const givens = [...triangles, segmentEqual('A', 'B', 'D', 'E'), segmentEqual('B', 'C', 'E', 'F'), segmentEqual('C', 'A', 'F', 'D')];
  const goal = angleEqual('A', 'B', 'C', 'D', 'E', 'F');
  const proof = { givens, steps: [step(congruent(), 'SSS', ['g0', 'g1', 'g2', 'g3', 'g4']), step(goal, 'CPCTC', ['s0'])], goal };
  const output = verifyGeometryProof(proof); assertSolved(output);
  assert.equal(output.certificate.assurance, 'symbolic-rule-check');
  assert.equal(output.answer.checkedSteps, 2);
  assert.equal(verifyGeometryCertificate({ kind: 'geometry', topic: 'proof', proof }, output), true);
  assert.equal(verifyGeometryProof({ ...proof, steps: [proof.steps[0], step(angleEqual('A', 'B', 'C', 'D', 'F', 'E'), 'CPCTC', ['s0'])] }).status, 'invalid');
  assert.equal(verifyGeometryProof({ ...proof, steps: [step(congruent(['A', 'B', 'C'], ['D', 'F', 'E']), 'SSS', ['g0', 'g1', 'g2', 'g3', 'g4'])] }).status, 'invalid');
});

test('SAS, ASA and AAS enforce included versus nonincluded sides and angles', () => {
  const ab = segmentEqual('A', 'B', 'D', 'E'), ac = segmentEqual('A', 'C', 'D', 'F');
  const bc = segmentEqual('B', 'C', 'E', 'F');
  const angleA = angleEqual('B', 'A', 'C', 'E', 'D', 'F'), angleB = angleEqual('A', 'B', 'C', 'D', 'E', 'F');
  const check = (rule, evidence) => {
    const givens = [...triangles, ...evidence];
    return verifyGeometryProof({ givens, steps: [step(congruent(), rule, givens.map((_, i) => `g${i}`))], goal: congruent() });
  };
  assertSolved(check('SAS', [ab, ac, angleA]));
  assert.equal(check('SAS', [ab, bc, angleA]).status, 'invalid'); // SSA is not SAS.
  assertSolved(check('ASA', [angleA, angleB, ab]));
  assert.equal(check('ASA', [angleA, angleB, ac]).status, 'invalid');
  assertSolved(check('AAS', [angleA, angleB, ac]));
  assert.equal(check('AAS', [angleA, angleB, ab]).status, 'invalid');
  assert.equal(check('AAA', [angleA, angleB, angleEqual('A', 'C', 'B', 'D', 'F', 'E')]).status, 'invalid');
});

test('midpoint, reflexive and transitive rules derive only justified statements', () => {
  const mid = fact('midpoint', 'M', 'A', 'B'), halves = segmentEqual('A', 'M', 'M', 'B');
  assertSolved(verifyGeometryProof({ givens: [mid], steps: [step(halves, 'midpoint_definition', ['g0'])], goal: halves }));
  const between = fact('between', 'A', 'M', 'B');
  assertSolved(verifyGeometryProof({ givens: [mid], steps: [step(between, 'midpoint_definition', ['g0'])], goal: between }));
  assertSolved(verifyGeometryProof({ givens: [between, halves], steps: [step(mid, 'midpoint_converse', ['g0', 'g1'])], goal: mid }));
  assert.equal(verifyGeometryProof({ givens: [halves], steps: [step(mid, 'midpoint_converse', ['g0'])], goal: mid }).status, 'invalid');
  const reflexive = segmentEqual('A', 'B', 'B', 'A');
  assertSolved(verifyGeometryProof({ givens: [], steps: [step(reflexive, 'reflexive')], goal: reflexive }));
  const wrong = segmentEqual('A', 'B', 'A', 'C');
  assert.equal(verifyGeometryProof({ givens: [], steps: [step(wrong, 'reflexive')], goal: wrong }).status, 'invalid');
  const p = segmentEqual('A', 'B', 'C', 'D'), q = segmentEqual('D', 'C', 'E', 'F'), goal = segmentEqual('B', 'A', 'F', 'E');
  assertSolved(verifyGeometryProof({ givens: [p, q], steps: [step(goal, 'transitive', ['g0', 'g1'])], goal }));
  assert.equal(verifyGeometryProof({ givens: [p], steps: [step(goal, 'transitive', ['g0'])], goal }).status, 'invalid');
});

test('parallel angle theorems require both parallel lines and explicit position facts', () => {
  const parallel = fact('parallel', 'A', 'B', 'C', 'D');
  const args = [['E', 'A', 'B'], ['F', 'C', 'D'], ['A', 'B'], ['C', 'D']];
  const equal = angleEqual(...args[0], ...args[1]);
  for (const rule of ['alternate_interior_angles', 'alternate_exterior_angles', 'corresponding_angles']) {
    const position = fact(rule, ...args);
    const proof = { givens: [parallel, position], steps: [step(equal, rule, ['g0', 'g1'])], goal: equal };
    assertSolved(verifyGeometryProof(proof));
    assert.equal(verifyGeometryProof({ ...proof, steps: [step(equal, rule, ['g0'])] }).status, 'invalid');
    assert.equal(verifyGeometryProof({ ...proof, steps: [step(equal, rule, ['g1'])] }).status, 'invalid');
    assertSolved(verifyGeometryProof({ givens: [position, equal], steps: [step(parallel, `${rule}_converse`, ['g0', 'g1'])], goal: parallel }));
  }
  const sameSide = fact('same_side_interior_angles', ...args), supplementary = fact('supplementary', args[0], args[1]);
  assertSolved(verifyGeometryProof({ givens: [parallel, sameSide], steps: [step(supplementary, 'same_side_interior_angles', ['g0', 'g1'])], goal: supplementary }));
  assert.equal(verifyGeometryProof({ givens: [parallel, sameSide], steps: [step(equal, 'same_side_interior_angles', ['g0', 'g1'])], goal: equal }).status, 'invalid');
});

test('vertical angles, linear pairs and right angle congruence use explicit facts', () => {
  const a = ['A', 'O', 'B'], b = ['C', 'O', 'D'];
  const equal = angleEqual(...a, ...b);
  assertSolved(verifyGeometryProof({ givens: [fact('vertical_angles', a, b)], steps: [step(equal, 'vertical_angles', [0])], goal: equal }));
  const supp = fact('supplementary', a, b);
  assertSolved(verifyGeometryProof({ givens: [fact('linear_pair', a, b)], steps: [step(supp, 'linear_pair', ['given:0'])], goal: supp }));
  assertSolved(verifyGeometryProof({ givens: [fact('right_angle', ...a), fact('right_angle', ...b)], steps: [step(equal, 'right_angles_congruent', [0, 1])], goal: equal }));
});

test('proof premise resolution rejects future, invented, omitted or circular evidence', () => {
  const p = segmentEqual('A', 'B', 'C', 'D'), wrong = segmentEqual('A', 'B', 'E', 'F');
  for (const premises of [['s0'], ['s1'], ['g99'], [-1], [99], [wrong], ['g0junk'], ['__proto__']]) {
    assert.equal(verifyGeometryProof({ givens: [p], steps: [step(p, 'given', premises)], goal: p }).status, 'invalid', JSON.stringify(premises));
  }
  assertSolved(verifyGeometryProof({ givens: [p], steps: [step(p, 'given', [p])], goal: p }));
  assert.equal(verifyGeometryProof({ givens: [p], steps: [step(wrong, 'obvious from picture', ['g0'])], goal: wrong }).status, 'invalid');
  assert.equal(verifyGeometryProof({ givens: [p], steps: [step(wrong, 'given', ['g0'])], goal: wrong }).status, 'invalid');
  assert.equal(verifyGeometryProof({ givens: [p], steps: [], goal: wrong }).status, 'invalid');
  assertSolved(verifyGeometryProof({ givens: [p], steps: [], goal: p }));
});

test('proof schemas reject degenerate triangles, unknown predicates, contradictions and missing hypotheses', () => {
  const malformed = [null, {}, { givens: [], steps: [], goal: fact('triangle', 'A', 'A', 'B') }, { givens: [fact('magic', 'A')], steps: [], goal: fact('magic', 'A') }];
  for (const proof of malformed) assert.equal(verifyGeometryProof(proof).status, 'invalid');
  assert.equal(verifyGeometryProof({ givens: [fact('triangle', 'A', 'B', 'C'), fact('collinear', 'C', 'B', 'A')], steps: [], goal: fact('triangle', 'A', 'B', 'C') }).status, 'invalid');
  const edges = [segmentEqual('A', 'B', 'D', 'E'), segmentEqual('B', 'C', 'E', 'F'), segmentEqual('C', 'A', 'F', 'D')];
  assert.equal(verifyGeometryProof({ givens: edges, steps: [step(congruent(), 'SSS', [0, 1, 2])], goal: congruent() }).status, 'invalid');
  assert.equal(verifyGeometryProof({ givens: [fact('parallel', 'A', 'B', 'B', 'A')], steps: [], goal: fact('parallel', 'A', 'B', 'B', 'A') }).status, 'invalid');
});

test('triangle equivalence preserves simultaneous vertex order and CPCTC side mapping', () => {
  const given = congruent();
  const goal = congruent(['E', 'D', 'F'], ['B', 'A', 'C']);
  assertSolved(verifyGeometryProof({ givens: [given], steps: [], goal }));
  const side = segmentEqual('C', 'B', 'F', 'E');
  assertSolved(verifyGeometryProof({ givens: [given], steps: [step(side, 'CPCTC', [given])], goal: side }));
  assert.equal(verifyGeometryProof({ givens: [given], steps: [], goal: congruent(['A', 'B', 'C'], ['E', 'D', 'F']) }).status, 'invalid');
});

test('certificates reject forged answers, explanations, exactness, evidence and metadata', () => {
  const input = { kind: 'geometry', topic: 'triangle', sides: [3, 4, 5] };
  const output = solveGeometry(input);
  assert.equal(verifyGeometryCertificate(input, clone(output)), true);
  for (const mutate of [
    r => { r.answer.area.value = 7; }, r => { r.answer.area.exact = '7'; },
    r => { r.answer.area.approximate = false; }, r => { r.steps[0].verified = false; },
    r => { r.steps[0].explanation = 'trust me'; }, r => { r.steps = []; },
    r => { r.certificate.version = 999; }, r => { r.verified = false; },
    r => { r.answer.extra = 1; }, r => { r.restrictions.push('forged'); },
  ]) { const forged = clone(output); mutate(forged); assert.equal(verifyGeometryCertificate(input, forged), false); }
  const rounded = clone(output); rounded.answer.area.value += 1e-13;
  assert.equal(verifyGeometryCertificate(input, rounded), true);
  assert.equal(verifyGeometryCertificate({ ...input, sides: [5, 12, 13] }, output), false);
  assert.equal(verifyGeometryCertificate(input, null), false);
  assert.equal(verifyGeometryCertificate(input, { status: 'solved', verified: true }), false);
  assert.equal(verifyGeometryCertificate({ kind: 'geometry', topic: 'unknown' }, solve('unknown')), false);
});

test('proof certificates recheck rules and numeric tolerance never applies to input evidence', () => {
  const goal = segmentEqual('A', 'B', 'B', 'A');
  const input = { kind: 'geometry', topic: 'proof', givens: [], steps: [step(goal, 'reflexive')], goal };
  const output = solveGeometry(input); assertSolved(output);
  const forged = clone(output); forged.steps[0].rule = 'SSS';
  assert.equal(verifyGeometryCertificate(input, forged), false);
  const changed = clone(input); changed.steps[0].statement = segmentEqual('A', 'B', 'A', 'C');
  assert.equal(verifyGeometryCertificate(changed, output), false);
  const dimensions = { kind: 'geometry', topic: 'circle_area', radius: 3, metadata: { approximate: true, exact: '1', value: 1 } };
  const withMetadata = clone(solveGeometry(dimensions));
  withMetadata.steps[0].before.metadata.value += 1e-13;
  assert.equal(verifyGeometryCertificate(dimensions, withMetadata), false);
  const zero = { kind: 'geometry', topic: 'slope', points: [[0, 0], [1, 0]] };
  const badZero = clone(solveGeometry(zero)); badZero.answer.slope.value = 1e-100;
  assert.equal(verifyGeometryCertificate(zero, badZero), false);
});

test('solver is deterministic and leaves structured inputs unchanged', () => {
  const input = { kind: 'geometry', topic: 'distance', points: [[1.5, -3], [5, 2]] };
  const snapshot = clone(input);
  Object.freeze(input.points[0]); Object.freeze(input.points[1]); Object.freeze(input.points); Object.freeze(input);
  assert.deepEqual(solveGeometry(input), solveGeometry(input));
  assert.deepEqual(input, snapshot);
});
