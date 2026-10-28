/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function fixture(supabase = {}) {
  const values = new Map();
  const faults = { failNextRemove: false };
  const storage = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
    async multiGet(keys) { return keys.map((key) => [key, values.get(key) ?? null]); },
    async multiSet(entries) { for (const [key, value] of entries) values.set(key, value); },
    async multiRemove(keys) {
      if (faults.failNextRemove) { faults.failNextRemove = false; throw new Error('Storage unavailable'); }
      for (const key of keys) values.delete(key);
    },
  };
  const root = path.resolve(__dirname, '../..');
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localRequire = (id) => {
      if (id === '@react-native-async-storage/async-storage') return storage;
      if (id.endsWith('/supabase')) return { supabase, clearDeletedAccountSession: async () => {
        await storage.multiRemove(['test-auth-token', 'test-auth-code-verifier']);
      } };
      const file = id.startsWith('@/') ? path.resolve(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
      return load(file.endsWith('.ts') ? file : `${file}.ts`);
    };
    new Function('require', 'module', 'exports', '__DEV__', code)(localRequire, module, module.exports, false);
    return module.exports;
  }
  return { load, values, faults, storage };
}
const userId = 'a992e8c0-290e-4e17-a65f-bfd89d6e849c';
const targetId = 'b992e8c0-290e-4e17-a65f-bfd89d6e849c';

test('logout removes only this installation push token before ending Auth', async () => {
  const events = [];
  const filters = [];
  const query = { eq(key, value) { filters.push([key, value]); return this; },
    then(resolve) { events.push('detach'); return Promise.resolve({ error: null }).then(resolve); } };
  const f = fixture({
    from(table) { assert.equal(table, 'push_devices'); return { delete: () => query }; },
    auth: {
      getSession: async () => ({ data: { session: { user: { id: userId } } } }),
      signOut: async () => { events.push('signOut'); return { error: null }; },
    },
  });
  await f.load('lib/push-device-session.ts').rememberPushDevice('ExponentPushToken[installation]');
  await f.load('lib/account-session.ts').signOutAccount();
  assert.deepEqual(events, ['detach', 'signOut']);
  assert.deepEqual(filters, [['user_id', userId], ['expo_push_token', 'ExponentPushToken[installation]']]);
  assert.equal(f.values.has('@patio_push_device_token'), false);
});

test('failed push detachment preserves Auth and token for a safe logout retry', async () => {
  let signedOut = false;
  const query = { eq() { return this; }, then(resolve) { return Promise.resolve({ error: new Error('Offline') }).then(resolve); } };
  const f = fixture({
    from: () => ({ delete: () => query }),
    auth: {
      getSession: async () => ({ data: { session: { user: { id: userId } } } }),
      signOut: async () => { signedOut = true; return { error: null }; },
    },
  });
  await f.load('lib/push-device-session.ts').rememberPushDevice('ExponentPushToken[installation]');
  await assert.rejects(f.load('lib/account-session.ts').signOutAccount(), /desconectar los avisos/);
  assert.equal(signedOut, false);
  assert.equal(f.values.get('@patio_push_device_token'), 'ExponentPushToken[installation]');
});

test('closing and reopening an account isolates and restores its unsynced library', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  const store = f.load('lib/menu-store.ts');
  f.values.set('patio:favorites', '["guest-place"]');
  f.values.set('onboarding_done', '1');
  f.values.set('@lafondita_dark_mode', '1');
  await scope.activateLocalAccount('alice');
  f.values.set('@patio_menu_history', 'private menu');
  store.setFonditaId('private-business');
  await scope.activateLocalAccount(null);
  assert.equal(f.values.has('patio:favorites'), false);
  assert.equal(f.values.has('@patio_menu_history'), false);
  assert.equal(store.getFonditaId(), null);
  assert.equal(f.values.get('onboarding_done'), '1');
  assert.equal(f.values.get('@lafondita_dark_mode'), '1');
  await scope.activateLocalAccount('bob');
  assert.equal(f.values.has('@patio_menu_history'), false);
  f.values.set('patio:favorites', '["bobs-place"]');
  await scope.activateLocalAccount('alice');
  assert.equal(f.values.get('@patio_menu_history'), 'private menu');
  assert.equal(f.values.get('patio:favorites'), '["guest-place"]');
  await scope.activateLocalAccount('bob');
  assert.equal(f.values.get('patio:favorites'), '["bobs-place"]');
});

