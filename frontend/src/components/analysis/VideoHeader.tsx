"use client";

import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysisStore";

export function VideoHeader({ result }: { result: any }) {
    const { clearResult } = useAnalysisStore();

    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="apple-card p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center"
        >
            <div className="relative w-full md:w-[240px] aspect-video bg-gray-100 rounded-apple overflow-hidden shrink-0 border border-gray-200">
                {result.metadata?.thumbnail && (
                    <img
                        src={result.metadata.thumbnail}
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="badge-blue">
                        ANALYSIS COMPLETE
                    </span>
                    <span className="text-micro font-medium text-gray-500">
                        {result.analysis?.total_comments_analyzed || 0} comments analyzed
                    </span>
                </div>

                <h2 className="text-title-section md:text-title-page font-bold leading-tight mb-4 text-black tracking-tight">
                    {result.metadata?.title}
                </h2>

                <div className="flex items-center gap-3 text-secondary text-gray-500">
                    <span className="text-black font-semibold">{result.metadata?.channel}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{(result.metadata?.views || 0).toLocaleString()} views</span>
                </div>
            </div>

            <button
                onClick={clearResult}
                className="btn-secondary py-2.5 px-6 shrink-0 w-full md:w-auto"
            >
                New Analysis
            </button>
        </motion.div>
    );
}
