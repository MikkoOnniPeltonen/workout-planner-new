import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '@/context/auth.context';

function RequireAuth() {
    const { isLoggedIn, isLoading } = useContext(AuthContext);
    const location = useLocation();

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}

export default RequireAuth;
