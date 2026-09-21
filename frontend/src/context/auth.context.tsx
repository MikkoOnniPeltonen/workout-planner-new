import { useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, AuthUser } from '@workout-planner/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { setUnauthorizedHandler, tokenStorage } from '@/lib/api';
import authService from '@/services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** True while a stored token is being verified on startup. */
  isLoading: boolean;
  logIn: (auth: AuthResponse) => void;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => tokenStorage.get() !== null);

  const logIn = useCallback((auth: AuthResponse) => {
    tokenStorage.set(auth.authToken);
    setUser(auth.user);
  }, []);

  const logOut = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    // Drop cached data so the next user never sees the previous user's workouts.
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => setUnauthorizedHandler(logOut), [logOut]);

  useEffect(() => {
    if (tokenStorage.get() === null) return;

    let cancelled = false;
    authService
      .verify()
      .then((verifiedUser) => {
        if (!cancelled) setUser(verifiedUser);
      })
      .catch(() => {
        // An invalid token is cleared by the 401 handler; other errors leave the user logged out.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, isLoggedIn: user !== null, isLoading, logIn, logOut }),
    [user, isLoading, logIn, logOut],
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
