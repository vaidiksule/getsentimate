'use client'

interface AIServiceStatusProps {
  status: any
}

export default function AIServiceStatus({ status }: AIServiceStatusProps) {
  if (!status) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-gray-500">AI Status: Unknown</span>
      </div>
    )
  }

  const { ai_services } = status
  const { openai_available, gemini_available, primary_service } = ai_services

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${openai_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">OpenAI</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${gemini_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">Gemini</span>
      </div>
      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        Primary: {primary_service}
      </div>
    </div>
  )
}
