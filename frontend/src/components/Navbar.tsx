import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

function Navbar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('authToken');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    // Force re-render or navigation to update state
    navigate('/login');
    // Optional: reload to clear all in-memory state if context isn't used
    window.location.reload();
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    // Ideally this would toggle a class on the html element or use a context
  };

  return (
    <nav
      className={cn(
        'flex items-center justify-between p-4 mb-4 rounded-lg',
        theme === 'light' ? 'bg-white text-black shadow-sm' : 'bg-gray-800 text-white shadow-xl',
      )}
    >
      <div className="flex gap-4 font-semibold">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn('hover:text-blue-400 transition-colors', isActive && 'text-blue-500')
          }
        >
          Home
        </NavLink>
        {isLoggedIn ? (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn('hover:text-blue-400 transition-colors', isActive && 'text-blue-500')
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/create-workout"
              className={({ isActive }) =>
                cn('hover:text-blue-400 transition-colors', isActive && 'text-blue-500')
              }
            >
              Create Workout
            </NavLink>
            <NavLink
              to="/statistics"
              className={({ isActive }) =>
                cn('hover:text-blue-400 transition-colors', isActive && 'text-blue-500')
              }
            >
              Statistics
            </NavLink>
            <button
              onClick={handleLogout}
              className="hover:text-red-400 transition-colors text-left"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                cn('hover:text-blue-400 transition-colors', isActive && 'text-blue-500')
              }
            >
              Sign up
            </NavLink>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                cn('hover:text-blue-400 transition-colors', isActive && 'text-blue-500')
              }
            >
              Log in
            </NavLink>
          </>
        )}
      </div>
      <button
        onClick={toggleTheme}
        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
    </nav>
  );
}

export default Navbar;
