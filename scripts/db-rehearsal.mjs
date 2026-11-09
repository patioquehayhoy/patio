// Ensayo de migraciones sin tocar producción: corre todas las migraciones en un
// Postgres embebido (PGlite) con lo mínimo de Supabase (auth, storage, roles) y
// prueba las reglas como personas reales bajo RLS. Uso: npm run db:rehearse
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

const repo = process.argv[2] ?? path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const migrationsDir = path.join(repo, 'supabase/migrations');
const db = new PGlite();

const STUBS = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant anon, authenticated, service_role to postgres;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, is_anonymous boolean default false, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz default now(), created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to service_role;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[], owner uuid, created_at timestamptz default now(), updated_at timestamptz default now());
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid, metadata jsonb, created_at timestamptz default now());
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated, service_role;
create schema extensions;
create publication supabase_realtime;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
-- Tablas base creadas desde el dashboard antes de las migraciones.
create table public.fonditas (id uuid primary key default gen_random_uuid(), telefono text unique, nombre text, created_at timestamptz default now(), descripcion text, tipo_negocio text, direccion text, horario text, pagos_efectivo boolean, pagos_transferencia boolean, pagos_tarjeta boolean);
create table public.menus (id uuid primary key default gen_random_uuid(), fondita_id uuid references public.fonditas(id) on delete cascade, secciones jsonb, fecha date, created_at timestamptz default now(), unique (fondita_id, fecha));
create table public.cartas (id uuid primary key default gen_random_uuid(), fondita_id uuid references public.fonditas(id) on delete cascade, secciones jsonb, updated_at timestamptz default now());
grant all on public.fonditas, public.menus, public.cartas to anon, authenticated, service_role;
`;

await db.exec(STUBS);
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
let failed = false;
for (const file of files) {
  try {
    // gen_random_uuid() ya es parte de Postgres; pgcrypto no existe en esta versión embebida.
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8').replace(/create extension if not exists pgcrypto;/gi, '');
    await db.exec(sql);
    console.log('ok  ', file);
  } catch (error) {
    failed = true;
    console.log('FAIL', file, '→', error.message);
    break;
  }
}
if (failed) process.exit(1);

// ---------- Escenarios como roles reales bajo RLS ----------
const ids = {
  owner: '11111111-1111-4111-8111-111111111111',
  ana: '22222222-2222-4222-8222-222222222222',
  luis: '33333333-3333-4333-8333-333333333333',
};
const table = 'negocios';
const fk = 'negocio_id';
const nameHistory = 'negocio_name_history';
async function as(user, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ''}', false); select set_config('request.jwt.claim.role', '${user ? 'authenticated' : 'anon'}', false);`);
  await db.exec(user ? 'set role authenticated' : 'set role anon');
  try { return await db.query(sql, params); } finally { await db.exec('reset role'); }
}
async function admin(sql, params = []) { await db.exec('reset role'); return db.query(sql, params); }
const results = [];
async function check(name, fn) {
  try { await fn(); results.push(['ok  ', name]); } catch (error) { results.push(['FAIL', `${name} → ${error.message}`]); }
}
async function rejects(promise, pattern) {
  try { await promise; } catch (error) { if (pattern.test(error.message)) return; throw new Error(`unexpected error: ${error.message}`); }
  throw new Error('expected an error');
}

await admin(`insert into auth.users (id, email) values ($1, 'owner@x.mx'), ($2, 'ana@x.mx'), ($3, 'luis@x.mx')`, [ids.owner, ids.ana, ids.luis]);
const business = (await admin(`insert into public.${table} (nombre, owner_id) values ('Mi Fondita', $1) returning id`, [ids.owner])).rows[0].id;

