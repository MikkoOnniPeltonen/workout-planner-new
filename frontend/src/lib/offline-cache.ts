import type { AuthUser } from '@workout-planner/shared';

const USER = 'workout-offline-user:v1';
const PREFIX = 'workout-api-cache:v1:';
let activeOwner: string | null = null;
export function currentOwner() {
  return activeOwner;
}
export function rememberUser(user: AuthUser) {
  activeOwner = user._id;
  try {
    localStorage.setItem(USER, JSON.stringify({ _id: user._id, name: user.name }));
  } catch {
    /* Offline metadata is best effort. */
  }
}
export function offlineUser(): AuthUser | null {
  try {
    const user = JSON.parse(localStorage.getItem(USER) ?? 'null');
    return user && typeof user._id === 'string' && typeof user.name === 'string'
      ? { ...user, email: '' }
      : null;
  } catch {
    return null;
  }
}
export function clearOfflineUser() {
  activeOwner = null;
  try {
    localStorage.removeItem(USER);
    for (const key of Object.keys(localStorage))
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
  } catch {
    /* Storage may be disabled. Server-side logout has still revoked access. */
  }
}
export function cacheKey(url: string, params: unknown) {
  return `${PREFIX}${activeOwner ?? 'public'}:${url}:${JSON.stringify(params ?? {})}`;
}
export function cacheResponse(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* Cache must not break network success. */
  }
}
export function cachedResponse(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}
