'use client'

interface ToxicityData {
  toxic: number
  'non-toxic': number
}

interface ToxicityChartProps {
  data: ToxicityData
}

export default function ToxicityChart({ data }: ToxicityChartProps) {
  const total = data.toxic + data['non-toxic']

  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  const toxicPercentage = getPercentage(data.toxic)

  return (
    <div className="space-y-4">
      {/* Donut Chart */}
      <div className="relative w-32 h-32 mx-auto">
        <svg
          className="w-32 h-32 transform -rotate-90 text-gray-200"
          viewBox="0 0 36 36"
        >
          {/* Background Circle */}
          <path
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Toxic Segment */}
          <path
            className="text-red-500"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={`${toxicPercentage}, 100`}
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>

        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {toxicPercentage}%
            </div>
            <div className="text-xs text-gray-500">Toxic</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Toxic</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{data.toxic}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Non-toxic</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {data['non-toxic']}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{data.toxic}</div>
          <div className="text-xs text-gray-500">Toxic Comments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {data['non-toxic']}
          </div>
          <div className="text-xs text-gray-500">Safe Comments</div>
        </div>
      </div>
    </div>
  )
}
