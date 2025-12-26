
"use client";

import { useAnalysisStore } from "@/store/analysisStore";
import { SearchInput } from "@/components/analysis/SearchInput";
import { VideoHeader } from "@/components/analysis/VideoHeader";
import { ExecutiveSummary } from "@/components/analysis/ExecutiveSummary";
import { ChartsSidebar } from "@/components/analysis/ChartsSidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/analysis/Header";
import { AnimatePresence, motion } from "framer-motion";

export default function AnalysisPage() {
    const { result, loading } = useAnalysisStore();

    return (
        <AuthGuard requireAuth={true} redirectTo="/">
            <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50/80 font-sans selection:bg-[#0071e3]/20 text-[#1d1d1f]">


                <main className="max-w-[1120px] mx-auto pt-8 pb-16 px-6 sm:px-8">
                    {/* Animate out search input slightly when result appears to transition smoothly */}
                    <AnimatePresence mode="wait">
                        {!result && (
                            <motion.div
                                key="search"
                                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                            >
                                <SearchInput />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {result && (
                        <div className="space-y-8">
                            <VideoHeader result={result} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                <ExecutiveSummary result={result} />
                                <ChartsSidebar result={result} />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AuthGuard>
    );
}
