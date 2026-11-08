const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Contratos sin conexión de las migraciones del 1 de noviembre: filtro de
// contenido, comentarios guardados, perfil privado y reglas de identidad.
// El comportamiento real de RLS se ensaya en Supabase.
const read = (name) => fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations', name), 'utf8');
const flat = (sql) => sql.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').toLowerCase();
const moderation = flat(read('20261101130000_content_moderation.sql'));
const moderationTerms = [...read('20261101130000_content_moderation.sql').matchAll(/\('([a-z0-9 ]+)'\)/g)].map((match) => match[1]);
const comments = flat(read('20261101131000_review_comments.sql'));
const privacy = flat(read('20261101132000_private_profiles.sql'));
const identity = flat(read('20261101133000_identity_rules.sql'));
const rename = flat(read('20261101121000_rename_fonditas_to_negocios.sql'));
const stats = flat(read('20261101134000_business_stats.sql'));

test('every public text goes through the content filter on the server', () => {
  for (const table of ['reviews', 'user_profiles', 'collections', 'collection_places', 'negocios', 'menus', 'cartas']) {
    assert.match(moderation, new RegExp(`before insert or update on public\\.${table} for each row`), table);
  }
  assert.match(comments, /perform public\.moderation_assert\(new\.body\)/);
  assert.match(moderation, /raise exception 'content_rejected'/);
  assert.match(moderation, /alter table public\.moderation_terms enable row level security/);
  assert.doesNotMatch(moderation, /create policy[^;]*moderation_terms/);
});

test('the word list blocks insults but not everyday Mexican words or food', () => {
  for (const term of ['pendejo', 'puta', 'mierda', 'joto', 'te voy a matar']) assert.ok(moderationTerms.includes(term), term);
  for (const word of ['pinche', 'chingon', 'cabron', 'panocha', 'concha', 'huevos', 'mamon', 'indio', 'negro']) {
    assert.ok(!moderationTerms.includes(word), `${word} must stay allowed`);
  }
  // La normalización junta letras repetidas: ningún término puede tener tres seguidas.
  assert.ok(moderationTerms.every((term) => !/([a-z])\1\1/.test(term)));
});

test('comments are readable with their review, written only by people with a profile or the owner', () => {
  assert.match(comments, /alter table public\.review_comments enable row level security/);
  assert.match(comments, /for select using \(status = 'published' and exists \(select 1 from public\.reviews r where r\.id = review_id\)\)/);
  assert.match(comments, /as restrictive for select to authenticated using \(not public\.is_blocked_by\(auth\.uid\(\), user_id\)\)/);
  assert.match(comments, /for insert to authenticated with check \( user_id = auth\.uid\(\)/);
  assert.match(comments, /not public\.is_blocked_by\(r\.user_id, auth\.uid\(\)\)/);
  assert.match(comments, /n\.owner_id = auth\.uid\(\)/);
  assert.doesNotMatch(comments, /on public\.review_comments for (all|update)/);
  assert.match(comments, /target_type in \('review', 'profile', 'patio', 'collection', 'comment'\)/);
  assert.match(comments, /social_activity boolean not null default true/);
});

test('private profiles hide lists and follows from strangers and turn follows into requests', () => {
  assert.match(privacy, /check \(status in \('pending', 'accepted'\)\)/);
  assert.match(privacy, /then 'pending' else 'accepted'/);
  assert.match(privacy, /visibility = 'public' and public\.can_view_profile_content\(owner_id\)/);
  assert.match(privacy, /drop policy if exists "follows owned" on public\.profile_follows/);
  assert.match(privacy, /for update to authenticated using \(followed_id = auth\.uid\(\)\) with check \(followed_id = auth\.uid\(\) and status = 'accepted'\)/);
  assert.match(privacy, /new\.follower_id := old\.follower_id/);
  assert.match(privacy, /old\.visibility = 'private' and new\.visibility = 'public'/);
});

test('identity rules: two name changes per 14 days, business type fixed after setup, no phone column', () => {
  assert.match(identity, /interval '14 days'/);
  assert.match(identity, /if recent >= 2 then raise exception 'name_change_limit'/);
  assert.match(identity, /new\.categorias := old\.categorias/);
  assert.match(identity, /not in \('', 'mi fondita'\)/);
  assert.match(identity, /if current_user <> 'authenticated' then return new/);
  assert.match(identity, /before update on public\.user_profiles/);
  assert.match(identity, /drop column if exists telefono/);
});

function loadTs(relative) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../..', relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(() => ({ supabase: {} }), module, module.exports);
  return module.exports;
}

