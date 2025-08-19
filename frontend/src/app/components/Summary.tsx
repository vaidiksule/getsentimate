'use client'

import { useEffect, useState } from 'react'

interface SummaryProps {
  videoId: string
}

export default function Summary({ videoId }: SummaryProps) {
  const [summary, setSummary] = useState<string>('No summary available yet.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoId) {
      setSummary('No video ID provided.')
      return
    }

    const fetchSummary = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/analytics/${videoId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setSummary(data.summary || 'No summary available.')
      } catch (err) {
        setError('Failed to fetch summary. Please try again.')
        setSummary('No summary available.')
        console.error('Error fetching summary:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
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
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-gray-800 leading-relaxed">{summary}</p>
        )}
      </div>
    </div>
  )
}