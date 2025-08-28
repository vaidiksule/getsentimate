'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function YouTubeCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setError(`OAuth error: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setError('No authorization code received');
          return;
        }

        if (!user) {
          setStatus('error');
          setError('User not authenticated');
          return;
        }

        setMessage('Connecting your YouTube account...');

        // Send authorization code to backend
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/youtube_oauth/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authorization_code: code
          })
        });

        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          setMessage(`Successfully connected ${data.channel_count || 0} YouTube channel(s)!`);
          
          // Redirect back to the original page after a delay
          setTimeout(() => {
            const returnPath = localStorage.getItem('youtube_oauth_return') || '/dashboard';
            localStorage.removeItem('youtube_oauth_return');
            router.push(returnPath);
          }, 2000);
        } else {
          const errorData = await response.json();
          setStatus('error');
          setError(errorData.error || 'Failed to connect YouTube account');
        }

      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [searchParams, user, router]);

  const handleRetry = () => {
    router.push('/dashboard?tab=channels');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Connecting YouTube</h2>
              <p className="text-muted-foreground">{message || 'Processing authorization...'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Success!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Connection Failed</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleRetry} variant="outline" className="w-full">
                Try Again
              </Button>
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
