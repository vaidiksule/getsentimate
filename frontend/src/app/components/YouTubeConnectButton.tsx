"use client";

import React, { useState } from 'react';
import { 
  Youtube, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Link
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

interface YouTubeConnectButtonProps {
  onConnect?: (channels: any[]) => void;
  onError?: (error: string) => void;
}

export function YouTubeConnectButton({ onConnect, onError }: YouTubeConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleYouTubeConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        const errorMsg = 'Authentication required. Please log in first.';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Start YouTube OAuth flow with Google
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/youtube-callback`;
      const scope = 'https://www.googleapis.com/auth/youtube.force-ssl';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      // Store the current page to return to after OAuth
      localStorage.setItem('youtube_oauth_return', window.location.pathname);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect YouTube account';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 font-medium mb-2">Connection Error</p>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <Button onClick={handleYouTubeConnect} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleYouTubeConnect}
      disabled={isConnecting}
      className="bg-red-600 hover:bg-red-700 text-white"
      size="sm"
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Youtube className="w-4 h-4 mr-2" />
      )}
      {isConnecting ? 'Connecting...' : 'Connect YouTube'}
    </Button>
  );
}
