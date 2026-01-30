import axios from 'axios';

const API_URL = 'http://localhost:3000';

class AuthService {
  api = axios.create({
    baseURL: API_URL,
  });

  constructor() {
    // Request interceptor
    this.api.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('authToken');

      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }

      return config;
    });

    // Response interceptor for Auto Logout
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          // Only redirect if not already on auth pages
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  login = (requestBody: any) => {
    return this.api.post('/auth/login', requestBody);
  };

  signup = (requestBody: any) => {
    return this.api.post('/auth/signup', requestBody);
  };

  verify = () => {
    return this.api.get('/auth/verify');
  };
}

const authService = new AuthService();

export default authService;
