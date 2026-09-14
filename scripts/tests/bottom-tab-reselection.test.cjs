const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

test('the selected bottom tab does not replace its own route', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../..', 'components/bottom-tab-bar.tsx'), 'utf8');
  const handler = source.slice(source.indexOf('const onTabPress'), source.indexOf('return (', source.indexOf('const onTabPress')));
  assert.match(handler, /if \(active\) return;[\s\S]*router\.replace/);
  assert.ok(handler.indexOf('if (active) return;') < handler.indexOf('router.replace'));
});