test('an account switch waits for in-flight writes and rejects gestures during the switch', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  const queue = f.load('lib/storage-queue.ts');
  await scope.activateLocalAccount('alice');
  let release;
  const wait = new Promise((resolve) => { release = resolve; });
  const write = queue.withStorageLock('patio:favorites', async () => {
    await wait;
    f.values.set('patio:favorites', '["latest"]');
  });
  const switching = scope.activateLocalAccount('bob');
  await new Promise(setImmediate);
  await assert.rejects(queue.withStorageLock('patio:favorites', async () => {}), /cuenta/);
  release();
  await Promise.all([write, switching]);
  assert.equal(f.values.has('patio:favorites'), false);
  await scope.activateLocalAccount('alice');
  assert.equal(f.values.get('patio:favorites'), '["latest"]');
});

test('guest saves merge into a returning account and other guest work survives logout', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount('alice');
  f.values.set('patio:favorites', '["account-place", "shared-place"]');
  f.values.set('patio:collections:v1', JSON.stringify([{ id: 'account-list', title: 'Mine', remoteId: 'remote-a' }]));
  f.values.set('patio:saved-meta:v1', JSON.stringify([{ patioId: 'account-place', note: 'keep' }, { patioId: 'shared-place', note: 'old', rating: 4 }]));
  f.values.set('@patio_menu_history', 'account draft');
  await scope.activateLocalAccount(null);
  f.values.set('patio:favorites', '["guest-place", "shared-place"]');
  f.values.set('patio:collections:v1', JSON.stringify([{ id: 'guest-list', title: 'New' }]));
  f.values.set('patio:saved-meta:v1', JSON.stringify([{ patioId: 'shared-place', note: 'new' }]));
  f.values.set('@patio_menu_history', 'guest draft');
  await scope.activateLocalAccount('alice');
  assert.deepEqual(JSON.parse(f.values.get('patio:favorites')), ['guest-place', 'shared-place', 'account-place']);
  assert.deepEqual(JSON.parse(f.values.get('patio:collections:v1')).map((item) => item.id), ['guest-list', 'account-list']);
  assert.equal(JSON.parse(f.values.get('patio:collections:v1'))[1].remoteId, 'remote-a');
  assert.deepEqual(JSON.parse(f.values.get('patio:saved-meta:v1')), [{ patioId: 'account-place', note: 'keep' }, { patioId: 'shared-place', note: 'new', rating: 4 }]);
  assert.equal(f.values.get('@patio_menu_history'), 'account draft');
  await scope.activateLocalAccount(null);
  assert.equal(f.values.get('@patio_menu_history'), 'guest draft');
  assert.equal(f.values.has('patio:favorites'), false);
  await scope.activateLocalAccount('bob');
  assert.equal(f.values.get('@patio_menu_history'), 'guest draft');
  assert.equal(f.values.has('patio:favorites'), false);
});

test('corrupt guest library prevents destructive account restoration', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount('alice');
  f.values.set('patio:favorites', '["account-place"]');
  await scope.activateLocalAccount(null);
  f.values.set('patio:favorites', '{broken');
  await assert.rejects(scope.activateLocalAccount('alice'));
  assert.equal(f.values.has('@patio_active_account'), false);
  assert.equal(f.values.get('patio:favorites'), '{broken');
  assert.match(f.values.get('@patio_account_archive:alice'), /account-place/);
});

