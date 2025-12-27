"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white/80 text-[11px] text-neutral-500">
      <div className="mx-auto flex flex-col md:flex-row max-w-5xl items-center justify-between px-6 sm:px-8 lg:px-24 xl:px-32 py-6 md:py-3 gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <span className="font-medium">GetSentimate · Youtube Comment Analysis Tool</span>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 md:border-l md:border-neutral-200 md:pl-4">
            <Link href="/privacy-policy" className="hover:text-neutral-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-neutral-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-neutral-900 transition-colors">
              Contact Us
            </Link>
            <Link href="/shipping-policy" className="hover:text-neutral-900 transition-colors">
              Shipping Policy
            </Link>
            <Link href="/cancellations-and-refunds" className="hover:text-neutral-900 transition-colors">
              Cancellations & Refunds
            </Link>
          </div>
        </div>
        <span className="text-center">Built for YouTube creators</span>
      </div>
    </footer>
  );
}
