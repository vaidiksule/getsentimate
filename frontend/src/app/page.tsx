"use client";

import { GoogleLoginButton } from './components/GoogleLoginButton';
import { useAuth } from './components/AuthProvider';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, accessToken } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      if (accessToken) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setMessage(`Hello ${data.name}!`);
          } else {
            setMessage('Failed to fetch /api/me/');
          }
        } catch (error) {
          setMessage('Error fetching /api/me/');
        }
      } else {
        setMessage('Not authenticated.');
      }
    };

    fetchMe();
  }, [accessToken]);

  return (
    <main>
      <div>
        
        <div>
          {user ? (
            <>
              <p>Logged in as {user.name} ({user.email})</p>
              <p>{message}</p>
            </>
          ) : (
            <GoogleLoginButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''} />
          )}
        </div>

      </div>

      
    </main>
  );
}
