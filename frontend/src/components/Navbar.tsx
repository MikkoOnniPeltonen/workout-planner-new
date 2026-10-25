import {
  ChartColumn,
  CirclePlus,
  Dumbbell,
  RotateCcwClock as HistoryIcon,
  LayoutGrid,
  LogOut,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth.context';
import { cn } from '@/lib/utils';

const desktopLinks = [
  { to: '/dashboard', label: 'Workouts' },
  { to: '/create-workout', label: 'Generate' },
  { to: '/history', label: 'History' },
  { to: '/statistics', label: 'Stats' },
  { to: '/exercises', label: 'Exercises' },
];

// On phones the main destinations live in a bottom tab bar, within thumb reach.
const mobileTabs = [
  { to: '/dashboard', label: 'Workouts', icon: LayoutGrid },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/log', label: 'Log', icon: CirclePlus },
  { to: '/statistics', label: 'Stats', icon: ChartColumn },
  { to: '/exercises', label: 'Exercises', icon: Dumbbell },
];

function topLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground',
  );
}

function Navbar() {
  const { isLoggedIn, logOut } = useAuth();

  const handleLogOut = async () => {
    try {
      await logOut();
    } catch {
      toast.error('Could not log out. Check your connection and try again.');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4"
        >
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span>Workout Planner</span>
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <ul className="hidden items-center gap-1 md:flex">
                {desktopLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink to={link.to} className={topLinkClass}>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" onClick={handleLogOut}>
                <LogOut aria-hidden="true" />
                <span className="sr-only md:not-sr-only">Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/exercises"
                className={(state) => cn(topLinkClass(state), 'hidden sm:block')}
              >
                Exercises
              </NavLink>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </nav>
      </header>

      {isLoggedIn && (
        <nav
          aria-label="App"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          <ul className="grid grid-cols-5">
            {mobileTabs.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 py-2 text-xs font-medium',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                    )
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}

export default Navbar;
