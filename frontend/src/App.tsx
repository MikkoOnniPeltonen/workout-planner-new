import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import RedirectIfAuthenticated from './components/auth/RedirectIfAuthenticated';
import RequireAuth from './components/auth/RequireAuth';
import { AuthProviderWrapper } from './context/auth.context';
import AllExercisesPage from './pages/AllExercisesPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StatisticsPage from './pages/StatisticsPage';
import UserPage from './pages/UserPage';
import WorkoutWizard from './pages/WorkoutWizard';

function App() {
  return (
    <Router>
      <AuthProviderWrapper>
        <div className="min-h-screen bg-gray-950 text-foreground font-sans antialiased">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route element={<RedirectIfAuthenticated />}>
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/exercises" element={<AllExercisesPage />} />
              <Route path="/dashboard" element={<UserPage />} />
              <Route path="/create-workout" element={<WorkoutWizard />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Route>

            <Route
              path="*"
              element={<div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">404 - Page Not Found</div>}
            />
          </Routes>
        </div>
      </AuthProviderWrapper>
    </Router>
  );
}

export default App;
