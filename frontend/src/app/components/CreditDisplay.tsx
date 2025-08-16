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
      <div className={`flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner ${className}`}>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <span className="text-sm font-medium text-blue-600">Loading credits...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-3xl bg-red-50 shadow-inner ${className}`}>
        <FaExclamationTriangle className="text-2xl text-red-500 mb-2" />
        <span className="text-sm font-medium text-red-600">Error loading credits</span>
      </div>
    )
  }

  if (!creditInfo) {
    return null
  }

  const isLowCredits = creditInfo.credits <= 2
  const bgGradient = isLowCredits ? 'from-orange-100 to-orange-50' : 'from-green-100 to-green-50'
  const textColor = isLowCredits ? 'text-orange-700' : 'text-green-700'
  const iconColor = isLowCredits ? 'text-orange-500' : 'text-green-500'

  return (
    <div className={`p-6 rounded-3xl bg-gradient-to-br ${bgGradient} shadow-inner ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Credits</h3>
      <div className="flex items-center justify-center space-x-4 mb-4">
        <FaCoins className={`text-3xl ${iconColor}`} />
        <div className="text-center">
          <div className={`text-4xl font-bold ${textColor}`}>
            {creditInfo.credits}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className={`text-center p-2 rounded-xl ${creditInfo.can_fetch ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {creditInfo.can_fetch ? '✓ Can fetch' : '✗ Cannot fetch'}
        </div>
        <div className={`text-center p-2 rounded-xl ${creditInfo.can_analyze ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {creditInfo.can_analyze ? '✓ Can analyze' : '✗ Cannot analyze'}
        </div>
      </div>

      {isLowCredits && (
        <div className="mt-4 text-center text-sm text-orange-600 bg-orange-50 p-2 rounded-xl">
          Low credits! Consider topping up.
        </div>
      )}
    </div>
  )
}
