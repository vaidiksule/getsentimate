"use client";

import { Brain, TrendingUp, Users, BarChart, MessageSquare, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning algorithms analyze thousands of comments in seconds, providing deep insights into your audience's behavior.",
  },
  {
    icon: TrendingUp,
    title: "Sentiment Tracking",
    description: "Understand the emotional tone of your comments with precise sentiment analysis, helping you gauge audience reaction.",
  },
  {
    icon: Users,
    title: "Audience Personas",
    description: "Discover detailed audience personas based on commenting patterns, helping you create targeted content that resonates.",
  },
  {
    icon: BarChart,
    title: "Topic Intelligence",
    description: "Identify trending topics and themes in your comments to stay ahead of content trends and audience interests.",
  },
  {
    icon: MessageSquare,
    title: "Comment Insights",
    description: "Extract actionable suggestions from your comments to improve content quality and engagement rates.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get comprehensive analysis in under 90 seconds. No waiting, no complex setup - just paste and analyze.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl w-full">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Everything you need to understand your audience
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Powerful features that give you deep insights into your YouTube audience
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-neutral-200/50 bg-white/50 p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0A84FF]/10 text-[#0A84FF]">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900 group-hover:text-[#0A84FF] transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
