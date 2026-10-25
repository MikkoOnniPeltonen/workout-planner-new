# Deployment and rollback

## Runtime

Use Node 24.22.1 or a newer patched Node 24 release. The repository pins the reviewed version in `.nvmrc` and Dockerfile. The build and runtime are one same-origin service: Express serves the compiled frontend and `/api`. Do not expose a Vite dev/preview server as the production application.

## Release steps

1. Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm typecheck`, `pnpm test`, `pnpm audit:security`, and `VITE_BACKEND_URL=/api pnpm build`.
2. Run browser tests against their disposable database. Review desktop and mobile views, keyboard navigation, loading/error states and pending-save recovery.
3. Take a MongoDB backup or snapshot and record the current image digest. Test restoration into a separate database before relying on backups.
4. Configure `MONGODB_URI`, a random `TOKEN_SECRET` of at least 32 characters, `NODE_ENV=production`, `CORS_ORIGIN=https://your-domain`, and the correct numeric `TRUST_PROXY` for your hosting topology. Never use a wildcard CORS origin. Set `DEMO_ENABLED=false` if you do not want public demo provisioning.
5. Build `docker build -t workout-planner:<release> .`. Run `docker run --rm --env-file /secure/path/workout.env workout-planner:<release> node src/scripts/indexes.ts` against the intended database. This creates indexes without dropping old ones. Audit existing duplicate data before resolving any unique-index build failure.
6. Seed catalogue data if necessary with the image command `node src/scripts/seed.ts`. Seeding updates catalogue entries in place.
7. Start the image behind an HTTPS reverse proxy on port 3000. Check `/api/health`, signup/login/logout, refreshing `/exercises` and `/dashboard`, and one complete training session before routing all traffic.

The app's Secure cookies require HTTPS in production. Do not disable this to work around an incorrectly configured proxy. Keep application and API on the same public origin. Set the proxy to stop accepting compressed request bodies if possible; the API rejects compressed JSON and limits uncompressed bodies to 100 KB.

## Monitoring

Configure your hosting provider's uptime check against `/api/health` every minute and alert on repeated failures. Forward JSON stdout/stderr logs into your provider's log service; alert on sustained 5xx rates. Each HTTP response carries `X-Request-ID`, also present in its request log. Set log retention and access restrictions. Do not add request-body or cookie logging. No external monitoring account or alert recipient is preconfigured in this repository.

Rate limiting currently uses an in-process store. Run a single API replica or introduce a shared rate-limit store before scaling horizontally. Apply an additional edge limit to `/api/auth/demo`, which creates expiring database records. Demo users, workouts and sessions have TTL indexes, and authentication rejects expired users before eventual TTL deletion. Review the demo quota and storage costs before public launch.

## Rollback

Route traffic back to the previously recorded image digest. Do not drop new indexes during emergency rollback. Verify health and authentication again. The switch to opaque cookie sessions requires users to sign in again; old JWT clients are not compatible with the new production API. Rolling back to an old binary does not restore revoked sessions or deleted records. Restore a database backup only after assessing writes since the snapshot and planning how to preserve them. Never run a destructive index sync as a rollback shortcut.

## Remaining launch work

Choose hosting and domain, configure MongoDB backups, configure the uptime/log alerts, publish the demo URL, and record the walkthrough. These require your accounts or real feedback; they are not represented as completed by local test results.
