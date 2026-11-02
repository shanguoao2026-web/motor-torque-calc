import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const base = ['--power', '7.5', '--rpm', '1450'];

test('rated motor torque and angular velocity match check values', () => {
  const response = run(...base, '--json');
  assert.equal(response.status, 0, response.stderr);
  assert.equal(response.stderr, '');
  const data = JSON.parse(response.stdout);
  assert.equal(data.motorTorque.toFixed(2), '49.40');
  assert.equal(data.angularVelocity.toFixed(2), '151.84');
  assert.equal(data.outputSpeed, 1450);
  assert.equal(data.outputTorque, data.motorTorque);
  assert.equal(data.outputPower, 7.5);
  assert.equal('accelerationTime' in data, false);
});

test('gearbox check values', () => {
  const response = run(...base, '--ratio', '10', '--eff', '0.95', '--json');
  assert.equal(response.status, 0, response.stderr);
  const data = JSON.parse(response.stdout);
  assert.equal(data.outputSpeed.toFixed(1), '145.0');
  assert.equal(data.outputTorque.toFixed(2), '469.27');
  assert.equal(data.outputPower, 7.125);
});

test('acceleration time check value', () => {
  const response = run(...base, '--inertia', '0.5', '--accel-torque', '49.3966', '--json');
  assert.equal(response.status, 0, response.stderr);
  assert.equal(JSON.parse(response.stdout).accelerationTime.toFixed(3), '1.537');
});

test('default table includes units and formatted results', () => {
  const response = run(...base, '--ratio', '10', '--eff', '0.95', '--inertia', '0.5', '--accel-torque', '49.3966');
  assert.equal(response.status, 0, response.stderr);
  for (const pattern of [/Motor torque\s+49\.40\s+N·m/, /Angular velocity\s+151\.84\s+rad\/s/, /Output speed\s+145\.0\s+rpm/, /Output torque\s+469\.27\s+N·m/, /Output power\s+7\.125\s+kW/, /Acceleration time\s+1\.537\s+s/]) {
    assert.match(response.stdout, pattern);
  }
});

test('help works without required inputs', () => {
  const response = run('--help');
  assert.equal(response.status, 0);
  assert.match(response.stdout, /Usage:/);
  assert.match(response.stdout, /--accel-torque/);
  assert.equal(response.stderr, '');
});

for (const [label, args] of [
  ['efficiency above one', [...base, '--eff', '1.2']],
  ['inertia without torque', [...base, '--inertia', '0.5']],
  ['torque without inertia', [...base, '--accel-torque', '10']],
  ['ratio below one', [...base, '--ratio', '0.5']],
  ['missing inputs', []],
  ['missing rpm', ['--power', '7.5']],
  ['missing value', [...base, '--eff']],
  ['option as value', ['--power', '--rpm', '1450']],
  ['unknown option', [...base, '--wat']],
  ['positional argument', [...base, '10']],
  ['duplicate option', [...base, '--power', '8']],
  ['overflow result', ['--power', '1e308', '--rpm', '1e-300']],
]) {
  test(`rejects ${label}`, () => {
    const response = run(...args);
    assert.equal(response.status, 1);
    assert.equal(response.stdout, '');
    assert.match(response.stderr, /^Error: /);
  });
}

for (const option of ['power', 'rpm', 'ratio', 'eff', 'inertia', 'accel-torque']) {
  for (const value of ['0', '-1', 'NaN', 'Infinity', '1e309', '', 'abc', '0x10']) {
    test(`rejects invalid --${option} value ${JSON.stringify(value)}`, () => {
      const args = ['--power', '7.5', '--rpm', '1450', '--inertia', '0.5', '--accel-torque', '10'];
      const position = args.indexOf(`--${option}`);
      if (position >= 0) args[position + 1] = value;
      else args.push(`--${option}`, value);
      const response = run(...args);
      assert.equal(response.status, 1);
      assert.equal(response.stdout, '');
      assert.match(response.stderr, /^Error: /);
    });
  }
}

test('accepts scientific notation and boundary ratio and efficiency', () => {
  const response = run('--power', '7.5e0', '--rpm', '1.45e3', '--ratio', '1', '--eff', '1', '--json');
  assert.equal(response.status, 0, response.stderr);
  assert.equal(JSON.parse(response.stdout).motorTorque.toFixed(2), '49.40');
});
