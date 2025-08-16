'use client'

import { useEffect, useState } from 'react'

interface SummaryProps {
  videoId: string
}

export default function Summary({ videoId }: SummaryProps) {
  const [summary, setSummary] = useState<string>('No summary available yet.')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!videoId) return
    setLoading(true)

    // Simulate API call to fetch summary
    setTimeout(() => {
      setSummary(`This is a placeholder AI-generated summary for video ID: ${videoId}. Replace this with actual API call.`)
      setLoading(false)
    }, 1200)
  }, [videoId])

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Summary</h2>
      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-inner min-h-[150px] flex items-center justify-center">
        {loading ? (
          <div className="flex items-center space-x-3 text-gray-600">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Generating insights...</span>
          </div>
        ) : (
          <p className="text-gray-800 leading-relaxed">{summary}</p>
        )}
      </div>
    </div>
  )
}
