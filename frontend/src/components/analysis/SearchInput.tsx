
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

        // Progress step simulation
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
        <div className="flex flex-col items-center justify-start pt-12 min-h-[50vh] w-full max-w-4xl mx-auto px-4">
            {/* User Profile Section */}
            {!loading && !result && user && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full flex flex-col md:flex-row items-center justify-between mb-8 px-1 gap-6 md:gap-0"
                >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-black/5 shadow-sm shrink-0">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <h2 className="text-[18px] font-bold text-[#1d1d1f] tracking-tight truncate">{user.name}</h2>
                                <span className="inline-flex w-fit px-3 py-0.5 rounded-full bg-blue-50 text-[#0071e3] text-[12px] font-bold border border-blue-100 shadow-sm whitespace-nowrap">
                                    {typeof user.credits === 'number' ? user.credits : 0} credits
                                </span>
                            </div>
                            <p className="text-[14px] text-[#86868b] font-normal truncate">{user.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowBuyCredits(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-8 py-3 text-[15px] font-semibold text-white shadow-md hover:bg-[#0077ed] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Buy Credits
                    </button>
                </motion.div>
            )}

            <motion.div
                layout
                className="w-full max-w-4xl relative z-10"
                animate={loading ? { scale: 0.98, opacity: 0.8 } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "circOut" }}
            >
                <div className="bg-white rounded-[32px] p-3 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-black/[0.03]">
                    <form onSubmit={handleAnalyze} className="relative flex flex-col md:flex-row items-stretch gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Paste YouTube URL here..."
                                className="w-full pl-6 pr-4 py-4.5 bg-[#f5f5f7] outline-none text-[17px] text-[#1d1d1f] placeholder:text-[#86868b]/70 font-medium border border-transparent focus:border-[#0071e3]/20 focus:bg-white rounded-[20px] transition-all duration-300 shadow-inner"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="shrink-0 px-10 py-4.5 bg-[#0071e3] hover:bg-[#0077ED] disabled:bg-[#f5f5f7] disabled:text-[#86868b] text-white text-[16px] font-bold rounded-[20px] transition-all duration-300 shadow-[0_6px_20px_rgba(0,113,227,0.2)] hover:shadow-[0_8px_24px_rgba(0,113,227,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Search className="w-5 h-5 text-white/90" strokeWidth={3} />
                                    Analyze URL
                                </>
                            )}
                        </button>
                    </form>

                    {/* Comment Slider Section */}
                    <div className="mt-4 px-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[13px] text-[#86868b] font-medium">50 comments</span>
                            <div className="flex flex-col items-center">
                                <motion.div
                                    key={commentLimit}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[14px] font-semibold text-[#1d1d1f]"
                                >
                                    Analyzing: {commentLimit} comments
                                </motion.div>
                            </div>
                            <span className="text-[13px] text-[#86868b] font-medium text-right">500 comments</span>
                        </div>

                        <div className="relative h-6 flex items-center group">
                            <input
                                type="range"
                                min="50"
                                max="500"
                                step="50"
                                value={commentLimit}
                                onChange={(e) => setCommentLimit(parseInt(e.target.value))}
                                className="w-full h-1 bg-[#f5f5f7] rounded-full appearance-none cursor-pointer accent-[#007aff] transition-all"
                                style={{
                                    background: `linear-gradient(to right, #007aff 0%, #007aff ${((commentLimit - 50) / 450) * 100}%, #f5f5f7 ${((commentLimit - 50) / 450) * 100}%, #f5f5f7 100%)`
                                }}
                            />
                        </div>

                        <p className="mt-3 text-[12px] text-[#86868b] italic text-center text-balance">
                            More comments = deeper insight, slightly longer analysis
                        </p>
                    </div>
                </div>

                <div className="mt-4 px-2 flex items-center gap-2 text-[13px] text-[#86868b]">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span>Analysis costs 1 credit</span>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="text-[#ff3b30] bg-[#fff2f2] px-4 py-3 rounded-xl text-sm font-medium border border-[#ff3b30]/10 text-center shadow-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Mock Loader Animation */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-16 w-full max-w-md bg-white p-8 rounded-[32px] border border-black/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-[3px] border-[#f5f5f7] border-t-[#0071e3] animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        key={progressStep}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-[#0071e3]"
                                    >
                                        {steps[progressStep].icon}
                                    </motion.div>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <motion.p
                                    key={progressStep}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[17px] font-semibold text-[#1d1d1f]"
                                >
                                    {steps[progressStep].text}
                                </motion.p>
                                <p className="text-[14px] text-[#86868b]">This usually takes 90 seconds...</p>
                            </div>

                            <div className="w-full h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#0071e3]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${((progressStep + 1) / steps.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Buy Credits Modal */}
            <BuyCreditsModal isOpen={showBuyCredits} onClose={() => setShowBuyCredits(false)} />
        </div>
    );
}
