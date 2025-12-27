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
      setTimeout(() => {
        router.push("/analysis");
      }, 1500);
    } else {
      router.push("/analysis");
    }
  };

  return (
    <div className="min-h-screen bg-white py-24 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <div className="label-micro mb-6">Pricing Plans</div>
          <h1 className="text-title-hero md:text-headline-dashboard font-bold text-black mb-6 tracking-tight">
            Scale your channel <br />with precision analytics.
          </h1>
          <p className="text-emphasis text-gray-500 max-w-2xl mx-auto font-medium">
            Buy credits once, use them forever. No subscriptions, no monthly fees. Just pure insights.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
            <span className="text-micro font-bold text-black">1 CREDIT = 1 FULL ANALYSIS</span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {creditPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.2, ease: "easeOut" }}
              className="relative flex"
            >
              <div
                className={`flex-1 flex flex-col apple-card p-10 bg-white ${pkg.popular ? "ring-2 ring-black" : ""}`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-10 -translate-y-1/2">
                    <span className="badge-blue px-3 py-1">MOST POPULAR</span>
                  </div>
                )}

                <h3 className="text-title-section font-bold text-black mb-2">{pkg.name}</h3>

                {pkg.savings ? (
                  <span className="badge-green w-fit mb-6">
                    {pkg.savings}
                  </span>
                ) : (
                  <div className="mb-6 h-5"></div>
                )}

                <div className="mb-2">
                  <span className="text-hero-product font-bold text-black tracking-tight">₹{pkg.price}</span>
                </div>
                <p className="text-secondary text-gray-500 mb-10 font-medium">
                  {pkg.credits} credits · ₹{pkg.pricePerCredit.toFixed(1)}/ea
                </p>

                <ul className="space-y-4 mb-12 flex-grow">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-black mt-1" strokeWidth={3} />
                      <span className="text-secondary text-black font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleBuyClick}
                  className="btn-credits w-full py-4 text-body"
                >
                  Buy {pkg.credits} Credits
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-24">
          <h2 className="text-title-page font-bold text-black text-center mb-12 tracking-tight">
            Common Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "How does payment work?", a: "We use Razorpay for secure payments. Pay via UPI, Cards, or Netbanking. Credits are credited instantly." },
              { q: "Do credits expire?", a: "Never. Use them next week or next year. No monthly pressure." },
              { q: "What does 1 credit get me?", a: "One complete analysis of any YouTube video. Sentiment, personas, topics, and actions." }
            ].map((faq, i) => (
              <div key={i} className="apple-card p-8 bg-gray-50">
                <h3 className="text-body font-bold text-black mb-3">{faq.q}</h3>
                <p className="text-secondary text-gray-600 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="text-center py-12 border-t border-gray-100">
          <p className="label-micro text-gray-400 mb-8">Trusted by Creators Worldwide</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {["Secure Processing", "Instant Activation", "24/7 Priority Support"].map((badge, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-primary" strokeWidth={3} />
                <span className="text-secondary font-bold text-gray-500">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
