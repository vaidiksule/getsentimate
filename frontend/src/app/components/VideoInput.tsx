'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface VideoData {
    video_id: string
    title: string
    channel_title: string
    total_comments: number
}

interface VideoInputProps {
    onVideoAnalyzed: (videoId: string) => void
}

export default function VideoInput({ onVideoAnalyzed }: VideoInputProps) {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [videoData, setVideoData] = useState<VideoData | null>(null)
    const [error, setError] = useState('')
    const [analysisStatus, setAnalysisStatus] = useState('')

    const extractVideoId = (url: string) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\\s]{11})/
        const match = url.match(regex)
        return match ? match[1] : null
    }

    const fetchVideoData = async () => {
        if (!url.trim()) {
            setError('Please enter a YouTube URL')
            return
        }

        const videoId = extractVideoId(url)
        if (!videoId) {
            setError('Invalid YouTube URL')
            return
        }

        setLoading(true)
        setError('')
        setVideoData(null)

        try {
            console.log('here')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/youtube/fetch-comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, fetch_transcript: false }),
            })
            console.log(response)
        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch video data')
        }

        setVideoData({
            video_id: data.video_id,
            title: data.video.title,
            channel_title: data.video.channel_title,
            total_comments: data.total_comments,
        })

        setAnalysisStatus('Comments fetched successfully! Ready for analysis.')
    } catch (err: any) {
        setError(err.message || 'Failed to fetch video data')
    } finally {
        setLoading(false)
    }
    }

    const analyzeComments = async () => {
        if (!videoData) return

        setLoading(true)
        setAnalysisStatus('Analyzing comments...')

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/youtube/analyze-comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_id: videoData.video_id }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze comments')
            }

            setAnalysisStatus(`Analysis complete! ${data.analyzed_count} comments analyzed.`)

            // Notify parent component that analysis is complete
            onVideoAnalyzed(videoData.video_id)
        } catch (err: any) {
            setError(err.message || 'Failed to analyze comments')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-50 rounded-xl shadow-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Video Analysis</h2>

            {/* URL Input */}
            <div className="space-y-2">
                <label htmlFor="video-url" className="block text-sm font-medium text-gray-700">YouTube Video URL</label>
                <div className="flex rounded-md shadow-sm">
                    <input
                        type="url"
                        id="video-url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 block w-full min-w-0 rounded-xl border-gray-300 focus:border-primary focus:ring-primary sm:text-sm text-blue-900"
                        disabled={loading}
                    />
                    <button
                        onClick={fetchVideoData}
                        disabled={loading || !url.trim()}
                        className="inline-flex items-center rounded-xl border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <LoadingSpinner /> : 'Fetch'}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Preview */}
            {videoData && (
                <div className="bg-neutral rounded-md p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Video Information</h3>
                    <div className="space-y-2 text-gray-900">
                        <p><span className="font-medium">Title:</span> {videoData.title}</p>
                        <p><span className="font-medium">Channel:</span> {videoData.channel_title}</p>
                        <p><span className="font-medium">Comments:</span> {videoData.total_comments}</p>
                        <p><span className="font-medium">Video ID:</span> {videoData.video_id}</p>
                    </div>

                    <button
                        onClick={analyzeComments}
                        disabled={loading}
                        className="mt-4 w-full inline-flex items-center justify-center rounded-xl border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <LoadingSpinner /> : 'Analyze Comments'}
                    </button>
                </div>
            )}

            {/* Status Display */}
            {analysisStatus && (
                <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">{analysisStatus}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
