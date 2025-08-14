export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center space-x-3 p-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-gray-700 font-medium animate-pulse">Loading...</span>
    </div>
  )
}
