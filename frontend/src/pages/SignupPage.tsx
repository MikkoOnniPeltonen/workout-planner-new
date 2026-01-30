import { type FormEvent, useState } from 'react';
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
import authService from '../services/auth.service';

function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await authService.signup(formData);
      navigate('/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Signup failed. Try again.';
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
            <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Enter your details below to create your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                placeholder="Your name"
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                required
              />
            </div>
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
                placeholder="m@example.com"
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none text-gray-200">
                Password
              </label>
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
              Sign up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-gray-800 pt-6">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-white hover:underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignupPage;
