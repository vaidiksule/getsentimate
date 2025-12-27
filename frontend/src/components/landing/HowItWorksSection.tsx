"use client";

import { motion, Variants } from "framer-motion";
import { Copy, Search, Brain, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Copy,
    title: "Copy YouTube URL",
    description: "Simply copy any YouTube video URL from your browser or share menu.",
  },
  {
    icon: Search,
    title: "Paste & Analyze",
    description: "Paste the URL and click analyze. No complex setup or API keys required.",
  },
  {
    icon: Brain,
    title: "AI Processing",
    description: "Our AI analyzes thousands of comments, extracting sentiment and insights.",
  },
  {
    icon: Sparkles,
    title: "Get Insights",
    description: "Receive comprehensive analysis with actionable recommendations instantly.",
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

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <div className="label-micro inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 mb-6">
            Simple 4-step process
          </div>
          <h2 className="text-title-hero font-bold tracking-tight text-black">
            How it works.
          </h2>
          <p className="mt-4 text-emphasis text-gray-500 max-w-2xl mx-auto font-medium">
            Get YouTube comment insights in minutes, not hours. Our streamlined process makes analysis effortless.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={item} className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-apple bg-black">
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-black text-micro font-bold text-black">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-title-section font-bold text-black mb-3">
                {step.title}
              </h3>
              <p className="text-secondary text-gray-600 leading-relaxed font-medium">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-20"
        >
          <div className="apple-card p-10 bg-gray-50">
            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="label-micro text-gray-500 mb-2">Processing time</div>
                <div className="text-title-hero font-bold text-black">90s</div>
              </div>
              <div className="text-center">
                <div className="label-micro text-gray-500 mb-2">Maximum Comments</div>
                <div className="text-title-hero font-bold text-black">10,000+</div>
              </div>
              <div className="text-center">
                <div className="label-micro text-gray-500 mb-2">Analysis Precision</div>
                <div className="text-title-hero font-bold text-black">95%</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
