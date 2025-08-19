'use client'

import { useState, useEffect } from 'react'
import SentimentChart from './SentimentChart'
import ToxicityChart from './ToxicityChart'
import CommentList from './CommentList'

interface AnalyticsData {
  video_id: string
  total_comments: number
  analyzed_comments: number
  sentiment_distribution: {
    positive: number
    negative: number
    neutral: number
  }
  toxicity_distribution: {
    toxic: number
    'non-toxic': number
  }
  analysis_progress: number
}

interface AnalyticsDashboardProps {
  videoId: string
}

export default function AnalyticsDashboard({ videoId }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [summary, setSummary] = useState<string>('No summary available yet.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchAnalytics = async (videoId: string) => {
    if (!videoId) {
      setError('No video ID provided')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/${videoId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Insufficient credits to view analytics. Please purchase more credits.')
        }
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setAnalyticsData(data.analytics)
      setSummary(data.summary || 'Unable to generate summary')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics')
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (videoId) {
      fetchAnalytics(videoId)
    }
  }, [videoId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-3 text-gray-600">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600 font-medium">{error}</div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Analytics Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-100 to-blue-50 shadow-inner text-center transform hover:scale-105 transition duration-300">
            <h3 className="text-sm font-semibold text-blue-700 mb-2">Total Comments</h3>
            <p className="text-3xl font-bold text-blue-800">{analyticsData.total_comments}</p>
          </div>
          <div className="rounded-2xl p-6 bg-gradient-to-br from-green-100 to-green-50 shadow-inner text-center transform hover:scale-105 transition duration-300">
            <h3 className="text-sm font-semibold text-green-700 mb-2">Analyzed Comments</h3>
            <p className="text-3xl font-bold text-green-800">{analyticsData.analyzed_comments}</p>
          </div>
          <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-100 to-purple-50 shadow-inner text-center transform hover:scale-105 transition duration-300">
            <h3 className="text-sm font-semibold text-purple-700 mb-2">Progress</h3>
            <p className="text-3xl font-bold text-purple-800">
              {Math.round(analyticsData.analysis_progress)}%
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-md p-8 border border-gray-100 hover:shadow-xl transition duration-300">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Summary</h2>
        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-inner min-h-[150px] flex items-center justify-center">
          {loading ? (
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Generating insights...</span>
            </div>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-gray-800 leading-relaxed">{summary}</p>
          )}
        </div>
      </div>

      {/* Charts */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-md p-8 border border-gray-100 hover:shadow-xl transition duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
            <SentimentChart data={analyticsData.sentiment_distribution} />
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-md p-8 border border-gray-100 hover:shadow-xl transition duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Toxicity Analysis</h3>
            <ToxicityChart data={analyticsData.toxicity_distribution} />
          </div>
        </div>
      )}

      {/* Comments List
      {videoId && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-md p-8 border border-gray-100 hover:shadow-xl transition duration-300">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Comment Explorer</h3>
          <CommentList videoId={videoId} />
        </div>
      )} */}
    </div>
  )
}