import type { AuthResponse, AuthUser, LoginInput, SignupInput } from '@workout-planner/shared';
import { api } from '@/lib/api';

class AuthService {
  login = async (input: LoginInput) => {
    const response = await api.post<AuthResponse>('/auth/login', input);
    return response.data;
  };

  signup = async (input: SignupInput) => {
    const response = await api.post<AuthResponse>('/auth/signup', input);
    return response.data;
  };

  verify = async () => {
    const response = await api.get<AuthUser>('/auth/verify');
    return response.data;
  };
}

const authService = new AuthService();

export default authService;
