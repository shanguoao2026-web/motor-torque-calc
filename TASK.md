# motor-torque-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) for electric motor torque / gearbox output / acceleration time.

Features:
- Inputs: --power P (kW), --rpm n; optional --ratio i (>=1) and --eff η (0<η≤1, default 1) for a gearbox; optional --inertia J (kg·m², at motor shaft) with --accel-torque Ta (N·m) to compute acceleration time t = J·ω/Ta from standstill to rated speed.
- Outputs: motor torque T = 9550·P/n (N·m), ω (rad/s), output speed n/i, output torque T·i·η, output power P·η, acceleration time.
- Validate finite positive numbers; errors to stderr with exit 1. --inertia and --accel-torque must be given together.
- Table output by default, --json, --help. README with examples, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log.
- npm test must build and pass. No secrets, no personal info.

Check values (must be in tests):
- 7.5 kW 1450 rpm → T 49.40 N·m, ω 151.84 rad/s.
- + --ratio 10 --eff 0.95 → output 145.0 rpm, output torque 469.27 N·m, output power 7.125 kW.
- --inertia 0.5 --accel-torque 49.3966 → t 1.537 s.
- --eff 1.2 → exit 1; --inertia without --accel-torque → exit 1.
