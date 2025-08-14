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

  const badgeStyle = (color: string) => `px-2 py-0.5 text-xs rounded-full font-medium ${color} bg-opacity-20`

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return badgeStyle('text-green-600 bg-green-500')
      case 'negative':
        return badgeStyle('text-red-600 bg-red-500')
      case 'neutral':
        return badgeStyle('text-gray-600 bg-gray-500')
      default:
        return badgeStyle('text-gray-600 bg-gray-500')
    }
  }

  const getToxicityColor = (toxicity: string) => {
    switch (toxicity) {
      case 'toxic':
        return badgeStyle('text-red-600 bg-red-500')
      case 'non-toxic':
        return badgeStyle('text-green-600 bg-green-500')
      default:
        return badgeStyle('text-gray-600 bg-gray-500')
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) {
    return (
      <div className="text-center py-8 text-red-600">{error}</div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-sm border border-gray-200">
        <input
          type="text"
          placeholder="Search comments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <select
          value={toxicityFilter}
          onChange={(e) => setToxicityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No comments found</div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-800">{comment.author_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.published_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {comment.analyzed && (
                    <>
                      <span className={getSentimentColor(comment.sentiment_label)}>
                        {comment.sentiment_label}
                      </span>
                      <span className={getToxicityColor(comment.toxicity_label)}>
                        {comment.toxicity_label}
                      </span>
                    </>
                  )}
                  <span className="text-sm text-gray-500">👍 {comment.like_count}</span>
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
