'use client'

import { useState } from 'react'
import VideoInput from './components/VideoInput'
import AnalyticsDashboard from './components/AnalyticsDashboard'

export default function Home() {
  const [currentVideoId, setCurrentVideoId] = useState('')

  const handleVideoAnalyzed = (videoId: string) => {
    setCurrentVideoId(videoId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              {/* <h1 className="text-3xl font-bold text-gray-900">GetSentimate</h1> */}
              <img 
                src="/getsentimate-logo.svg" 
                alt="GetSentimate" 
                className="w-15 h-11" 
              />
              <p className="text-gray-600">AI-Powered YouTube Comment Analysis</p>
            </div>
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
