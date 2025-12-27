"use client";

import { motion, Variants } from "framer-motion";
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

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <h2 className="text-title-hero font-bold tracking-tight text-black">
            The standard for audience intelligence.
          </h2>
          <p className="mt-4 text-emphasis text-gray-500 max-w-2xl mx-auto font-medium">
            Everything you need to turn thousands of comments into content strategy.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className="apple-card p-10 bg-white hover:bg-gray-100 transition-all duration-apple ease-apple"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-button bg-black mb-8">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-title-section font-bold text-black mb-4">
                {feature.title}
              </h3>
              <p className="text-secondary text-gray-600 leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
