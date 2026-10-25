import { createHmac, randomBytes } from 'node:crypto';
import type { AuthUser } from '@workout-planner/shared';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { AuthSession } from '../models/AuthSession.model.ts';
import { User } from '../models/User.model.ts';
import { HttpError } from '../utils/http-error.ts';

const COOKIE = env.NODE_ENV === 'production' ? '__Host-workout-session' : 'workout-session';
const LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

function sessionToken(req: Request): string | undefined {
  const value = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}
function hash(token: string) {
  return createHmac('sha256', env.TOKEN_SECRET).update(token).digest('hex');
}
export async function issueSession(res: Response, user: AuthUser) {
  const token = randomBytes(32).toString('hex');
  const account = await User.findById(user._id);
  const lifetime = Math.min(
    LIFETIME_MS,
    account?.expiresAt ? Math.max(0, account.expiresAt.getTime() - Date.now()) : LIFETIME_MS,
  );
  await AuthSession.create({
    tokenHash: hash(token),
    user: user._id,
    expiresAt: new Date(Date.now() + lifetime),
  });
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: lifetime });
  res.set('Cache-Control', 'no-store');
}
export async function revokeSession(req: Request, res: Response) {
  const token = sessionToken(req);
  if (token) await AuthSession.deleteOne({ tokenHash: hash(token) });
  res.clearCookie(COOKIE, cookieOptions);
}
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = sessionToken(req);
  if (!token) throw new HttpError(401, 'Please sign in to continue.');
  const session = await AuthSession.findOne({
    tokenHash: hash(token),
    expiresAt: { $gt: new Date() },
  });
  const user = session && (await User.findById(session.user));
  if (!user || (user.expiresAt && user.expiresAt.getTime() <= Date.now()))
    throw new HttpError(401, 'Your session expired. Please sign in again.');
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.get('X-Session-Owner') &&
    req.get('X-Session-Owner') !== String(user._id)
  )
    throw new HttpError(409, 'The signed-in account changed. Reload before saving.');
  req.payload = { _id: String(user._id), email: user.email, name: user.name };
  res.set('Cache-Control', 'no-store');
  next();
}
export function getAuth(req: Request): AuthUser {
  if (!req.payload) throw new HttpError(401, 'Not authenticated');
  return req.payload;
}

// A custom header forces a CORS preflight; HTML forms cannot supply it. Validate
// browser origins as well, including login, to prevent login CSRF. CLI clients
// without Origin must still opt in with the header. Cookies are SameSite=Strict.
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('Origin');
  if (req.get('X-CSRF-Protection') !== '1' || (origin && !env.CORS_ORIGIN.includes(origin))) {
    throw new HttpError(403, 'Request origin could not be verified.');
  }
  next();
}
