import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/unused-in-tests',
      TOKEN_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      CORS_ORIGIN: 'http://localhost:5173',
    },
    testTimeout: 30_000,
    // The first run downloads a MongoDB binary for mongodb-memory-server.
    hookTimeout: 180_000,
  },
});
