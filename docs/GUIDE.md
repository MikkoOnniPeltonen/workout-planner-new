# Working with Workout Planner

A step-by-step guide to setting up the app on your computer, using it and changing it safely. For the feature overview and the API reference, see the [README](../README.md).

## How the pieces fit together

| Piece | What it is | Where |
| --- | --- | --- |
| App | The website you use | http://localhost:5173 |
| API | The server the app talks to. It handles logins and saves your data | http://localhost:3000 |
| Database | MongoDB Atlas, in the cloud. It stores accounts, workouts and logged sessions | Your Atlas cluster |
| MongoDB Compass | A viewer for the database, handy for looking at the data. The app doesn't need it | Your computer |

**Seeding** fills an empty database with the starter data the app needs: 7 muscle groups and 27 exercises. The workout generator and the exercise library pick from these. Seeding never touches accounts, workouts or logged sessions, and running it again only refreshes the exercises.

## One-time setup

### 1. Install the tools

1. Install Node.js 24. With nvm, run `nvm install` in the project folder; it reads the version from `.nvmrc`.
2. Turn on pnpm, which ships with Node:
   ```bash
   corepack enable pnpm
   ```
   If you switch Node versions with nvm, run this again for the new version.
3. Install the dependencies from the project folder:
   ```bash
   pnpm install
   ```

### 2. Create your settings files

```bash
pnpm run env:create
```

This creates `backend/.env`, with a random `TOKEN_SECRET` for signing logins, and `frontend/.env`. Existing files are never overwritten. Git ignores both files; don't commit or share them, because `backend/.env` will hold your database password.

### 3. Create a free Atlas database

1. Sign in at https://cloud.mongodb.com and create a project.
2. Create a cluster and choose **Free**. Pick a region near you.
3. Create a database user. Use a password with only letters and numbers; other characters have to be URL-encoded in the connection string.
4. Under **Network Access**, choose **Add My Current IP Address**.
5. Click **Connect → Drivers** and copy the connection string. Replace `<db_password>` with the user's password.
6. Optional: in Compass, click **New connection**, paste the string and connect. If it connects, the string is right.

### 4. Connect the API to Atlas

Open `backend/.env` and paste the string after `MONGODB_URI=`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

You don't need to add a database name. When the string doesn't include one, the app uses `workout-planner`.

### Instead of steps 3 and 4: a local database in Docker

