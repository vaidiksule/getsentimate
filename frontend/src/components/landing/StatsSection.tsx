"use client";

import { useState, useEffect } from "react";
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
    description: "Sentiment analysis precision",
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
    description: "Average analysis duration",
  },
];

export function StatsSection() {
  const [counters, setCounters] = useState(stats.map(() => 0));

  useEffect(() => {
    const duration = 2000; // 2 seconds
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
    <section className="py-20 bg-[#0A84FF] text-white">
      <div className="mx-auto max-w-5xl w-full">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by creators worldwide
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            See the impact GetSentimate has on YouTube channels
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">
                  {Math.round(counters[index])}{stat.suffix}
                </div>
                <div className="mt-1 text-sm font-medium text-blue-100">
                  {stat.label}
                </div>
                <div className="mt-1 text-xs text-blue-200">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
            <div className="text-sm text-white">
              Join <span className="font-semibold">10,000+</span> creators already using GetSentimate
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
