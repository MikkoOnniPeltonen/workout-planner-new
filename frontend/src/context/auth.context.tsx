import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, AuthUser } from '@workout-planner/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { setUnauthorizedHandler } from '@/lib/api';
import { clearOfflineUser, offlineUser, rememberUser } from '@/lib/offline-cache';
import authService from '@/services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** True while a stored token is being verified on startup. */
  isLoading: boolean;
  logIn: (auth: AuthResponse) => void;
  logOut: () => Promise<void>;
  sessionUnavailable: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const authEpoch = useRef(0);
  const identity = useRef<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sessionUnavailable, setSessionUnavailable] = useState(false);

  const logIn = useCallback(
    (auth: AuthResponse) => {
      authEpoch.current += 1;
      setIsLoading(false);
      setSessionUnavailable(false);
      queryClient.clear();
      identity.current = auth.user._id;
      rememberUser(auth.user);
      setUser(auth.user);
    },
    [queryClient],
  );

  const clearUser = useCallback(() => {
    authEpoch.current += 1;
    identity.current = null;
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const logOut = useCallback(async () => {
    // Keep the session visible when revocation fails so logout is never misleading.
    await authService.logout();
    clearOfflineUser();
    queryClient.clear();
    // Reload after revocation to clear all in-memory state and avoid a guard redirect race.
    window.location.assign('/');
  }, [queryClient]);

  useEffect(() => setUnauthorizedHandler(clearUser), [clearUser]);

  useEffect(() => {
    try {
      localStorage.removeItem('authToken');
    } catch {
      /* Storage can be disabled. */
    }
    let cancelled = false;
    const verify = () => {
      const epoch = authEpoch.current;
      return Promise.resolve()
        .then(() => authService.verify())
        .then((verifiedUser) => {
          if (!cancelled && epoch === authEpoch.current) {
            if (identity.current !== (verifiedUser?._id ?? null)) queryClient.clear();
            identity.current = verifiedUser?._id ?? null;
            setSessionUnavailable(false);
            setUser(verifiedUser ?? null);
            if (verifiedUser) rememberUser(verifiedUser);
          }
        })
        .catch((error) => {
          if (!cancelled && epoch === authEpoch.current) {
            const cachedUser = !error?.response ? offlineUser() : null;
            if (identity.current !== (cachedUser?._id ?? null)) queryClient.clear();
            identity.current = cachedUser?._id ?? null;
            if (cachedUser) rememberUser(cachedUser);
            setUser(cachedUser);
            if (error?.response?.status === 401) clearOfflineUser();
            setSessionUnavailable(error?.response?.status !== 401);
          }
        })
        .finally(() => {
          if (!cancelled && epoch === authEpoch.current) setIsLoading(false);
        });
    };
    void verify();
    window.addEventListener('online', verify);
    window.addEventListener('focus', verify);

    return () => {
      cancelled = true;
      window.removeEventListener('online', verify);
      window.removeEventListener('focus', verify);
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, isLoggedIn: user !== null, isLoading, logIn, logOut, sessionUnavailable }),
    [user, isLoading, logIn, logOut, sessionUnavailable],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
