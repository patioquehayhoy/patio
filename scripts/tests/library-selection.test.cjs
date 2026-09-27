/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.resolve(__dirname, '../../lib/library-selection.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('module', 'exports', output)(loaded, loaded.exports);
const { resolveLibraryMoveSelection } = loaded.exports;

const collections = [
  { id: 'a', patioIds: ['shared', 'only-a'] },
  { id: 'b', patioIds: ['shared', 'only-b'] },
  { id: 'empty', patioIds: [] },
];
const resolve = (activeCollectionIds, selectedPatioIds) => resolveLibraryMoveSelection({
  collections, activeCollectionIds, selectedPatioIds,
});

test('moving from A preserves B as a destination when the place already belongs to both', () => {
  const scope = resolve(['a'], new Set(['shared']));
  assert.deepEqual(scope.sourceCollectionIds, ['a']);
  assert.deepEqual(scope.candidateSourceCollectionIds, ['a', 'b']);
  assert.deepEqual(scope.patioIds, ['shared']);
  assert.equal(scope.canMove, true);
  assert.equal(scope.requiresSourceChoice, false);
  assert.ok(!scope.sourceCollectionIds.includes('b'), 'B must remain a destination, not an inferred source');
});

test('Todos requires choosing sources without inferring removal from every membership', () => {
  const scope = resolve([], ['shared']);
  assert.deepEqual(scope.sourceCollectionIds, []);
  assert.deepEqual(scope.candidateSourceCollectionIds, ['a', 'b']);
  assert.deepEqual(scope.patioIds, ['shared']);
  assert.equal(scope.canMove, true);
  assert.equal(scope.requiresSourceChoice, true);
});

test('active or explicitly chosen sources must cover the entire selection', () => {
  const partial = resolve(['a'], ['only-a', 'only-b']);
  assert.equal(partial.canMove, false);
  assert.deepEqual(partial.unscopedPatioIds, ['only-b']);
  assert.deepEqual(partial.patioIds, []);
  assert.equal(partial.requiresSourceChoice, false);

  const complete = resolve(['a', 'b'], ['only-a', 'only-b']);
  assert.equal(complete.canMove, true);
  assert.deepEqual(complete.patioIds, ['only-a', 'only-b']);
  assert.deepEqual(complete.unscopedPatioIds, []);
});

test('Todos rejects a mixed selection containing a place with no list', () => {
  const scope = resolve([], ['shared', 'unlisted']);
  assert.equal(scope.canMove, false);
  assert.equal(scope.requiresSourceChoice, false);
  assert.deepEqual(scope.patioIds, []);
  assert.deepEqual(scope.unscopedPatioIds, ['unlisted']);
});

test('an empty selection or an active empty list never enables moving', () => {
  assert.equal(resolve(['a'], []).canMove, false);
  const emptyScope = resolve(['empty'], ['shared']);
  assert.deepEqual(emptyScope.sourceCollectionIds, ['empty']);
  assert.equal(emptyScope.canMove, false);
  assert.deepEqual(emptyScope.patioIds, []);
});

test('stale source filters are ignored and duplicate IDs are normalized without mutation', () => {
  const before = JSON.stringify(collections);
  const scope = resolve(['deleted', 'a', 'a'], ['shared', 'shared']);
  assert.deepEqual(scope.sourceCollectionIds, ['a']);
  assert.deepEqual(scope.patioIds, ['shared']);
  const staleOnly = resolve(['deleted'], ['shared']);
  assert.deepEqual(staleOnly.sourceCollectionIds, []);
  assert.equal(staleOnly.requiresSourceChoice, true);
  assert.equal(JSON.stringify(collections), before);
});
