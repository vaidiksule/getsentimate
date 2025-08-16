'use client'

import { useState, useEffect } from 'react'
import { FaCoins, FaExclamationTriangle } from 'react-icons/fa'

interface CreditInfo {
  credits: number
  can_analyze: boolean
  can_fetch: boolean
}

interface CreditDisplayProps {
  className?: string
}

export default function CreditDisplay({ className = '' }: CreditDisplayProps) {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCredits = async () => {
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/credits/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch credit information')
      }

      const data = await response.json()
      setCreditInfo(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading credits...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 ${className}`}>
        <FaExclamationTriangle className="text-red-500 text-sm" />
        <span className="text-sm text-red-600">Error loading credits</span>
      </div>
    )
  }

  if (!creditInfo) {
    return null
  }

  const isLowCredits = creditInfo.credits <= 2
  const bgColor = isLowCredits ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
  const textColor = isLowCredits ? 'text-orange-700' : 'text-green-700'
  const iconColor = isLowCredits ? 'text-orange-500' : 'text-green-500'

  return (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${bgColor} ${className}`}>
      <div className="flex items-center space-x-2">
        <FaCoins className={`text-lg ${iconColor}`} />
        <div className="text-center">
          <div className={`text-lg font-bold ${textColor}`}>
            {creditInfo.credits}
          </div>
          <div className={`text-xs ${textColor}`}>
            Credits
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-600">
        <div className={creditInfo.can_fetch ? 'text-green-600' : 'text-red-600'}>
          {creditInfo.can_fetch ? '✓ Can fetch' : '✗ Cannot fetch'}
        </div>
        <div className={creditInfo.can_analyze ? 'text-green-600' : 'text-red-600'}>
          {creditInfo.can_analyze ? '✓ Can analyze' : '✗ Cannot analyze'}
        </div>
      </div>

      {isLowCredits && (
        <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
          Low credits!
        </div>
      )}
    </div>
  )
}
