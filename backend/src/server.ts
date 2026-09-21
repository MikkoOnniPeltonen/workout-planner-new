import mongoose from 'mongoose';
import { createApp } from './app.ts';
import { connectDatabase, logConnectionError } from './config/database.ts';
import { env } from './config/env.ts';

try {
  await connectDatabase();
} catch (error) {
  logConnectionError(error);
  process.exit(1);
}

try {
  // Drops indexes that are no longer declared in the schemas, such as the old
  // globally-unique workout name, and builds the new ones.
  await mongoose.syncIndexes();
} catch (error) {
  console.error('Could not update the database indexes:', error);
  process.exit(1);
}

let shuttingDown = false;

// The driver reconnects by itself; these lines make an outage visible in the logs.
mongoose.connection.on('disconnected', () => {
  if (!shuttingDown) console.warn('Lost the connection to MongoDB. Reconnecting…');
});
mongoose.connection.on('reconnected', () => console.log('Reconnected to MongoDB'));

const server = createApp().listen(env.PORT, (error) => {
  if (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
  console.log(`Server is running on http://localhost:${env.PORT}`);
});

function shutdown() {
  shuttingDown = true;
  server.close(() => {
    mongoose.disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
