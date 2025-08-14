'use client'

import { useState } from 'react'
import VideoInput from './components/VideoInput'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import Summary from './components/Summary'

export default function Home() {
  const [currentVideoId, setCurrentVideoId] = useState('')

  const handleVideoAnalyzed = (videoId: string) => {
    setCurrentVideoId(videoId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex flex-col">
              <img 
                src="/getsentimate-logo.svg" 
                alt="GetSentimate" 
                className="w-14 h-auto mb-1 drop-shadow-sm"
              />
              <p className="text-gray-500 text-sm tracking-wide">
                AI-Powered YouTube Comment Analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            {/* Video Input Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <VideoInput onVideoAnalyzed={handleVideoAnalyzed} />
            </div>

            {/* Summary Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <Summary videoId={currentVideoId} />
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <AnalyticsDashboard videoId={currentVideoId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
