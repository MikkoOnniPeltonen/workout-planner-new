import mongoose from 'mongoose';
import { env } from './env.ts';

export const DEFAULT_DATABASE_NAME = 'workout-planner';

// Atlas copies connection strings without a database name, and MongoDB would then silently
// use "test". Returns undefined when the URI already names a database.
export function databaseName(uri: string): string | undefined {
  return /^mongodb(?:\+srv)?:\/\/[^/]+\/[^?]+/.test(uri) ? undefined : DEFAULT_DATABASE_NAME;
}

export async function connectDatabase(uri: string = env.MONGODB_URI) {
  const dbName = databaseName(uri);
  await mongoose.connect(uri, {
    ...(dbName ? { dbName } : {}),
    // Give up after 10 seconds instead of 30 when the database can't be reached.
    serverSelectionTimeoutMS: 10_000,
  });
  const { name, host } = mongoose.connection;
  console.log(`Connected to MongoDB database "${name}" on ${host}`);
}

// "connected", "connecting", "disconnected" and so on, straight from Mongoose.
export function databaseState(readyState: number = mongoose.connection.readyState): string {
  return mongoose.ConnectionStates[readyState] ?? 'unknown';
}

// Turns the most common connection failures into a next step. Never includes the URI,
// which holds the database password.
export function connectionHint(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : String(error);
  if (/bad auth|authentication failed/i.test(message)) {
    return 'The username or password in MONGODB_URI is wrong. If the password has special characters, URL-encode them, or set a letters-and-numbers password in Atlas under Database Access.';
  }
  if (/querySrv|ENOTFOUND|EREFUSED/.test(message)) {
    return 'The cluster address in MONGODB_URI could not be found. Copy the connection string from Atlas again and check your internet connection.';
  }
  if (/ECONNREFUSED/.test(message)) {
    return 'Nothing is listening at the address in MONGODB_URI. If you use a local MongoDB, make sure it is running.';
  }
  if (error instanceof Error && error.name === 'MongooseServerSelectionError') {
    return 'MongoDB did not answer in time. In Atlas, add your current IP address under Network Access, and check your internet connection.';
  }
  return undefined;
}

export function logConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not connect to MongoDB: ${message}`);
  const hint = connectionHint(error);
  if (hint) {
    console.error(`Hint: ${hint}`);
  }
}
