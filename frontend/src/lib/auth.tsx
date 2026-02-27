import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getMe } from './api';

interface User {
  id: string;
  email: string;
  company_name: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (t: string | null) => {
    if (t) {
      localStorage.setItem('token', t);
    } else {
      localStorage.removeItem('token');
    }
    setTokenState(t);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
