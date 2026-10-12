/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'patio-dependencies-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

// Keep the installed consumer and its uuid resolution real. Only the ngrok
// process launcher and HTTP client are replaced so this never opens a tunnel.
function loadWithBoundaries(packageName, boundaries) {
  const filename = require.resolve(packageName);
  const requireFromConsumer = createRequire(filename);
  const module = { exports: {} };
  const requireDependency = (name) => Object.hasOwn(boundaries, name)
    ? boundaries[name]
    : requireFromConsumer(name);
  new Function('require', 'module', 'exports', fs.readFileSync(filename, 'utf8'))(
    requireDependency, module, module.exports,
  );
  return module.exports;
}

test('xcode can generate group IDs and roundtrip a project with its installed uuid', (t) => {
  const directory = temporaryDirectory(t);
  const filename = path.join(directory, 'project.pbxproj');
  // Minimal standalone fixture: no dependency on the ignored native project.
  fs.writeFileSync(filename, `// !$*UTF8*$!
{
  archiveVersion = 1;
  classes = {};
  objectVersion = 56;
  objects = {
/* Begin PBXGroup section */
    A00000000000000000000001 = {
      isa = PBXGroup;
      children = ();
      sourceTree = "<group>";
    };
/* End PBXGroup section */
/* Begin PBXProject section */
    A00000000000000000000002 = {
      isa = PBXProject;
      mainGroup = A00000000000000000000001;
      targets = ();
    };
/* End PBXProject section */
  };
  rootObject = A00000000000000000000002;
}
`);
  const xcode = require('xcode');
  const project = xcode.project(filename).parseSync();
  const ids = new Set(project.allUuids());
  for (let index = 0; index < 100; index++) {
    const group = project.addPbxGroup([], `Screens${index}`, `Screens${index}`);
    assert.match(group.uuid, /^[0-9A-F]{24}$/);
    assert.equal(ids.has(group.uuid), false);
    ids.add(group.uuid);
    project.addToPbxGroup(group.uuid, 'A00000000000000000000001');
  }
  fs.writeFileSync(filename, project.writeSync());
  // The parser returns objects without prototypes; editing methods create
  // ordinary objects. Compare the project data that the file can preserve.
  assert.deepEqual(
    JSON.parse(JSON.stringify(xcode.project(filename).parseSync().hash)),
    JSON.parse(JSON.stringify(project.hash)),
  );
});

test('ngrok generates a tunnel name and preserves an explicit name with its installed uuid', async (t) => {
  const directory = temporaryDirectory(t);
  const configPath = path.join(directory, 'ngrok.yml');
  fs.writeFileSync(configPath, 'tunnels: {}\n');
  const requests = [];
  class Client {
    async startTunnel(options) {
      requests.push({ ...options });
      return { public_url: 'https://isolated.invalid' };
    }
  }
  const ngrok = loadWithBoundaries('@expo/ngrok', {
    './src/client': { NgrokClient: Client },
    './src/process': { getProcess: async () => 'http://127.0.0.1:0' },
  });
  assert.equal(await ngrok.connect({ addr: 8081 }), 'https://isolated.invalid');
  const uuid = createRequire(require.resolve('@expo/ngrok'))('uuid');
  assert.equal(uuid.validate(requests[0].name), true);
  assert.equal(uuid.version(requests[0].name), 4);
  await ngrok.connect({ addr: 8081, name: 'existing-tunnel', configPath });
  assert.equal(requests[1].name, 'existing-tunnel');
});

for (const consumer of ['xcode', '@expo/ngrok']) {
  test(`${consumer} resolves uuid with the v3/v5/v6 buffer-bounds fix`, () => {
    const uuid = createRequire(require.resolve(consumer))('uuid');
    for (const version of ['v3', 'v5']) {
      assert.equal(uuid.validate(uuid[version]('Patio', uuid[version].DNS)), true);
      assert.throws(() => uuid[version]('Patio', uuid[version].DNS, new Uint8Array(15)), RangeError);
      assert.throws(() => uuid[version]('Patio', uuid[version].DNS, new Uint8Array(16), 1), RangeError);
    }
    assert.throws(() => uuid.v6({}, new Uint8Array(15)), RangeError);
    assert.throws(() => uuid.v6({}, new Uint8Array(16), 1), RangeError);
  });
}

test('Metro reads byte buffers and asset file paths using the corrected image-size API', async () => {
  const assets = require(path.join(path.dirname(require.resolve('metro/package.json')), 'src/Assets.js'));
  const icon = path.resolve(__dirname, '../../assets/images/p-icon.png');
  assert.deepEqual(assets.getAssetSize('png', fs.readFileSync(icon), icon), { width: 1024, height: 1024 });
  assert.throws(() => assets.getAssetSize('png', Buffer.alloc(0), icon), /empty file/);
  assert.equal(assets.getAssetSize('txt', Buffer.from('not an image'), 'text.txt'), null);
  const data = await assets.getAssetData(icon, 'assets/images/p-icon.png', [], 'ios', '/assets');
  assert.equal(data.width, 1024); assert.equal(data.height, 1024);
  assert.deepEqual(data.files, [icon]);
});
