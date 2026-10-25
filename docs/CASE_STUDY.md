# Workout Planner — portfolio case study

## Problem

A workout app needs to be useful between sets: quick inputs, clear targets, and reliable handling of a connection that disappears inside a gym. The product connects planning, completed training and the next session rather than treating them as unrelated CRUD screens.

## What I built

A React and TypeScript PWA with an Express API and MongoDB persistence. Shared Zod schemas validate forms and API requests. Users generate equipment-aware plans, log weighted or timed sets, compare previous performance and inspect weekly training statistics. Each demo visitor receives a separate account with sample history.

## Engineering decisions to discuss

1. **Lost-response recovery:** an account-scoped immutable outbox plus a unique database index makes retrying a committed write safe. A browser journey deliberately drops a response after the server commits it, then checks that only one session exists.
2. **Concurrent editing:** a conditional database update rejects an old revision. Draft recovery preserves the revision the edit started from.
3. **Authentication:** revocable server sessions keep credentials out of browser storage, while cookie settings and CSRF protection cover separate threats.
4. **History correctness:** a timestamp plus ID cursor handles ties; workout-name snapshots preserve historical meaning when a plan changes.
5. **Time zones:** aggregations bucket training into the user's local weeks, with regression tests around calendar boundaries.

## Evidence

The repository includes API integration tests against a disposable MongoDB, component and domain tests, desktop/mobile browser journeys, dependency auditing, a CI workflow and a documented same-origin deployment. Use current test output rather than a hard-coded historic test count in applications.

## Walkthrough recording script

- Open the image-led homepage and enter the demo without signup.
- Show an existing workout and 12 weeks of sample statistics.
- Generate an equipment-aware plan and explain the visible recency heuristic.
- Start a workout, log a set, refresh and show the restored draft.
- Interrupt a save, reconnect and show one persisted session.
- Briefly open the architecture diagram, idempotency test and CI results.

Aim for a short recording that shows the product before opening code. Publish the real demo and video URLs at the top of the README once hosting and recording are complete.

## User validation to run

Observe several people logging a real workout. Record consented, anonymized notes: time to first logged set, recovery after interruption, confusing inputs and whether progression suggestions make sense. Capture before/after evidence for changes. No user counts, retention claims or performance improvements are claimed until measured.

## CV wording

“Built a full-stack workout PWA with React, TypeScript, Express and MongoDB, implementing shared validation, revocable cookie authentication, retry-safe session logging, concurrent-edit protection and time-zone-aware training analytics; verified with API, component and desktop/mobile browser tests.”

Use only the capabilities verified in the final check results. Add real adoption or performance measurements after collecting them.
