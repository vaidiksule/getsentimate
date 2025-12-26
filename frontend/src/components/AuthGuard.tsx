"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, type User } from '@/lib/auth';
import { useUserStore } from '@/store/userStore';

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

        // Skip auth check if user just logged out
        const justLoggedOut = sessionStorage.getItem('just_logged_out');
        if (justLoggedOut) {
          setUser(null);
          sessionStorage.removeItem('just_logged_out');
          setIsLoading(false);
          return;
        }

        const userData = await checkAuth();
        setUser(userData);
        useUserStore.getState().setUser(userData);

        // Redirect logic based on authentication status
        if (requireAuth && !userData) {
          // Authentication required but user is not logged in
          router.push(redirectTo || '/analysis');
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
          router.push(redirectTo || '/analysis');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router, requireAuth, redirectTo, mounted]);

  // Show loading spinner during verification
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50/80 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#e5e5e5] border-t-[#0071e3] animate-spin" />
      </div>
    );
  }

  // If we reach here, the user is in the correct authentication state
  return <>{children}</>;
}
