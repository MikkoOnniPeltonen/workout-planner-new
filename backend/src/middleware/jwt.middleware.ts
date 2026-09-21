import type { AuthUser } from '@workout-planner/shared';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { HttpError } from '../utils/http-error.ts';

const tokenPayloadSchema = z.object({
  _id: z.string(),
  email: z.string(),
  name: z.string(),
});

export function signToken(user: AuthUser): string {
  const payload: AuthUser = { _id: user._id, email: user.email, name: user.name };
  return jwt.sign(payload, env.TOKEN_SECRET, { algorithm: 'HS256', expiresIn: '6h' });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Token not provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.TOKEN_SECRET, { algorithms: ['HS256'] });
    req.payload = tokenPayloadSchema.parse(decoded);
  } catch {
    res.status(401).json({ message: 'Token not valid' });
    return;
  }

  next();
}

/** Returns the authenticated user. Only valid on routes behind `isAuthenticated`. */
export function getAuth(req: Request): AuthUser {
  if (!req.payload) {
    throw new HttpError(401, 'Not authenticated');
  }
  return req.payload;
}
