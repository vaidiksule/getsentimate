'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, TrendingDown, MessageCircle, Heart, AlertTriangle, 
  Users, Target, Lightbulb, BarChart3, Activity, Eye, ThumbsUp 
} from 'lucide-react';

interface VideoInsightsData {
  video: {
    id: string;
    title: string;
    thumbnail_url: string;
    published_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
  };
  channel: {
    id: string;
    title: string;
    thumbnail_url: string;
  };
  insights: {
    total_comments: number;
    analyzed_comments: number;
    analysis_coverage: number;
    sentiment_metrics: {
      positive_ratio: number;
      negative_ratio: number;
      neutral_ratio: number;
      average_score: number;
      distribution: {
        very_positive: number;
        positive: number;
        neutral: number;
        negative: number;
        very_negative: number;
      };
    };
    toxicity_metrics: {
      average_score: number;
      distribution: {
        not_toxic: number;
        slightly_toxic: number;
        moderately_toxic: number;
        highly_toxic: number;
      };
    };
    engagement_metrics: {
      overall_score: number;
      high_engagement_comments: number;
      low_engagement_comments: number;
    };
    audience_insights: string;
    content_recommendations: string[];
    key_findings: string[];
    trends: string[];
  };
  analysis_summary: {
    total_comments: number;
    analysis_coverage: number;
    overall_sentiment: string;
    engagement_level: string;
  };
}

interface VideoInsightsDashboardProps {
  videoId: string;
}

const COLORS = {
  positive: ['#10b981', '#059669', '#047857'],
  negative: ['#ef4444', '#dc2626', '#b91c1c'],
  neutral: ['#6b7280', '#4b5563', '#374151'],
  toxic: ['#f59e0b', '#d97706', '#b45309', '#92400e']
};

