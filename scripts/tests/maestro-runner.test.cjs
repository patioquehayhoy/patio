const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const runner = require.resolve('../../maestro/run-all.sh');

function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'patio-maestro-runner-'));
  const javaHome = path.join(directory, 'java');
  const maestro = path.join(directory, 'maestro');
  const output = path.join(directory, 'reports with spaces');
  fs.mkdirSync(path.join(javaHome, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(javaHome, 'bin/java'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(maestro, `#!/usr/bin/env bash
if [[ "$1" == "--version" ]]; then echo "fixture-maestro"; exit 0; fi
flow="$4"
while (( $# )); do
  if [[ "$1" == "--output" ]]; then report="$2"; shift; fi
  shift
done
printf '<testsuite/>\\n' > "$report"
echo "visible stderr from $(basename "$flow")" >&2
if [[ "$flow" == *fail.yaml ]]; then exit 7; fi
exit 0
`, { mode: 0o755 });
  for (const name of ['pass.yaml', 'fail.yaml']) fs.writeFileSync(path.join(directory, name), 'appId: test.fixture\n---\n');
  const invoke = (args = [], extraEnv = {}) => spawnSync('/bin/bash', [runner, ...args], {
    cwd: directory,
    encoding: 'utf8',
    env: { ...process.env, JAVA_HOME: javaHome, MAESTRO_BIN: maestro, MAESTRO_DEVICE_ID: '', MAESTRO_OUTPUT_DIR: output, ...extraEnv },
  });
  try { run({ directory, output, invoke }); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('Maestro runner rejects missing device instead of prompting in CI', () => fixture(({ invoke }) => {
  const result = invoke();
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Specify --device/);
  assert.doesNotMatch(result.stdout, /fixture-maestro/);
}));

test('Maestro runner aggregates failure, preserves stderr and continues remaining flows', () => fixture(({ directory, output, invoke }) => {
  const result = invoke(['--device', 'fixture-device', path.join(directory, 'fail.yaml'), path.join(directory, 'pass.yaml')]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /visible stderr from fail.yaml/);
  assert.match(result.stdout, /Flows passed: 1; failed: 1/);
  const runDir = path.join(output, fs.readdirSync(output)[0]);
  const summary = fs.readFileSync(path.join(runDir, 'summary.tsv'), 'utf8');
  assert.match(summary, /fail.yaml\tFAIL\t7\t/);
  assert.match(summary, /pass.yaml\tPASS\t0\t/);
  assert.ok(fs.existsSync(path.join(runDir, '1-fail/report.xml')));
  assert.ok(fs.existsSync(path.join(runDir, '2-pass/report.xml')));
  assert.match(fs.readFileSync(path.join(runDir, '1-fail/run.log'), 'utf8'), /visible stderr/);
}));

test('default smoke runs alone and repeated invocations keep separate reports', () => fixture(({ output, invoke }) => {
  for (let i = 0; i < 2; i += 1) {
    const result = invoke(['--device', 'fixture-device']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Flows passed: 1; failed: 0/);
  }
  const runs = fs.readdirSync(output);
  assert.equal(runs.length, 2);
  for (const run of runs) {
    const summary = fs.readFileSync(path.join(output, run, 'summary.tsv'), 'utf8');
    assert.match(summary, /release\/01-public-navigation.yaml\tPASS/);
    assert.equal(summary.trim().split('\n').length, 2);
  }
}));

test('missing flow is a preflight error and never becomes an empty successful suite', () => fixture(({ invoke }) => {
  const result = invoke(['--device', 'fixture-device', 'missing.yaml']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Flow not found/);
}));
