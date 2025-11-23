"use client";

import { Target, Shield, Zap, Heart, TrendingUp, Award } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Content That Resonates",
    description: "Create videos your audience actually wants to watch based on real comment analysis.",
    highlight: "Higher engagement rates",
  },
  {
    icon: Shield,
    title: "Risk-Free Analysis",
    description: "No API keys needed. Simply paste a YouTube URL and get instant insights.",
    highlight: "Privacy-first approach",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get comprehensive analysis in under 90 seconds, not hours or days.",
    highlight: "Save valuable time",
  },
  {
    icon: Heart,
    title: "Build Community",
    description: "Understand your audience's emotions and build stronger connections.",
    highlight: "Deeper audience relationships",
  },
  {
    icon: TrendingUp,
    title: "Growth Acceleration",
    description: "Use data-driven insights to grow your channel faster than ever before.",
    highlight: "Proven growth strategies",
  },
  {
    icon: Award,
    title: "Competitive Edge",
    description: "Get insights your competitors miss by understanding comment sentiment.",
    highlight: "Stay ahead of trends",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-neutral-50/80 to-white">
      <div className="mx-auto max-w-5xl w-full">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Why creators choose GetSentimate
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Transform your YouTube strategy with data-driven insights
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-neutral-200/50 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#0A84FF]/50"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#0A84FF]/10 text-[#0A84FF]">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-[#0A84FF] transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                    {benefit.description}
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center rounded-full bg-[#0A84FF]/10 px-3 py-1 text-xs font-medium text-[#0A84FF]">
                      {benefit.highlight}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
