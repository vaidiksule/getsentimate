"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Users, TrendingUp, Clock } from "lucide-react";

const stats = [
  {
    icon: MessageSquare,
    value: 10000,
    suffix: "+",
    label: "Comments Analyzed",
    description: "Per video analysis",
  },
  {
    icon: Users,
    value: 95,
    suffix: "%",
    label: "Accuracy Rate",
    description: "Sentiment precision",
  },
  {
    icon: TrendingUp,
    value: 3,
    suffix: "x",
    label: "Engagement Boost",
    description: "Average improvement",
  },
  {
    icon: Clock,
    value: 90,
    suffix: "s",
    label: "Processing Time",
    description: "Average duration",
  },
];

export function StatsSection() {
  const [counters, setCounters] = useState(stats.map(() => 0));

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;

    const interval = setInterval(() => {
      setCounters((prev) => {
        return prev.map((current, index) => {
          const target = stats[index].value;
          const increment = target / steps;
          const next = current + increment;
          return next >= target ? target : next;
        });
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-[#0071e3]">
      <div className="mx-auto max-w-6xl w-full px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-[28px] sm:text-[36px] md:text-[40px] font-semibold tracking-tight text-white">
            Trusted by creators worldwide
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-white/80 max-w-2xl mx-auto">
            See the impact GetSentimate has on YouTube channels
          </p>
        </motion.div>

        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] bg-white/20 backdrop-blur-sm mb-4">
                <stat.icon className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <div className="text-[36px] sm:text-[42px] font-semibold text-white">
                {Math.round(counters[index])}{stat.suffix}
              </div>
              <div className="mt-1 text-[15px] font-medium text-white/90">
                {stat.label}
              </div>
              <div className="mt-1 text-[13px] text-white/70">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
            <span className="text-[13px] sm:text-[15px] text-white">
              Join <span className="font-semibold">10,000+</span> creators using GetSentimate
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
