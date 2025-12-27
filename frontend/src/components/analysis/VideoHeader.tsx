"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysisStore";

export function VideoHeader({ result }: { result: any }) {
    const { clearResult } = useAnalysisStore();

    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="apple-card p-6 flex flex-col md:flex-row gap-8 items-center"
        >
            <div className="relative w-full md:w-[240px] aspect-video bg-[#f5f5f7] rounded-xl overflow-hidden shrink-0 border border-black/[0.03]">
                {result.metadata?.thumbnail && (
                    <img
                        src={result.metadata.thumbnail}
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#0071e3]/5 text-[#0071e3] text-[10px] font-bold tracking-wider rounded uppercase">
                        Analysis
                    </span>
                    <span className="text-[12px] text-[#86868b] font-medium">
                        {result.analysis?.total_comments_analyzed || 0} comments
                    </span>
                </div>

                <h2 className="text-[20px] md:text-[22px] font-semibold leading-tight mb-3 text-[#1d1d1f] tracking-tight">
                    {result.metadata?.title}
                </h2>

                <div className="flex items-center justify-center md:justify-start gap-3 text-[13px] text-[#86868b]">
                    <span className="text-[#1d1d1f] font-medium">{result.metadata?.channel}</span>
                    <span className="w-1 h-1 rounded-full bg-[#d2d2d7]"></span>
                    <span>{(result.metadata?.views || 0).toLocaleString()} views</span>
                </div>
            </div>

            <button
                onClick={clearResult}
                className="apple-button-secondary text-[13px] py-2 px-6 shrink-0"
            >
                New Analysis
            </button>
        </motion.div>
    );
}