await check('alta: el nombre provisional se cambia sin contar', async () => {
  await as(ids.owner, `update public.${table} set nombre = 'Fonda Lupita', categorias = '{Fondita}', tipo_negocio = 'fondita' where id = $1`, [business]);
  const { rows } = await admin(`select count(*)::int as n from public.${nameHistory}`);
  if (rows[0].n !== 0) throw new Error(`history ${rows[0].n}`);
});
await check('giro fijo después del alta (se ignora el cambio de la app)', async () => {
  await as(ids.owner, `update public.${table} set categorias = '{Tacos}', tipo_negocio = 'taqueria' where id = $1`, [business]);
  const { rows } = await admin(`select categorias, tipo_negocio from public.${table} where id = $1`, [business]);
  if (rows[0].categorias[0] !== 'Fondita' || rows[0].tipo_negocio !== 'fondita') throw new Error(JSON.stringify(rows[0]));
});
await check('soporte sí cambia el giro', async () => {
  await admin(`update public.${table} set categorias = '{Tacos}' where id = $1`, [business]);
  const { rows } = await admin(`select categorias from public.${table} where id = $1`, [business]);
  if (rows[0].categorias[0] !== 'Tacos') throw new Error(JSON.stringify(rows[0]));
});
await check('nombre: dos cambios en 14 días, el tercero se rechaza', async () => {
  await as(ids.owner, `update public.${table} set nombre = 'Fonda Lupita 2' where id = $1`, [business]);
  await as(ids.owner, `update public.${table} set nombre = 'Fonda Lupita 3' where id = $1`, [business]);
  await rejects(as(ids.owner, `update public.${table} set nombre = 'Fonda Lupita 4' where id = $1`, [business]), /NAME_CHANGE_LIMIT/);
});
await check('el filtro rechaza un nombre de negocio ofensivo', async () => {
  await rejects(as(ids.owner, `update public.${table} set descripcion = 'puro pendejo' where id = $1`, [business]), /CONTENT_REJECTED/);
});
await check('el filtro deja pasar jerga y comida', async () => {
  await as(ids.owner, `update public.${table} set descripcion = 'Pinche sazón chingón, panocha y conchas' where id = $1`, [business]);
});

for (const [user, first] of [[ids.ana, 'Ana'], [ids.luis, 'Luis']]) {
  await as(user, `insert into public.user_profiles (user_id, first_name, last_name, display_name, setup_completed) values ($1, $2, 'Pérez', $3, true)`, [user, first, `${first} P.`]);
}
await check('el filtro rechaza perfiles ofensivos', async () => {
  await rejects(as(ids.ana, `update public.user_profiles set bio = 'soy bien culero' where user_id = $1`, [ids.ana]), /CONTENT_REJECTED/);
});
await check('perfil: dos cambios de nombre cada 14 días', async () => {
  await as(ids.ana, `update public.user_profiles set first_name = 'Anita' where user_id = $1`, [ids.ana]);
  await as(ids.ana, `update public.user_profiles set first_name = 'Ana María' where user_id = $1`, [ids.ana]);
  await rejects(as(ids.ana, `update public.user_profiles set first_name = 'Ana Mar' where user_id = $1`, [ids.ana]), /NAME_CHANGE_LIMIT/);
});