test('deleting an account restores separate guest work for the next login', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount('alice');
  f.values.set('@patio_menu_history', 'alice draft');
  await scope.activateLocalAccount(null);
  f.values.set('@patio_menu_history', 'guest draft');
  await scope.activateLocalAccount('alice');
  assert.equal(f.values.get('@patio_menu_history'), 'alice draft');
  await scope.eraseLocalAccount('alice');
  assert.equal(f.values.get('@patio_menu_history'), 'guest draft');
  await scope.activateLocalAccount('bob');
  assert.equal(f.values.get('@patio_menu_history'), 'guest draft');
  assert.equal(f.values.has('@patio_account_archive:alice'), false);
});

test('failed switch or corrupt destination does not erase the active account', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount('alice');
  f.values.set('patio:favorites', '["mine"]');
  f.values.set('@patio_account_archive:bob', '{corrupt');
  await assert.rejects(scope.activateLocalAccount('bob'));
  assert.equal(f.values.get('patio:favorites'), '["mine"]');
  f.values.delete('@patio_account_archive:bob');
  f.faults.failNextRemove = true;
  await assert.rejects(scope.activateLocalAccount('bob'), /Storage unavailable/);
  assert.equal(f.values.get('@patio_active_account'), 'alice');
  assert.equal(f.values.get('patio:favorites'), '["mine"]');
  await scope.activateLocalAccount('bob');
  await scope.activateLocalAccount('alice');
  assert.equal(f.values.get('patio:favorites'), '["mine"]');
});

test('account deletion removes that account archive, preserving other accounts and preferences', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount('alice');
  f.values.set('patio:favorites', '["alice"]');
  await scope.activateLocalAccount('bob');
  f.values.set('patio:favorites', '["bob"]');
  f.values.set('@lafondita_dark_mode', '1');
  await scope.eraseLocalAccount('bob');
  assert.equal(f.values.has('patio:favorites'), false);
  assert.equal(f.values.has('@patio_account_archive:bob'), false);
  assert.equal(f.values.get('@lafondita_dark_mode'), '1');
  await scope.activateLocalAccount('alice');
  assert.equal(f.values.get('patio:favorites'), '["alice"]');
});

test('failed remote logout leaves the local account accessible for retry', async () => {
  const f = fixture({ auth: {
    getSession: async () => ({ data: { session: { user: { id: userId } } }, error: null }),
    signOut: async () => ({ error: new Error('Offline') }),
  } });
  f.values.set('patio:favorites', '["mine"]');
  await assert.rejects(f.load('lib/account-session.ts').signOutAccount(), /Offline/);
  assert.equal(f.values.get('patio:favorites'), '["mine"]');
});

test('logout excludes gestures until auth and local storage have both finished switching', async () => {
  let active = { user: { id: userId } };
  let signalSignOut;
  let finishSignOut;
  const started = new Promise((resolve) => { signalSignOut = resolve; });
  const waiting = new Promise((resolve) => { finishSignOut = resolve; });
  const f = fixture({ auth: {
    getSession: async () => ({ data: { session: active }, error: null }),
    signOut: async () => { active = null; signalSignOut(); await waiting; return { error: null }; },
  } });
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount(userId);
  f.values.set('patio:favorites', '["mine"]');
  const closing = f.load('lib/account-session.ts').signOutAccount();
  await started;
  await assert.rejects(f.load('lib/storage-queue.ts').withStorageLock('patio:favorites', async () => {}), /cuenta/);
  finishSignOut();
  await closing;
  assert.equal(f.values.has('patio:favorites'), false);
  await scope.activateLocalAccount(userId);
  assert.equal(f.values.get('patio:favorites'), '["mine"]');
});

test('a failed local logout can be retried after auth has already closed without losing the archive', async () => {
  let active = { user: { id: userId } };
  const f = fixture({ auth: {
    getSession: async () => ({ data: { session: active }, error: null }),
    signOut: async () => { active = null; return { error: null }; },
  } });
  const scope = f.load('lib/account-storage.ts');
  const session = f.load('lib/account-session.ts');
  await scope.activateLocalAccount(userId);
  f.values.set('patio:favorites', '["mine"]');
  f.faults.failNextRemove = true;
  await assert.rejects(session.signOutAccount(), /Storage unavailable/);
  assert.equal(f.values.get('patio:favorites'), '["mine"]');
  await assert.rejects(f.load('lib/favorites.ts').toggleFavoritePatio('guest-place'), /cuenta/);
  await session.signOutAccount();
  assert.equal(f.values.has('patio:favorites'), false);
  await f.load('lib/favorites.ts').toggleFavoritePatio('guest-place');
  await scope.activateLocalAccount(userId);
  assert.equal(f.values.get('patio:favorites'), '["guest-place","mine"]');
});

