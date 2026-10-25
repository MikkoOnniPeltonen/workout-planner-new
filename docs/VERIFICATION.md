# Verification — 25 October 2026

Verified locally with Node **24.22.1**, using a checksum-verified temporary runtime. The machine's system Node installation was not changed. Run `nvm install` from the repository to install/select the version pinned in `.nvmrc`.

| Check | Result |
| --- | --- |
| Shared schema/domain tests | 12 passed |
| Backend API/integration tests | 51 passed against disposable MongoDB |
| Frontend component/domain/outbox tests | 41 passed |
| Browser journeys | 6 passed: three journeys in desktop and mobile Chromium emulation |
| Type checking | All workspace packages passed |
| Biome formatting/import/lint checks | Passed |
| Production frontend/shared build | Passed |
| Frozen lockfile install | Passed |
| Dependency audit | Zero known advisories at review time; initial audit reported 33 |
| Deployed production dependency package | Imports and application initialization passed |
| Production smoke test | Explicit indexes, SPA routes, API readiness, signup, secure cookie attributes and session verification passed against disposable MongoDB |
| Screenshots | Desktop/mobile homepage and statistics captured and visually inspected |

The browser journeys cover an isolated populated demo, signup and plan creation, draft recovery, a lost response after a successful database write, offline save/reload/reconnect, and logout. API tests cover cross-user isolation, duplicate retries, conflicting request IDs, stable pagination with equal timestamps, stale edits, full-window recency, expiry, and CSRF. A component regression preserves an edit's original revision through reload and updates it only when the user discards the draft.

Mobile tests use Chromium device emulation; no physical phone or Safari/WebKit validation is claimed. Screenshots contain generated sample training data. Dependency audits change as new advisories are published.

Docker's daemon was unavailable locally, so a complete container build/run was not verified. The production deployment package and actual production-mode server were tested separately. CI configuration is checked in but has not run on GitHub in this session. Public hosting, domain, external monitoring/alerts, walkthrough video and real-user validation remain launch work requiring the owner's services or feedback.
