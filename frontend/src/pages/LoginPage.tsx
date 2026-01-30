import { type FormEvent, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { AuthContext } from '../context/auth.context';
import authService from '../services/auth.service';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { storeToken, authenticateUser } = useContext(AuthContext);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await authService.login(formData);
      storeToken(response.data.authToken);
      authenticateUser();
      navigate('/'); // Redirect to home or user dashboard
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Check your credentials.';
      setError(errorMessage);
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl bg-gray-900 border-gray-800 text-white">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Enter your email to sign in to your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none text-gray-200">
                Email
              </label>
              <input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="name@example.com"
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none text-gray-200"
                >
                  Password
                </label>
              </div>

              <input
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-900/30 border border-red-900 text-red-300 text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200 font-semibold mt-4 h-11"
            >
              Sign in
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-white hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default LoginPage;
