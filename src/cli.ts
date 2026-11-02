#!/usr/bin/env node

const help = `Usage: motor-torque-calc --power P --rpm n [options]

Calculate electric motor torque and gearbox output.

  --power P          Motor power in kW (required, > 0)
  --rpm n            Motor speed in rpm (required, > 0)
  --ratio i          Gear reduction ratio (>= 1, default 1)
  --eff eta          Gearbox efficiency (0 < eta <= 1, default 1)
  --inertia J        Inertia at motor shaft in kg·m² (> 0)
  --accel-torque Ta  Net accelerating torque in N·m (> 0)
                     Supply inertia and accel-torque together
  --json             Print numeric results as JSON
  --help             Show this help
`;

const numericOptions = new Set(['power', 'rpm', 'ratio', 'eff', 'inertia', 'accel-torque']);

function main(args: string[]): void {
  const values = new Map<string, number>();
  const flags = new Set<string>();
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--help' || arg === '--json') {
      if (flags.has(arg)) throw new Error(`Duplicate option: ${arg}`);
      flags.add(arg);
      continue;
    }
    const name = arg.startsWith('--') ? arg.slice(2) : '';
    if (!numericOptions.has(name)) throw new Error(`Unknown option: ${arg}`);
    if (values.has(name)) throw new Error(`Duplicate option: ${arg}`);
    const raw = args[++index];
    if (raw === undefined || raw.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    // Accept decimal/scientific notation, rejecting empty strings and hexadecimal.
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      throw new Error(`${arg} must be a finite positive number`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${arg} must be a finite positive number`);
    values.set(name, value);
  }
  if (flags.has('--help')) {
    process.stdout.write(help);
    return;
  }
  const power = values.get('power');
  const rpm = values.get('rpm');
  if (power === undefined || rpm === undefined) throw new Error('--power and --rpm are required');
  const ratio = values.get('ratio') ?? 1;
  const efficiency = values.get('eff') ?? 1;
  if (ratio < 1) throw new Error('--ratio must be >= 1');
  if (efficiency > 1) throw new Error('--eff must be <= 1');
  const inertia = values.get('inertia');
  const accelTorque = values.get('accel-torque');
  if ((inertia === undefined) !== (accelTorque === undefined)) {
    throw new Error('--inertia and --accel-torque must be given together');
  }
  const motorTorque = 9550 * (power / rpm);
  const angularVelocity = (rpm / 60) * (2 * Math.PI);
  const result = {
    motorTorque,
    angularVelocity,
    outputSpeed: rpm / ratio,
    outputTorque: motorTorque * ratio * efficiency,
    outputPower: power * efficiency,
    ...(inertia !== undefined && accelTorque !== undefined
      ? { accelerationTime: (inertia / accelTorque) * angularVelocity }
      : {}),
  };
  if (Object.values(result).some(value => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Inputs produce results outside the supported numeric range');
  }
  if (flags.has('--json')) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  const rows: [string, number, number, string][] = [
    ['Motor torque', result.motorTorque, 2, 'N·m'],
    ['Angular velocity', result.angularVelocity, 2, 'rad/s'],
    ['Output speed', result.outputSpeed, 1, 'rpm'],
    ['Output torque', result.outputTorque, 2, 'N·m'],
    ['Output power', result.outputPower, 3, 'kW'],
  ];
  if (result.accelerationTime !== undefined) rows.push(['Acceleration time', result.accelerationTime, 3, 's']);
  process.stdout.write(`${'Quantity'.padEnd(22)} ${'Value'.padStart(14)}  Unit\n`);
  for (const [label, value, decimals, unit] of rows) {
    process.stdout.write(`${label.padEnd(22)} ${value.toFixed(decimals).padStart(14)}  ${unit}\n`);
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
