const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function fixture({ enabled = true, native = true } = {}) {
  const root = path.resolve(__dirname, '../..');
  const state = { userId: 'alice', purchased: [], restored: 0, configured: false, sdkUser: null, changeDuringPurchase: false };
  const item = { identifier: '$rc_monthly', product: { identifier: 'patio_pro_monthly', priceString: '$99.00' } };
  const sdk = {
    isConfigured: async () => state.configured,
    configure: ({ appUserID }) => { state.configured = true; state.sdkUser = appUserID; },
    getAppUserID: async () => state.sdkUser,
    logIn: async (id) => { state.sdkUser = id; },
    getOfferings: async () => ({ all: { patio_pro: { monthly: item, availablePackages: [item] } } }),
    purchasePackage: async (value) => {
      state.purchased.push(value);
      if (state.changeDuringPurchase) state.userId = 'bob';
      return { customerInfo: { entitlements: { active: { patio_pro: {} } } } };
    },
    restorePurchases: async () => { state.restored++; return { entitlements: { active: {} } }; },
  };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/billing.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const deps = (id) => {
    if (id === 'react-native') return { NativeModules: native ? { RNPurchases: {} } : {}, Platform: { OS: 'ios' } };
    if (id === 'react-native-purchases') return sdk;
    if (id === './plans') return { PLANS: { pro: { entitlement: 'patio_pro', offering: 'patio_pro' } } };
    if (id === './supabase') return { supabase: { auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null }, error: null }) } } };
    throw new Error(id);
  };
  const processFixture = { env: { EXPO_PUBLIC_PAID_PLANS_ENABLED: enabled ? 'true' : 'false', EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: 'fixture', EXPO_PUBLIC_PRIVACY_URL: 'https://example.test/privacy', EXPO_PUBLIC_TERMS_URL: 'https://example.test/terms' } };
  new Function('require', 'module', 'exports', 'process', code)(deps, module, module.exports, processFixture);
  return { ...module.exports, state, item };
}

test('billing stays unavailable until explicitly enabled and installed in the native client', async () => {
  for (const options of [{ enabled: false }, { native: false }]) {
    const f = fixture(options);
    assert.equal(f.billingAvailable(), false);
    await assert.rejects(f.loadPlanPackages('pro'), /pronto/);
    assert.equal(f.state.configured, false);
  }
});
test('checkout binds purchases to the authenticated UUID and only accepts the plan offering', async () => {
  const f = fixture();
  assert.equal((await f.loadPlanPackages('pro')).monthly, f.item);
  assert.equal(f.state.sdkUser, 'alice');
  await assert.rejects(f.purchasePlan('pro', { ...f.item, product: { identifier: 'foreign_product' } }), /cambió/);
  assert.equal(f.state.purchased.length, 0);
  assert.equal(await f.purchasePlan('pro', f.item), true);
  assert.equal(f.state.purchased.length, 1);
});
test('restoration cannot claim Pro without an active entitlement and follows account changes', async () => {
  const f = fixture();
  await f.loadPlanPackages('pro');
  f.state.userId = 'bob';
  assert.equal(await f.restorePlan('pro'), false);
  assert.equal(f.state.sdkUser, 'bob');
  f.state.userId = null;
  await assert.rejects(f.restorePlan('pro'), /Inicia sesión/);
  assert.equal(f.state.restored, 1);
});
test('a purchase finishing after the account changed cannot announce activation for the new account', async () => {
  const f = fixture();
  f.state.changeDuringPurchase = true;
  await assert.rejects(f.purchasePlan('pro', f.item), /cuenta cambió/);
});
