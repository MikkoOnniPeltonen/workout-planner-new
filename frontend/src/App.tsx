import { MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import RedirectIfAuthenticated from './components/auth/RedirectIfAuthenticated';
import RequireAuth from './components/auth/RequireAuth';
import { PageLoader } from './components/feedback';
import Navbar from './components/Navbar';
import { SyncStatus } from './components/SyncStatus';
import { AuthProvider } from './context/auth.context';
import HomePage from './pages/HomePage';

// Route-level code splitting: heavy pages (charts, animations) load only when visited.
const AllExercisesPage = lazy(() => import('./pages/AllExercisesPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LogSessionPage = lazy(() => import('./pages/LogSessionPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const WorkoutWizard = lazy(() => import('./pages/WorkoutWizard'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <div className="min-h-screen bg-background font-sans text-foreground antialiased">
            <Navbar />
            <SyncStatus />
            <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:pb-12">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/exercises" element={<AllExercisesPage />} />

                  <Route element={<RedirectIfAuthenticated />}>
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />
                  </Route>

                  <Route element={<RequireAuth />}>
                    <Route path="/dashboard" element={<UserPage />} />
                    <Route path="/create-workout" element={<WorkoutWizard />} />
                    <Route path="/workouts/:workoutId/log" element={<LogSessionPage />} />
                    <Route path="/log" element={<LogSessionPage />} />
                    <Route path="/sessions/:sessionId/edit" element={<LogSessionPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/statistics" element={<StatisticsPage />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </MotionConfig>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
