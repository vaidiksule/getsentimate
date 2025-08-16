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
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-md p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Overview</h2>

                {!analyticsData ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <p className="text-gray-600 font-medium">Analyze a video to see insights here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-100 to-blue-50 shadow-inner text-center transform hover:scale-105 transition duration-300">
                            <h3 className="text-sm font-semibold text-blue-700 mb-2">Total Comments</h3>
                            <p className="text-3xl font-bold text-blue-800">{analyticsData.total_comments}</p>
                        </div>
                        <div className="rounded-2xl p-6 bg-gradient-to-br from-green-100 to-green-50 shadow-inner text-center transform hover:scale-105 transition duration-300">
                            <h3 className="text-sm font-semibold text-green-700 mb-2">Analyzed</h3>
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

            {/* Comments List */}
            {analyticsData && (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-md p-8 border border-gray-100 hover:shadow-xl transition duration-300">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Comment Explorer</h3>
                    <CommentList videoId={analyticsData.video_id} />
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 shadow-inner">
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}
        </div>
    )
}
