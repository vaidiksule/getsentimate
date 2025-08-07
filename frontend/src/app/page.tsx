'use client'

import { useEffect, useState } from 'react'
import VideoInput from './components/VideoInput'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import AIServiceStatus from './components/AIServiceStatus'
import LoadingSpinner from './components/LoadingSpinner'

export default function Home() {
  const [aiServiceStatus, setAiServiceStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentVideoId, setCurrentVideoId] = useState('')

  useEffect(() => {
    // Check AI service status on load
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ai-status/`)
      .then(res => res.json())
      .then(data => {
        setAiServiceStatus(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching AI status:', err)
        setLoading(false)
      })
  }, [])

  const handleVideoAnalyzed = (videoId: string) => {
    setCurrentVideoId(videoId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GetSentimate</h1>
              <p className="text-gray-600">AI-Powered YouTube Comment Analysis</p>
            </div>
            <AIServiceStatus status={aiServiceStatus} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Input Section */}
          <div className="lg:col-span-1">
            <VideoInput onVideoAnalyzed={handleVideoAnalyzed} />
          </div>

          {/* Analytics Dashboard */}
          <div className="lg:col-span-2">
            <AnalyticsDashboard videoId={currentVideoId} />
          </div>
        </div>
      </main>
    </div>
  )
}
