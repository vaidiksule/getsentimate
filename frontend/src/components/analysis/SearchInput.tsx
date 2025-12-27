
"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/store/analysisStore";
import { Search, Plus, Loader2, Database, Brain, BarChart3, Youtube } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/services/api";
import { useUserStore } from "@/store/userStore";
import { BuyCreditsModal } from "./BuyCreditsModal";

export function SearchInput() {
    const { url, setUrl, loading, setLoading, setResult, setError, error, result } = useAnalysisStore();
    const { user, updateCredits } = useUserStore();
    const [showBuyCredits, setShowBuyCredits] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [commentLimit, setCommentLimit] = useState(150);

    const steps = [
        { icon: <Youtube className="w-5 h-5" />, text: "Fetching video metadata...", duration: 2000 },
        { icon: <Database className="w-5 h-5" />, text: "Retrieving user comments...", duration: 3000 },
        { icon: <Brain className="w-5 h-5" />, text: "Analyzing sentiment patterns...", duration: 4000 },
        { icon: <BarChart3 className="w-5 h-5" />, text: "Generating actionable insights...", duration: 2000 },
    ];

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError("");
        setResult(null);
        setProgressStep(0);

        const stepIntervals: NodeJS.Timeout[] = [];
        let accumulatedTime = 0;
        steps.forEach((step, index) => {
            const timeout = setTimeout(() => {
                setProgressStep(index);
            }, accumulatedTime);
            stepIntervals.push(timeout);
            accumulatedTime += step.duration;
        });

        try {
            const data = await api.analyze(url, commentLimit);
            setResult(data);
            if (typeof data.credits_remaining === "number") {
                updateCredits(data.credits_remaining);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
            stepIntervals.forEach(clearTimeout);
        } finally {
            setLoading(false);
            stepIntervals.forEach(clearTimeout);
        }
    };

    if (result) return null;

    return (
        <div className="flex flex-col items-center justify-start pt-16 min-h-[60vh] w-full max-w-4xl mx-auto px-6">
            {/* Minimal User Profile Section */}
            {!loading && !result && user && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-center justify-between mb-12"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-black/[0.05] bg-[#f5f5f7]">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#86868b] font-semibold text-lg">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight">{user.name}</h2>
                                <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#0071e3]/5 text-[#0071e3] border border-[#0071e3]/10">
                                    {user.credits} credits
                                </span>
                            </div>
                            <p className="text-[13px] text-[#86868b]">{user.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowBuyCredits(true)}
                        className="apple-button-secondary py-2.5 px-6 text-[14px]"
                    >
                        Buy Credits
                    </button>
                </motion.div>
            )}

            <motion.div
                layout
                className="w-full"
                animate={loading ? { scale: 0.99, opacity: 0.8 } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <div className="apple-card p-2 sm:p-2.5 bg-[#f5f5f7]/50 backdrop-blur-sm">
                    <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row items-center gap-2">
                        <div className="relative flex-1 w-full">
                            <input
                                type="text"
                                placeholder="Paste YouTube URL here..."
                                className="w-full pl-6 pr-4 py-4 bg-transparent outline-none text-[17px] text-[#1d1d1f] placeholder:text-[#86868b]/60 font-normal"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !url}
                            className="w-full md:w-auto apple-button-primary py-4 px-10 text-[16px] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Search className="w-4 h-4" strokeWidth={2.5} />
                                    Analyze
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Comment Slider Section - Minimal */}
                <div className="mt-8 px-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[12px] font-medium text-[#86868b]">50 comments</span>
                        <div className="text-[13px] font-semibold text-[#1d1d1f] bg-black/[0.03] px-3 py-1 rounded-full">
                            Analyze: <span className="text-[#0071e3]">{commentLimit}</span> comments
                        </div>
                        <span className="text-[12px] font-medium text-[#86868b]">500 comments</span>
                    </div>

                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min="50"
                            max="500"
                            step="50"
                            value={commentLimit}
                            onChange={(e) => setCommentLimit(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-[#f5f5f7] rounded-full appearance-none cursor-pointer accent-[#0071e3]"
                            style={{
                                background: `linear-gradient(to right, #0071e3 ${((commentLimit - 50) / 450) * 100}%, #e8e8ed ${((commentLimit - 50) / 450) * 100}%)`
                            }}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-[#86868b] font-medium">
                    <div className="w-1 h-1 rounded-full bg-[#0071e3] animate-pulse" />
                    <span>Analysis costs 1 credit</span>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-6 text-[#ff3b30] bg-[#ff3b30]/5 px-6 py-3 rounded-full text-[14px] font-medium border border-[#ff3b30]/10 text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Mock Loader - Minimal Apple Style */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="mt-20 w-full max-w-sm flex flex-col items-center"
                    >
                        <div className="w-16 h-16 rounded-full border-[2.5px] border-[#f5f5f7] border-t-[#0071e3] animate-spin mb-8" />

                        <div className="text-center space-y-2">
                            <motion.p
                                key={progressStep}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight"
                            >
                                {steps[progressStep].text}
                            </motion.p>
                            <p className="text-[14px] text-[#86868b]">One moment please...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BuyCreditsModal isOpen={showBuyCredits} onClose={() => setShowBuyCredits(false)} />
        </div>
    );
}
