# motor-torque-calc

A TypeScript CLI for electric motor torque, gearbox output, and acceleration time. Requires Node.js 18+ and npm. No runtime dependencies.

```sh
npm install
npm run build
node dist/cli.js --help
npm test
```

`npm test` builds the CLI and runs tests using `node:test`.

```sh
node dist/cli.js --power 7.5 --rpm 1450
node dist/cli.js --power 7.5 --rpm 1450 --ratio 10 --eff 0.95
node dist/cli.js --power 7.5 --rpm 1450 --inertia 0.5 --accel-torque 49.3966 --json
```

After `npm link`, the command is also available as `motor-torque-calc`.

| Option | Meaning | Default |
| --- | --- | --- |
| `--power P` | Motor shaft power in kW, positive | Required |
| `--rpm n` | Motor shaft speed in rpm, positive | Required |
| `--ratio i` | Reduction ratio, at least 1 | 1 |
| `--eff eta` | Gearbox efficiency, greater than 0 and at most 1 | 1 |
| `--inertia J` | Inertia referred to motor shaft, kg·m², positive | Omitted |
| `--accel-torque Ta` | Constant net accelerating torque, N·m, positive | Omitted |
| `--json` | Numeric JSON output | Table output |
| `--help` | Usage information | |

Supply `--inertia` and `--accel-torque` together. All numeric inputs must be finite; decimal and scientific notation are accepted. Invalid inputs produce an error on stderr and exit code 1. Successful commands exit with code 0.

Calculations:

- Motor torque: `T = 9550 * P / n` in N·m (using the specified approximate conversion constant).
- Angular velocity: `omega = 2 * pi * n / 60` in rad/s.
- Output speed: `n / i` in rpm.
- Output torque: `T * i * eta` in N·m.
- Output power: `P * eta` in kW.
- Acceleration time: `t = J * omega / Ta` in seconds, from standstill to rated speed under constant net accelerating torque.

The gearbox example gives 49.40 N·m motor torque, 151.84 rad/s, 145.0 rpm output speed, 469.27 N·m output torque, and 7.125 kW output power. The acceleration example gives 1.537 s.

Table output rounds torque and angular velocity to two decimals, speed to one, and power and time to three. JSON retains numeric precision and uses `motorTorque` (N·m), `angularVelocity` (rad/s), `outputSpeed` (rpm), `outputTorque` (N·m), `outputPower` (kW), and optional `accelerationTime` (s). Without acceleration inputs, that key is omitted. Inputs whose calculated results exceed the supported finite positive numeric range are rejected.

Licensed under the MIT License; see LICENSE.
