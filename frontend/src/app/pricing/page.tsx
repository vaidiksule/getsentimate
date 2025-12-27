"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { Toast } from "@/components/ui/Toast";

const creditPackages = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: 99,
    pricePerCredit: 9.9,
    popular: false,
    features: [
      "10 video analyses",
      "Full sentiment analysis",
      "Topic extraction",
      "Engagement metrics",
      "Credits never expire",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    credits: 30,
    price: 249,
    pricePerCredit: 8.3,
    popular: true,
    features: [
      "30 video analyses",
      "Full sentiment analysis",
      "Topic extraction",
      "Engagement metrics",
      "Viewer personas",
      "Action priorities",
      "Credits never expire",
    ],
    savings: "Save ₹48"
  },
  {
    id: "pro",
    name: "Pro",
    credits: 100,
    price: 699,
    pricePerCredit: 7.0,
    popular: false,
    features: [
      "100 video analyses",
      "Full sentiment analysis",
      "Topic extraction",
      "Engagement metrics",
      "Viewer personas",
      "Action priorities",
      "Priority support",
      "Credits never expire",
    ],
    savings: "Save ₹291"
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [showToast, setShowToast] = useState(false);

  const handleBuyClick = () => {
    if (!user) {
      setShowToast(true);
      // Redirect to login after showing toast
      setTimeout(() => {
        router.push("/analysis");
      }, 1500);
    } else {
      // User is logged in, proceed to analysis page to buy
      router.push("/analysis");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50/80 py-8 px-4 sm:px-8 lg:px-12 sm:py-16 md:py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="text-[32px] sm:text-[40px] md:text-[48px] font-semibold text-[#1d1d1f] mb-3 tracking-tight">
            Simple, Pay-As-You-Go Pricing
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#86868b] max-w-2xl mx-auto leading-relaxed">
            Buy credits once, use them forever. No subscriptions, no monthly fees.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-black/[0.06]">
            <span className="text-[13px] font-medium text-[#1d1d1f]">1 Credit = 1 Video Analysis</span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {creditPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex"
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-3 py-1 bg-[#0071e3] text-white text-[11px] font-semibold rounded-full shadow-sm">
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`flex-1 flex flex-col rounded-[20px] p-6 sm:p-8 bg-white border transition-all ${pkg.popular
                  ? "border-[#0071e3] shadow-[0_4px_24px_rgba(0,113,227,0.12)]"
                  : "border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                  }`}
              >
                {/* Package Name */}
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1">{pkg.name}</h3>

                {/* Savings Badge */}
                {pkg.savings ? (
                  <div className="inline-block mb-3">
                    <span className="text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {pkg.savings}
                    </span>
                  </div>
                ) : (
                  <div className="mb-3 h-5"></div>
                )}

                {/* Price */}
                <div className="mb-1">
                  <span className="text-[40px] sm:text-[48px] font-semibold text-[#1d1d1f] tracking-tight">₹{pkg.price}</span>
                </div>
                <p className="text-[13px] text-[#86868b] mb-6">
                  {pkg.credits} credits • ₹{pkg.pricePerCredit.toFixed(1)} per credit
                </p>

                {/* Features - flex-grow to push button to bottom */}
                <ul className="space-y-2.5 mb-8 flex-grow">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0071e3] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-[13px] text-[#1d1d1f]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - pushed to bottom */}
                <button
                  onClick={handleBuyClick}
                  className={`w-full py-3 px-6 rounded-full text-[15px] font-medium transition-all ${pkg.popular
                    ? "bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-sm hover:shadow-md"
                    : "bg-[#1d1d1f] text-white hover:bg-[#2d2d2f]"
                    }`}
                >
                  Buy {pkg.credits} Credits
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-[24px] sm:text-[28px] font-semibold text-[#1d1d1f] text-center mb-8 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            <div className="bg-white rounded-[16px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.06]">
              <h3 className="font-semibold text-[15px] text-[#1d1d1f] mb-2">How does payment work?</h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                We use Razorpay for secure payments. You can pay with credit/debit cards, UPI, net banking, or wallets. Your credits are added instantly.
              </p>
            </div>
            <div className="bg-white rounded-[16px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.06]">
              <h3 className="font-semibold text-[15px] text-[#1d1d1f] mb-2">Do credits expire?</h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                No! Your credits never expire. Buy them once, use them whenever you want. No pressure, no deadlines.
              </p>
            </div>
            <div className="bg-white rounded-[16px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.06]">
              <h3 className="font-semibold text-[15px] text-[#1d1d1f] mb-2">What does 1 credit get me?</h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                1 credit = full analysis of 1 YouTube video, including sentiment analysis, topic extraction, engagement metrics, viewer personas, and actionable insights.
              </p>
            </div>
            <div className="bg-white rounded-[16px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.06]">
              <h3 className="font-semibold text-[15px] text-[#1d1d1f] mb-2">Can I get a refund?</h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                We offer refunds within 7 days of purchase if you haven't used any credits. For issues with analysis quality, contact our support team.
              </p>
            </div>
            <div className="bg-white rounded-[16px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.06]">
              <h3 className="font-semibold text-[15px] text-[#1d1d1f] mb-2">Do you have a free trial?</h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                Yes! New users get 10 free credits upon signup. No credit card required. Try our full platform before you buy.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 sm:mt-16 text-center"
        >
          <p className="text-[11px] text-[#86868b] mb-3 uppercase tracking-wide">Trusted by creators worldwide</p>
          <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" strokeWidth={2.5} />
              <span className="text-[13px] font-medium text-[#86868b]">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" strokeWidth={2.5} />
              <span className="text-[13px] font-medium text-[#86868b]">Instant Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" strokeWidth={2.5} />
              <span className="text-[13px] font-medium text-[#86868b]">24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message="Please login or signup first to purchase credits"
          type="warning"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
