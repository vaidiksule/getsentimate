"use client";

import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

interface GoogleLoginButtonProps {
  clientId: string;
}

declare global {
  interface Window {
    google?: any;
  }
}


export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ clientId }) => {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/google/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_token: response.credential,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          login(data.access, data.refresh, data.user);
          router.push('/dashboard'); // Redirect to dashboard after successful login
        } else {
          console.error('Google login failed', res);
        }
      } catch (error) {
        console.error('Google login error', error);
      }
    };

    const initializeGoogleSignIn = () => {
      if (typeof window.google !== 'undefined') {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("buttonDiv"),
          { theme: "outline", size: "large" }  // customization attributes
        );
        window.google.accounts.id.prompt(); // also display the One Tap sign-in prompt.
      }
    };

    // Check if the Google Identity Services library is already loaded
    if (typeof window.google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = initializeGoogleSignIn;
      script.async = true;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }


  }, [clientId, login, router]);

  return (
    <div id="buttonDiv"></div>
  );
};
