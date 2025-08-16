'use client'

import { useState, useEffect } from 'react'
import { FaUser, FaCalendarAlt, FaVideo, FaChartBar } from 'react-icons/fa'

interface UserProfileData {
  name: string
  email: string
  avatar: string
  credits: number
  videos_fetched: number
  total_analyses: number
  account_joined_at: string
  last_active: string
}

interface UserProfileProps {
  className?: string
}

export default function UserProfile({ className = '' }: UserProfileProps) {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/profile/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch profile information')
      }

      const data = await response.json()
      setProfileData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className={`rounded-3xl p-6 space-y-6 bg-gradient-to-br from-white to-gray-50 shadow-inner ${className}`}>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-3xl p-6 text-center text-red-600 bg-red-50 shadow-inner ${className}`}>
        <FaUser className="text-4xl mx-auto mb-3 text-red-400" />
        <p className="font-medium">Error: {error}</p>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className={`rounded-3xl p-6 text-center text-gray-500 bg-gray-50 shadow-inner ${className}`}>
        <FaUser className="text-4xl mx-auto mb-3 text-gray-400" />
        <p className="font-medium">No profile data</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-blue-200 ring-offset-2">
          {profileData.avatar ? (
            <img 
              src={profileData.avatar} 
              alt={profileData.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FaUser className="w-full h-full p-4 text-gray-400 bg-gray-100" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{profileData.name}</h3>
          <p className="text-gray-600">{profileData.email}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 text-center shadow-inner">
          <FaVideo className="text-blue-500 text-2xl mx-auto mb-2" />
          <div className="text-3xl font-bold text-blue-700">{profileData.videos_fetched}</div>
          <div className="text-xs text-blue-600 font-medium">Videos Fetched</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center shadow-inner">
          <FaChartBar className="text-green-500 text-2xl mx-auto mb-2" />
          <div className="text-3xl font-bold text-green-700">{profileData.total_analyses}</div>
          <div className="text-xs text-green-600 font-medium">Analyses Performed</div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl">
          <FaCalendarAlt className="text-gray-500" />
          <span>Joined: {formatDate(profileData.account_joined_at)}</span>
        </div>
        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl">
          <FaCalendarAlt className="text-gray-500" />
          <span>Last Active: {formatDate(profileData.last_active)}</span>
        </div>
      </div>

      {/* Refresh */}
      <button
        onClick={fetchProfile}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
      >
        Refresh Profile
      </button>
    </div>
  )
}
