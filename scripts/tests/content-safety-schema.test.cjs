const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

// Offline migration contract checks. These detect accidentally permissive
// policy/grant changes; actual RLS behavior still requires a PostgreSQL rehearsal.
const sql = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20260910_content_safety.sql'), 'utf8')
  .replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').toLowerCase();

test('reports cannot be moderated or read across accounts by the client', () => {
  assert.match(sql, /alter table public\.content_reports enable row level security/);
  assert.match(sql, /revoke all on public\.content_reports from anon, authenticated/);
  assert.match(sql, /grant select, insert on public\.content_reports to authenticated/);
  assert.match(sql, /for select to authenticated using \(reporter_id = auth\.uid\(\)\)/);
  assert.match(sql, /for insert to authenticated with check \(reporter_id = auth\.uid\(\) and status = 'open'\)/);
  assert.doesNotMatch(sql, /on public\.content_reports for (all|update|delete)/);
});

test('blocks remain owned, cannot point to self, and can be reversed', () => {
  assert.match(sql, /primary key \(blocker_id, blocked_user_id\)/);
  assert.match(sql, /check \(blocker_id <> blocked_user_id\)/);
  assert.match(sql, /grant select, insert, delete on public\.blocked_users to authenticated/);
  for (const operation of ['select', 'delete']) {
    assert.match(sql, new RegExp(`on public\\.blocked_users for ${operation} to authenticated using \\(blocker_id = auth\\.uid\\(\\)\\)`));
  }
  assert.match(sql, /on public\.blocked_users for insert to authenticated with check \(blocker_id = auth\.uid\(\)\)/);
});

test('block filters restrict existing visibility without opening private or anonymous reads', () => {
  for (const [table, owner] of [['user_profiles', 'user_id'], ['reviews', 'user_id'], ['collections', 'owner_id']]) {
    assert.match(sql, new RegExp(`on public\\.${table} as restrictive for select to authenticated using \\(not exists \\( select 1 from public\\.blocked_users b where b\\.blocker_id = auth\\.uid\\(\\) and b\\.blocked_user_id = ${table}\\.${owner} \\)\\)`));
  }
});

test('unblock RPC is scoped to caller and never discloses private profile names', () => {
  const rpc = sql.slice(sql.indexOf('create or replace function public.get_blocked_profiles()'));
  assert.match(rpc, /returns table \(user_id uuid, display_name text\)/);
  assert.match(rpc, /security definer set search_path = ''/);
  assert.match(rpc, /case when p\.visibility = 'public' then p\.display_name else null end/);
  assert.match(rpc, /where b\.blocker_id = auth\.uid\(\)/);
  assert.match(rpc, /revoke all on function public\.get_blocked_profiles\(\) from public, anon, authenticated/);
  assert.match(rpc, /grant execute on function public\.get_blocked_profiles\(\) to authenticated/);
});
