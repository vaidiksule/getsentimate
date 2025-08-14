"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: number; email: string; name: string; avatar?: string } | null;
  login: (access: string, refresh: string, user: { id: number; email: string; name: string; avatar?: string } | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; email: string; name: string; avatar?: string } | null>(null);

  useEffect(() => {
    // Load tokens from localStorage on component mount
    const storedAccessToken = localStorage.getItem('access');
    const storedRefreshToken = localStorage.getItem('refresh');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
    }
    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (access: string, refresh: string, user: { id: number; email: string; name: string; avatar?: string } | null) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(user);

    // Store tokens in localStorage (BEWARE OF XSS - use cookies in production!)
    if (user) {
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    // Remove tokens from localStorage
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
  };

  const isAuthenticated = () => {
    return !!accessToken;
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, user, login, logout, isAuthenticated }}>
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