const VideoInsightsDashboard: React.FC<VideoInsightsDashboardProps> = ({ videoId }) => {
  const [insightsData, setInsightsData] = useState<VideoInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideoInsights();
  }, [videoId]);

  const fetchVideoInsights = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/videos/${videoId}/insights/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video insights');
      }

      const data = await response.json();
      setInsightsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // For demo purposes, show sample data when API fails
      console.log('Showing demo data due to API error');
      setInsightsData(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  // Demo data for testing
  const getDemoData = (): VideoInsightsData => ({
    video: {
      id: videoId,
      title: "How to Build a YouTube Analytics Dashboard with AI",
      thumbnail_url: "https://via.placeholder.com/320x180/3b82f6/ffffff?text=Demo+Video",
      published_at: "2025-01-15T10:00:00Z",
      view_count: 15420,
      like_count: 892,
      comment_count: 156
    },
    channel: {
      id: "demo_channel",
      title: "Tech Tutorials Pro",
      thumbnail_url: "https://via.placeholder.com/88x88/10b981/ffffff?text=T"
    },
    insights: {
      total_comments: 156,
      analyzed_comments: 156,
      analysis_coverage: 1.0,
      sentiment_metrics: {
        positive_ratio: 0.68,
        negative_ratio: 0.12,
        neutral_ratio: 0.20,
        average_score: 0.45,
        distribution: {
          very_positive: 23,
          positive: 83,
          neutral: 31,
          negative: 15,
          very_negative: 4
        }
      },
      toxicity_metrics: {
        average_score: 0.08,
        distribution: {
          not_toxic: 142,
          slightly_toxic: 10,
          moderately_toxic: 3,
          highly_toxic: 1
        }
      },
      engagement_metrics: {
        overall_score: 0.72,
        high_engagement_comments: 89,
        low_engagement_comments: 12
      },
      audience_insights: "Your audience is overwhelmingly positive about this tutorial! They love the practical examples and clear explanations. Many users are asking for follow-up content on advanced features.",
      content_recommendations: [
        "Continue with the current tutorial style - your audience loves it",
        "Consider creating a series on related topics",
        "Add more practical examples based on user feedback",
        "The pacing is perfect - keep it up!"
      ],
      key_findings: [
        "68% of comments express positive sentiment about the tutorial quality",
        "Users particularly appreciate the step-by-step explanations",
        "Several comments request more advanced topics in future videos",
        "The community is highly engaged with 89 high-engagement comments"
      ],
      trends: [
        "Positive sentiment is trending upward in recent comments",
        "Users are asking for more content in this series",
        "Engagement levels are consistently high across all comment types"
      ]
    },
    analysis_summary: {
      total_comments: 156,
      analysis_coverage: 1.0,
      overall_sentiment: "positive",
      engagement_level: "high"
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !insightsData) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-lg font-medium">Unable to load video insights</p>
            <p className="text-sm">{error || 'No data available'}</p>
            <button 
              onClick={fetchVideoInsights}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { video, channel, insights, analysis_summary } = insightsData;

  // Prepare chart data
  const sentimentData = [
    { name: 'Very Positive', value: insights.sentiment_metrics.distribution.very_positive, color: COLORS.positive[0] },
    { name: 'Positive', value: insights.sentiment_metrics.distribution.positive, color: COLORS.positive[1] },
    { name: 'Neutral', value: insights.sentiment_metrics.distribution.neutral, color: COLORS.neutral[0] },
    { name: 'Negative', value: insights.sentiment_metrics.distribution.negative, color: COLORS.negative[1] },
    { name: 'Very Negative', value: insights.sentiment_metrics.distribution.very_negative, color: COLORS.negative[0] },
  ];

  const toxicityData = [
    { name: 'Not Toxic', value: insights.toxicity_metrics.distribution.not_toxic, color: COLORS.positive[0] },
    { name: 'Slightly Toxic', value: insights.toxicity_metrics.distribution.slightly_toxic, color: COLORS.toxic[0] },
    { name: 'Moderately Toxic', value: insights.toxicity_metrics.distribution.moderately_toxic, color: COLORS.toxic[1] },
    { name: 'Highly Toxic', value: insights.toxicity_metrics.distribution.highly_toxic, color: COLORS.toxic[2] },
  ];

  const engagementData = [
    { name: 'High Engagement', value: insights.engagement_metrics.high_engagement_comments, color: COLORS.positive[0] },
    { name: 'Low Engagement', value: insights.engagement_metrics.low_engagement_comments, color: COLORS.negative[0] },
    { name: 'Neutral', value: insights.analyzed_comments - insights.engagement_metrics.high_engagement_comments - insights.engagement_metrics.low_engagement_comments, color: COLORS.neutral[0] },
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start space-x-4"
      >
        <img 
          src={video.thumbnail_url} 
          alt={video.title}
          className="w-32 h-20 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{video.title}</h1>
          <p className="text-muted-foreground">Channel: {channel.title}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {video.view_count.toLocaleString()} views
            </span>
            <span className="flex items-center">
              <ThumbsUp className="w-4 h-4 mr-1" />
              {video.like_count.toLocaleString()} likes
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {video.comment_count.toLocaleString()} comments
            </span>
          </div>
        </div>
      </motion.div>

      <Separator />

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-bold">{insights.total_comments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Analysis Coverage</p>
                <p className="text-2xl font-bold">{Math.round(insights.analysis_coverage * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Score</p>
                <p className="text-2xl font-bold">{Math.round(insights.engagement_metrics.overall_score * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Sentiment</p>
                <Badge className={getSentimentColor(analysis_summary.overall_sentiment)}>
                  {analysis_summary.overall_sentiment}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Sentiment Distribution
            </CardTitle>
            <CardDescription>How your audience feels about this video</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Toxicity Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Toxicity Analysis
            </CardTitle>
            <CardDescription>Community health and moderation insights</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={toxicityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Engagement Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Engagement Breakdown
            </CardTitle>
            <CardDescription>Comment engagement levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Engagement Score
            </CardTitle>
            <CardDescription>Overall audience engagement level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Engagement Level</span>
                <span>{Math.round(insights.engagement_metrics.overall_score * 100)}%</span>
              </div>
              <Progress value={insights.engagement_metrics.overall_score * 100} className="w-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>High Engagement Comments</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {insights.engagement_metrics.high_engagement_comments}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Low Engagement Comments</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {insights.engagement_metrics.low_engagement_comments}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-6"
      >
        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Key Findings
            </CardTitle>
            <CardDescription>AI-generated insights about your audience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.key_findings.map((finding, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{finding}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Content Recommendations
            </CardTitle>
            <CardDescription>Actionable suggestions to improve your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.content_recommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{recommendation}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audience Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Audience Summary
            </CardTitle>
            <CardDescription>What your audience is saying</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{insights.audience_insights}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VideoInsightsDashboard;
