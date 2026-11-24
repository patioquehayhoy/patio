/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Equipo, fase 1 (docs/SUCURSALES_Y_EQUIPO_2026-11-23.md). El comportamiento
// de permisos se ensayó en PostgreSQL con una transacción revertida
// (dueño, administradora, extraño, quitar y volver a intentar); aquí se
// cuida que el contrato no se afloje sin querer.
const root = path.resolve(__dirname, '../..');
function load(relative) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(() => ({ supabase: {} }), module, module.exports);
  return module.exports;
}
const team = load('lib/team.ts');
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261124090000_equipo.sql'), 'utf8')
  .replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').toLowerCase();

test('the activity log says what happened with the person name, never «Tú»', () => {
  assert.equal(team.describeActivity({ action: 'publico_menu', detail: {} }), 'publicó el menú');
  assert.equal(team.describeActivity({ action: 'se_acabo', detail: { platillo: 'Alitas BBQ' } }), 'marcó Se acabó: Alitas BBQ');
  assert.equal(team.describeActivity({ action: 'edito_negocio', detail: { campos: ['horario', 'horario_semanal', 'logo_url'] } }), 'cambió el horario y el logo');
  assert.equal(team.describeActivity({ action: 'quito_del_equipo', detail: { persona: 'Luis' } }), 'quitó del equipo a Luis');
  assert.equal(team.describeActivity({ action: 'algo_nuevo', detail: {} }), 'hizo un cambio');
  for (const action of ['publico_menu', 'se_acabo', 'aviso', 'invito', 'entro_al_equipo']) {
    assert.doesNotMatch(team.describeActivity({ action, detail: {} }), /\btú\b/i);
  }
});

test('times read like iOS in Mexico City and group by local day', () => {
  assert.equal(team.activityTime('2026-11-23T19:05:00Z'), '1:05 p. m.');
  assert.equal(team.activityTime('2026-11-23T15:00:00Z'), '9:00 a. m.');
  assert.equal(team.activityDay('2026-11-24T03:00:00Z'), '2026-11-23');
});

test('the team list puts the primary owner first and invitations last', () => {
  const sorted = team.sortTeam([
    { kind: 'invite', id: 'i', email: 'a@b.mx', role: 'administrador', since: '2026-11-01', expiresAt: '2026-11-08' },
    { kind: 'person', id: 'x', userId: 'x', name: 'Ana', email: null, role: 'administrador', principal: false, since: '2026-10-01' },
    { kind: 'person', id: 'p', userId: 'p', name: 'Doña Mary', email: null, role: 'propietario', principal: true, since: '2026-12-01' },
    { kind: 'person', id: 'o', userId: 'o', name: 'Socio', email: null, role: 'propietario', principal: false, since: '2026-11-01' },
  ]);
  assert.deepEqual(sorted.map((entry) => entry.id), ['p', 'o', 'x', 'i']);
});

test('the invitation message says what to do and with which email', () => {
  const message = team.inviteMessage('Fonda Doña Mary', ' Hija@Correo.MX ');
  assert.match(message, /Fonda Doña Mary/);
  assert.match(message, /hija@correo\.mx/);
  assert.match(message, /Publicar lo que preparo/);
  assert.equal(team.isValidEmail('hija@correo.mx'), true);
  assert.equal(team.isValidEmail('hija@correo'), false);
});

test('writing requires puede(); reading only lists the person own places', () => {
  assert.match(sql, /create policy "team adds menus" on public\.menus for insert to authenticated with check \(public\.puede\(negocio_id, 'operar'\)\)/);
  assert.match(sql, /create policy "team changes the carta" on public\.cartas for update to authenticated using \(public\.puede\(negocio_id, 'carta'\)\)/);
  assert.match(sql, /create policy "owners delete their patio" on public\.negocios for delete to authenticated using \(owner_id = auth\.uid\(\)\)/);
  assert.doesNotMatch(sql, /for all to authenticated/);
  assert.match(sql, /revoke all on function public\.puede_persona\(uuid, uuid, text\) from public, anon, authenticated/);
  for (const table of ['marcas', 'equipo', 'invitaciones', 'registro_actividad', 'marcas_reservadas']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.doesNotMatch(sql, new RegExp(`create policy [^;]* on public\\.${table} `));
  }
});

test('only managers see emails and the log; payment stays with the primary owner', () => {
  assert.match(sql, /p_accion <> 'pago'/);
  assert.match(sql, /when 'equipo' then e\.rol = 'propietario'/);
  assert.match(sql, /ve_correos boolean := public\.puede\(p_negocio, 'equipo'\)/);
  assert.match(sql, /function public\.registro_del_negocio[\s\S]*?if not public\.puede\(p_negocio, 'equipo'\)/);
});

test('only the identical name of a reserved brand is blocked', () => {
  assert.match(sql, /raise exception 'reserved_name'/);
  assert.match(sql, /r\.nombre_normalizado = public\.nombre_normalizado\(new\.nombre\)/);
  assert.match(sql, /'starbucks'/);
  assert.doesNotMatch(sql, /'el portón'|'la casa de toño'/);
  assert.doesNotMatch(sql, / i?like '|similarity\(|levenshtein\(/);
});
