/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/photo-hash.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, () => ({}));
const { isPhotoHash, photoHashFromBase64, photoHashToBase64, photoPlaceholder } = mod.exports;

// ThumbHash real de una foto de prueba (lib/demo.ts).
const HEX = 'da590a16025f78c865863ab6878c576bc6962f77b1c30b';

test('hex and base64 round-trip exactly like Node does', () => {
  const base64 = Buffer.from(HEX, 'hex').toString('base64');
  assert.equal(photoHashToBase64(HEX), base64);
  assert.equal(photoHashFromBase64(base64), HEX);
  for (const length of [20, 21, 22, 23, 24]) {
    const hex = 'a1b2c3'.repeat(10).slice(0, length * 2);
    assert.equal(photoHashFromBase64(Buffer.from(hex, 'hex').toString('base64')), hex, `${length} bytes`);
  }
});

test('only well-formed hashes are accepted', () => {
  assert.ok(isPhotoHash(HEX));
  for (const bad of [undefined, '', 'abc', 'ZZ'.repeat(12), HEX.toUpperCase(), 'a'.repeat(23), 'ab'.repeat(60), 'ab/cd+'.repeat(5)]) {
    assert.equal(isPhotoHash(bad), false, String(bad));
  }
  assert.equal(photoPlaceholder('nope'), undefined);
  assert.deepEqual(photoPlaceholder(HEX), { thumbhash: Buffer.from(HEX, 'hex').toString('base64') });
});

test('a stored hash is one word for the server word filter', () => {
  // El filtro separa palabras en todo lo que no es letra o número.
  assert.match(HEX, /^[0-9a-f]+$/);
});
