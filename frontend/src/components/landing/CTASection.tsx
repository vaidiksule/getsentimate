"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle, Star } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-[#0071e3] to-[#0058b3] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>

      <div className="relative mx-auto max-w-4xl w-full text-center px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Star className="h-4 w-4 mr-2 text-yellow-300" fill="currentColor" />
            <span className="text-[13px] font-medium">4.9/5 rating from 10,000+ creators</span>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[28px] sm:text-[36px] md:text-[44px] font-semibold tracking-tight"
        >
          Ready to understand your audience?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-[15px] sm:text-[17px] text-white/90 max-w-2xl mx-auto leading-relaxed"
        >
          Join thousands of creators using GetSentimate to create better content,
          grow their channels, and build stronger communities.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
        >
          <Button
            asChild
            size="lg"
            className="gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-[#0071e3] shadow-lg hover:bg-gray-50 transition-all hover:scale-105"
          >
            <Link href="/analysis">
              <PlayCircle className="h-5 w-5" />
              Start Analyzing Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-2 text-[13px] text-white/90">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            Free to try • No credit card required
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid gap-6 sm:gap-8 sm:grid-cols-3"
        >
          <div className="text-center">
            <div className="text-[32px] font-semibold">30s</div>
            <div className="mt-1 text-[13px] text-white/80">Average setup time</div>
          </div>
          <div className="text-center">
            <div className="text-[32px] font-semibold">10,000+</div>
            <div className="mt-1 text-[13px] text-white/80">Creators trust us</div>
          </div>
          <div className="text-center">
            <div className="text-[32px] font-semibold">24/7</div>
            <div className="mt-1 text-[13px] text-white/80">Always available</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
