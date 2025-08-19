// app/components/VideoInput.tsx (Full Updated File)

'use client'

import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import Image from 'next/image'

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
  const [statusMessage, setStatusMessage] = useState('')

  const extractVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/ ]{11})/
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
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/youtube/fetch-comments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ video_url: url, fetch_transcript: false }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Insufficient credits to fetch comments. Please purchase more credits.')
        }
        throw new Error(data.error || 'Failed to fetch video data')
      }

      setVideoData({
        video_id: data.video_id,
        title: data.video_title,
        channel_title: data.channel_title,
        total_comments: data.total_comments,
      })
      // const creditMessage = data.credits !== undefined 
      //   ? ` (Credits used: ${data.credits_used}, Remaining: ${data.credits_remaining})`
      //   : ''
      
      setAnalysisStatus("Comments fetched successfully! Ready for analysis.")
    } catch (err: any) {
      setError(err.message || 'Failed to fetch video data')
    } finally {
      setLoading(false)
    }
  }

  const analyzeComments = async () => {
    if (!videoData) return

    setLoading(true)
    setError('')
    setAnalysisStatus('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/youtube/analyze-comments/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ video_id: videoData.video_id }),
        }
      )

      const data = await response.json()

      console.log("analyed data ", data)

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Insufficient credits to analyze comments. Please purchase more credits.')
        }
        throw new Error(data.error || 'Failed to analyze comments')
      }
      onVideoAnalyzed(videoData.video_id)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze comments')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Start Your Analysis</h2>

      {/* URL Input */}
      <div className="flex rounded-full overflow-hidden border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200 transition duration-200 bg-white shadow-inner">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube video URL here..."
          className="flex-1 px-6 py-4 text-gray-900 outline-none"
          disabled={loading}
        />
        <button
          onClick={fetchVideoData}
          disabled={loading || !url.trim()}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-8 py-4 transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch Comments'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Video Info */}
      {videoData && (
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-6">
          <div className="flex gap-6">
            <div className="w-48 h-28 rounded-2xl overflow-hidden shadow-md">
              <Image
                src={`https://img.youtube.com/vi/${videoData.video_id}/hqdefault.jpg`}
                alt={videoData.title}
                width={480}
                height={360}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{videoData.title}</h3>
              <p className="text-gray-600 mb-1">{videoData.channel_title}</p>
              <p className="text-gray-600">Comments: {videoData.total_comments}</p>
            </div>
          </div>
          <button
            onClick={analyzeComments}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Now'}
          </button>
        </div>
      )}

      {/* Status */}
      {analysisStatus && (
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700 font-medium">
          {analysisStatus}
        </div>
      )}
    </div>
  )
}