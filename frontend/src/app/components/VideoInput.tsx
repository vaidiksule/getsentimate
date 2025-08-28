"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

export function VideoInput() {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL');
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(videoUrl)) {
      setError('Please enter a valid YouTube video URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Extract video ID from URL
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      
      if (!videoId) {
        throw new Error('Could not extract video ID');
      }

      // For now, just show success message
      // TODO: Implement actual video analysis
      setSuccess(`Video "${videoId}" queued for analysis! This feature will be implemented in the next phase.`);
      setVideoUrl('');
      
    } catch (err: any) {
      setError(err.message || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          Analyze YouTube Video
        </h3>
        <p className="text-white/70">
          Enter a YouTube video URL to analyze comments and sentiment
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-white/80 mb-2">
            YouTube Video URL
          </label>
          <input
            type="url"
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !videoUrl.trim()}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            'Analyze Video'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/50 text-sm">
          💡 <strong>Coming Soon:</strong> AI-powered comment analysis, sentiment tracking, and audience insights
        </p>
      </div>
    </div>
  );
}
