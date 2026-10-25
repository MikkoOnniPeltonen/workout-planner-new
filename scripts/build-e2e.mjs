import { spawnSync } from 'node:child_process';

const result = spawnSync('pnpm', ['build'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_BACKEND_URL: '/api' },
});
process.exit(result.status ?? 1);
