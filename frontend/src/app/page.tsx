
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Zap, 
  ArrowRight,
  Play,
  Shield,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { useAuth } from './components/AuthProvider';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Log the client ID
  console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-4">Welcome back!</h2>
          <p className="text-muted-foreground mb-6">Redirecting you to your dashboard...</p>
          <Link href="/dashboard">
            <Button size="lg">
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-primary drop-shadow-lg" />
              <span className="text-xl font-bold text-foreground">GetSentimate</span>
            </div>
            <div className="flex items-center space-x-4">
              <GoogleLoginButton 
                clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}
                onLoading={(loading: boolean) => setIsLoading(loading)}
                onSuccess={(user) => {
                  console.log('Login successful:', user);
                  // Redirect will happen automatically via AuthProvider
                }}
                onError={(error) => {
                  console.error('Login failed:', error);
                }}
                size="sm"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background gradient with shadow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20"></div>
        
        {/* Floating shadow elements for depth */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Main headline with enhanced typography and shadow */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-foreground mb-4 leading-tight tracking-tight">
                AI-Powered
              </h1>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-primary mb-6 leading-tight tracking-tight drop-shadow-2xl">
                YouTube Analytics
              </h1>
            </div>
            
            {/* Sub-headline with improved styling */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed font-medium">
              Understand your audience like never before. GetSentimate analyzes your YouTube comments 
              with AI to provide deep insights, sentiment analysis, and actionable recommendations.
            </p>
            
            {/* CTA buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <GoogleLoginButton 
                clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}
                onLoading={(loading: boolean) => setIsLoading(loading)}
                onSuccess={(user) => {
                  console.log('Login successful:', user);
                }}
                onError={(error) => {
                  console.error('Login failed:', error);
                }}
                size="lg"
                variant="default"
              >
                Start Analyzing →
              </GoogleLoginButton>
              
              <Link href="#features">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-14 border-2 hover:bg-muted/50 transition-all duration-300">
                  Learn More
                </Button>
              </Link>
            </div>
            
            {/* Demo Mode for testing */}
            {(!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === 'your_google_client_id_here') && (
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Google OAuth not configured? Try demo mode:
                </p>
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform duration-200">
                    Demo Mode
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Why Choose GetSentimate?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful AI analysis combined with beautiful, actionable insights to help you 
              understand and grow your YouTube audience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-12 h-12 text-primary" />,
                title: "Deep Analytics",
                description: "Comprehensive sentiment analysis, toxicity detection, and engagement metrics for every video."
              },
              {
                icon: <Zap className="w-12 h-12 text-primary" />,
                title: "AI-Powered Insights",
                description: "Advanced AI algorithms provide actionable recommendations and audience insights."
              },
              {
                icon: <MessageSquare className="w-12 h-12 text-primary" />,
                title: "Comment Intelligence",
                description: "Understand what your audience is saying and how they feel about your content."
              },
              {
                icon: <TrendingUp className="w-12 h-12 text-primary" />,
                title: "Growth Insights",
                description: "Data-driven recommendations to improve your content strategy and audience engagement."
              },
              {
                icon: <Shield className="w-12 h-12 text-primary" />,
                title: "Community Health",
                description: "Monitor toxicity levels and maintain a healthy comment section for your channel."
              },
              {
                icon: <Users className="w-12 h-12 text-primary" />,
                title: "Audience Understanding",
                description: "Get to know your viewers better with detailed demographic and sentiment analysis."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to unlock the power of AI-driven YouTube analytics.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Your Channel",
                description: "Securely connect your YouTube account with OAuth2 authentication."
              },
              {
                step: "02",
                title: "Select Videos",
                description: "Choose which videos to analyze from your channel library."
              },
              {
                step: "03",
                title: "Get AI Insights",
                description: "Receive comprehensive analytics and actionable recommendations."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-all duration-300">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Background shadow effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary via-primary to-primary/90"></div>
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-2xl">
              Ready to Transform Your YouTube Analytics?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto font-medium">
              Join creators who are already using AI to understand their audience better 
              and create more engaging content.
            </p>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <GoogleLoginButton 
                clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}
                onLoading={(loading: boolean) => setIsLoading(loading)}
                onSuccess={(user) => {
                  console.log('Login successful:', user);
                }}
                onError={(error) => {
                  console.error('Login failed:', error);
                }}
                size="lg"
                variant="secondary"
              >
                Start Your Free Analysis →
              </GoogleLoginButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">GetSentimate</span>
          </div>
          <p className="text-muted-foreground mb-4">
            AI-powered YouTube analytics for content creators
          </p>
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <span>© 2025 GetSentimate. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}