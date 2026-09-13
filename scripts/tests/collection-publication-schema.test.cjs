const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

// Migration contract inspection only. FK rollback/concurrent calls require the
// PostgreSQL staging rehearsal described in APP_BACKEND_AUDIT_2026-09-10.md.
const sql = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20260910120000_publish_collection.sql'), 'utf8')
  .replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').toLowerCase();

test('collection publication binds owner to an existing nonanonymous caller', () => {
  assert.match(sql, /caller_id uuid := auth\.uid\(\)/);
  assert.match(sql, /from auth\.users u where u\.id = caller_id and not coalesce\(u\.is_anonymous, false\)/);
  assert.match(sql, /where collections\.owner_id = caller_id returning id into saved_id/);
  assert.match(sql, /if saved_id is null then raise exception/);
});

test('collection replacement keeps stable IDs, ordered unique places and propagates failures', () => {
  assert.match(sql, /values \(p_collection_id, caller_id,/);
  assert.match(sql, /on conflict \(id\) do update/);
  assert.match(sql, /delete from public\.collection_places where collection_id = saved_id/);
  assert.match(sql, /with ordinality as place\(id, position\) group by place\.id/);
  assert.match(sql, /min\(place\.position\) - 1/);
  assert.doesNotMatch(sql, /exception when|on conflict.*do nothing/);
});

test('collection RPC has an empty search path and no anonymous execute grant', () => {
  assert.match(sql, /security definer set search_path = ''/);
  assert.match(sql, /revoke all on function public\.publish_collection\(uuid, text, text, text, uuid\[\]\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.publish_collection\(uuid, text, text, text, uuid\[\]\) to authenticated/);
});
