import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GetSentimate - AI-Powered YouTube Analytics',
  description: 'Understand your YouTube audience with AI-powered comment analysis, sentiment detection, and actionable insights.',
  keywords: 'YouTube analytics, comment analysis, sentiment analysis, AI, content creators, audience insights',
  authors: [{ name: 'GetSentimate Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
