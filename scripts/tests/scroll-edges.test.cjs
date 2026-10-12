/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
function fixture() {
  const slots = []; let cursor = 0; let result; const effects = [];
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: initial }; return [slots[i].value, (value) => { slots[i].value = value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useCallback(callback, deps) { const i = cursor++; if (!slots[i] || deps.some((d, j) => !Object.is(d, slots[i].deps[j]))) slots[i] = { callback, deps }; return slots[i].callback; },
    useLayoutEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((d, j) => !Object.is(d, slots[i][j]))) { slots[i] = deps; effects.push(fn); } },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/use-scroll-edges.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)((id) => { assert.equal(id, 'react'); return react; }, module, module.exports);
  const render = (key = 'default') => { cursor = 0; result = module.exports.useScrollEdges(key); effects.splice(0).forEach((fn) => fn()); return result; };
  return { render };
}
const scroll = (y, content = 600, viewport = 200) => ({ nativeEvent: { contentOffset: { y }, contentSize: { height: content }, layoutMeasurement: { height: viewport } } });

test('scroll fade indicates only hidden content and clears at both ends, including bounce', () => {
  const f = fixture(); let e = f.render();
  assert.equal(e.top, false); assert.equal(e.bottom, false);
  e.onLayout({ nativeEvent: { layout: { height: 200 } } }); e.onContentSizeChange(300, 600); e = f.render();
  assert.equal(e.top, false); assert.equal(e.bottom, true);
  e.onScroll(scroll(120)); e = f.render(); assert.equal(e.top, true); assert.equal(e.bottom, true);
  e.onScroll(scroll(500)); e = f.render(); assert.equal(e.top, true); assert.equal(e.bottom, false);
  e.onScroll(scroll(-40)); e = f.render(); assert.equal(e.top, false); assert.equal(e.bottom, true);
  e.onContentSizeChange(300, 100); e = f.render(); assert.equal(e.top, false); assert.equal(e.bottom, false);
});

test('new native scroll views reset metrics and ignore stale callbacks from the old view', () => {
  const f = fixture(); const old = f.render('first'); old.onScroll(scroll(120));
  assert.equal(f.render('first').top, true);
  let next = f.render('second'); assert.equal(next.top, false); assert.equal(next.bottom, false);
  old.onScroll(scroll(300)); old.onContentSizeChange(300, 900); next = f.render('second');
  assert.equal(next.top, false); assert.equal(next.bottom, false);
  next.onScroll(scroll(0, 400, 200)); next = f.render('second'); assert.equal(next.top, false); assert.equal(next.bottom, true);
});
