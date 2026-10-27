const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const query = require('query-string');

test('patched query-string preserves spaces, accents, repeated fields and callback credentials', () => {
  const parsed = query.parse('q=chile+relleno&nombre=Do%C3%B1a%20Rosa&tag=tacos&tag=elotes&code=abc_123&token_hash=a%2Bb');
  assert.deepEqual({ ...parsed }, { q: 'chile relleno', nombre: 'Doña Rosa', tag: ['tacos', 'elotes'], code: 'abc_123', token_hash: 'a+b' });
  assert.equal(query.parse(query.stringify({ q: '¿Qué hay hoy?', url: 'patio://patio/123' })).q, '¿Qué hay hoy?');
});
test('malformed percent-encoded input finishes within a bounded child process', () => {
  const child = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const query = require('query-string');
    const value = '%FF'.repeat(10000) + '%41';
    const decoded = query.parse('q=' + value).q;
    assert.equal(decoded, '%FF'.repeat(10000) + 'A');
  `], { cwd: process.cwd(), timeout: 3000, encoding: 'utf8' });
  assert.equal(child.error, undefined);
  assert.equal(child.status, 0, child.stderr);
});
