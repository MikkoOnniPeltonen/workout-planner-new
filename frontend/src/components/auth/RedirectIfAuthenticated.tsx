import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/feedback';
import { useAuth } from '@/context/auth.context';

interface RedirectState {
  from?: { pathname: string };
}

function RedirectIfAuthenticated() {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isLoggedIn) {
    // Send users back to the page that asked them to log in.
    const from = (location.state as RedirectState | null)?.from?.pathname;
    return <Navigate to={from ?? '/dashboard'} replace />;
  }

  return <Outlet />;
}

export default RedirectIfAuthenticated;
