/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

// La app corta los datos del negocio y la base repite el mismo límite; esta
// prueba evita que digan números distintos.
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('business text limits match between the app and the database', () => {
  const name = Number(/MAX_NOMBRE_LENGTH = (\d+)/.exec(read('lib/fondita-name.ts'))[1]);
  const limits = read('lib/text-limits.ts');
  const migration = read('supabase/migrations/20261102140000_text_limits.sql');
  const value = (key) => Number(new RegExp(`${key}: (\\d+)`).exec(limits)[1]);
  assert.match(migration, new RegExp(`new\\.nombre, ''\\)\\)\\) > ${name}`));
  assert.match(migration, new RegExp(`new\\.descripcion, ''\\)\\) > ${value('businessDescription')}`));
  assert.match(migration, new RegExp(`new\\.direccion, ''\\)\\) > ${value('address')}`));
});
