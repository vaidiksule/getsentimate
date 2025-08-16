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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchAnalytics = async (videoId: string) => {
        if (!videoId) return

        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/${videoId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const data = await response.json()

            if (!response.ok) {
                if (response.status === 402) {
                    throw new Error('Insufficient credits to view analytics. Please purchase more credits.')
                }
                throw new Error(data.error || 'Failed to fetch analytics')
            }

            setAnalyticsData(data)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch analytics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (videoId) {
            fetchAnalytics(videoId)
        } else {
            setAnalyticsData(null)
        }
    }, [videoId])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Analytics Dashboard</h2>

                {!analyticsData ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Enter a YouTube URL to start analyzing comments</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
                            <h3 className="text-sm font-medium text-blue-600">Total Comments</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{analyticsData.total_comments}</p>
                        </div>
                        <div className="rounded-xl p-4 bg-gradient-to-br from-green-50 to-white border border-green-100 shadow-sm">
                            <h3 className="text-sm font-medium text-green-600">Analyzed</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{analyticsData.analyzed_comments}</p>
                        </div>
                        <div className="rounded-xl p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm">
                            <h3 className="text-sm font-medium text-purple-600">Progress</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {Math.round(analyticsData.analysis_progress)}%
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts */}
            {analyticsData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Distribution</h3>
                        <SentimentChart data={analyticsData.sentiment_distribution} />
                    </div>

                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Toxicity Analysis</h3>
                        <ToxicityChart data={analyticsData.toxicity_distribution} />
                    </div>
                </div>
            )}

            {/* Comments List */}
            {analyticsData && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments</h3>
                    <CommentList videoId={analyticsData.video_id} />
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                    <p className="text-red-600">{error}</p>
                </div>
            )}
        </div>
    )
}
