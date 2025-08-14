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
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\\s]{11})/
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/youtube/fetch-comments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, fetch_transcript: false }),
        }
      )

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/youtube/analyze-comments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ video_id: videoData.video_id }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze comments')
      }

      setAnalysisStatus(
        `Analysis complete! ${data.analyzed_count} comments analyzed.`
      )

      onVideoAnalyzed(videoData.video_id)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze comments')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900">Video Analysis</h2>

      {/* URL Input */}
      <div className="space-y-2">
        <label
          htmlFor="video-url"
          className="block text-sm font-semibold text-gray-700"
        >
          YouTube Video URL
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:border-blue-500 focus-within:ring focus-within:ring-blue-200 transition">
          <input
            type="url"
            id="video-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-4 py-2 text-sm text-gray-900 outline-none"
            disabled={loading}
          />
          <button
            onClick={fetchVideoData}
            disabled={loading || !url.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner /> : 'Fetch'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 border border-red-200">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Video Preview */}
      {videoData && (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Video Information
          </h3>
          <div className="space-y-2 text-gray-800 text-sm">
            <p>
              <span className="font-medium">Title:</span> {videoData.title}
            </p>
            <p>
              <span className="font-medium">Channel:</span>{' '}
              {videoData.channel_title}
            </p>
            <p>
              <span className="font-medium">Comments:</span>{' '}
              {videoData.total_comments}
            </p>
            <p>
              <span className="font-medium">Video ID:</span>{' '}
              {videoData.video_id}
            </p>
          </div>

          <button
            onClick={analyzeComments}
            disabled={loading}
            className="mt-5 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <LoadingSpinner /> : 'Analyze Comments'}
          </button>
        </div>
      )}

      {/* Status Display */}
      {analysisStatus && (
        <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <p className="text-sm font-medium text-blue-700">{analysisStatus}</p>
        </div>
      )}
    </div>
  )
}
