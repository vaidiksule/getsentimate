'use client'
import React, { useEffect, useState, useRef } from 'react'

interface AIServiceStatusProps {}

interface AIStatus {
  ai_services: {
    openai_available: boolean
    gemini_available: boolean
    primary_service: string
  }
  message?: string
}

export default function AIServiceStatus({}: AIServiceStatusProps) {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/ai-status')
        if (!res.ok) throw new Error('Failed to fetch AI status')
        const data: AIStatus = await res.json()
        setStatus(data)
      } catch (err) {
        console.error(err)
        setStatus({
          ai_services: {
            openai_available: false,
            gemini_available: false,
            primary_service: 'none',
          },
        })
      }
    }

    fetchStatus()
  }, [])

  if (!status) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/70 backdrop-blur-md border border-gray-200 shadow-sm">
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-gray-500">AI Status: Unknown</span>
      </div>
    )
  }

  const { ai_services } = status
  const { openai_available, gemini_available, primary_service } = ai_services

  const statusDot = (isAvailable: boolean) =>
    `w-2.5 h-2.5 rounded-full shadow-sm ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`

  return (
    <div className="flex items-center space-x-4 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className={statusDot(openai_available)}></div>
        <span className="text-sm text-gray-700">OpenAI</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className={statusDot(gemini_available)}></div>
        <span className="text-sm text-gray-700">Gemini</span>
      </div>
      <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
        Primary: {primary_service}
      </div>
    </div>
  )
}
