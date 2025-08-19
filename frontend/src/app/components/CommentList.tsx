'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface Comment {
  id: number
  author_name: string
  text: string
  like_count: number
  published_at: string
  sentiment_label: string
  toxicity_label: string
  sentiment_score: number
  toxicity_score: number
  analyzed: boolean
}

interface CommentListProps {
  videoId: string
}

export default function CommentList({ videoId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('all')
  const [toxicityFilter, setToxicityFilter] = useState('all')

  const fetchComments = async () => {
    if (!videoId) return
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      console.log("got token, ", token)
      if (!token) {
        throw new Error('No authentication token found')
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments/?video_id=${videoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      console.log(response)
      console.log(response.type)
      const data = await response.json()
      console.log("DATAAA: ", data)
      if (!response.ok) throw new Error(data.error || 'Failed to fetch comments')
      setComments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (videoId) {
      fetchComments()
    }
  }, [videoId])

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSentiment = sentimentFilter === 'all' || comment.sentiment_label === sentimentFilter
    const matchesToxicity = toxicityFilter === 'all' || comment.toxicity_label === toxicityFilter
    return matchesSearch && matchesSentiment && matchesToxicity
  })

  const badgeStyle = (color: string) => `px-3 py-1 text-xs font-semibold rounded-full ${color} bg-opacity-10 border ${color.replace('text', 'border')}`

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return badgeStyle('text-green-600 border-green-200')
      case 'negative':
        return badgeStyle('text-red-600 border-red-200')
      case 'neutral':
        return badgeStyle('text-gray-600 border-gray-200')
      default:
        return badgeStyle('text-gray-600 border-gray-200')
    }
  }

  const getToxicityColor = (toxicity: string) => {
    switch (toxicity) {
      case 'toxic':
        return badgeStyle('text-red-600 border-red-200')
      case 'non-toxic':
        return badgeStyle('text-green-600 border-green-200')
      default:
        return badgeStyle('text-gray-600 border-gray-200')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-red-700 font-medium">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
        <input
          type="text"
          placeholder="Search comments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none"
        />
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="px-4 py-2 rounded-full border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <select
          value={toxicityFilter}
          onChange={(e) => setToxicityFilter(e.target.value)}
          className="px-4 py-2 rounded-full border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none"
        >
          <option value="all">All Toxicity</option>
          <option value="toxic">Toxic</option>
          <option value="non-toxic">Non-toxic</option>
        </select>
      </div>

      {/* Comments Count */}
      <div className="text-sm text-gray-600 font-medium">
        Showing {filteredComments.length} of {comments.length} comments
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-medium">No comments match your filters</div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-900">{comment.author_name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {new Date(comment.published_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {comment.analyzed && (
                    <>
                      <span className={getSentimentColor(comment.sentiment_label)}>
                        {comment.sentiment_label.charAt(0).toUpperCase() + comment.sentiment_label.slice(1)}
                      </span>
                      <span className={getToxicityColor(comment.toxicity_label)}>
                        {comment.toxicity_label.charAt(0).toUpperCase() + comment.toxicity_label.slice(1)}
                      </span>
                    </>
                  )}
                  <span className="text-sm text-gray-600 flex items-center">
                    <span className="mr-1">👍</span> {comment.like_count}
                  </span>
                </div>
              </div>
              <p className="text-gray-800 leading-relaxed mb-3">{comment.text}</p>
              {comment.analyzed && (
                <div className="flex items-center space-x-6 text-xs text-gray-600">
                  <span className="bg-blue-50 px-3 py-1 rounded-full">Sentiment: {Math.round(comment.sentiment_score * 100)}%</span>
                  <span className="bg-purple-50 px-3 py-1 rounded-full">Toxicity: {Math.round(comment.toxicity_score * 100)}%</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}