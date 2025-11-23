"use client";

import { useState } from "react";
import { PricingCard } from "@/components/pricing/PricingCard";
import { BillingToggle } from "@/components/pricing/BillingToggle";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out GetSentimate",
      credits: "5 credits per month",
      features: [
        "YouTube Summarizer",
        "Comment Analysis (limited)",
      ],
      buttonText: "Get Started for Free",
      buttonVariant: "outline" as const,
    },
    {
      name: "Basic",
      price: isYearly ? "$7" : "$11",
      description: "For content creators who need more",
      credits: "50 credits per month",
      features: [
        "YouTube Summarizer",
        "Complete Comment Analysis",
        "Content Recommendation",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
    },
    {
      name: "Pro",
      price: isYearly ? "$30" : "$45",
      description: "For professional creators and businesses",
      credits: "500 credits per month",
      features: [
        "YouTube Summarizer",
        "Full Transcript",
        "Complete Comment Analysis",
        "Advanced Video Stats",
        "TikTok Transcript",
        "Priority Support",
      ],
      buttonText: "Get Started",
      buttonVariant: "default" as const,
      recommended: true,
    },
    {
      name: "Ultimate",
      price: isYearly ? "$70" : "$100",
      description: "For agencies and large teams",
      credits: "Unlimited credits",
      features: [
        "Everything in Pro",
        "Unlimited Analysis",
        "Team Collaboration",
        "API Access",
        "Custom Integrations",
        "Dedicated Support",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 w-full">
      <div className="mx-auto max-w-4xl text-center w-full">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
          Get Started for <span className="text-[#0A84FF]">Free</span>
        </h1>
        <p className="mt-4 text-balance text-sm text-neutral-600 sm:text-base">
          Start analyzing YouTube comments today. Upgrade as you grow.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="mt-12 w-full max-w-md">
        <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
      </div>

      {/* Pricing Cards */}
      <div className="mt-12 grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pricingPlans.map((plan, index) => (
          <PricingCard
            key={index}
            {...plan}
            isYearly={isYearly}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-20 w-full max-w-3xl">
        <h2 className="text-center text-2xl font-semibold text-neutral-900 mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white/80 p-6 backdrop-blur-sm">
            <h3 className="font-medium text-neutral-900 mb-2">What are credits?</h3>
            <p className="text-sm text-neutral-600">
              Each credit allows you to analyze one YouTube video. Credits reset at the beginning of your billing cycle.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white/80 p-6 backdrop-blur-sm">
            <h3 className="font-medium text-neutral-900 mb-2">Can I change plans anytime?</h3>
            <p className="text-sm text-neutral-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white/80 p-6 backdrop-blur-sm">
            <h3 className="font-medium text-neutral-900 mb-2">Do unused credits roll over?</h3>
            <p className="text-sm text-neutral-600">
              For paid plans, unused credits roll over to the next month. Free plan credits reset each month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
