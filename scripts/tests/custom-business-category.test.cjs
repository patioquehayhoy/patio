const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

test('Otro persists the written category alongside selected tags instead of converting it to Fondita', async () => {
  let payload;
  const deps = {
    '@/lib/edge-function-error': {},
    '@/lib/fondita-name': { nombreDisponible: async () => true },
    '@/lib/horario': { deserialize: () => null },
    '@/lib/user-store': { getFonditaId: () => 'own-business' },
    '@/lib/supabase': { supabase: { from: (table) => {
      assert.equal(table, 'fonditas');
      return { update: (value) => { payload = value; return { eq: async (field, id) => {
        assert.equal(field, 'id'); assert.equal(id, 'own-business'); return { error: null };
      } }; } };
    } } },
  };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/smart-setup.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((id) => {
    assert.ok(Object.hasOwn(deps, id), id); return deps[id];
  }, module, module.exports);
  await module.exports.saveSmartSetup({ nombre: 'Tamales Rosa', direccion: '', tipos: ['otro', 'bebidas'], tipo: 'otro', otroGiro: '  tamales   oaxaqueños ', horario: [], pagos: { efectivo: true, transferencia: false, tarjeta: false } });
  assert.equal(payload.tipo_negocio, 'otro');
  assert.deepEqual(payload.categorias, ['Tamales oaxaqueños', 'Bebidas']);
});
