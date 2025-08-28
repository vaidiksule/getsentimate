"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

// Google Sign-In types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  clientId: string;
  onLoading?: (loading: boolean) => void;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  size?: 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  children?: React.ReactNode;
}

export function GoogleLoginButton({ 
  clientId, 
  onLoading, 
  onSuccess, 
  onError,
  size = 'lg',
  variant = 'default',
  children
}: GoogleLoginButtonProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load Google Sign-In script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Sign-In script loaded');
        renderGoogleButton();
      };
      document.head.appendChild(script);
    } else {
      renderGoogleButton();
    }
  }, [clientId]);

  const renderGoogleButton = () => {
    if (!window.google || !buttonRef.current) return;

    // Clear any existing content
    buttonRef.current.innerHTML = '';

    // Configure Google Sign-In
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the button directly
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: size === 'lg' ? 'large' : 'medium',
      text: 'signin_with',
      shape: 'rectangular',
      width: size === 'lg' ? 300 : 200,
    });
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);
      onLoading?.(true);

      console.log('Google Sign-In response received');

      // Send the ID token to your backend
      const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend authentication successful:', data);
        
        // Store the token
        localStorage.setItem('access_token', data.access);
        
        // Create user object for login
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          avatar: data.user.avatar,
          google_id: data.user.google_id,
          token: data.access
        };
        
        // Update auth context
        await login(userData);
        
        // Call success callback
        onSuccess?.(userData);
        
        // Clear any previous errors
        setError(null);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorData = await backendResponse.json();
        const errorMessage = errorData.error || 'Authentication failed';
        console.error('Backend authentication failed:', errorData);
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      console.error('Authentication error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      onLoading?.(false);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-2">Authentication Error</p>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <Button onClick={() => {
              setError(null);
              renderGoogleButton();
            }} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientId || clientId === 'your_google_client_id_here') {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p className="text-orange-800 font-medium mb-2">Setup Required</p>
            <p className="text-orange-700 text-sm mb-4">
              Google OAuth is not configured. Please set up your Google Client ID in the environment variables.
            </p>
            <div className="text-xs text-orange-600 text-left bg-orange-100 p-3 rounded">
              <p className="font-medium mb-2">To fix this:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add http://localhost:3000 to authorized origins</li>
                <li>Copy the Client ID to your .env.local file</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span>Signing in...</span>
      </div>
    );
  }

  // Just render the Google button directly
  return (
    <div ref={buttonRef} className="flex justify-center">
      {/* Google button will be rendered here */}
    </div>
  );
}
