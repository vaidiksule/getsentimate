
"use client";

import { useAnalysisStore } from "@/store/analysisStore";
import { TrendingUp } from "lucide-react";

export function Header() {
    const { result, clearResult } = useAnalysisStore();

    return (
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5 transition-all duration-300">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="font-semibold text-lg tracking-tight text-gray-900 flex items-center gap-2" />

                {result && (
                    <button
                        onClick={clearResult}
                        className="text-[15px] font-medium text-blue-500 hover:text-blue-600 transition-colors px-4 py-2 rounded-full hover:bg-blue-50/50"
                    >
                        Analyze Another
                    </button>
                )}
            </div>
        </header>
    );
}
