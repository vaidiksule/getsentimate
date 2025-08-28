"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  google_id?: string;
  youtube_access_token?: string;
  youtube_refresh_token?: string;
  credits?: number;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  loading: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('access_token');
        
        if (storedUser && storedToken) {
          // Validate token and user data
          const userData = JSON.parse(storedUser);
          
          // Basic validation - in production, you'd verify the token with your backend
          if (userData.id && userData.email) {
            // Ensure the user object has the token
            const userWithToken = {
              ...userData,
              token: userData.token || storedToken
            };
            setUser(userWithToken);
          } else {
            // Invalid data, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback((userData: User) => {
    // Ensure the user object has the token
    const userWithToken = {
      ...userData,
      token: userData.token || localStorage.getItem('access_token') || undefined
    };
    
    setUser(userWithToken);
    
    // Store user data and token
    if (userWithToken.token) {
      localStorage.setItem('access_token', userWithToken.token);
    }
    localStorage.setItem('user', JSON.stringify(userWithToken));
    
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    
    // Clear all stored data
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    
    // Redirect to landing page
    router.push('/');
  }, [router]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const isAuthenticated = useCallback(() => {
    return !!user && !!user.token;
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    loading,
    updateUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
