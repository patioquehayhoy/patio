/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');

// La pantalla de planes promete cupos que solo el servidor hace cumplir; esta
// prueba evita que lib/plans.ts y la base digan números distintos.
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const output = ts.transpileModule(read('lib/plans.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', output)(loaded.exports);
const { PLANS } = loaded.exports;
const migration = read('supabase/migrations/20261102120000_business_pro.sql');
const notices = read('supabase/functions/send-special-notice/index.ts');

test('photo reads per plan match the server quota', () => {
  assert.match(migration, new RegExp(`when public\\.has_pro\\(p_user_id\\) then ${PLANS.pro.photoReads} else ${PLANS.free.photoReads} end`));
});

test('special notices per month match the server quota', () => {
  assert.match(notices, new RegExp(`MONTHLY_NOTICES = ${PLANS.pro.specialNotices};`));
  assert.match(migration, new RegExp(`greatest\\(0, ${PLANS.pro.specialNotices} - `));
});
