import type { AuthUser } from '@workout-planner/shared';

declare global {
  namespace Express {
    interface Request {
      /** Set by `isAuthenticated` once the bearer token has been verified. */
      payload?: AuthUser;
    }
  }
}
