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
    <div className="space-y-6 p-4 bg-white shadow-lg rounded-xl border border-gray-100">
      {/* Bar Chart */}
      <div className="space-y-3">
        {Object.entries(data).map(([sentiment, count]) => (
          <div key={sentiment} className="flex items-center space-x-4">
            {/* Label */}
            <div className="w-20 text-sm font-semibold text-gray-800">
              {getLabel(sentiment)}
            </div>
            
            {/* Progress Bar */}
            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 ${getColor(sentiment)} transition-all duration-500 ease-out shadow-inner`}
                style={{ width: `${getPercentage(count)}%` }}
              ></div>
            </div>
            
            {/* Count & % */}
            <div className="w-16 text-xs font-medium text-gray-600 text-right">
              {count} ({getPercentage(count)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center p-2 rounded-lg bg-green-50">
          <div className="text-2xl font-bold text-green-600">{data.positive}</div>
          <div className="text-xs font-medium text-green-700">Positive</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50">
          <div className="text-2xl font-bold text-red-600">{data.negative}</div>
          <div className="text-xs font-medium text-red-700">Negative</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50">
          <div className="text-2xl font-bold text-gray-600">{data.neutral}</div>
          <div className="text-xs font-medium text-gray-700">Neutral</div>
        </div>
      </div>
    </div>
  )
}