test('delete account never clears local work after an unsuccessful server response', async () => {
  let signOuts = 0;
  const f = fixture({ auth: {
    getUser: async () => ({ data: { user: { id: userId } } }),
    getSession: async () => ({ data: { session: { access_token: 'token-a', user: { id: userId } } } }),
    signOut: async () => { signOuts++; return { error: null }; },
  }, functions: { invoke: async () => ({ data: {}, error: null }) } });
  f.values.set('patio:favorites', '["mine"]');
  await assert.rejects(f.load('lib/account-session.ts').deleteAccount(userId), /eliminar/);
  assert.equal(signOuts, 0);
  assert.equal(f.values.get('patio:favorites'), '["mine"]');
});

test('auth links parse query and hash credentials and reject unrelated app links', () => {
  const links = fixture().load('lib/auth-links.ts');
  assert.equal(links.extractAuthParams('patio://login-callback?code=current#code=stale').code, 'current');
  assert.equal(links.extractAuthParams('patio://login-callback#token_hash=otp&type=email').tokenHash, 'otp');
  assert.equal(links.extractAuthParams('patio://login-callback?error_code=otp_expired').hasError, true);
  assert.throws(() => links.extractAuthParams('patio://patio/place?code=wrong'), /acceso/);
});

test('login return paths preserve valid context and reject external, encoded, recursive or malformed routes', () => {
  const { safeReturnTo, isValidEmail } = fixture().load('lib/auth-links.ts');
  assert.equal(safeReturnTo('/resena/place?stars=4'), '/resena/place?stars=4');
  for (const path of ['//evil.test', 'https://evil.test', '/login-callback?code=x', '/%2fevil.test', '/%5cevil.test', '/warmup', '/%', '/..']) {
    assert.equal(safeReturnTo(path), '/explorar');
  }
  assert.equal(isValidEmail('hello+patio@example.com'), true);
  for (const email of ['hello@', '@example.com', 'a b@example.com', 'a@b']) assert.equal(isValidEmail(email), false);
});

test('duplicate magic link mounts exchange the single-use credential only once', async () => {
  let calls = 0;
  let release;
  const session = { user: { id: userId } };
  const response = new Promise((resolve) => { release = resolve; });
  const f = fixture({ auth: { exchangeCodeForSession: () => { calls++; return response; } } });
  const callback = f.load('lib/auth-callback.ts');
  const first = callback.resolveLoginSession('patio://login-callback?code=single-use');
  const second = callback.resolveLoginSession('patio://login-callback?code=single-use');
  assert.equal(first, second);
  release({ data: { session }, error: null });
  assert.equal(await first, session);
  assert.equal(calls, 1);
});

test('serialized magic link remounts reuse the successful exchange only for the same active account', async () => {
  let calls = 0;
  let active = { user: { id: userId }, access_token: 'alice-token' };
  const f = fixture({ auth: {
    exchangeCodeForSession: async () => {
      calls++;
      return calls === 1
        ? { data: { session: active }, error: null }
        : { data: { session: null }, error: new Error('Already used') };
    },
    getSession: async () => ({ data: { session: active }, error: null }),
  } });
  const callback = f.load('lib/auth-callback.ts');
  const { withSessionLock } = f.load('lib/session-queue.ts');
  const link = 'patio://login-callback?code=serialized-single-use';
  const first = withSessionLock(() => callback.resolveLoginSession(link));
  const remount = withSessionLock(() => callback.resolveLoginSession(link));
  assert.equal(await first, active);
  assert.equal(await remount, active);
  assert.equal(calls, 1);
  active = { user: { id: targetId }, access_token: 'bob-token' };
  await assert.rejects(callback.resolveLoginSession(link), /enlace/);
  active = null;
  await assert.rejects(callback.resolveLoginSession(link), /enlace/);
  assert.equal(calls, 1);
});

