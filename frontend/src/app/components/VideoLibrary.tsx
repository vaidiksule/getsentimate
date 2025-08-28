"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { CommentManager } from './CommentManager';
import { 
  Video as VideoIcon, 
  Play, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  Calendar,
  Clock,
  Search,
  Download,
  Loader2,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  duration: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  channel: {
    id: string;
    title: string;
  };
}

interface VideoLibraryProps {
  onVideoSelect?: (video: Video) => void;
}

export function VideoLibrary({ onVideoSelect }: VideoLibraryProps) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<Video | null>(null);

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/videos/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch videos');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
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

  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? match[1].replace('H', '') : '0';
    const minutes = match[2] ? match[2].replace('M', '') : '0';
    const seconds = match[3] ? match[3].replace('S', '') : '0';
    
    if (hours !== '0') {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.channel.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Error loading videos</p>
            <p className="text-sm mb-4">{error}</p>
            <Button onClick={fetchVideos} variant="outline">
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
          <h2 className="section-title">Video Library</h2>
          <p className="text-muted-foreground">
            Browse and analyze videos from your connected YouTube channels
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
                      <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          <Button onClick={fetchVideos} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
            {/* Video Thumbnail */}
            <div className="relative">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </div>

            {/* Video Info */}
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm line-clamp-2" title={video.title}>
                {video.title}
              </h4>
              
              <p className="text-muted-foreground text-xs">
                {video.channel.title}
              </p>
              
              <p className="text-muted-foreground text-xs flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(video.published_at)}
              </p>

              {/* Video Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {formatNumber(video.view_count)}
                </span>
                <span className="flex items-center">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  {formatNumber(video.like_count)}
                </span>
                <span className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {formatNumber(video.comment_count)}
                </span>
              </div>

              {/* Description Preview */}
              {video.description && (
                <p className="text-muted-foreground text-xs line-clamp-2" title={video.description}>
                  {video.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => onVideoSelect?.(video)}
                  className="w-full"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Analyze Video
                </Button>
                
                <Button
                  onClick={() => setSelectedVideoForComments(video)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Comments ({formatNumber(video.comment_count)})
                </Button>

                <Button
                  onClick={() => window.location.href = `/video-insights/${video.id}`}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Insights
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Message */}
      {filteredVideos.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No videos match your search term.</p>
        </div>
      )}

      {/* Empty State */}
      {filteredVideos.length === 0 && !searchTerm && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <VideoIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No videos found</p>
              <p className="text-sm mb-4">
                Connect your YouTube channel to start analyzing videos and comments.
              </p>
              <Button onClick={fetchVideos} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Comment Manager Modal */}
      {selectedVideoForComments && (
        <CommentManager
          videoId={selectedVideoForComments.id}
          videoTitle={selectedVideoForComments.title}
          onClose={() => setSelectedVideoForComments(null)}
        />
      )}
    </div>
  );
}