test('the business table is called negocios and every function was rewritten', () => {
  assert.match(rename, /alter table public\.fonditas rename to negocios/);
  for (const table of ['menus', 'cartas', 'menu_sections', 'reviews', 'dish_likes', 'saved_patios', 'collection_places', 'patio_follows', 'publication_events']) {
    assert.match(rename, new RegExp(`alter table public\\.${table} rename column fondita_id to negocio_id`), table);
  }
  for (const fn of ['delete_owned_patios_before_account', 'reply_to_review', 'publish_collection']) assert.match(rename, new RegExp(`function public\\.${fn}`), fn);
  assert.match(rename, /grant execute on function public\.publish_collection\(uuid, text, text, text, uuid\[\]\) to authenticated/);
  // Solo el nombre provisional heredado («Mi Fondita») sigue como dato.
  for (const sql of [moderation, comments, privacy, identity, stats]) assert.doesNotMatch(sql, /fondita_|fonditas\b|fondita\(/);
});

test('public numbers expose totals only, never who saved or liked', () => {
  assert.match(privacy, /returns table \(reviews bigint, likes bigint, followers bigint, following bigint\)/);
  assert.match(stats, /returns table \(saves bigint, dish_likes bigint, reviews bigint\)/);
  assert.match(stats, /security definer/);
});

test('the owner dashboard answers only to the owner and never lists who saved', () => {
  const insights = flat(read('20261102100000_business_insights.sql'));
  assert.match(insights, /n\.owner_id = auth\.uid\(\)/);
  assert.match(insights, /revoke all on function public\.business_insights\(uuid\) from public, anon/);
  assert.doesNotMatch(insights, /select s\.user_id|array_agg\(s\.user_id/);
});

test('the name lock date is shown before typing, from the two most recent changes', () => {
  const { nameLockEnd } = loadTs('lib/name-changes.ts');
  const now = Date.parse('2026-11-10T12:00:00Z');
  assert.equal(nameLockEnd(['2026-11-05T12:00:00Z'], now), null);
  const until = nameLockEnd(['2026-11-01T12:00:00Z', '2026-11-08T12:00:00Z', '2026-10-01T00:00:00Z'], now);
  assert.equal(until.toISOString(), '2026-11-15T12:00:00.000Z');
});

test('server refusals become plain messages instead of a connection error', () => {
  const safety = loadTs('lib/content-safety.ts');
  assert.equal(safety.writeErrorMessage({ message: 'CONTENT_REJECTED' }, 'x'), safety.CONTENT_REJECTED_MESSAGE);
  assert.equal(safety.writeErrorMessage({ message: 'NAME_CHANGE_LIMIT' }, 'x'), safety.NAME_CHANGE_LIMIT_MESSAGE);
  assert.equal(safety.writeErrorMessage(new Error('Offline'), 'Revisa tu conexión'), 'Revisa tu conexión');
});

test('tapping an alert only opens known screens', () => {
  const { routeForNotification } = loadTs('lib/notification-routes.ts');
  assert.deepEqual(routeForNotification({ type: 'follow_request' }), { pathname: '/notificaciones' });
  assert.deepEqual(routeForNotification({ type: 'review_comment', patioId: 'p1' }), { pathname: '/patio/[id]', params: { id: 'p1' } });
  assert.deepEqual(routeForNotification({ type: 'visit_review', patioId: 'p1' }), { pathname: '/resena/[id]', params: { id: 'p1' } });
  assert.deepEqual(routeForNotification({ route: '/historial' }), { pathname: '/historial' });
  assert.equal(routeForNotification({ route: '/perfil-editar' }), null);
  assert.equal(routeForNotification({}), null);
});
