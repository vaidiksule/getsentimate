
"use client";

import { GoogleLoginButton } from './components/GoogleLoginButton';
import { useAuth } from './components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaRegSmile, FaShieldAlt, FaLightbulb } from 'react-icons/fa';
import Image from 'next/image';

export default function Home() {
  const { user, login, logout } = useAuth();
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
      if (user) { // Check if user is authenticated
        try {
          const token = user?.token || ''; // Get the token from the user object
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/me/`, {
            headers: { Authorization: `Bearer ${token}` },
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
  }, [user]);

  return (
    <main className="min-h-screen font-sans text-gray-900 bg-white antialiased">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
          <Image
              src="/getsentimate-logo.svg"
              alt="GetSentimate"
              width={160}
              height={60}
              className="drop-shadow-md"
            />
            {/* <span className="text-2xl font-extrabold text-blue-600 tracking-tight">GetSentimate</span> */}
          </div>
          {!user && (
            <GoogleLoginButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''} />
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-32 md:py-48">
        <div className="absolute inset-0 opacity-5 bg-[url('/getsentimate-logo.svg')] bg-no-repeat bg-center bg-contain mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tighter text-gray-900">
            Skyrocket Your YouTube Success with <span className="text-blue-600">AI Insights</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto mb-12 font-medium">
            Unleash the full potential of your channel with GetSentimate. Dive deep into viewer sentiments, eliminate toxic comments, and uncover trends that drive engagement and growth.
          </p>
          {!user && (
            <div className="flex justify-center gap-6">
              <GoogleLoginButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''} />
            </div>
          )}
          <div className="mt-12">
            <p className="text-sm text-gray-500 italic">Trusted by thousands of creators worldwide</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-16 text-gray-900 tracking-tight">Why Top Creators Choose GetSentimate</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-12 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-default text-center transform hover:-translate-y-2">
              <FaRegSmile className="text-6xl text-blue-600 mx-auto mb-6 drop-shadow-sm" />
              <h3 className="text-3xl font-semibold mb-4 text-gray-800">Sentiment Analysis</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Understand your audience’s emotions with precision, creating content that resonates and builds a loyal fanbase.</p>
            </div>
            <div className="bg-white p-12 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-default text-center transform hover:-translate-y-2">
              <FaShieldAlt className="text-6xl text-blue-600 mx-auto mb-6 drop-shadow-sm" />
              <h3 className="text-3xl font-semibold mb-4 text-gray-800">Toxicity Detection</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Keep your community safe by instantly identifying and filtering harmful comments for a positive viewer experience.</p>
            </div>
            <div className="bg-white p-12 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-default text-center transform hover:-translate-y-2">
              <FaLightbulb className="text-6xl text-blue-600 mx-auto mb-6 drop-shadow-sm" />
              <h3 className="text-3xl font-semibold mb-4 text-gray-800">Trend Insights</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Discover hidden patterns and viewer demands to craft videos that spark engagement and growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-16 text-gray-900 tracking-tight">Grow Smarter in Three Easy Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="bg-blue-50/50 p-12 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-default relative group">
              <span className="absolute top-6 left-6 text-5xl font-extrabold text-blue-200/50 group-hover:text-blue-300 transition-colors">1</span>
              <h3 className="text-2xl font-semibold mb-4 text-gray-800 relative z-10">Connect Your Channel</h3>
              <p className="text-gray-600 text-lg relative z-10 leading-relaxed">Link your YouTube channel securely with Google in just one click to access your comment data.</p>
            </div>
            <div className="bg-blue-50/50 p-12 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-default relative group">
              <span className="absolute top-6 left-6 text-5xl font-extrabold text-blue-200/50 group-hover:text-blue-300 transition-colors">2</span>
              <h3 className="text-2xl font-semibold mb-4 text-gray-800 relative z-10">AI-Driven Analysis</h3>
              <p className="text-gray-600 text-lg relative z-10 leading-relaxed">Our cutting-edge AI instantly processes comments for sentiment, toxicity, and actionable insights.</p>
            </div>
            <div className="bg-blue-50/50 p-12 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-default relative group">
              <span className="absolute top-6 left-6 text-5xl font-extrabold text-blue-200/50 group-hover:text-blue-300 transition-colors">3</span>
              <h3 className="text-2xl font-semibold mb-4 text-gray-800 relative z-10">Boost Your Growth</h3>
              <p className="text-gray-600 text-lg relative z-10 leading-relaxed">Use powerful insights to create content that captivates viewers and skyrockets your channel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Join the Future of YouTube Growth</h2>
        <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
          Don’t miss out—thousands of creators are already using GetSentimate to unlock audience insights and dominate their niche. Start your journey today.
        </p>
        {!user && (
          <GoogleLoginButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''} />
        )}
        <div className="mt-8">
          <p className="text-sm opacity-80">No credit card required. Try risk-free!</p>
        </div>
      </section>

    </main>
  );
}