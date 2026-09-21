import mongoose from 'mongoose';
import { connectDatabase, logConnectionError } from '../config/database.ts';
import { seedDatabase } from './seed-data.ts';

try {
  await connectDatabase();
} catch (error) {
  logConnectionError(error);
  process.exit(1);
}

try {
  const result = await seedDatabase();
  console.log(
    `Seeded ${result.muscleGroups} muscle groups and ${result.exercises} exercises into "${mongoose.connection.name}".`,
  );
} catch (error) {
  console.error('Error seeding data:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
