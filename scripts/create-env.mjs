// Creates backend/.env and frontend/.env from their .env.example files, with a freshly
// generated TOKEN_SECRET. Existing .env files are never overwritten.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

for (const app of ['backend', 'frontend']) {
  const target = path.join(root, app, '.env');
  if (existsSync(target)) {
    console.log(`${app}/.env already exists, left unchanged.`);
    continue;
  }

  const contents = readFileSync(path.join(root, app, '.env.example'), 'utf8').replace(
    /^TOKEN_SECRET=.*$/m,
    `TOKEN_SECRET=${randomBytes(48).toString('base64url')}`,
  );
  // Readable only by you: the file holds the token secret and the database password.
  writeFileSync(target, contents, { mode: 0o600 });
  console.log(`Created ${app}/.env`);
}

console.log(
  '\nNext: put your MongoDB connection string in backend/.env (MONGODB_URI), then run `pnpm seed`.',
);
