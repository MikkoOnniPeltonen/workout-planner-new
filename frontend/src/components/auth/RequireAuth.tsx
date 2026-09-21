import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/feedback';
import { useAuth } from '@/context/auth.context';

function RequireAuth() {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
