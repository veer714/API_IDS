import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sentinel_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('sentinel_token');
      if (storedToken) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          setToken(storedToken);
        } catch (err) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('sentinel_token');
          localStorage.removeItem('sentinel_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: any) => {
    const res = await authApi.login(credentials);
    localStorage.setItem('sentinel_token', res.token);
    setToken(res.token);
    const currentUser: User = {
      id: 1,
      username: res.username,
      email: res.email,
      fullName: res.fullName,
      role: res.role as any,
      organization: res.organizationName,
    };
    localStorage.setItem('sentinel_user', JSON.stringify(currentUser));
    setUser(currentUser);
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    localStorage.setItem('sentinel_token', res.token);
    setToken(res.token);
    const currentUser: User = {
      id: 1,
      username: res.username,
      email: res.email,
      fullName: res.fullName,
      role: res.role as any,
      organization: res.organizationName,
    };
    localStorage.setItem('sentinel_user', JSON.stringify(currentUser));
    setUser(currentUser);
  };

  const logout = () => {
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
