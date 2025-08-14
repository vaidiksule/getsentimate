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
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Video Summary</h2>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px]">
        {loading ? (
          <div className="flex items-center text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            Generating summary...
          </div>
        ) : (
          <p className="text-gray-700 text-sm leading-relaxed">{summary}</p>
        )}
      </div>
    </div>
  )
}
