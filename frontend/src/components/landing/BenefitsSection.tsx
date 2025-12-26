"use client";

import { motion } from "framer-motion";
import { Target, Shield, Zap, Heart, TrendingUp, Award } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Content That Resonates",
    description: "Create videos your audience actually wants to watch based on real comment analysis.",
    highlight: "Higher engagement",
  },
  {
    icon: Shield,
    title: "Risk-Free Analysis",
    description: "No API keys needed. Simply paste a YouTube URL and get instant insights.",
    highlight: "Privacy-first",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get comprehensive analysis in under 90 seconds, not hours or days.",
    highlight: "Save time",
  },
  {
    icon: Heart,
    title: "Build Community",
    description: "Understand your audience's emotions and build stronger connections.",
    highlight: "Deeper relationships",
  },
  {
    icon: TrendingUp,
    title: "Growth Acceleration",
    description: "Use data-driven insights to grow your channel faster than ever.",
    highlight: "Proven strategies",
  },
  {
    icon: Award,
    title: "Competitive Edge",
    description: "Get insights your competitors miss by understanding comment sentiment.",
    highlight: "Stay ahead",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function BenefitsSection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-neutral-50/80 to-white">
      <div className="mx-auto max-w-6xl w-full px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-[28px] sm:text-[36px] md:text-[40px] font-semibold tracking-tight text-[#1d1d1f]">
            Why creators choose GetSentimate
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-[#86868b] max-w-2xl mx-auto">
            Transform your YouTube strategy with data-driven insights
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 sm:gap-6 lg:grid-cols-2"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={item}
              className="group rounded-[20px] border border-black/[0.06] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:border-[#0071e3]/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] bg-[#0071e3]/10">
                  <benefit.icon className="h-5 w-5 text-[#0071e3]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[17px] font-semibold text-[#1d1d1f]">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-[13px] text-[#86868b] leading-relaxed">
                    {benefit.description}
                  </p>
                  <div className="mt-3">
                    <span className="inline-flex items-center rounded-full bg-[#0071e3]/10 px-3 py-1 text-[11px] font-medium text-[#0071e3]">
                      {benefit.highlight}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
