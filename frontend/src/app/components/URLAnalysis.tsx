'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Link, 
  Play, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Eye,
  ThumbsUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

interface AnalysisResult {
  success: boolean;
  message: string;
  video: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    published_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    channel_title: string;
    duration: string;
  };
  analysis: {
    total_comments_analyzed: number;
    analysis_timestamp: string;
    ai_insights: any;
    ai_error?: string;
  };
  comments_sample: Array<{
    text: string;
    author_name: string;
    like_count: number;
    published_at?: string;
  }>;
}

export function URLAnalysis() {
  const [url, setUrl] = useState('');
  const [maxComments, setMaxComments] = useState(100);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analysis/url/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          max_comments: maxComments
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        if (data.error && data.error.includes('YouTube API not configured')) {
          setError('YouTube API is not configured. Please contact the administrator to set up YouTube API access.');
        } else {
          setError(data.error || 'Analysis failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">URL Analysis</h2>
        <p className="text-muted-foreground">
          Analyze any YouTube video by pasting its URL. Get instant insights about comments and engagement.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Video Analysis
          </CardTitle>
          <CardDescription>
            Enter a YouTube video URL to analyze its comments and get AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              YouTube Video URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="maxComments" className="text-sm font-medium">
              Maximum Comments to Analyze (Optional)
            </label>
            <Input
              id="maxComments"
              type="number"
              min="1"
              max="1000"
              value={maxComments}
              onChange={(e) => setMaxComments(parseInt(e.target.value) || 100)}
              disabled={isAnalyzing}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty or set to 100 for default analysis
            </p>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !url.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Analysis Failed</span>
            </div>
            <p className="text-sm text-destructive mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Video Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <img 
                  src={result.video.thumbnail_url} 
                  alt={result.video.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{result.video.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {result.video.channel_title}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(result.video.published_at)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Views</span>
                  </div>
                  <div className="font-semibold">{formatNumber(result.video.view_count)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Likes</span>
                  </div>
                  <div className="font-semibold">{formatNumber(result.video.like_count)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Comments</span>
                  </div>
                  <div className="font-semibold">{formatNumber(result.video.comment_count)}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <div className="font-semibold">{result.video.duration}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Analyzed {result.analysis.total_comments_analyzed} comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.analysis.ai_insights ? (
                <div className="space-y-6">
                  {/* Engagement Level */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Engagement Level</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.analysis.ai_insights.engagement_level === 'high' ? 'default' : result.analysis.ai_insights.engagement_level === 'medium' ? 'secondary' : 'outline'}>
                        {result.analysis.ai_insights.engagement_level?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                      <span className="text-sm text-blue-700">
                        Score: {result.analysis.ai_insights.engagement_metrics?.overall_score || 0}
                      </span>
                    </div>
                  </div>

                  {/* Key Findings */}
                  {result.analysis.ai_insights.key_findings && result.analysis.ai_insights.key_findings.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-3">Key Findings</h4>
                      <ul className="space-y-2">
                        {result.analysis.ai_insights.key_findings.map((finding: string, index: number) => (
                          <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What Users Like */}
                  {result.analysis.ai_insights.what_users_like && result.analysis.ai_insights.what_users_like.length > 0 && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <h4 className="font-medium text-emerald-900 mb-3">What Users Like</h4>
                      <ul className="space-y-2">
                        {result.analysis.ai_insights.what_users_like.map((like: string, index: number) => (
                          <li key={index} className="text-sm text-emerald-700 flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">✓</span>
                            {like}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What Users Dislike */}
                  {result.analysis.ai_insights.what_users_dislike && result.analysis.ai_insights.what_users_dislike.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-3">What Users Dislike</h4>
                      <ul className="space-y-2">
                        {result.analysis.ai_insights.what_users_dislike.map((dislike: string, index: number) => (
                          <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-600 mt-1">✗</span>
                            {dislike}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* User Suggestions */}
                  {result.analysis.ai_insights.user_suggestions && result.analysis.ai_insights.user_suggestions.length > 0 && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-3">User Suggestions</h4>
                      <ul className="space-y-2">
                        {result.analysis.ai_insights.user_suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                            <span className="text-purple-600 mt-1">💡</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Video Requests */}
                  {result.analysis.ai_insights.video_requests && result.analysis.ai_insights.video_requests.length > 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-3">Video Requests</h4>
                      <ul className="space-y-2">
                        {result.analysis.ai_insights.video_requests.map((request: string, index: number) => (
                          <li key={index} className="text-sm text-orange-700 flex items-start gap-2">
                            <span className="text-orange-600 mt-1">🎥</span>
                            {request}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Content Recommendations */}
                  {result.analysis.ai_insights.content_recommendations && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h4 className="font-medium text-indigo-900 mb-2">Content Recommendations</h4>
                      <p className="text-sm text-indigo-700">{result.analysis.ai_insights.content_recommendations}</p>
                    </div>
                  )}

                  {/* Audience Insights */}
                  {result.analysis.ai_insights.audience_insights && (
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                      <h4 className="font-medium text-teal-900 mb-2">Audience Insights</h4>
                      <p className="text-sm text-teal-700">{result.analysis.ai_insights.audience_insights}</p>
                    </div>
                  )}

                  {/* Charts and Visualizations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sentiment Distribution Pie Chart */}
                    {result.analysis.ai_insights.sentiment_analysis && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Positive', value: Math.round(result.analysis.ai_insights.sentiment_analysis.positive_ratio * 100), color: '#10b981' },
                                  { name: 'Negative', value: Math.round(result.analysis.ai_insights.sentiment_analysis.negative_ratio * 100), color: '#ef4444' },
                                  { name: 'Neutral', value: Math.round(result.analysis.ai_insights.sentiment_analysis.neutral_ratio * 100), color: '#6b7280' }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {[
                                  { name: 'Positive', value: Math.round(result.analysis.ai_insights.sentiment_analysis.positive_ratio * 100), color: '#10b981' },
                                  { name: 'Negative', value: Math.round(result.analysis.ai_insights.sentiment_analysis.negative_ratio * 100), color: '#ef4444' },
                                  { name: 'Neutral', value: Math.round(result.analysis.ai_insights.sentiment_analysis.neutral_ratio * 100), color: '#6b7280' }
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Engagement Level Radial Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Engagement Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={[
                            { 
                              name: 'Engagement', 
                              value: Math.round((result.analysis.ai_insights.engagement_metrics?.overall_score || 0) * 100),
                              fill: result.analysis.ai_insights.engagement_level === 'high' ? '#10b981' : 
                                    result.analysis.ai_insights.engagement_level === 'medium' ? '#f59e0b' : '#ef4444'
                            }
                          ]}>
                            <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
                              {Math.round((result.analysis.ai_insights.engagement_metrics?.overall_score || 0) * 100)}%
                            </text>
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="text-center mt-2">
                          <Badge variant={result.analysis.ai_insights.engagement_level === 'high' ? 'default' : result.analysis.ai_insights.engagement_level === 'medium' ? 'secondary' : 'outline'}>
                            {result.analysis.ai_insights.engagement_level?.toUpperCase() || 'MEDIUM'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Feedback Categories Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Feedback Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { 
                            category: 'Likes', 
                            count: result.analysis.ai_insights.what_users_like?.length || 0,
                            color: '#10b981'
                          },
                          { 
                            category: 'Dislikes', 
                            count: result.analysis.ai_insights.what_users_dislike?.length || 0,
                            color: '#ef4444'
                          },
                          { 
                            category: 'Suggestions', 
                            count: result.analysis.ai_insights.user_suggestions?.length || 0,
                            color: '#8b5cf6'
                          },
                          { 
                            category: 'Requests', 
                            count: result.analysis.ai_insights.video_requests?.length || 0,
                            color: '#f59e0b'
                          }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Basic Analysis Only</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    AI analysis failed: {result.analysis.ai_error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample Comments */}
          {result.comments_sample && result.comments_sample.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Sample Comments
                </CardTitle>
                <CardDescription>
                  First {Math.min(10, result.comments_sample.length)} comments from the analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.comments_sample.map((comment, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">{comment.author_name}</span>
                        {comment.like_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {comment.like_count} likes
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Comments Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Comments are not accessible for this video. This is common due to YouTube's privacy settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
