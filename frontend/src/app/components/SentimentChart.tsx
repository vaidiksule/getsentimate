'use client'

interface SentimentData {
  positive: number
  negative: number
  neutral: number
}

interface SentimentChartProps {
  data: SentimentData
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const total = data.positive + data.negative + data.neutral
  
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
        return 'bg-gray-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Positive'
      case 'negative':
        return 'Negative'
      case 'neutral':
        return 'Neutral'
      default:
        return sentiment
    }
  }

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="space-y-2">
        {Object.entries(data).map(([sentiment, count]) => (
          <div key={sentiment} className="flex items-center space-x-3">
            <div className="w-20 text-sm font-medium text-gray-700">
              {getLabel(sentiment)}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${getColor(sentiment)} transition-all duration-300`}
                style={{ width: `${getPercentage(count)}%` }}
              ></div>
            </div>
            <div className="w-16 text-sm text-gray-600 text-right">
              {count} ({getPercentage(count)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{data.positive}</div>
          <div className="text-xs text-gray-500">Positive</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{data.negative}</div>
          <div className="text-xs text-gray-500">Negative</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{data.neutral}</div>
          <div className="text-xs text-gray-500">Neutral</div>
        </div>
      </div>
    </div>
  )
}
