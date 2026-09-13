// Optional PostgreSQL/WASM integration rehearsal, deliberately outside npm test.
// Install dependencies outside this repo and pass that directory as argv[2].
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const dependencyDirectory = process.argv[2];
if (!dependencyDirectory) {
  console.error('Usage: node scripts/db-tests/run-pglite.cjs /path/to/isolated-pglite-install');
  process.exit(1);
}
const { PGlite } = createRequire(path.join(path.resolve(dependencyDirectory), 'package.json'))('@electric-sql/pglite');
const repo = path.resolve(__dirname, '../..');
const sql = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const id = (suffix) => `10000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
const A = id(1), B = id(2), C = id(3), PRIVATE = id(4), ANONYMOUS = id(5);
const PATIO_A = id(11), PATIO_B = id(12), COLLECTION_A = id(21), COLLECTION_B = id(22), REVIEW_A = id(31), REVIEW_B = id(32);

(async () => {
  const pg = await PGlite.create();
  let checks = 0;
  const check = async (name, body) => { await body(); checks++; console.log(`PASS ${name}`); };
  const query = async (statement, parameters = []) => (await pg.query(statement, parameters)).rows;
  const asRole = async (role, user, body) => {
    await pg.exec(`set role ${role}`); // fixed role literals supplied only by this script
    await pg.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
    try { return await body(); } finally {
      await pg.exec('reset role');
      await pg.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  };
  const asUser = (user, body) => asRole('authenticated', user, body);
  const rejectsCode = async (operation, code) => assert.rejects(operation, (error) => error.code === code);
  const publish = (collection, title, places) => query(
    'select public.publish_collection($1, $2, $3, $4, $5::uuid[]) as id',
    [collection, title, 'Descripción', 'public', places],
  );
  try {
    console.log((await query('select version() as version'))[0].version);
    await pg.exec(sql('scripts/db-tests/minimal-fixture.sql'));
    for (const file of [
      '20260513_create_menu_tables.sql',
      '20260728_create_social_graph.sql',
      '20260730_create_saved_collections.sql',
      '20260731_create_saved_patios_and_name_history.sql',
      '20260801_create_verified_reviews.sql',
      '20260803_create_business_review_replies.sql',
      '20260804_make_reviews_immutable.sql',
      '20260828_create_dish_likes.sql',
      '20260829_create_review_likes.sql',
    ]) await pg.exec(sql(`supabase/migrations/${file}`));
    // Emulate ordinary API grants on the legacy tables only. New migrations
    // below must establish their own constrained grants and policies.
    await pg.exec('grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role');
    for (const file of [
      '20260909_account_deletion.sql',
      '20260910_content_safety.sql',
      '20260910120000_publish_collection.sql',
    ]) await pg.exec(sql(`supabase/migrations/${file}`));

    for (const [user, name, visibility] of [[A, 'Ana', 'public'], [B, 'Beto', 'public'], [C, 'Caro', 'public'], [PRIVATE, 'Privado', 'private']]) {
      await query('insert into auth.users (id,email,email_confirmed_at) values ($1,$2,now())', [user, `${name.toLowerCase()}@example.test`]);
      await query('insert into public.user_profiles(user_id,first_name,last_name,display_name,visibility,setup_completed) values ($1,$2,$3,$2,$4,true)', [user, name, 'Prueba', visibility]);
    }
    await query('insert into auth.users(id,is_anonymous) values ($1,true)', [ANONYMOUS]);
    await query('insert into public.fonditas(id,telefono,nombre) values ($1,$2,$3),($4,$5,$6)', [PATIO_A, 'ana@example.test', 'Patio A', PATIO_B, 'beto@example.test', 'Patio B']);
    await query('insert into public.collections(id,owner_id,title,visibility) values ($1,$2,$3,$4)', [COLLECTION_B, B, 'Colección B', 'public']);
    await query('insert into public.reviews(id,user_id,fondita_id,stars) values ($1,$2,$3,5),($4,$5,$3,4)', [REVIEW_A, A, PATIO_B, REVIEW_B, B]);

    await check('RLS baseline hides a private profile from another account', () => asUser(A, async () => {
      assert.equal((await query('select user_id from public.user_profiles where user_id=$1', [PRIVATE])).length, 0);
    }));

    await check('publish_collection refuses somebody else\'s collection', () => asUser(A, async () => {
      await rejectsCode(() => publish(COLLECTION_B, 'Usurpada', [PATIO_A]), '42501');
      assert.equal((await query('select title from public.collections where id=$1', [COLLECTION_B]))[0].title, 'Colección B');
    }));

    await check('publication retry keeps one ID and ordered unique places', () => asUser(A, async () => {
      const first = await publish(COLLECTION_A, 'Original', [PATIO_A, PATIO_B, PATIO_A]);
      const second = await publish(COLLECTION_A, 'Original', [PATIO_A, PATIO_B, PATIO_A]);
      assert.equal(first[0].id, COLLECTION_A);
      assert.equal(second[0].id, COLLECTION_A);
      assert.deepEqual(await query('select fondita_id,sort_order from public.collection_places where collection_id=$1 order by sort_order', [COLLECTION_A]), [
        { fondita_id: PATIO_A, sort_order: 0 }, { fondita_id: PATIO_B, sort_order: 1 },
      ]);
    }));

    await check('failed FK rolls back collection title and all prior places', () => asUser(A, async () => {
      await rejectsCode(() => publish(COLLECTION_A, 'No debe guardarse', [id(999)]), '23503');
      assert.equal((await query('select title from public.collections where id=$1', [COLLECTION_A]))[0].title, 'Original');
      assert.deepEqual((await query('select fondita_id from public.collection_places where collection_id=$1 order by sort_order', [COLLECTION_A])).map((row) => row.fondita_id), [PATIO_A, PATIO_B]);
    }));

    await check('anonymous/deleted-account JWT cannot publish through definer RPC', async () => {
      await asUser(ANONYMOUS, () => rejectsCode(() => publish(id(25), 'No', []), '42501'));
      await asUser(id(999), () => rejectsCode(() => publish(id(25), 'No', []), '42501'));
    });

    await check('report cannot spoof reporter/moderation status or update status', () => asUser(A, async () => {
      await rejectsCode(() => query('insert into public.content_reports(reporter_id,target_type,target_id,reason,status) values ($1,$2,$3,$4,$5)', [A, 'review', REVIEW_B, 'abuse', 'reviewed']), '42501');
      await rejectsCode(() => query('insert into public.content_reports(reporter_id,target_type,target_id,reason) values ($1,$2,$3,$4)', [B, 'review', REVIEW_B, 'abuse']), '42501');
      await query('insert into public.content_reports(reporter_id,target_type,target_id,reason) values ($1,$2,$3,$4)', [A, 'review', REVIEW_B, 'abuse']);
      await rejectsCode(() => query("update public.content_reports set status='reviewed' where reporter_id=$1", [A]), '42501');
    }));

    await check('report is readable only by its reporter', async () => {
      await asUser(A, async () => assert.equal((await query('select * from public.content_reports')).length, 1));
      await asUser(B, async () => assert.equal((await query('select * from public.content_reports')).length, 0));
      await asRole('anon', null, () => rejectsCode(() => query('select * from public.content_reports'), '42501'));
    });

    await check('block hides B profile/reviews/collections from A but not C', async () => {
      await asUser(A, async () => {
        await query('insert into public.blocked_users(blocker_id,blocked_user_id) values ($1,$2)', [A, B]);
        assert.equal((await query('select * from public.user_profiles where user_id=$1', [B])).length, 0);
        assert.equal((await query('select * from public.reviews where user_id=$1', [B])).length, 0);
        assert.equal((await query('select * from public.collections where owner_id=$1', [B])).length, 0);
      });
      await asUser(C, async () => {
        assert.equal((await query('select * from public.user_profiles where user_id=$1', [B])).length, 1);
        assert.equal((await query('select * from public.reviews where user_id=$1', [B])).length, 1);
        assert.equal((await query('select * from public.collections where owner_id=$1', [B])).length, 1);
        assert.equal((await query('select * from public.blocked_users')).length, 0);
      });
    });

    await check('unblock RPC scopes caller, masks private names and denies anonymous execute', async () => {
      await asUser(A, async () => {
        await query('insert into public.blocked_users(blocker_id,blocked_user_id) values ($1,$2)', [A, PRIVATE]);
        const rows = await query('select * from public.get_blocked_profiles()');
        assert.equal(rows.find((row) => row.user_id === B).display_name, 'Beto');
        assert.equal(rows.find((row) => row.user_id === PRIVATE).display_name, null);
      });
      await asUser(C, async () => assert.deepEqual(await query('select * from public.get_blocked_profiles()'), []));
      await asRole('anon', null, () => rejectsCode(() => query('select * from public.get_blocked_profiles()'), '42501'));
    });

    await check('unblock restores original public visibility', () => asUser(A, async () => {
      await query('delete from public.blocked_users where blocker_id=$1 and blocked_user_id=$2', [A, B]);
      assert.equal((await query('select * from public.user_profiles where user_id=$1', [B])).length, 1);
      assert.equal((await query('select * from public.reviews where user_id=$1', [B])).length, 1);
      assert.equal((await query('select * from public.collections where owner_id=$1', [B])).length, 1);
    }));

    await check('review INSERT cannot forge an official business reply', () => asUser(C, async () => {
      await rejectsCode(() => query('insert into public.reviews(user_id,fondita_id,stars,business_reply) values ($1,$2,5,$3)', [C, PATIO_A, 'Respuesta falsa']), '42501');
    }));

    await check('account deletion readiness detects trigger and restricts execution', async () => {
      await asRole('service_role', null, async () => assert.equal((await query('select public.account_deletion_ready() as ready'))[0].ready, true));
      await asUser(A, () => rejectsCode(() => query('select public.account_deletion_ready()'), '42501'));
      await pg.exec('alter table auth.users disable trigger delete_owned_patios_before_account');
      await asRole('service_role', null, async () => assert.equal((await query('select public.account_deletion_ready() as ready'))[0].ready, false));
      await pg.exec('alter table auth.users enable trigger delete_owned_patios_before_account');
    });

    await check('auth-admin FK failure rolls back the account-deletion trigger', async () => {
      await query('insert into public.menus(fondita_id) values ($1)', [PATIO_A]);
      await query('insert into public.cartas(fondita_id) values ($1)', [PATIO_A]);
      await pg.exec('create table public.test_deletion_blocker (user_id uuid references auth.users(id))');
      await query('insert into public.test_deletion_blocker(user_id) values ($1)', [A]);
      await asRole('supabase_auth_admin', null, () => rejectsCode(() => query('delete from auth.users where id=$1', [A]), '23503'));
      assert.equal((await query('select * from auth.users where id=$1', [A])).length, 1);
      assert.equal((await query('select * from public.fonditas where id=$1', [PATIO_A])).length, 1);
      assert.equal((await query('select * from public.menus where fondita_id=$1', [PATIO_A])).length, 1);
      assert.equal((await query('select * from public.cartas where fondita_id=$1', [PATIO_A])).length, 1);
      await pg.exec('drop table public.test_deletion_blocker');
    });

    await check('auth-admin deletion cascades immutable reviews and owned Patio data only', async () => {
      await asRole('supabase_auth_admin', null, () => query('delete from auth.users where id=$1', [A]));
      assert.equal((await query('select * from public.reviews where id=$1', [REVIEW_A])).length, 0);
      assert.equal((await query('select * from public.fonditas where id=$1', [PATIO_A])).length, 0);
      assert.equal((await query('select * from public.menus where fondita_id=$1', [PATIO_A])).length, 0);
      assert.equal((await query('select * from public.cartas where fondita_id=$1', [PATIO_A])).length, 0);
      assert.equal((await query('select * from public.collections where owner_id=$1', [A])).length, 0);
      assert.equal((await query('select * from public.content_reports where reporter_id=$1', [A])).length, 0);
      assert.equal((await query('select * from public.fonditas where id=$1', [PATIO_B])).length, 1);
      assert.equal((await query('select * from public.reviews where id=$1', [REVIEW_B])).length, 1);
      assert.equal((await query('select * from auth.users where id=$1', [B])).length, 1);
    });
    console.log(`RESULT ${checks} PostgreSQL integration checks passed on a minimal fixture; no production services accessed.`);
  } finally {
    await pg.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
