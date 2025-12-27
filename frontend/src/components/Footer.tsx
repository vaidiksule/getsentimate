"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white/80 text-[11px] text-neutral-500">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 sm:px-8 lg:px-24 xl:px-32 py-3">
        <div className="flex gap-4">
          <span>GetSentimate · Youtube Comment Analysis Tool</span>
          <div className="flex flex-wrap gap-4 border-l border-neutral-200 pl-4">
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
        <span>Built for YouTube creators</span>
      </div>
    </footer>
  );
}
