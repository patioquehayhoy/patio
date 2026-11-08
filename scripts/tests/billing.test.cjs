const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const MONTHLY = 'patio_pro_mensual';

function fixture({ enabled = true, native = true, os = 'android', server = { active: true, expiresAt: '2026-12-07T00:00:00Z' } } = {}) {
  const root = path.resolve(__dirname, '../..');
  const state = { userId: 'alice', anonymous: false, requests: [], finished: [], verified: [], connected: 0, purchases: [], outcome: 'purchased' };
  const listeners = { ok: new Set(), fail: new Set() };
  const iap = {
    initConnection: async () => { state.connected++; },
    fetchProducts: async () => [{
      id: MONTHLY, type: 'subs', displayPrice: '$99.00',
      subscriptionOffers: [
        { id: 'base', paymentMode: 'pay-as-you-go', offerTokenAndroid: 'tok-base' },
        { id: 'trial', paymentMode: 'free-trial', offerTokenAndroid: 'tok-trial' },
      ],
    }],
    purchaseUpdatedListener: (fn) => { listeners.ok.add(fn); return { remove: () => listeners.ok.delete(fn) }; },
    purchaseErrorListener: (fn) => { listeners.fail.add(fn); return { remove: () => listeners.fail.delete(fn) }; },
    isUserCancelledError: (e) => e.code === 'user-cancelled',
    requestPurchase: async (args) => {
      state.requests.push(args);
      setTimeout(() => {
        if (state.outcome === 'cancelled') for (const fn of [...listeners.fail]) fn({ code: 'user-cancelled', message: 'x' });
        else for (const fn of [...listeners.ok]) fn({ id: 'tx1', productId: MONTHLY, purchaseState: 'purchased', purchaseToken: 'gp-token-123' });
      }, 0);
    },
    finishTransaction: async ({ purchase }) => { state.finished.push(purchase.id); },
    getAvailablePurchases: async () => state.purchases,
  };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/billing.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const deps = (id) => {
    if (id === 'expo-modules-core') return { requireOptionalNativeModule: () => (native ? {} : null) };
    if (id === 'react-native') return { Platform: { OS: os } };
    if (id === 'expo-iap') return iap;
    if (id === './plans') return {};
    if (id === './supabase') return { supabase: {
      auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId, is_anonymous: state.anonymous } : null }, error: null }) },
      functions: { invoke: async (name, { body }) => { state.verified.push({ name, body }); return server ? { data: server, error: null } : { data: null, error: new Error('down') }; } },
    } };
    throw new Error(id);
  };
  const env = { EXPO_PUBLIC_PAID_PLANS_ENABLED: enabled ? 'true' : 'false', EXPO_PUBLIC_PRIVACY_URL: 'https://example.test/privacy', EXPO_PUBLIC_TERMS_URL: 'https://example.test/terms' };
  // `await import()` se transpila a require en CommonJS.
  new Function('require', 'module', 'exports', 'process', code)(deps, module, module.exports, { env });
  return { ...module.exports, state };
}

test('billing stays off until enabled and installed in the native client', async () => {
  for (const options of [{ enabled: false }, { native: false }]) {
    const f = fixture(options);
    assert.equal(f.billingAvailable(), false);
    await assert.rejects(f.loadPlanPackages('pro'), /pronto/);
    assert.equal(f.state.connected, 0);
  }
});

test('Android picks the free-trial offer and binds the purchase to the account', async () => {
  const f = fixture();
  const packages = await f.loadPlanPackages('pro');
  assert.deepEqual(packages.monthly, { productId: MONTHLY, priceString: '$99.00', offerToken: 'tok-trial', freeTrial: true });
  assert.equal(await f.purchasePlan('pro', packages.monthly), true);
  const request = f.state.requests[0].request;
  assert.equal(request.google.obfuscatedAccountId, 'alice');
  assert.equal(request.apple.appAccountToken, 'alice');
  assert.deepEqual(f.state.verified[0], { name: 'verify-purchase', body: { platform: 'android', productId: MONTHLY, purchaseToken: 'gp-token-123' } });
  assert.deepEqual(f.state.finished, ['tx1']);
});

test('a foreign product is refused before reaching the store', async () => {
  const f = fixture();
  await assert.rejects(f.purchasePlan('pro', { productId: 'otro', priceString: '$1', freeTrial: false }), /cambió/);
  assert.equal(f.state.requests.length, 0);
});

test('the transaction stays open when the server cannot confirm it', async () => {
  const f = fixture({ server: null });
  const packages = await f.loadPlanPackages('pro');
  await assert.rejects(f.purchasePlan('pro', packages.monthly), /Restaurar compras/);
  assert.deepEqual(f.state.finished, []);
});

test('cancelling is reported as a cancellation, not an error', async () => {
  const f = fixture();
  f.state.outcome = 'cancelled';
  const packages = await f.loadPlanPackages('pro');
  await assert.rejects(f.purchasePlan('pro', packages.monthly), (e) => e.userCancelled === true);
});

test('iOS sends the transaction id; anonymous sessions cannot buy or restore', async () => {
  const f = fixture({ os: 'ios' });
  const packages = await f.loadPlanPackages('pro');
  await f.purchasePlan('pro', packages.monthly);
  assert.deepEqual(f.state.verified[0].body, { platform: 'ios', productId: MONTHLY, transactionId: 'tx1' });
  f.state.anonymous = true;
  await assert.rejects(f.restorePlan('pro'), /Inicia sesión/);
});

test('restore only reports Pro when the server confirms an active purchase', async () => {
  const f = fixture({ server: { active: false, expiresAt: null } });
  f.state.purchases = [{ id: 'old', productId: MONTHLY, purchaseState: 'purchased', purchaseToken: 'gp-token-old' }, { id: 'x', productId: 'other' }];
  assert.equal(await f.restorePlan('pro'), false);
  assert.equal(f.state.verified.length, 1);
});
