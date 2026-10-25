import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { HttpError } from '../utils/http-error.ts';
import { isDuplicateKeyError } from '../utils/mongo-errors.ts';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${error.path}.` });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const [firstError] = Object.values(error.errors);
    res.status(400).json({ message: firstError?.message ?? 'Invalid data.' });
    return;
  }

  if (isDuplicateKeyError(error)) {
    res.status(409).json({ message: 'That value is already taken.' });
    return;
  }

  // Errors raised by express.json() (malformed JSON, payload too large) are safe to expose.
  if (error?.expose && typeof error.status === 'number') {
    res.status(error.status).json({ message: error.message });
    return;
  }

  console.error(
    JSON.stringify({
      event: 'application_error',
      requestId: res.locals.requestId,
      kind: error instanceof Error ? error.name : 'UnknownError',
    }),
  );
  res.status(500).json({ message: 'Internal Server Error' });
};