let reviewId;
await check('reseña con insulto se rechaza; sin insulto se publica', async () => {
  await rejects(as(ids.ana, `insert into public.reviews (user_id, ${fk}, stars, note) values ($1, $2, 2, 'el mesero es un imbécil')`, [ids.ana, business]), /CONTENT_REJECTED/);
  reviewId = (await as(ids.ana, `insert into public.reviews (user_id, ${fk}, stars, note) values ($1, $2, 5, 'Muy rico el caldo') returning id`, [ids.ana, business])).rows[0].id;
});
let commentId;
await check('comentario de otra persona se guarda y se ve sin sesión', async () => {
  commentId = (await as(ids.luis, `insert into public.review_comments (review_id, user_id, body) values ($1, $2, '¿El caldo es diario?') returning id`, [reviewId, ids.luis])).rows[0].id;
  const { rows } = await as(null, `select body from public.review_comments where review_id = $1`, [reviewId]);
  if (rows.length !== 1) throw new Error(`visible ${rows.length}`);
});
await check('el negocio comenta en reseñas de su Patio sin perfil de Foodie', async () => {
  await as(ids.owner, `insert into public.review_comments (review_id, user_id, body, parent_id) values ($1, $2, 'Sí, de lunes a viernes', $3)`, [reviewId, ids.owner, commentId]);
});
await check('responder a una respuesta cuelga del comentario principal', async () => {
  const reply = (await admin(`select id from public.review_comments where parent_id = $1`, [commentId])).rows[0].id;
  const row = (await as(ids.ana, `insert into public.review_comments (review_id, user_id, body, parent_id) values ($1, $2, 'Gracias', $3) returning parent_id`, [reviewId, ids.ana, reply])).rows[0];
  if (row.parent_id !== commentId) throw new Error(row.parent_id);
});
await check('comentario ofensivo se rechaza', async () => {
  await rejects(as(ids.luis, `insert into public.review_comments (review_id, user_id, body) values ($1, $2, 'qué mierda')`, [reviewId, ids.luis]), /CONTENT_REJECTED/);
});
await check('nadie edita comentarios; solo autor o autor de la reseña los borra', async () => {
  const edited = await as(ids.luis, `update public.review_comments set body = 'x' where id = $1 returning id`, [commentId]);
  if (edited.rows.length) throw new Error('edited');
  const strangerDelete = await as(ids.owner, `delete from public.review_comments where id = $1 returning id`, [commentId]);
  if (strangerDelete.rows.length) throw new Error('owner deleted a comment on someone else review');
});
await check('quien fue bloqueado no comenta en la reseña de quien lo bloqueó', async () => {
  await as(ids.ana, `insert into public.blocked_users (blocker_id, blocked_user_id) values ($1, $2)`, [ids.ana, ids.luis]);
  await rejects(as(ids.luis, `insert into public.review_comments (review_id, user_id, body) values ($1, $2, 'hola')`, [reviewId, ids.luis]), /row-level security/);
  await as(ids.ana, `delete from public.blocked_users where blocker_id = $1`, [ids.ana]);
});
await check('reporte de comentario aceptado', async () => {
  await as(ids.ana, `insert into public.content_reports (reporter_id, target_type, target_id, reason) values ($1, 'comment', $2, 'spam')`, [ids.ana, commentId]);
});

await check('perfil privado: seguir crea solicitud y oculta listas', async () => {
  await as(ids.ana, `insert into public.collections (owner_id, title, visibility) values ($1, 'Mis caldos', 'public')`, [ids.ana]);
  await as(ids.ana, `update public.user_profiles set visibility = 'private' where user_id = $1`, [ids.ana]);
  await as(ids.luis, `insert into public.profile_follows (follower_id, followed_id) values ($1, $2)`, [ids.luis, ids.ana]);
  const status = (await admin(`select status from public.profile_follows where follower_id = $1`, [ids.luis])).rows[0].status;
  if (status !== 'pending') throw new Error(status);
  const lists = await as(ids.luis, `select id from public.collections where owner_id = $1`, [ids.ana]);
  if (lists.rows.length) throw new Error('private lists visible');
  const name = await as(null, `select display_name from public.user_profiles where user_id = $1`, [ids.ana]);
  if (!name.rows.length) throw new Error('private name hidden');
});
await check('quien sigue no puede aceptarse solo', async () => {
  const self = await as(ids.luis, `update public.profile_follows set status = 'accepted' where follower_id = $1 returning status`, [ids.luis]);
  if (self.rows.length) throw new Error('follower accepted own request');
});
await check('al aceptar, ve las listas; los conteos son públicos', async () => {
  await as(ids.ana, `update public.profile_follows set status = 'accepted' where follower_id = $1 and followed_id = $2`, [ids.luis, ids.ana]);
  const lists = await as(ids.luis, `select id from public.collections where owner_id = $1`, [ids.ana]);
  if (lists.rows.length !== 1) throw new Error('accepted follower cannot see lists');
  const counts = (await as(null, `select * from public.profile_stats($1)`, [ids.ana])).rows[0];
  if (Number(counts.followers) !== 1 || Number(counts.reviews) !== 1) throw new Error(JSON.stringify(counts));
});
await check('conteos públicos del negocio: guardados y me gusta', async () => {
  await as(ids.luis, `insert into public.saved_patios (user_id, ${fk}) values ($1, $2)`, [ids.luis, business]);
  await as(ids.ana, `insert into public.saved_patios (user_id, ${fk}) values ($1, $2)`, [ids.ana, business]);
  const counts = (await as(null, `select * from public.business_stats($1)`, [business])).rows[0];
  if (Number(counts.saves) !== 2) throw new Error(JSON.stringify(counts));
  const peek = await as(ids.luis, `select * from public.saved_patios where user_id = $1`, [ids.ana]);
  if (peek.rows.length) throw new Error('saves of others are readable');
});

