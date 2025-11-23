"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Star } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0A84FF] to-[#0b7aed] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
      
      <div className="relative mx-auto max-w-4xl w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Star className="h-4 w-4 mr-2 text-yellow-300" />
            <span className="text-sm font-medium">4.9/5 rating from 10,000+ creators</span>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Ready to understand your audience?
        </h2>
        <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
          Join thousands of creators who are already using GetSentimate to create better content, 
          grow their channels, and build stronger communities.
        </p>
        
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Button
            asChild
            size="lg"
            className="gap-2 rounded-full bg-white px-8 text-sm font-semibold text-[#0A84FF] shadow-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105"
          >
            <Link href="/analysis">
              <PlayCircle className="h-5 w-5" />
              Start Analyzing Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            Free to try • No credit card required
          </div>
        </div>
        
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold">30 Seconds</div>
            <div className="mt-1 text-sm text-blue-100">Average setup time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">10,000+</div>
            <div className="mt-1 text-sm text-blue-100">Creators trust us</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">24/7</div>
            <div className="mt-1 text-sm text-blue-100">Always available</div>
          </div>
        </div>
      </div>
    </section>
  );
}
