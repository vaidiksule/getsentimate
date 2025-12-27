"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/store/analysisStore";
import { Search, Loader2 } from "lucide-react";
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
        { text: "Fetching video metadata...", duration: 2000 },
        { text: "Retrieving user comments...", duration: 3000 },
        { text: "Analyzing sentiment patterns...", duration: 4000 },
        { text: "Generating actionable insights...", duration: 2000 },
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
            {!loading && !result && user && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-center justify-between mb-12"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-title-section">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-body font-bold text-black tracking-tight">{user.name}</h2>
                                <span className="badge-green">
                                    {user.credits} credits
                                </span>
                            </div>
                            <p className="text-secondary text-gray-500">{user.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowBuyCredits(true)}
                        className="btn-credits py-2.5 px-6"
                    >
                        Add Credits
                    </button>
                </motion.div>
            )}

            <motion.div
                layout
                className="w-full"
                animate={loading ? { opacity: 0.5 } : { opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
            >
                <div className="apple-card p-2 bg-gray-50">
                    <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row items-center gap-2">
                        <div className="relative flex-1 w-full">
                            <input
                                type="text"
                                placeholder="Paste YouTube URL here..."
                                className="w-full px-6 py-4 bg-transparent outline-none text-body text-black placeholder:text-gray-400 font-normal"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !url}
                            className="w-full md:w-auto btn-primary py-4 px-10 rounded-button flex items-center justify-center gap-2"
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

                <div className="mt-8 px-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-micro label-micro">50 comments</span>
                        <div className="text-secondary font-bold text-black bg-gray-100 px-3 py-1 rounded-full">
                            Analyze: <span className="text-blue-primary">{commentLimit}</span> comments
                        </div>
                        <span className="text-micro label-micro">500 comments</span>
                    </div>

                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min="50"
                            max="500"
                            step="50"
                            value={commentLimit}
                            onChange={(e) => setCommentLimit(parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-black"
                            style={{
                                background: `linear-gradient(to right, #0A0A0A ${((commentLimit - 50) / 450) * 100}%, #E5E5E5 ${((commentLimit - 50) / 450) * 100}%)`
                            }}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-primary animate-pulse" />
                    <span className="text-micro text-gray-500 font-medium">Analysis costs 1 credit</span>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-6 text-red-text bg-red-soft px-6 py-3 rounded-button text-secondary font-medium border border-red-primary/10 text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-20 w-full max-w-sm flex flex-col items-center"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-black animate-spin mb-8" />

                        <div className="text-center space-y-2">
                            <motion.p
                                key={progressStep}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-emphasis font-bold text-black tracking-tight"
                            >
                                {steps[progressStep].text}
                            </motion.p>
                            <p className="text-secondary text-gray-500">Processing your data...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BuyCreditsModal isOpen={showBuyCredits} onClose={() => setShowBuyCredits(false)} />
        </div>
    );
}
