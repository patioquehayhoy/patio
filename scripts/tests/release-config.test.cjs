const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const test = require('node:test');

const configure = require('../../app.config.js');
const config = require('../../app.json').expo;
const names = ['EAS_BUILD_PLATFORM', 'EAS_BUILD_PROFILE', 'GOOGLE_MAPS_ANDROID_API_KEY', 'GOOGLE_SERVICES_JSON'];

function environment(values, run) {
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  for (const name of names) {
    if (values[name] === undefined) delete process.env[name];
    else process.env[name] = values[name];
  }
  try {
    run();
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}

test('iOS production does not require Android credentials', () => {
  environment({ EAS_BUILD_PLATFORM: 'ios', EAS_BUILD_PROFILE: 'production' }, () => {
    assert.equal(configure({ config }).ios.bundleIdentifier, config.ios.bundleIdentifier);
  });
});

test('local development resolves without production credentials', () => {
  environment({}, () => {
    assert.equal(configure({ config }).android.package, config.android.package);
  });
});

test('Android production refuses an absent or empty Maps key', () => {
  for (const value of [undefined, '   ']) {
    environment({ EAS_BUILD_PLATFORM: 'android', EAS_BUILD_PROFILE: 'production', GOOGLE_MAPS_ANDROID_API_KEY: value }, () => {
      assert.throws(() => configure({ config }), /GOOGLE_MAPS_ANDROID_API_KEY/);
    });
  }
});

test('Android production refuses missing Firebase client configuration', () => {
  environment({ EAS_BUILD_PLATFORM: 'android', EAS_BUILD_PROFILE: 'production', GOOGLE_MAPS_ANDROID_API_KEY: 'fixture-key' }, () => {
    assert.throws(() => configure({ config }), /GOOGLE_SERVICES_JSON/);
    process.env.GOOGLE_SERVICES_JSON = join(tmpdir(), 'patio-nonexistent-services', 'google-services.json');
    assert.throws(() => configure({ config }), /no existe/);
  });
});

test('native credentials preserve identifiers, plugins and EAS metadata', () => {
  const directory = mkdtempSync(join(tmpdir(), 'patio-release-config-'));
  const fixture = join(directory, 'google-services.json');
  // The resolver checks file availability; Firebase validates contents at build time.
  writeFileSync(fixture, '{}');
  try {
    environment({
      EAS_BUILD_PLATFORM: 'android', EAS_BUILD_PROFILE: 'production',
      GOOGLE_MAPS_ANDROID_API_KEY: ' fixture-key ', GOOGLE_SERVICES_JSON: fixture,
    }, () => {
      const result = configure({ config });
      assert.equal(result.android.config.googleMaps.apiKey, 'fixture-key');
      assert.equal(result.android.googleServicesFile, fixture);
      assert.equal(result.android.package, config.android.package);
      assert.deepEqual(result.plugins, config.plugins);
      assert.deepEqual(result.extra, config.extra);
      assert.equal(config.android.googleServicesFile, undefined);
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
