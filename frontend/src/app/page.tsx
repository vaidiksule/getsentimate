"use client";

import { GoogleLoginButton } from './components/GoogleLoginButton';
import { useAuth } from './components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaRegSmile, FaShieldAlt, FaLightbulb } from 'react-icons/fa';

export default function Home() {
  const { user, accessToken, logout } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Optional: fetch user info (can be removed if not needed)
  useEffect(() => {
    const fetchMe = async () => {
      if (accessToken) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/me/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setMessage(`Hello ${data.name}!`);
          } else {
            setMessage('Failed to fetch /api/me/');
          }
        } catch {
          setMessage('Error fetching /api/me/');
        }
      } else {
        setMessage('Not authenticated.');
      }
    };
    fetchMe();
  }, [accessToken]);

  return (
    <main className="min-h-screen font-sans text-gray-900 bg-white antialiased">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white py-32">
        <div className="absolute inset-0 bg-[url('/public/getsentimate-logo.svg')] opacity-50 bg-no-repeat bg-center bg-contain mix-blend-soft-light"></div>
        <div className="max-w-7xl mx-auto px-6 py-32 text-center relative">
          <h1 className="text-5xl md:text-6xl font-semibold mb-6 leading-tight tracking-tight text-gray-800">
            Unlock the Power of <span className="text-blue-600">YouTube Comment Analysis</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            GetSentimate helps you understand audience sentiment, detect toxicity, and extract insights from comments — elegantly and effortlessly.
          </p>

          {!user && (
            <GoogleLoginButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''} />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold mb-16 text-gray-800">Features You’ll Love</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-10 rounded-2xl shadow-md hover:shadow-lg transition cursor-default text-center">
              <FaRegSmile className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-medium mb-3 text-gray-700">Sentiment Analysis</h3>
              <p className="text-gray-500">Understand the emotions behind your comments with clarity.</p>
            </div>
            <div className="bg-white p-10 rounded-2xl shadow-md hover:shadow-lg transition cursor-default text-center">
              <FaShieldAlt className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-medium mb-3 text-gray-700">Toxicity Detection</h3>
              <p className="text-gray-500">Filter out spammy or harmful comments to maintain a clean community.</p>
            </div>
            <div className="bg-white p-10 rounded-2xl shadow-md hover:shadow-lg transition cursor-default text-center">
              <FaLightbulb className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-medium mb-3 text-gray-700">Insight Extraction</h3>
              <p className="text-gray-500">Discover recurring topics and trends effortlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-semibold mb-16 text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-blue-50 p-10 rounded-2xl shadow-md hover:shadow-lg transition cursor-default">
              <h3 className="text-xl font-medium mb-3 text-gray-700">1. Connect Your Channel</h3>
              <p className="text-gray-500">Sign in with Google to connect your YouTube channel securely.</p>
            </div>
            <div className="bg-blue-50 p-10 rounded-2xl shadow-md hover:shadow-lg transition cursor-default">
              <h3 className="text-xl font-medium mb-3 text-gray-700">2. AI Analyzes Comments</h3>
              <p className="text-gray-500">Comments are analyzed for sentiment, toxicity, and insights instantly.</p>
            </div>
            <div className="bg-blue-50 p-10 rounded-2xl shadow-md hover:shadow-lg transition cursor-default">
              <h3 className="text-xl font-medium mb-3 text-gray-700">3. Get Actionable Insights</h3>
              <p className="text-gray-500">See trends and audience feedback to make smarter content decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-blue-100 text-center">
        <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-800">Start Understanding Your Audience</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Sign in with Google and start analyzing YouTube comments effortlessly.
        </p>
      </section>

    </main>
  );
}
