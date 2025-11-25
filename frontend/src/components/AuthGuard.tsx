"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, type User } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ children, requireAuth = false, redirectTo }: AuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const verifyAuth = async () => {
      try {
        // Handle cross-domain session ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (sessionId) {
          // Store session ID and clean URL
          localStorage.setItem('session_id', sessionId);
          const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]session_id=[^&]*/, '');
          window.history.replaceState({}, '', cleanUrl);
        }
        
        const userData = await checkAuth();
        setUser(userData);

        // Redirect logic based on authentication status
        if (requireAuth && !userData) {
          // Authentication required but user is not logged in
          router.push(redirectTo || '/');
          return;
        }

        // Special case: if user is logged in and on home page, redirect to analysis
        // Add a small delay to ensure session cookie is properly set
        if (!requireAuth && userData && window.location.pathname === '/') {
          setTimeout(() => {
            router.push('/analysis');
          }, 100);
          return;
        }

        // Only redirect authenticated users away from other pages if they came from login
        // Don't redirect if they explicitly navigated to the home page (handled above)
        if (!requireAuth && userData && redirectTo && redirectTo !== '/') {
          // Authentication not required but user is logged in and explicit redirect is set
          router.push(redirectTo);
          return;
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        if (requireAuth) {
          router.push(redirectTo || '/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router, requireAuth, redirectTo, mounted]);

  // Return null during loading/mounting to prevent hydration mismatch
  if (!mounted || isLoading) {
    return null;
  }

  // If we reach here, the user is in the correct authentication state
  return <>{children}</>;
}
