"use client";

import React from 'react';

export function AnalyticsDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Overview Card */}
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-xl font-bold text-white mb-2">Analytics Overview</h3>
          <p className="text-white/70 text-sm">
            Track your YouTube performance and audience engagement
          </p>
        </div>
      </div>

      {/* Sentiment Analysis Card */}
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-2">😊</div>
          <h3 className="text-xl font-bold text-white mb-2">Sentiment Analysis</h3>
          <p className="text-white/70 text-sm">
            Understand how your audience feels about your content
          </p>
        </div>
      </div>

      {/* Comment Insights Card */}
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <h3 className="text-xl font-bold text-white mb-2">Comment Insights</h3>
          <p className="text-white/70 text-sm">
            Discover trends and patterns in viewer comments
          </p>
        </div>
      </div>

      {/* Audience Demographics Card */}
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-2">👥</div>
          <h3 className="text-xl font-bold text-white mb-2">Audience Insights</h3>
          <p className="text-white/70 text-sm">
            Learn about your viewers and their preferences
          </p>
        </div>
      </div>

      {/* Content Performance Card */}
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <h3 className="text-xl font-bold text-white mb-2">Performance Metrics</h3>
          <p className="text-white/70 text-sm">
            Monitor views, likes, and engagement rates
          </p>
        </div>
      </div>

      {/* AI Recommendations Card */}
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-2">🤖</div>
          <h3 className="text-xl font-bold text-white mb-2">AI Recommendations</h3>
          <p className="text-white/70 text-sm">
            Get personalized suggestions to improve your content
          </p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="col-span-full">
        <div className="card bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              🚀 Analytics Dashboard Coming Soon!
            </h3>
            <p className="text-white/80 text-lg mb-4">
              We're building powerful analytics tools to help you understand your YouTube audience better.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Real-time data</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>AI-powered insights</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Custom reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
