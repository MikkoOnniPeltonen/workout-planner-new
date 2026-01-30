import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '@/context/auth.context';

function RedirectIfAuthenticated() {
    const { isLoggedIn, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>;
    }

    if (isLoggedIn) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

export default RedirectIfAuthenticated;