test('login waits for an old account save before changing the authenticated identity', async () => {
  let active = { user: { id: userId }, access_token: 'alice-token' };
  let exchanges = 0;
  let inserted;
  let release;
  let started;
  const waiting = new Promise((resolve) => { release = resolve; });
  const readingUser = new Promise((resolve) => { started = resolve; });
  const f = fixture({ auth: {
    getUser: async () => { started(); await waiting; return { data: { user: active.user } }; },
    exchangeCodeForSession: async () => {
      exchanges++;
      active = { user: { id: targetId }, access_token: 'bob-token' };
      return { data: { session: active }, error: null };
    },
  }, from: () => ({ upsert: async (payload) => { inserted = payload; return { error: null }; } }) });
  await f.load('lib/account-storage.ts').activateLocalAccount(userId);
  const saving = f.load('lib/collections.ts').saveSavedPatioMeta({ patioId: targetId, note: 'Alice private note' });
  await readingUser;
  const login = f.load('lib/auth-callback.ts').resolveLoginSession('patio://login-callback?code=bob-login');
  await new Promise(setImmediate);
  const exchangedDuringSave = exchanges;
  release();
  await Promise.all([saving, login]);
  assert.equal(exchangedDuringSave, 0);
  assert.equal(inserted.user_id, userId);
  assert.equal(f.values.get('@patio_active_account'), targetId);
  assert.equal(f.values.has('patio:saved-meta:v1'), false);
  assert.match(f.values.get(`@patio_account_archive:${userId}`), /Alice private note/);
});

test('a consumed login can finish local activation after a storage failure without losing the old account', async () => {
  let exchanges = 0;
  const active = { user: { id: targetId }, access_token: 'bob-token' };
  const f = fixture({ auth: {
    exchangeCodeForSession: async () => { exchanges++; return { data: { session: active }, error: null }; },
    getSession: async () => ({ data: { session: active }, error: null }),
  } });
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount(userId);
  f.values.set('patio:favorites', '["alice-place"]');
  const callback = f.load('lib/auth-callback.ts');
  const link = 'patio://login-callback?code=retry-local-activation';
  f.faults.failNextRemove = true;
  await assert.rejects(callback.resolveLoginSession(link), /Storage unavailable/);
  assert.equal(f.values.get('@patio_active_account'), userId);
  assert.equal(f.values.get('patio:favorites'), '["alice-place"]');
  // Auth is Bob while the rollback preserved Alice's local data. No gesture
  // may mutate or synchronize that data until activation has been retried.
  await assert.rejects(f.load('lib/favorites.ts').toggleFavoritePatio('bobs-place'), /cuenta/);
  await assert.rejects(f.load('lib/collections.ts').syncLocalLibraryToCloud(), /cuenta/);
  await callback.resolveLoginSession(link);
  assert.equal(exchanges, 1);
  assert.equal(f.values.get('@patio_active_account'), targetId);
  assert.equal(f.values.has('patio:favorites'), false);
  await f.load('lib/favorites.ts').toggleFavoritePatio('bobs-place');
  assert.equal(f.values.get('patio:favorites'), '["bobs-place"]');
  await scope.activateLocalAccount(userId);
  assert.equal(f.values.get('patio:favorites'), '["alice-place"]');
});

test('expired login cannot silently fall back to a different signed-in account', async () => {
  let existingSessionReads = 0;
  const f = fixture({ auth: {
    exchangeCodeForSession: async () => ({ data: { session: null }, error: new Error('Expired') }),
    getSession: async () => { existingSessionReads++; return { data: { session: { user: { id: 'old-account' } } } }; },
  } });
  const callback = f.load('lib/auth-callback.ts');
  await assert.rejects(callback.resolveLoginSession('patio://login-callback?code=expired'), /enlace/);
  await assert.rejects(callback.resolveLoginSession('patio://login-callback?error=expired'), /enlace/);
  assert.equal(existingSessionReads, 0);
});

