'use client'

interface SentimentData {
  positive: number
  negative: number
  neutral: number
}

interface SentimentChartProps {
  data: SentimentData | null // Allow null to handle undefined/missing data
}

export default function SentimentChart({ data }: SentimentChartProps) {
  // Default to zeros if data is null or undefined
  const sentimentData: SentimentData = data ?? { positive: 0, negative: 0, neutral: 0 }
  const total = sentimentData.positive + sentimentData.negative + sentimentData.neutral
  
  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  const getColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500'
      case 'negative':
        return 'bg-red-500'
      case 'neutral':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getLabel = (sentiment: string) => {
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
  }

  const getBgColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50 text-green-700'
      case 'negative':
        return 'bg-red-50 text-red-700'
      case 'neutral':
        return 'bg-yellow-50 text-yellow-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  // Show a loading or empty state if no data is available
  if (!data || total === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 font-medium">
        No sentiment data available yet. Please analyze the video to see sentiment distribution.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="space-y-4">
        {Object.entries(sentimentData).map(([sentiment, count]) => (
          <div key={sentiment} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span>{getLabel(sentiment)}</span>
              <span>{count} ({getPercentage(count)}%)</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`${getColor(sentiment)} h-full transition-all duration-500`}
                style={{ width: `${getPercentage(count)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(sentimentData).map(([sentiment, count]) => (
          <div key={sentiment} className={`p-4 rounded-2xl text-center ${getBgColor(sentiment)} shadow-inner`}>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-sm font-medium">{getLabel(sentiment)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}