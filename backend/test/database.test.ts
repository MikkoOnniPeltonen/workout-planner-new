import { describe, expect, it } from 'vitest';
import {
  connectionHint,
  DEFAULT_DATABASE_NAME,
  databaseName,
  databaseState,
} from '../src/config/database.ts';

describe('databaseState', () => {
  it('names the connection state, which the health check reports', () => {
    expect(databaseState(1)).toBe('connected');
    expect(databaseState(2)).toBe('connecting');
    expect(databaseState(0)).toBe('disconnected');
    expect(databaseState(42)).toBe('unknown');
  });
});

describe('databaseName', () => {
  it('keeps the database named in the URI', () => {
    expect(databaseName('mongodb://localhost:27017/workout-planner')).toBeUndefined();
    expect(
      databaseName('mongodb+srv://user:pass@cluster0.abc.mongodb.net/mydb?retryWrites=true'),
    ).toBeUndefined();
    expect(databaseName('mongodb://host1:27017,host2:27017/mydb?replicaSet=rs0')).toBeUndefined();
  });

  it('falls back to workout-planner when the URI names no database', () => {
    expect(
      databaseName('mongodb+srv://user:pass@cluster0.abc.mongodb.net/?retryWrites=true&w=majority'),
    ).toBe(DEFAULT_DATABASE_NAME);
    expect(databaseName('mongodb+srv://user:pass@cluster0.abc.mongodb.net')).toBe(
      DEFAULT_DATABASE_NAME,
    );
    expect(databaseName('mongodb://localhost:27017')).toBe(DEFAULT_DATABASE_NAME);
  });
});

describe('connectionHint', () => {
  it('explains a wrong username or password', () => {
    expect(connectionHint(new Error('bad auth : authentication failed'))).toMatch(
      /username or password/,
    );
  });

  it('explains an unknown cluster address', () => {
    const error = new Error('querySrv ENOTFOUND _mongodb._tcp.cluster0.abc.mongodb.net');
    expect(connectionHint(error)).toMatch(/could not be found/);
  });

  it('explains a local database that is not running', () => {
    expect(connectionHint(new Error('connect ECONNREFUSED 127.0.0.1:27017'))).toMatch(
      /make sure it is running/,
    );
  });

  it('points to the Atlas IP access list on a timeout', () => {
    const error = new Error('Could not connect to any servers in your MongoDB Atlas cluster.');
    error.name = 'MongooseServerSelectionError';
    expect(connectionHint(error)).toMatch(/Network Access/);
  });

  it('returns nothing for unrelated errors', () => {
    expect(connectionHint(new Error('Something else went wrong'))).toBeUndefined();
  });
});
