"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Star } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-black text-white rounded-apple overflow-hidden relative">
      <div className="relative mx-auto max-w-4xl w-full text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <Star className="h-4 w-4 mr-2 text-yellow-primary" fill="currentColor" />
            <span className="text-micro font-medium uppercase tracking-widest">Master Category Rating · 4.9/5</span>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-title-hero md:text-hero-product font-bold tracking-tight mb-6"
        >
          Ready to scale with precision?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.2, ease: "easeOut" }}
          className="text-emphasis text-gray-400 max-w-2xl mx-auto font-medium"
        >
          Join 10,000+ top-tier creators using GetSentimate to engineer their content strategy with AI intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.2, ease: "easeOut" }}
          className="mt-12 flex flex-col items-center justify-center gap-6"
        >
          <Link href="/analysis" className="btn-base bg-white text-black hover:bg-gray-100 py-4 px-12 text-body flex items-center gap-3">
            <PlayCircle className="h-5 w-5" />
            Start Free Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-3 text-secondary text-gray-400 font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-green-primary animate-pulse"></div>
            Instant access • 1 free analysis included
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.2, ease: "easeOut" }}
          className="mt-16 grid gap-12 md:grid-cols-3 border-t border-white/10 pt-16"
        >
          <div className="text-center">
            <div className="text-title-hero font-bold tracking-tight">30s</div>
            <div className="label-micro text-gray-500 mt-2">Setup time</div>
          </div>
          <div className="text-center">
            <div className="text-title-hero font-bold tracking-tight">10k+</div>
            <div className="label-micro text-gray-500 mt-2">Trusted Users</div>
          </div>
          <div className="text-center">
            <div className="text-title-hero font-bold tracking-tight">24/7</div>
            <div className="label-micro text-gray-500 mt-2">Uptime</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
