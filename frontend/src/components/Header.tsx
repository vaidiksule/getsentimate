"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isAnalysis = pathname === "/analysis";

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-neutral-900 text-xs font-semibold text-white shadow-sm">
            GS
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-neutral-900">GetSentimate</span>
            <span className="text-[11px] text-neutral-500">YouTube comments intelligence</span>
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-[12px] font-medium text-neutral-600">
          <Link
            href="/analysis"
            className={`rounded-full px-3 py-1 transition ${
              isAnalysis ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
            }`}
          >
            Analysis
          </Link>
        </nav>
      </div>
    </header>
  );
}
