# Security review — 25 October 2026

The initial registry audit reported 33 advisories: 1 critical, 11 high, 16 moderate and 5 low across production and development dependencies. These are registry findings, not evidence of successful exploitation or proof that every advisory path was reachable in this app.

Compatible workspace upgrades include Express 5.3, Mongoose 9.11, React 19.3.1, Vite 8.3.5, Vitest 5.0.5, Axios 1.20 and Zod 4.6.7. Transitive updates include patched proxy address handling, request parsing, redirect handling and toolchain packages. Unused JWT and request-logger dependencies were removed. The post-upgrade audit returned zero known advisories; rerun `pnpm audit:security` because that result is time-dependent.

Node's [21 October security release](https://nodejs.org/en/blog/release/v24.22.1) patches DNS/TLS and Brotli issues, among others. `.nvmrc`, engine requirements and Docker now target 24.22.1. Updating this repository does not upgrade a developer's or hosting provider's installed Node binary. A checksum-verified temporary runtime can be used for local validation.

The installed Vite 8.3.0 was in the affected range for [GHSA-rq7h-c2jc-7f22](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22), fixed in 8.3.3. Its described exposure requires specific dev-server conditions. The app uses client-rendered React, with no React Server Components packages or server-function endpoints; RSC advisories must not be assumed to apply merely because React is installed.

## Application controls

- Opaque random session cookies; Secure and `__Host-` prefix in production, HttpOnly and SameSite=Strict everywhere. Only HMAC verifiers are stored in MongoDB.
- Explicit session revocation on logout and expiry checks independent of TTL cleanup. Old localStorage JWTs are removed on client startup.
- Custom CSRF header and Origin allowlist for writes, including login. CORS allows credentials only for configured origins.
- Password hashing with bcrypt, a 12-character signup minimum and 72-byte UTF-8 maximum to avoid silent truncation. Existing accounts can still authenticate with their existing passwords.
- Strict request validation, owner-scoped database operations, payload limits, no compressed request bodies, Helmet, API/auth/demo rate limits, and no credential logging.
- Pending-write account binding, server-side deduplication and atomic revision checks.
- Read-only CI permissions and official GitHub Actions pinned to release commit hashes, automated dependency review via weekly Dependabot updates, and an audit gate that fails on known advisories.

## Trust boundaries and limitations

Browser caches and pending saves are local training data, not authenticated server state. They are readable by scripts running on the same origin and by someone with access to the browser profile. No credentials are stored there, and explicit logout clears the read cache and offline identity. Drafts and outbox data remain account-scoped so logout cannot silently discard an interrupted workout. Clearing browser storage removes those local copies. XSS prevention and shared-device privacy still matter; HttpOnly cookies are not a complete defense against hostile same-origin scripts.

MongoDB must not be publicly writable. Restrict its network access and application database permissions. Protect backups and environment secrets in the hosting provider. Rate limits use a process-local store and need shared storage before multiple replicas. This review and a clean dependency audit are not a penetration test or a guarantee of absence of vulnerabilities.

Report security issues privately to the repository owner's verified contact channel. Do not post credentials, database URLs, exploit payloads or personal training data in public issues.
