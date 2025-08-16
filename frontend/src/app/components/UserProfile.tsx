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
      <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}>
        <div className="text-center text-red-600">
          <FaUser className="text-3xl mx-auto mb-2 text-red-400" />
          <p className="text-sm">Error loading profile: {error}</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}>
        <div className="text-center text-gray-500">
          <FaUser className="text-3xl mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No profile data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
          {profileData.avatar ? (
            <img 
              src={profileData.avatar} 
              alt={profileData.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FaUser className="w-full h-full p-4 text-gray-400" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
          <p className="text-gray-600">{profileData.email}</p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <FaVideo className="text-blue-500 text-xl mx-auto mb-1" />
          <div className="text-2xl font-bold text-blue-700">{profileData.videos_fetched}</div>
          <div className="text-xs text-blue-600">Videos Fetched</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <FaChartBar className="text-green-500 text-xl mx-auto mb-1" />
          <div className="text-2xl font-bold text-green-700">{profileData.total_analyses}</div>
          <div className="text-xs text-green-600">Total Analyses</div>
        </div>
      </div>

      {/* Account Info */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center space-x-3 text-gray-600">
          <FaCalendarAlt className="text-gray-400" />
          <span>Joined: {formatDate(profileData.account_joined_at)}</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600">
          <FaCalendarAlt className="text-gray-400" />
          <span>Last Active: {formatDate(profileData.last_active)}</span>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchProfile}
        className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition"
      >
        Refresh Profile
      </button>
    </div>
  )
}
