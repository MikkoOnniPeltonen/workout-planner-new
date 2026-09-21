import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';

beforeAll(async () => {
  // A separate database per test file, so files can run in parallel on the shared server.
  await mongoose.connect(inject('mongoUri'), { dbName: `test_${randomUUID()}` });
  // Build indexes up front so unique constraints are enforced from the first test.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
