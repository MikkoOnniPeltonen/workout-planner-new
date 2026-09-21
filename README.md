# Workout Planner

A workout planner that adapts to what you actually did. Generate a workout in a few taps, log your sets at the gym, and let your history shape what comes next:

- **Progressive overload built in.** When every set of an exercise hit its reps last time, the logger suggests the next step up: +2.5 kg, +1 rep, or +5 seconds.
- **Recovery-aware generator.** The wizard recommends the muscle group you trained longest ago, avoids exercises you did in the last week, and matches the equipment you have today.
- **Made for the gym floor.** An installable app with a rest timer, big tap targets, and drafts that survive a refresh or a locked phone.

New here? The [step-by-step guide](docs/GUIDE.md) walks through setup with a free MongoDB Atlas database, everyday use, making changes and troubleshooting.

## Features

- **Accounts:** sign up and log in with JWT authentication. Password rules are shared between the API and the form.
- **Workouts:** build a workout by hand, or generate one from a primary focus, secondary focus, finisher and available equipment. Swap, remove or add exercises before saving.
- **Session logging:** follow a workout or log freestyle. Each exercise shows last time's sets; ticking a set fills in the target.
- **History:** every session grouped by week, with editing and deleting.
- **Statistics:** sessions, sets, volume and week streak compared with the previous period, weekly charts, sets per muscle group, and estimated one-rep-max records.
- **Exercise library:** searchable and filterable, with the muscle groups and equipment for each exercise.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, TanStack Query, React Router 7, React Hook Form, Radix UI, Recharts, lucide 1, framer-motion 13, vite-plugin-pwa |
| Backend | Node.js 22.18+ (runs TypeScript directly), Express 5, Mongoose 9, JWT, express-rate-limit |
| Shared | zod 4 schemas and TypeScript types in `packages/shared`, used by both apps |
| Tooling | pnpm 12 workspaces, TypeScript 7, Biome 2, Vitest 5, Testing Library, Supertest, mongodb-memory-server |

## Project structure

```
backend/          Express API (src/app.ts builds the app, src/server.ts starts it)
frontend/         React app
packages/shared/  Validation schemas and API types shared by both
scripts/          Repository scripts, such as creating the .env files
docs/             The step-by-step guide
```

## Prerequisites

- Node.js 24 (the version in `.nvmrc`); 22.18 or later also works.
- pnpm on your PATH. The version is pinned in `package.json`; run `corepack enable pnpm` once to get it (corepack ships with Node). With nvm, run it again after switching Node versions.
- A MongoDB 5.0+ database: a free [MongoDB Atlas](https://cloud.mongodb.com) cluster, or MongoDB running locally in Docker. The [guide](docs/GUIDE.md) covers both. Statistics use `$dateTrunc`, which needs 5.0.

## Getting started

```bash
pnpm install

# Create backend/.env (with a generated TOKEN_SECRET) and frontend/.env. Never overwrites.
pnpm run env:create

# Put your MongoDB connection string in backend/.env (MONGODB_URI), then load the
# muscle groups and exercises. Safe to run again at any time.
pnpm seed

# Start the API (http://localhost:3000) and the app (http://localhost:5173)
pnpm dev
```

See the [guide](docs/GUIDE.md) for creating the Atlas cluster and checking the data in MongoDB Compass.

### Environment variables

**backend/.env**

| Variable | Default | Description |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://localhost:27017/workout-planner` | MongoDB connection string. If it names no database, as Atlas strings don't, `workout-planner` is used |
| `TOKEN_SECRET` | none (required) | JWT signing secret, at least 32 characters. `pnpm run env:create` generates one |
| `PORT` | `3000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated list of allowed frontend origins. The example file also allows `http://localhost:4173` for `pnpm preview` |
| `TRUST_PROXY` | `0` | Number of reverse proxies in front of the API, so rate limiting sees client IPs |
| `NODE_ENV` | `development` | `development`, `test` or `production` |

The API validates these at startup and exits with a clear message if something is missing. If it can't reach the database, it says why and what to check.

**frontend/.env**

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_BACKEND_URL` | `http://localhost:3000` | Base URL of the API |

## Scripts

Run from the repository root:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts the API and the frontend together, in watch mode |
| `pnpm run env:create` | Creates missing `.env` files from the examples, with a generated `TOKEN_SECRET` |
| `pnpm seed` | Upserts muscle groups and exercises (ids stay stable) |
| `pnpm run check-data` | Prints which database you're connected to and how much data it holds |
| `pnpm test` | Runs every test suite |
| `pnpm typecheck` | Type-checks every package |
| `pnpm lint` | Lints with Biome |
| `pnpm check:fix` | Formats, organizes imports and applies safe lint fixes |
| `pnpm build` | Builds the frontend for production |
| `pnpm preview` | Builds the frontend, then serves it on http://localhost:4173 with the API, as in production |

Backend tests start an in-memory MongoDB, so they need no database. The first run downloads a MongoDB binary.

## API overview

Every route except health, auth, exercises and muscle groups needs an `Authorization: Bearer <token>` header. Users can only see and change their own data.

| Method and path | Description |
| --- | --- |
| `GET /health` | API status; 503 when the database is unreachable |
| `POST /auth/signup` | Create an account; returns `{ user, authToken }` |
| `POST /auth/login` | Log in; returns `{ user, authToken }` |
| `GET /auth/verify` | The user behind a token |
| `GET /exercises?muscleGroups=Legs,Back` | Exercises, optionally filtered by muscle group names (any casing) |
| `GET /musclegroups` | Muscle groups |
| `GET/POST /workouts`, `GET/PUT/DELETE /workouts/:id` | Workouts |
| `GET/POST /sessions`, `GET/PUT/DELETE /sessions/:id` | Logged sessions; the list pages with `?limit=&before=` |
| `GET /sessions/last-performance?exercises=<ids>` | Most recent sets for each exercise |
| `GET /sessions/stats?weeks=12&tz=Europe/Helsinki` | Weekly totals, streak, sets per muscle group, records |

## Upgrading an existing installation

- **Set a longer `TOKEN_SECRET`.** It must now be at least 32 characters. Existing tokens stop working, so users log in again.
- **Indexes update automatically.** Workout names are now unique per user instead of across all users, and the API updates the indexes when it starts.
- **Re-seeding is safe.** `pnpm seed` updates exercises in place instead of recreating them, so saved workouts keep their exercises.
