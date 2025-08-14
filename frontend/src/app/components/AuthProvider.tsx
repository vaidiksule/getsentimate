"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: number; email: string; name: string; avatar?: string } | null;
  login: (access: string, refresh: string, user: { id: number; email: string; name: string; avatar?: string } | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; email: string; name: string; avatar?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access');
    const storedRefreshToken = localStorage.getItem('refresh');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken) setAccessToken(storedAccessToken);
    if (storedRefreshToken) setRefreshToken(storedRefreshToken);
    if (storedUser) setUser(JSON.parse(storedUser));

    setLoading(false); // finished loading
  }, []);

  const login = (access: string, refresh: string, user: { id: number; email: string; name: string; avatar?: string } | null) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(user);

    if (user) {
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    }

    router.push('/dashboard'); // redirect immediately after login
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    router.push('/');
  };

  const isAuthenticated = () => !!accessToken;

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