test('reports use the authenticated identity and cannot claim moderator status', async () => {
  let inserted;
  const f = fixture({ auth: { getUser: async () => ({ data: { user: { id: userId } } }) },
    from: (table) => ({ insert: async (payload) => { inserted = { table, payload }; return { error: null }; } }),
  });
  await f.load('lib/content-safety.ts').reportContent('review', targetId, 'abuse', 'x'.repeat(600));
  assert.equal(inserted.table, 'content_reports');
  assert.equal(inserted.payload.reporter_id, userId);
  assert.equal(inserted.payload.details.length, 500);
  assert.equal(Object.hasOwn(inserted.payload, 'status'), false);
});

test('blocking rejects self-blocks and propagates backend failure without false success', async () => {
  const f = fixture({ auth: { getUser: async () => ({ data: { user: { id: userId } } }) },
    from: () => ({ insert: async () => ({ error: { code: '42501' } }) }),
  });
  const safety = f.load('lib/content-safety.ts');
  await assert.rejects(safety.blockUser(userId), /propia cuenta/);
  await assert.rejects(safety.blockUser(targetId), /bloquear/);
});

test('deletion stops if auth changes during user verification', async () => {
  let active = { access_token: 'token-alice', user: { id: userId } };
  let authorization;
  const f = fixture({ auth: {
    getSession: async () => ({ data: { session: active } }),
    getUser: async (token) => {
      assert.equal(token, 'token-alice');
      active = { access_token: 'token-bob', user: { id: targetId } };
      return { data: { user: { id: userId } } };
    },
    signOut: async () => ({ error: null }),
  }, functions: { invoke: async (_name, options) => {
    authorization = options.headers.Authorization;
    return { data: { deleted: false }, error: new Error('Stop before deletion') };
  } } });
  await assert.rejects(f.load('lib/account-session.ts').deleteAccount(userId), /cuenta cambió/);
  assert.equal(authorization, undefined);
});

test('confirmation for a different account cannot reach deletion', async () => {
  let invoked = false;
  const f = fixture({ auth: { getSession: async () => ({ data: { session: { user: { id: targetId }, access_token: 'bob' } } }) },
    functions: { invoke: async () => { invoked = true; } },
  });
  await assert.rejects(f.load('lib/account-session.ts').deleteAccount(userId), /cuenta cambió/);
  assert.equal(invoked, false);
});

test('erasing an old account cannot clear the active account', async () => {
  const f = fixture();
  const scope = f.load('lib/account-storage.ts');
  await scope.activateLocalAccount('bob');
  f.values.set('patio:favorites', '["bob"]');
  f.values.set('@patio_account_archive:alice', '[]');
  await scope.eraseLocalAccount('alice');
  assert.equal(f.values.get('@patio_active_account'), 'bob');
  assert.equal(f.values.get('patio:favorites'), '["bob"]');
  assert.equal(f.values.has('@patio_account_archive:alice'), false);
});

test('session transitions serialize login after account removal has completed', async () => {
  const f = fixture();
  const { withSessionLock } = f.load('lib/session-queue.ts');
  const order = [];
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  const removing = withSessionLock(async () => { order.push('delete-start'); await waiting; order.push('delete-end'); });
  const login = withSessionLock(async () => { order.push('login'); });
  await new Promise(setImmediate);
  assert.deepEqual(order, ['delete-start']);
  release();
  await Promise.all([removing, login]);
  assert.deepEqual(order, ['delete-start', 'delete-end', 'login']);
});


