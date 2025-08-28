"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { YouTubeConnectButton } from './YouTubeConnectButton';
import { 
  Users, 
  Video, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  published_at: string;
  is_connected: boolean;
  last_sync?: string;
}

interface ChannelListProps {
  onChannelSelect?: (channel: Channel) => void;
}

export function ChannelList({ onChannelSelect }: ChannelListProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchChannels();
    }
  }, [user]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/channels/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch channels');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };

  const refreshChannel = async (channelId: string) => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/channels/${channelId}/refresh/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh the channel list
        await fetchChannels();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to refresh channel');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh channel');
    } finally {
      setRefreshing(false);
    }
  };

  const disconnectYouTube = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/disconnect_youtube/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('YouTube disconnected:', data.message);
        // Refresh the channel list
        await fetchChannels();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect YouTube');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect YouTube');
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (isConnected: boolean) => {
    if (isConnected) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusBadge = (isConnected: boolean) => {
    if (isConnected) {
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>;
    }
    return <Badge variant="secondary">Disconnected</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-2">Error loading channels</p>
            <p className="text-sm mb-4">{error}</p>
            <Button onClick={fetchChannels} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-title">YouTube Channels</h2>
          <p className="text-muted-foreground">
            Connect and manage your YouTube channels for analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={fetchChannels} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={disconnectYouTube} 
            variant="destructive" 
            size="sm"
            disabled={channels.length === 0}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Disconnect YouTube
          </Button>
          <YouTubeConnectButton 
            onConnect={(channels) => {
              // Refresh the channel list
              fetchChannels();
            }}
            onError={(error) => {
              console.error('YouTube connection error:', error);
              setError(error);
            }}
          />
        </div>
      </div>

      {/* Channel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <Card key={channel.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            {/* Channel Thumbnail */}
            <div className="relative">
              <img
                src={channel.thumbnail_url}
                alt={channel.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                {getStatusIcon(channel.is_connected)}
              </div>
            </div>

            {/* Channel Info */}
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-foreground text-sm line-clamp-2 flex-1" title={channel.title}>
                  {channel.title}
                </h4>
                {getStatusBadge(channel.is_connected)}
              </div>
              
              {channel.description && (
                <p className="text-muted-foreground text-xs line-clamp-2" title={channel.description}>
                  {channel.description}
                </p>
              )}
              
              <p className="text-muted-foreground text-xs flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Joined {formatDate(channel.published_at)}
              </p>

              {/* Channel Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="font-semibold text-foreground">{formatNumber(channel.subscriber_count)}</p>
                  <p className="text-muted-foreground">Subscribers</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="font-semibold text-foreground">{formatNumber(channel.video_count)}</p>
                  <p className="text-muted-foreground">Videos</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="font-semibold text-foreground">{formatNumber(channel.view_count)}</p>
                  <p className="text-muted-foreground">Views</p>
                </div>
              </div>

              {/* Last Sync Info */}
              {channel.last_sync && (
                <div className="text-xs text-muted-foreground">
                  Last synced: {formatDate(channel.last_sync)}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => onChannelSelect?.(channel)}
                  className="w-full"
                  size="sm"
                  disabled={!channel.is_connected}
                >
                  <Video className="w-4 h-4 mr-2" />
                  View Videos
                </Button>
                
                <Button
                  onClick={() => refreshChannel(channel.id)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Channel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {channels.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No channels connected</p>
              <p className="text-sm mb-4">
                Connect your YouTube channel to start analyzing videos and comments.
              </p>
              <YouTubeConnectButton 
                onConnect={(channels) => {
                  fetchChannels();
                }}
                onError={(error) => {
                  console.error('YouTube connection error:', error);
                  setError(error);
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
