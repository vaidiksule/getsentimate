'use client'

import { useState, useEffect } from 'react'
import VideoInput from '../components/VideoInput'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import Summary from '../components/Summary'
import CreditDisplay from '../components/CreditDisplay'
import UserProfile from '../components/UserProfile'
import { useAuth } from '../components/AuthProvider'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const [currentVideoId, setCurrentVideoId] = useState('')
  const [aiStatus, setAiStatus] = useState(null)
  const { logout, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  // Fetch AI status from backend
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ai-status/`)
      .then(res => res.json())
      .then(data => setAiStatus(data))
      .catch(() => setAiStatus(null))
  }, [])

  const handleVideoAnalyzed = (videoId: string) => {
    setCurrentVideoId(videoId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-lg bg-white/90 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 px-30">
            <Image
              src="/getsentimate-logo.svg"
              alt="GetSentimate"
              width={160}
              height={60}
              className="drop-shadow-md"
            />
            {/* <span className="text-xl font-bold text-blue-600">GetSentimate</span> */}
          </div>
          <button
            onClick={logout}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex min-h-[calc(100vh-64px)] max-w-7xl mx-auto px-6 py-8 gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-80 space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300">
            <UserProfile />
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300">
            <CreditDisplay />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-8">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
            <VideoInput onVideoAnalyzed={handleVideoAnalyzed} />
          </div>
          {currentVideoId && (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
              <Summary videoId={currentVideoId} />
            </div>
          )}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
            <AnalyticsDashboard videoId={currentVideoId} />
          </div>
        </main>
      </div>
    </div>
  )
}
