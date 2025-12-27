"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-body font-bold text-black tracking-tight">GetSentimate</span>
            <span className="text-secondary text-gray-500">YouTube comments intelligence for creators.</span>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-4">
            <Link href="/privacy-policy" className="text-secondary text-gray-600 hover:text-black hover:underline underline-offset-4 transition-all">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-secondary text-gray-600 hover:text-black hover:underline underline-offset-4 transition-all">Terms of Service</Link>
            <Link href="/contact" className="text-secondary text-gray-600 hover:text-black hover:underline underline-offset-4 transition-all">Contact Us</Link>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-micro label-micro">© 2025 GetSentimate</span>
          <span className="text-micro text-gray-400">Built with precision.</span>
        </div>
      </div>
    </footer>
  );
}
