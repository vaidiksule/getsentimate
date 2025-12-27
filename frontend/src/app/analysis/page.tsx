
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
            <main className="max-w-6xl mx-auto pt-8 pb-24 px-6 md:px-8">
                <AnimatePresence mode="wait">
                    {!result && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <SearchInput />
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="space-y-12"
                        >
                            <VideoHeader result={result} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                                <ExecutiveSummary result={result} />
                                <ChartsSidebar result={result} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </AuthGuard>
    );
}
