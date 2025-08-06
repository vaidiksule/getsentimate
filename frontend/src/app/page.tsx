'use client'

import { useEffect, useState } from 'react'

type ApiResponse = {
  message: string
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/test/`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error('Error:', err))
  }, [])

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold">Frontend Connected to Django ✅</h1>
      {data ? (
        <pre className="mt-4 bg-gray-100 p-2 rounded">{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p className="text-gray-500">Loading data from backend...</p>
      )}
    </main>
  )
}