await check('tablero del negocio: solo el dueño ve guardados y me gusta de la semana', async () => {
  await as(ids.ana, `insert into public.dish_likes (user_id, ${fk}, dish_name, dish_name_display) values ($1, $2, 'POZOLE', 'Pozole')`, [ids.ana, business]);
  await as(ids.luis, `insert into public.dish_likes (user_id, ${fk}, dish_name, dish_name_display) values ($1, $2, 'POZOLE', 'Pozole')`, [ids.luis, business]);
  const mine = (await as(ids.owner, `select * from public.business_insights($1)`, [business])).rows[0];
  if (Number(mine.saves) !== 2 || Number(mine.saves_week) !== 2 || Number(mine.dish_likes) !== 2) throw new Error(JSON.stringify(mine));
  await rejects(as(ids.luis, `select * from public.business_insights($1)`, [business]), /not authorized/);
  const dishes = (await as(null, `select * from public.business_dish_like_counts($1)`, [business])).rows;
  if (dishes[0].display_name !== 'Pozole' || Number(dishes[0].likes) !== 2) throw new Error(JSON.stringify(dishes));
});
await check('el negocio responde una reseña (función reescrita) y el filtro la revisa', async () => {
  await rejects(as(ids.owner, `select public.reply_to_review($1, 'cállate pendejo')`, [reviewId]), /CONTENT_REJECTED/);
  await as(ids.owner, `select public.reply_to_review($1, 'Gracias por venir')`, [reviewId]);
  const { rows } = await admin(`select business_reply from public.reviews where id = $1`, [reviewId]);
  if (rows[0].business_reply !== 'Gracias por venir') throw new Error(JSON.stringify(rows[0]));
});
await check('publicar una lista con lugares (parámetro renombrado)', async () => {
  const list = '44444444-4444-4444-8444-444444444444';
  await as(ids.luis, `select public.publish_collection($1, 'Para el lunes', '', 'public', array[$2]::uuid[])`, [list, business]);
  const { rows } = await admin(`select count(*)::int as n from public.collection_places where collection_id = $1`, [list]);
  if (rows[0].n !== 1) throw new Error(`places ${rows[0].n}`);
});
await check('seguidores públicos de un lugar; lugares que sigue un perfil respetan lo privado', async () => {
  const followers = (await as(null, `select display_name from public.patio_followers($1) order by display_name`, [business])).rows.map((row) => row.display_name);
  if (followers.join() !== 'Ana P.,Luis P.') throw new Error(JSON.stringify(followers));
  const privateForAnon = await as(null, `select * from public.profile_followed_places($1)`, [ids.ana]);
  if (privateForAnon.rows.length) throw new Error('private followed places visible');
  const forFollower = await as(ids.luis, `select nombre from public.profile_followed_places($1)`, [ids.ana]);
  if (forFollower.rows.length !== 1) throw new Error('accepted follower cannot see followed places');
  const stats = (await as(null, `select * from public.profile_stats($1)`, [ids.luis])).rows[0];
  if (Number(stats.following) !== 2) throw new Error(`following ${stats.following}`);
  await as(ids.ana, `insert into public.blocked_users (blocker_id, blocked_user_id) values ($1, $2)`, [ids.ana, ids.luis]);
  const seenByAna = (await as(ids.ana, `select display_name from public.patio_followers($1)`, [business])).rows.map((row) => row.display_name);
  if (seenByAna.includes('Luis P.')) throw new Error('blocked follower visible');
  await as(ids.ana, `delete from public.blocked_users where blocker_id = $1`, [ids.ana]);
});
await check('«De quienes sigues»: lo reciente de quien sigues, sin bloqueos ni anónimos', async () => {
  const seen = (await as(ids.luis, `select kind, display_name, negocio_id from public.following_activity()`)).rows;
  if (!seen.some((row) => row.kind === 'follow' && row.display_name === 'Ana P.' && row.negocio_id === business)) throw new Error(JSON.stringify(seen));
  if (seen.some((row) => row.display_name === 'Luis P.')) throw new Error('own activity listed');
  await rejects(as(null, `select * from public.following_activity()`), /permission denied/);
  await as(ids.ana, `insert into public.blocked_users (blocker_id, blocked_user_id) values ($1, $2)`, [ids.ana, ids.luis]);
  const blocked = (await as(ids.luis, `select * from public.following_activity()`)).rows;
  if (blocked.length) throw new Error('blocked person activity visible');
  await as(ids.ana, `delete from public.blocked_users where blocker_id = $1`, [ids.ana]);
});
await check('Pro: platillo destacado solo con Pro y solo mientras dure', async () => {
  await rejects(as(ids.owner, `update public.${table} set featured_dish = 'POZOLE' where id = $1`, [business]), /PRO_REQUIRED/);
  await admin(`insert into public.business_plans (user_id, plan, source, expires_at) values ($1, 'pro', 'founder', now() + interval '6 months')`, [ids.owner]);
  await as(ids.owner, `update public.${table} set featured_dish = 'POZOLE' where id = $1`, [business]);
  const shown = (await as(null, `select featured_dish from public.patio_highlights($1)`, [business])).rows[0];
  if (shown.featured_dish !== 'POZOLE') throw new Error(JSON.stringify(shown));
  await admin(`update public.business_plans set expires_at = now() - interval '1 day' where user_id = $1`, [ids.owner]);
  const expired = (await as(null, `select featured_dish from public.patio_highlights($1)`, [business])).rows[0];
  if (expired.featured_dish !== null) throw new Error('featured dish shown without Pro');
  await admin(`update public.business_plans set expires_at = now() + interval '6 months' where user_id = $1`, [ids.owner]);
  await rejects(as(ids.luis, `select public.has_pro($1)`, [ids.owner]), /permission denied/);
});
await check('Pro: estado y cuándo hay más interés, solo para el dueño', async () => {
  const status = (await as(ids.owner, `select * from public.business_pro_status($1)`, [business])).rows[0];
  if (!status.pro_until || Number(status.notices_left) !== 8) throw new Error(JSON.stringify(status));
  const peaks = (await as(ids.owner, `select weekday, hour_of_day, signals from public.business_peak_times($1)`, [business])).rows;
  if (!peaks.length || peaks.reduce((sum, row) => sum + Number(row.signals), 0) !== 4) throw new Error(JSON.stringify(peaks));
  await rejects(as(ids.luis, `select * from public.business_peak_times($1)`, [business]), /not authorized/);
  await rejects(as(ids.luis, `select * from public.business_pro_status($1)`, [business]), /not authorized/);
});
await check('Pro: lecturas con foto, 20 al día sin Pro y 60 con Pro', async () => {
  const today = `date_trunc('day', statement_timestamp() at time zone 'America/Mexico_City') at time zone 'America/Mexico_City'`;
  for (const user of [ids.ana, ids.owner]) {
    await admin(`insert into public.ai_request_usage (user_id, feature, window_kind, window_start, requests) values ($1, 'read-menu', 'day', ${today}, 20)`, [user]);
  }
  const free = (await admin(`select public.consume_ai_request($1, 'read-menu') as ok`, [ids.ana])).rows[0].ok;
  const pro = (await admin(`select public.consume_ai_request($1, 'read-menu') as ok`, [ids.owner])).rows[0].ok;
  if (free !== false || pro !== true) throw new Error(`free ${free}, pro ${pro}`);
});
await check('avisos especiales: filtro de lenguaje, solo el servidor los crea y la ficha los muestra', async () => {
  await rejects(admin(`insert into public.special_notices (${fk}, created_by, body) values ($1, $2, 'qué mierda de precios')`, [business, ids.owner]), /CONTENT_REJECTED/);
  await rejects(as(ids.owner, `insert into public.special_notices (${fk}, created_by, body) values ($1, $2, 'Hoy agua gratis')`, [business, ids.owner]), /permission denied/);
  await admin(`insert into public.special_notices (${fk}, created_by, body) values ($1, $2, 'Hoy agua gratis')`, [business, ids.owner]);
  const shown = (await as(null, `select notice_body from public.patio_highlights($1)`, [business])).rows[0];
  if (shown.notice_body !== 'Hoy agua gratis') throw new Error(JSON.stringify(shown));
  const left = (await as(ids.owner, `select notices_left from public.business_pro_status($1)`, [business])).rows[0];
  if (Number(left.notices_left) !== 7) throw new Error(JSON.stringify(left));
});
await check('avisos de operación: no gastan el cupo de Pro y la ficha los muestra con su tipo', async () => {
  await admin(`insert into public.special_notices (${fk}, created_by, body, kind) values ($1, $2, 'Hoy abrimos a las 8 pm.', 'operation')`, [business, ids.owner]);
  const shown = (await as(null, `select notice_body, notice_kind from public.patio_highlights($1)`, [business])).rows[0];
  if (shown.notice_body !== 'Hoy abrimos a las 8 pm.' || shown.notice_kind !== 'operation') throw new Error(JSON.stringify(shown));
  const left = (await as(ids.owner, `select notices_left from public.business_pro_status($1)`, [business])).rows[0];
  if (Number(left.notices_left) !== 7) throw new Error(`operation notice used the Pro quota: ${JSON.stringify(left)}`);
  await rejects(admin(`insert into public.special_notices (${fk}, created_by, body, kind) values ($1, $2, 'x', 'spam')`, [business, ids.owner]), /check/);
});
await check('límites de texto del negocio: se revisan solo al cambiar', async () => {
  await rejects(as(ids.owner, `update public.${table} set descripcion = $2 where id = $1`, [business, 'Comida corrida casera '.repeat(4)]), /TEXT_TOO_LONG/);
  await admin(`alter table public.${table} disable trigger negocios_text_limits`);
  await admin(`update public.${table} set direccion = $2 where id = $1`, [business, 'Calle muy larga de antes '.repeat(5)]);
  await admin(`alter table public.${table} enable trigger negocios_text_limits`);
  await as(ids.owner, `update public.${table} set horario = '9-18' where id = $1`, [business]);
});
await check('visitas: anónimas, una por teléfono al día y nadie lee la tabla', async () => {
  const device = 'a'.repeat(64);
  const ok = (await as(null, `select public.record_visit($1, now() - interval '30 minutes', 20, $2) as ok`, [business, device])).rows[0].ok;
  if (ok !== true) throw new Error('valid visit rejected');
  await as(null, `select public.record_visit($1, now() - interval '20 minutes', 15, $2)`, [business, device]);
  const { rows } = await admin(`select count(*)::int as n from public.place_visits where negocio_id = $1`, [business]);
  if (rows[0].n !== 1) throw new Error(`same phone same day counted ${rows[0].n} times`);
  const bad = [
    [business, `now() - interval '30 minutes'`, 2, 'b'.repeat(64)],
    [business, `now() + interval '1 hour'`, 20, 'c'.repeat(64)],
    [business, `now() - interval '30 minutes'`, 20, 'not-a-hash'],
    ['99999999-9999-4999-8999-999999999999', `now() - interval '30 minutes'`, 20, 'd'.repeat(64)],
  ];
  for (const [place, started, minutes, hash] of bad) {
    const result = (await as(null, `select public.record_visit($1, ${started}, $2, $3) as ok`, [place, minutes, hash])).rows[0].ok;
    if (result !== false) throw new Error(`accepted bad visit ${minutes} ${hash}`);
  }
  for (const tableName of ['place_visits', 'place_presence', 'visit_settings']) {
    await rejects(as(null, `select * from public.${tableName}`), /permission denied/);
    await rejects(as(ids.ana, `select * from public.${tableName}`), /permission denied/);
  }
});
await check('en vivo: entrar y salir; solo cuenta quien lleva 3 minutos o más dentro', async () => {
  const device = 'e'.repeat(64);
  if ((await as(null, `select public.mark_presence($1, $2, true) as ok`, [business, device])).rows[0].ok !== true) throw new Error('presence rejected');
  const inside = (await admin(`select left_at from public.place_presence where negocio_id = $1 and device_day = $2`, [business, device])).rows[0];
  if (!inside || inside.left_at !== null) throw new Error('not inside');
  await as(null, `select public.mark_presence($1, $2, false)`, [business, device]);
  const out = (await admin(`select left_at from public.place_presence where negocio_id = $1 and device_day = $2`, [business, device])).rows[0];
  if (!out.left_at) throw new Error('did not leave');
  if ((await as(null, `select public.mark_presence($1, 'zz', true) as ok`, [business])).rows[0].ok !== false) throw new Error('bad hash accepted');
});
await check('qué tan lleno: nada con pocas visitas; niveles contra la hora pico y en vivo con quien está dentro', async () => {
  const few = (await as(null, `select * from public.place_busyness($1)`, [business])).rows;
  if (few.length) throw new Error(`shown with ${few.length} rows and 1 visit`);
  await admin(`insert into public.place_visits (negocio_id, started_at, minutes, device_day)
    select $1, now() - (g || ' days')::interval, 20, md5(g::text) || md5((g + 500)::text) from generate_series(1, 40) g`, [business]);
  await admin(`insert into public.place_presence (negocio_id, device_day, arrived_at)
    select $1, md5((g + 900)::text) || md5((g + 1900)::text), now() - interval '10 minutes' from generate_series(1, 3) g`, [business]);
  await admin(`insert into public.place_presence (negocio_id, device_day, arrived_at)
    values ($1, md5('justnow') || md5('justnow2'), now() - interval '1 minute')`, [business]);
  const rows = (await as(null, `select * from public.place_busyness($1)`, [business])).rows;
  if (!rows.length) throw new Error('nothing shown with 41 visits');
  if (Math.max(...rows.map((row) => row.level)) !== 100) throw new Error('peak is not 100');
  if (rows.some((row) => row.level < 1 || row.level > 100)) throw new Error('level out of range');
  const current = rows.filter((row) => row.usual_present !== null);
  if (current.length !== 1 || current[0].present_now !== 3) throw new Error(JSON.stringify(current));
  await admin(`update public.visit_settings set value = 100 where key = 'busy_min_visits'`);
  const hidden = (await as(null, `select * from public.place_busyness($1)`, [business])).rows;
  if (hidden.length) throw new Error('threshold not read from visit_settings');
  await admin(`update public.visit_settings set value = 10 where key = 'busy_min_visits'`);
});
await check('foto del lugar: solo de la carpeta del dueño y cualquiera la lee', async () => {
  const own = `https://x.supabase.co/storage/v1/object/public/place-photos/${ids.owner}/${business}.jpg?v=1`;
  await as(ids.owner, `update public.${table} set foto_url = $2 where id = $1`, [business, own]);
  await rejects(as(ids.owner, `update public.${table} set foto_url = $2 where id = $1`, [business, `https://x.supabase.co/storage/v1/object/public/place-photos/${ids.ana}/robada.jpg`]), /se sube desde Patio/);
  await rejects(as(ids.owner, `update public.${table} set foto_url = 'https://otro.sitio/foto.jpg' where id = $1`, [business]), /se sube desde Patio/);
  const { rows } = await as(null, `select foto_url from public.${table} where id = $1`, [business]);
  if (rows[0]?.foto_url !== own) throw new Error(`public read ${JSON.stringify(rows)}`);
  await as(ids.owner, `update public.${table} set foto_url = null where id = $1`, [business]);
});
await check('eliminar la cuenta del dueño borra su negocio (trigger reescrito)', async () => {
  await admin(`delete from auth.users where id = $1`, [ids.owner]);
  const { rows } = await admin(`select count(*)::int as n from public.${table}`);
  if (rows[0].n !== 0) throw new Error(`negocios ${rows[0].n}`);
});

for (const [status, name] of results) console.log(status, name);
if (results.some(([status]) => status === 'FAIL')) process.exit(1);
