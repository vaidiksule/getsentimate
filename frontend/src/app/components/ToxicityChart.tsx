'use client'

interface ToxicityData {
  toxic: number
  'non-toxic': number
}

interface ToxicityChartProps {
  data: ToxicityData | null // Allow null to handle undefined/missing data
}

export default function ToxicityChart({ data }: ToxicityChartProps) {
  // Default to zeros if data is null or undefined
  const toxicityData: ToxicityData = data ?? { toxic: 0, 'non-toxic': 0 }
  const total = toxicityData.toxic + toxicityData['non-toxic']

  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  const toxicPercentage = getPercentage(toxicityData.toxic)
  const nonToxicPercentage = getPercentage(toxicityData['non-toxic'])

  // Show a loading or empty state if no data is available
  if (!data || total === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 font-medium">
        No toxicity data available yet. Please analyze the video to see toxicity distribution.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Donut Chart */}
      <div className="relative w-48 h-48 mx-auto">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 36 36"
        >
          {/* Background Circle */}
          <path
            className="text-gray-200"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Toxic Segment */}
          <path
            className="text-red-500"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${toxicPercentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Non-toxic Segment */}
          <path
            className="text-green-500"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${nonToxicPercentage}, 100`}
            strokeDashoffset={`-${toxicPercentage}`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3 bg-red-50 p-3 rounded-xl">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <div>
            <span className="text-sm font-medium text-gray-700">Toxic</span>
            <div className="text-lg font-bold text-red-600">{toxicityData.toxic} ({toxicPercentage}%)</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-green-50 p-3 rounded-xl">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <div>
            <span className="text-sm font-medium text-gray-700">Non-toxic</span>
            <div className="text-lg font-bold text-green-600">{toxicityData['non-toxic']} ({nonToxicPercentage}%)</div>
          </div>
        </div>
      </div>
    </div>
  )
}