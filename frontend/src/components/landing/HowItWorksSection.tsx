"use client";

import { motion } from "framer-motion";
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
    description: "Paste the URL and click analyze. No registration or API keys required.",
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-neutral-50/80">
      <div className="mx-auto max-w-6xl w-full px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-black/[0.06] bg-white px-4 py-1.5 text-[13px] font-medium text-[#1d1d1f] shadow-sm mb-4">
            Simple 4-step process
          </div>
          <h2 className="text-[28px] sm:text-[36px] md:text-[40px] font-semibold tracking-tight text-[#1d1d1f]">
            How it works
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-[#86868b] max-w-2xl mx-auto">
            Get YouTube comment insights in minutes, not hours. Our streamlined process makes analysis effortless.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={item} className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="relative mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#0071e3] shadow-lg">
                  <step.icon className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                {/* Step number */}
                <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-[#0071e3] text-[13px] font-bold text-[#0071e3] shadow-sm">
                  {index + 1}
                </div>
              </div>

              <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">
                {step.title}
              </h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="rounded-[20px] border border-black/[0.06] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-[#86868b] mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  Processing time
                </div>
                <div className="text-[32px] font-semibold text-[#1d1d1f]">90s</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-[#86868b] mb-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Comments analyzed
                </div>
                <div className="text-[32px] font-semibold text-[#1d1d1f]">10,000+</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-[#86868b] mb-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  Accuracy rate
                </div>
                <div className="text-[32px] font-semibold text-[#1d1d1f]">95%</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
