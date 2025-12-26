import { PlayCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysisStore";

export function VideoHeader({ result }: { result: any }) {
    const { clearResult } = useAnalysisStore();

    if (!result) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03] flex flex-col md:flex-row gap-8 items-start hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-shadow duration-500 relative group/card"
        >
            {/* New Analysis Button - Top Right Hover/Mobile */}
            <div className="md:absolute top-6 right-6 mb-4 md:mb-0 w-full md:w-auto">
                <button
                    onClick={clearResult}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[14px] font-medium rounded-xl transition-all duration-200 w-full md:w-auto border border-black/[0.03] group"
                >
                    <Search className="w-4 h-4 text-[#86868b] group-hover:text-[#1d1d1f] transition-colors" strokeWidth={2.5} />
                    Analyze Another Video
                </button>
            </div>

            <div className="relative w-full md:w-[280px] aspect-video bg-[#f5f5f7] rounded-xl overflow-hidden shrink-0 group border border-black/[0.03]">
                {result.metadata?.thumbnail && (
                    <img
                        src={result.metadata.thumbnail}
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transform scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                        <PlayCircle className="w-5 h-5 text-[#1d1d1f] ml-0.5" />
                    </div>
                </div>
            </div>

            <div className="flex-1 py-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-[#0071e3]/10 text-[#0071e3] text-[11px] font-semibold tracking-wide rounded-md uppercase">
                        Video Analysis
                    </span>
                    <span className="px-2.5 py-1 bg-[#f5f5f7] text-[#86868b] text-[11px] font-medium tracking-wide rounded-md">
                        {result.analysis?.total_comments_analyzed || 0} Comments
                    </span>
                </div>

                <h2 className="text-[22px] md:text-[24px] font-semibold leading-tight mb-3 text-[#1d1d1f] tracking-tight">
                    {result.metadata?.title}
                </h2>

                <div className="flex items-center gap-4 text-[13px] text-[#86868b] font-medium">
                    <span className="text-[#1d1d1f] truncate">{result.metadata?.channel}</span>
                    <span className="w-1 h-1 rounded-full bg-[#d2d2d7]"></span>
                    <span>{(result.metadata?.views || 0).toLocaleString()} views</span>
                    <span className="w-1 h-1 rounded-full bg-[#d2d2d7]"></span>
                    <span>{(result.metadata?.likes || 0).toLocaleString()} likes</span>
                </div>
            </div>
        </motion.div>
    );
}
