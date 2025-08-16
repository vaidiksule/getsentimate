export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-gray-700 font-medium animate-pulse">Loading insights...</span>
    </div>
  )
}