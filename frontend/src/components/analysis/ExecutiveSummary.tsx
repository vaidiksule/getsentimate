
"use client";

import { Lightbulb, CheckCircle, ThumbsUp, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export function ExecutiveSummary({ result }: { result: any }) {
    if (!result) return null;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-2 space-y-6"
        >
            {/* Executive Insight Card */}
            <motion.div variants={item} className="bg-white rounded-[20px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-[#FFD60A]/10 rounded-lg">
                        <Lightbulb className="w-4 h-4 text-[#FFD60A]" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest">Executive Insight</h3>
                </div>
                <p className="text-[16px] sm:text-[17px] leading-relaxed font-medium text-[#1d1d1f] tracking-tight">
                    {result.analysis?.overall_summary}
                </p>
            </motion.div>

            {/* Action Plan */}
            <motion.div variants={item} className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03] overflow-hidden">
                <div className="px-8 py-5 border-b border-[#f5f5f7] bg-white flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#1d1d1f] flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-[#0071e3]" strokeWidth={2.5} />
                        Recommended Actions
                    </h3>
                </div>
                <div className="divide-y divide-[#f5f5f7]">
                    {result.analysis?.creator_actions?.map((action: any, i: number) => (
                        <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors duration-200">
                            <div className="text-[15px] font-medium text-[#1d1d1f] leading-snug">{action.action}</div>
                            <div className="flex gap-2 shrink-0">
                                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] font-medium border border-transparent">
                                    Effort: {action.effort}
                                </span>
                                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${action.impact === 'High'
                                    ? 'bg-[#0071e3]/5 text-[#0071e3] border-[#0071e3]/10'
                                    : 'bg-[#f5f5f7] text-[#86868b] border-transparent'
                                    }`}>
                                    Impact: {action.impact}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Interactive Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Keep Doing */}
                <motion.div variants={item} className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#34C759] mb-6 uppercase tracking-widest">
                        <ThumbsUp className="w-4 h-4" strokeWidth={2.5} /> Continue
                    </h3>
                    <ul className="space-y-4">
                        {result.analysis?.what_users_love?.map((item: string, i: number) => (
                            <li key={i} className="text-[14px] font-medium text-[#424245] flex items-start gap-3 leading-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Improve */}
                <motion.div variants={item} className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#FF9500] mb-6 uppercase tracking-widest">
                        <TrendingUp className="w-4 h-4" strokeWidth={2.5} /> Improve
                    </h3>
                    <ul className="space-y-4">
                        {result.analysis?.areas_for_improvement?.map((item: string, i: number) => (
                            <li key={i} className="text-[14px] font-medium text-[#424245] flex items-start gap-3 leading-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF9500] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </motion.div>
    );
}