test('account deletion authenticates the request with the captured confirmed JWT', async () => {
  let authorization;
  const f = fixture({ auth: {
    getSession: async () => ({ data: { session: { user: { id: userId }, access_token: 'alice-token' } } }),
    getUser: async (token) => { assert.equal(token, 'alice-token'); return { data: { user: { id: userId } } }; },
    signOut: async () => ({ error: null }),
  }, functions: { invoke: async (_name, options) => {
    authorization = options.headers.Authorization;
    return { data: { deleted: true }, error: null };
  } } });
  f.values.set('patio:favorites', '["private"]');
  await f.load('lib/account-session.ts').deleteAccount(userId);
  assert.equal(authorization, 'Bearer alice-token');
  assert.equal(f.values.has('patio:favorites'), false);
});

test('native intent rejects malformed and excessive links before the legacy URI decoder', () => {
  const { redirectSystemPath } = fixture().load('app/+native-intent.ts');
  const link = 'patio://login-callback?code=valid-code';
  assert.equal(redirectSystemPath({ path: link, initial: true }), link);
  const validNested = 'patio://comunidad-acceso?returnTo=%2Fpatio%2Fplace';
  assert.equal(redirectSystemPath({ path: validNested, initial: false }), validNested);
  for (const path of ['patio://patio/a?q=' + '%FF'.repeat(200), 'patio://patio/a?q=%25FF', 'patio://patio/a?q=' + 'x'.repeat(8200), 'patio://patio/a\n']) {
    assert.equal(redirectSystemPath({ path, initial: false }), '/entrada');
  }
});

test('confirmed remote deletion clears stale local credentials even if logout fails offline', async () => {
  const f = fixture({ auth: {
    getSession: async () => ({ data: { session: { user: { id: userId }, access_token: 'alice-token' } } }),
    getUser: async () => ({ data: { user: { id: userId } } }),
    signOut: async () => ({ error: new Error('Offline') }),
  }, functions: { invoke: async () => ({ data: { deleted: true }, error: null }) } });
  f.values.set('patio:favorites', '["private"]');
  f.values.set('test-auth-token', 'stale');
  f.values.set('test-auth-code-verifier', 'stale');
  f.values.set('@lafondita_dark_mode', '1');
  await f.load('lib/account-session.ts').deleteAccount(userId);
  assert.equal(f.values.has('test-auth-token'), false);
  assert.equal(f.values.has('test-auth-code-verifier'), false);
  assert.equal(f.values.has('patio:favorites'), false);
  assert.equal(f.values.get('@lafondita_dark_mode'), '1');
});

test('email code rejects malformed credentials before contacting Auth', async () => {
  let calls = 0;
  const f = fixture({ auth: { verifyOtp: async () => { calls++; } } });
  const { verifyEmailCode } = f.load('lib/auth-email-code.ts');
  for (const [email, code] of [['bad', '12345678'], ['person@example.com', '12345'], ['person@example.com', '123456'], ['person@example.com', '123456789'], ['person@example.com', '12a456']]) {
    await assert.rejects(verifyEmailCode(email, code), /8 dígitos/);
  }
  assert.equal(calls, 0);
});

test('valid email code normalizes email and activates the verified account', async () => {
  let submitted;
  const session = { user: { id: userId } };
  const f = fixture({ auth: { verifyOtp: async (params) => {
    submitted = params;
    return { data: { session }, error: null };
  } } });
  const { verifyEmailCode } = f.load('lib/auth-email-code.ts');
  assert.equal(await verifyEmailCode(' Person@Example.com ', '01234567'), session);
  assert.deepEqual(submitted, { email: 'person@example.com', token: '01234567', type: 'email' });
  assert.equal(f.values.get('@patio_active_account'), userId);
});

test('expired email code preserves the current account and its private work', async () => {
  const f = fixture({ auth: { verifyOtp: async () => ({ data: { session: null }, error: { code: 'otp_expired' } }) } });
  await f.load('lib/account-storage.ts').activateLocalAccount(userId);
  f.values.set('@patio_menu_history', 'private draft');
  await assert.rejects(f.load('lib/auth-email-code.ts').verifyEmailCode('person@example.com', '12345678'), /verificar/);
  assert.equal(f.values.get('@patio_active_account'), userId);
  assert.equal(f.values.get('@patio_menu_history'), 'private draft');
});
