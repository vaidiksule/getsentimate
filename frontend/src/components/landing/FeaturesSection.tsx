"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp, Users, BarChart, MessageSquare, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced ML algorithms analyze thousands of comments in seconds, providing deep insights into your audience.",
  },
  {
    icon: TrendingUp,
    title: "Sentiment Tracking",
    description: "Understand emotional tone with precise sentiment analysis, helping you gauge audience reaction instantly.",
  },
  {
    icon: Users,
    title: "Audience Personas",
    description: "Discover detailed personas based on commenting patterns to create targeted content that resonates.",
  },
  {
    icon: BarChart,
    title: "Topic Intelligence",
    description: "Identify trending topics and themes to stay ahead of content trends and audience interests.",
  },
  {
    icon: MessageSquare,
    title: "Comment Insights",
    description: "Extract actionable suggestions to improve content quality and boost engagement rates.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get comprehensive analysis in under 90 seconds. No waiting, no complex setup required.",
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

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl w-full px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-[28px] sm:text-[36px] md:text-[40px] font-semibold tracking-tight text-[#1d1d1f]">
            Everything you need to understand
            <br className="hidden sm:block" /> your audience
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-[#86868b] max-w-2xl mx-auto">
            Powerful features that give you deep insights into your YouTube audience
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className="group relative rounded-[20px] border border-black/[0.06] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#0071e3]/10">
                <feature.icon className="h-5 w-5 text-[#0071e3]" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-[17px] font-semibold text-[#1d1d1f]">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13px] text-[#86868b] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
