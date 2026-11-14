import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pages = ['index.html', 'features.html', 'learn.html', 'about.html', 'contact.html', 'legal.html', 'proof-lab.html'];
const expectedNav = [
  ['Home', 'index.html'],
  ['Features', 'features.html'],
  ['Learn', 'learn.html'],
  ['Proof Lab', 'proof-lab.html'],
  ['About', 'about.html'],
  ['Contact', 'contact.html'],
  ['Start math', 'proof-lab.html'],
];

function read(page) { return readFileSync(resolve(root, page), 'utf8'); }
function links(markup) {
  return [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attrs, label]) => [
    label.replace(/<[^>]*>/g, '').trim(),
    attrs.match(/\bhref="([^"]+)"/)?.[1],
  ]);
}

for (const page of pages) {
  test(`${page} shares the complete Proof Lab navigation and honest product copy`, () => {
    const html = read(page);
    const desktop = html.match(/<nav class="nav">([\s\S]*?)<\/nav>/)?.[1];
    const mobile = html.match(/<div class="mobile-nav"[^>]*>\s*<div class="inner">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(desktop, 'desktop navigation exists');
    assert.ok(mobile, 'mobile navigation exists');
    assert.deepEqual(links(desktop), expectedNav);
    assert.deepEqual(links(mobile), expectedNav);
    if (page !== 'legal.html') {
      assert.match(desktop, new RegExp(`data-nav="${page}"`));
      assert.match(mobile, new RegExp(`data-nav="${page}"`));
    }
    assert.match(html, /<footer class="site-footer">/);
    assert.match(html, /Bring the math\. Show the proof\./);
    assert.match(html, /<a class="btn btn-accent" href="proof-lab\.html">Start math<\/a>/);
    assert.doesNotMatch(html, /\bphysics\b|five modes|math lab/i);
  });
}

test('all local public-page links point to real pages and valid anchors', () => {
  for (const page of pages) {
    for (const [, target] of read(page).matchAll(/\bhref="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:)/.test(target)) continue;
      const [filename, fragment] = target.split('#');
      const destination = filename.split('?')[0] || page;
      assert.ok(existsSync(resolve(root, destination)), `${page}: missing ${target}`);
      if (fragment) assert.match(read(destination), new RegExp(`\\bid="${fragment}"`), `${page}: missing #${fragment}`);
    }
  }
});

test('the former Math Lab URL forwards to Proof Lab', () => {
  const old = read('math-lab.html');
  assert.match(old, /http-equiv="refresh" content="0; url=proof-lab\.html"/);
  assert.match(old, /href="proof-lab\.html"/);
});

test('legacy demos forward into the current proof tool', () => {
  assert.match(read('demo-stepgrader.html'), /http-equiv="refresh" content="0;url=proof-lab\.html#check"/);
  assert.match(read('lab-projectile.html'), /http-equiv="refresh" content="0;url=proof-lab\.html"/);
});
