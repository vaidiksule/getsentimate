"use client";

import { Copy, Search, Brain, Download, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Copy,
    title: "Copy YouTube URL",
    description: "Simply copy any YouTube video URL from your browser address bar or share menu.",
    detail: "Works with any public YouTube video",
  },
  {
    icon: Search,
    title: "Paste & Analyze",
    description: "Paste the URL into our analyzer and click the analyze button to start processing.",
    detail: "No registration or API keys required",
  },
  {
    icon: Brain,
    title: "AI Processing",
    description: "Our advanced AI analyzes thousands of comments, extracting insights about sentiment, topics, and audience personas.",
    detail: "Machine learning algorithms work in real-time",
  },
  {
    icon: Download,
    title: "Get Insights",
    description: "Receive comprehensive analysis with actionable recommendations to improve your content strategy.",
    detail: "Detailed reports with visualizations",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-neutral-50/80 xl:px-32">
      <div className="mx-auto max-w-5xl w-full">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm">
            <span className="mr-2">🚀</span>
            Simple 4-step process
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
            Get YouTube comment insights in minutes, not hours. Our streamlined process makes audience analysis effortless.
          </p>
        </div>
        
        <div className="mt-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="flex flex-col items-center text-center group">
                  {/* Step circle with hover effect */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#0A84FF] opacity-10 group-hover:opacity-20 transition-opacity blur-xl"></div>
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#0A84FF] to-[#0b7aed] text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                      <step.icon className="h-7 w-7" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-[#0A84FF] text-xs font-bold text-[#0A84FF] shadow-sm">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-[#0A84FF] transition-colors">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                      {step.description}
                    </p>
                    <p className="mt-2 text-xs text-[#0A84FF] font-medium">
                      {step.detail}
                    </p>
                  </div>
                </div>
                
                {/* Arrow indicator for mobile */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center mt-4 lg:hidden">
                    <ArrowRight className="h-5 w-5 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom stats bar */}
        <div className="mt-16">
          <div className="rounded-2xl border border-neutral-200/50 bg-white/50 p-8 shadow-sm">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  Average processing time
                </div>
                <div className="mt-2 text-2xl font-bold text-neutral-90">90 seconds</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Comments analyzed
                </div>
                <div className="mt-2 text-2xl font-bold text-neutral-90">10,000+</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  Accuracy rate
                </div>
                <div className="mt-2 text-2xl font-bold text-neutral-90">95%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
