"use client";

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  User, 
  Calendar, 
  ThumbsUp, 
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';

interface Comment {
  id: string;
  text: string;
  author: string;
  published_at: string;
  like_count: number;
  sentiment_score?: number;
  sentiment_label?: string;
  toxicity_score?: number;
  toxicity_label?: string;
  is_analyzed: boolean;
  analysis_date?: string;
}

interface CommentManagerProps {
  videoId: string;
  videoTitle: string;
  onClose: () => void;
}

export function CommentManager({ videoId, videoTitle, onClose }: CommentManagerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/videos/${videoId}/comments/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch comments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const refreshComments = async () => {
    try {
      setRefreshing(true);
      setError('');

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/videos/${videoId}/comments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_results: 100
        }),
      });

      if (response.ok) {
        await fetchComments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to refresh comments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh comments');
    } finally {
      setRefreshing(false);
    }
  };

  const analyzeComments = async () => {
    try {
      console.log('🔍 Starting comment analysis for video:', videoId);
      setRefreshing(true);
      setError('');

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analysis/${videoId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analysis successful:', data);
        await fetchComments();
        setShowAnalysis(true);
        
        // Show success message and redirect option
        alert(`Analysis completed! ${data.comments_analyzed} comments analyzed. You can now view insights.`);
      } else {
        const errorData = await response.json();
        console.error('❌ Analysis failed:', errorData);
        setError(errorData.error || 'Failed to analyze comments');
      }
    } catch (err: any) {
      console.error('❌ Analysis error:', err);
      setError(err.message || 'Failed to analyze comments');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSentimentColor = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getToxicityColor = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'toxic': return 'bg-red-100 text-red-800';
      case 'not_toxic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportComments = () => {
    const csvContent = [
      ['Author', 'Comment', 'Published', 'Likes', 'Sentiment', 'Toxicity'],
      ...comments.map(comment => [
        comment.author,
        comment.text,
        formatDate(comment.published_at),
        comment.like_count.toString(),
        comment.sentiment_label || 'Not analyzed',
        comment.toxicity_label || 'Not analyzed'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comments_${videoId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading comments...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Comments for: {videoTitle}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {comments.length} comments • {comments.filter(c => c.is_analyzed).length} analyzed
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button onClick={refreshComments} variant="outline" size="sm" disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button onClick={analyzeComments} variant="outline" size="sm" disabled={refreshing}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze
              </Button>
              
              <Button onClick={exportComments} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-800 font-medium mb-2">Error loading comments</p>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <Button onClick={fetchComments} variant="outline">
                Try Again
              </Button>
            </div>
          ) : comments.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No comments found</p>
              <p className="text-muted-foreground mb-4">
                This video doesn't have any comments yet.
              </p>
              <Button onClick={refreshComments} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Comments
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {comment.author?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-foreground">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.published_at)}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{comment.like_count}</span>
                        </div>
                      </div>
                      
                      <p className="text-foreground text-sm mb-3 leading-relaxed">
                        {comment.text}
                      </p>
                      
                      {/* Analysis Results */}
                      {comment.is_analyzed && (
                        <div className="flex items-center space-x-3">
                          <Badge className={getSentimentColor(comment.sentiment_label || '')}>
                            Sentiment: {comment.sentiment_label || 'Unknown'}
                          </Badge>
                          <Badge className={getToxicityColor(comment.toxicity_label || '')}>
                            Toxicity: {comment.toxicity_label || 'Unknown'}
                          </Badge>
                          {comment.sentiment_score !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              Score: {comment.sentiment_score.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
