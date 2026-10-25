import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.TOKEN_SECRET = 'browser-test-secret-not-for-production-use';
process.env.CORS_ORIGIN = 'http://127.0.0.1:3100';
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('workout-e2e');
const { connectDatabase } = await import('../src/config/database.ts');
const { seedDatabase } = await import('../src/scripts/seed-data.ts');
const { createApp } = await import('../src/app.ts');
await connectDatabase();
await seedDatabase();
const server = createApp({ serveFrontend: true }).listen(3100, '127.0.0.1');
const shutdown = () =>
  server.close(() => {
    void mongo.stop().finally(() => process.exit(0));
  });
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