To skip Atlas for now, run MongoDB on your computer with [Docker Desktop](https://www.docker.com/products/docker-desktop/):

```bash
docker run -d --name workout-planner-mongo --restart unless-stopped \
  -p 127.0.0.1:27017:27017 -v workout-planner-mongo-data:/data/db mongo:8
```

- Only your computer can reach it, and the data lives in the `workout-planner-mongo-data` volume, so it survives restarts.
- It starts by itself whenever Docker Desktop is running. If the API says `ECONNREFUSED 127.0.0.1:27017`, open Docker Desktop or run `docker start workout-planner-mongo`.
- Keep the default `MONGODB_URI=mongodb://localhost:27017/workout-planner` in `backend/.env`.
- In Compass, connect to `mongodb://localhost:27017`.
- To move to Atlas later, put your Atlas string in `MONGODB_URI` and run `pnpm seed`. Accounts and logged sessions stay in the local database; they aren't copied over.

### 5. Seed the database

```bash
pnpm seed
```

You should see `Seeded 7 muscle groups and 27 exercises into "workout-planner".` To double-check, run `pnpm run check-data`, or refresh Compass and open `workout-planner`: `musclegroups` has 7 documents and `exercises` has 27.

## Every day

1. Open a terminal in the project folder and run:
   ```bash
   pnpm dev
   ```
2. Wait until you see:
   - `Connected to MongoDB database "workout-planner" on …`
   - `Server is running on http://localhost:3000`
   - `Local: http://localhost:5173/`
3. Open http://localhost:5173.
4. To stop, press **Ctrl+C** in the terminal.

To check the API at any time, open http://localhost:3000/health. `"database":"connected"` means everything is up.

## Using the app

1. **Sign up.** The password hints update as you type, and you're logged in straight away.
2. **Get a workout.** On **Workouts**:
   - **Generate a plan** walks you through the primary focus, secondary focus, finisher and equipment. The muscle group you trained longest ago is marked **Recommended**. On the last step, shuffle, add or remove exercises, then save.
   - **New workout** lets you pick the exercises yourself.
3. **Train.** Press **Start workout** on a workout card.
   - Each exercise shows **Last time** with your previous sets. A badge such as **+2.5 kg** means you completed every set last time, so the target goes up.
   - Enter the reps and weight, or the time, and tick the set. The rest timer starts; change it with **−15 s** and **+15 s**, or press **Skip**.
   - If you refresh or your phone locks, your progress is kept. When you come back, choose **Keep it** or **Discard**.
   - Press **Save session** when you're done. If some sets aren't ticked, you can save only the ticked ones or mark them all as done.
4. **No plan today?** On **History**, choose **Log freestyle session**. On a phone, use the **Log** tab.
5. **History** lists your sessions by week. Edit or delete them there.
6. **Stats** shows sessions, sets, volume and your week streak for the last 4 weeks, 12 weeks or 6 months, plus sets per muscle group and personal records. **Show as table** lists the numbers behind each chart.
7. **Exercises** is the searchable exercise library.

### Install it as an app

Installing only works with a production build. Run `pnpm preview`, open http://localhost:4173 and use your browser's install option, such as the install icon in Chrome's address bar.

## Making changes safely

1. Create a branch:
   ```bash
   git switch -c my-change
   ```
2. Run `pnpm dev`. The app reloads as you edit, and the API restarts.
3. Before committing, run:
   ```bash
   pnpm check:fix   # formats the code and fixes lint issues
   pnpm typecheck   # finds type errors
   pnpm test        # runs every test
   ```
   The tests use a temporary in-memory database, so they never touch Atlas.
4. Commit your changes.

Every commit records a name and an email. To keep your personal address out of public commits, use the no-reply address GitHub gives you, found under GitHub → **Settings → Emails**. On the same page, turn on **Keep my email addresses private** and **Block command line pushes that expose my email**.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| `bad auth : authentication failed` | The username or password in `MONGODB_URI` is wrong. Reset the password in Atlas under **Database Access**, using only letters and numbers. |
| `Could not connect to any servers…`, or a hint about Network Access | Atlas doesn't allow your IP address. Go to **Network Access → Add My Current IP Address**. This usually happens after changing networks. |
| `querySrv ENOTFOUND` | The cluster address is wrong, or you're offline. Copy the connection string from Atlas again. |
| `TOKEN_SECRET must be at least 32 characters` | If `backend/.env` is missing, run `pnpm run env:create`. Otherwise, set a longer `TOKEN_SECRET` in `backend/.env`. |
| `pnpm: command not found` | Run `corepack enable pnpm`. With nvm, run it again after `nvm use`. |
| `EADDRINUSE` on port 3000, or Vite picks a port other than 5173 | Something else uses the port: this app in another terminal, or a different app. Stop it, or give the API another port: set `PORT=3001` in `backend/.env` and `VITE_BACKEND_URL=http://localhost:3001` in `frontend/.env`, then restart `pnpm dev`. |
| The exercise library or the generator is empty | Run `pnpm seed`. |
| The app can't reach the API | Check that `pnpm dev` is running and the API started without errors. If you open the app from a different address, add it to `CORS_ORIGIN` in `backend/.env`. |
| Everyone was logged out | `TOKEN_SECRET` changed. Log in again. |

## Keeping things up to date

- `pnpm outdated -r` lists newer versions of the dependencies.
- `pnpm update -r` updates them within the allowed version ranges. Before a major version upgrade, read the package's release notes.
- After any update, run `pnpm typecheck`, `pnpm test` and `pnpm build`.
- `pnpm seed` is safe to run again whenever the exercise list changes.
