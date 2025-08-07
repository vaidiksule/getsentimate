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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments/?video_id=${videoId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments')
      }

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50'
      case 'negative':
        return 'text-red-600 bg-red-50'
      case 'neutral':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getToxicityColor = (toxicity: string) => {
    switch (toxicity) {
      case 'toxic':
        return 'text-red-600 bg-red-50'
      case 'non-toxic':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <select
          value={toxicityFilter}
          onChange={(e) => setToxicityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Toxicity</option>
          <option value="toxic">Toxic</option>
          <option value="non-toxic">Non-toxic</option>
        </select>
      </div>

      {/* Comments Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredComments.length} of {comments.length} comments
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No comments found</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{comment.author_name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.published_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {comment.analyzed && (
                    <>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSentimentColor(comment.sentiment_label)}`}>
                        {comment.sentiment_label}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getToxicityColor(comment.toxicity_label)}`}>
                        {comment.toxicity_label}
                      </span>
                    </>
                  )}
                  <span className="text-sm text-gray-500">
                    👍 {comment.like_count}
                  </span>
                </div>
              </div>
              <p className="text-gray-700">{comment.text}</p>
              {comment.analyzed && (
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>Sentiment: {Math.round(comment.sentiment_score * 100)}%</span>
                  <span>Toxicity: {Math.round(comment.toxicity_score * 100)}%</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
