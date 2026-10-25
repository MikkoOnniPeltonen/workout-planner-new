FROM node:24.22.1-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN MONGOMS_DISABLE_POSTINSTALL=1 pnpm install --frozen-lockfile
COPY . .
ENV VITE_BACKEND_URL=/api
RUN pnpm build
RUN pnpm --filter backend deploy --prod /runtime

FROM node:24.22.1-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 NODE_OPTIONS=--conditions=workout-production
WORKDIR /app/backend
COPY --from=build --chown=node:node /runtime/ ./
COPY --from=build --chown=node:node /app/frontend/dist /app/frontend/dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.ts"]
