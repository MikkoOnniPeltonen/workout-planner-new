import { createContext, type ReactNode, useEffect, useState } from 'react';
import authService from '../services/auth.service';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: any; // Ideally this should be a User type
  storeToken: (token: string) => void;
  authenticateUser: () => void;
  logOutUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  storeToken: () => {},
  authenticateUser: () => {},
  logOutUser: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProviderWrapper(props: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const storeToken = (token: string) => {
    localStorage.setItem('authToken', token);
  };

  const authenticateUser = () => {
    const storedToken = localStorage.getItem('authToken');

    if (storedToken) {
      authService
        .verify()
        .then((response) => {
          const user = response.data;
          setIsLoggedIn(true);
          setIsLoading(false);
          setUser(user);
        })
        .catch((error) => {
          console.log(error);
          setIsLoggedIn(false);
          setIsLoading(false);
          setUser(null);
        });
    } else {
      setIsLoggedIn(false);
      setIsLoading(false);
      setUser(null);
    }
  };

  const logOutUser = () => {
    localStorage.removeItem('authToken');
    authenticateUser();
  };

  useEffect(() => {
    authenticateUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        storeToken,
        authenticateUser,
        logOutUser,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export { AuthProviderWrapper, AuthContext };
