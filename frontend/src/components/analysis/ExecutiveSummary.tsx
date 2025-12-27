"use client";

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
            className="lg:col-span-2 space-y-8"
        >
            {/* Executive Insight Card */}
            <motion.div variants={item} className="apple-card p-8 bg-[#f5f5f7]/50">
                <h3 className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-4">Executive Insight</h3>
                <p className="text-[18px] leading-relaxed font-medium text-[#1d1d1f] tracking-tight">
                    {result.analysis?.overall_summary}
                </p>
            </motion.div>

            {/* Action Plan */}
            <motion.div variants={item} className="apple-card overflow-hidden">
                <div className="px-8 py-5 border-b border-black/[0.03]">
                    <h3 className="text-[15px] font-semibold text-[#1d1d1f]">Recommended Actions</h3>
                </div>
                <div className="divide-y divide-black/[0.03]">
                    {result.analysis?.creator_actions?.map((action: any, i: number) => (
                        <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="text-[15px] font-medium text-[#1d1d1f] leading-snug max-w-xl">{action.action}</div>
                            <div className="flex gap-2 shrink-0">
                                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] font-medium">
                                    {action.effort} effort
                                </span>
                                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${action.impact === 'High'
                                        ? 'bg-[#0071e3] text-white'
                                        : 'bg-[#f5f5f7] text-[#86868b]'
                                    }`}>
                                    {action.impact} impact
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Simple Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Keep Doing */}
                <motion.div variants={item} className="apple-card p-8">
                    <h3 className="text-[11px] font-bold text-[#34C759] mb-6 uppercase tracking-widest">Strengths</h3>
                    <ul className="space-y-4">
                        {result.analysis?.what_users_love?.map((item: string, i: number) => (
                            <li key={i} className="text-[14px] font-medium text-[#424245] flex items-start gap-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Improve */}
                <motion.div variants={item} className="apple-card p-8">
                    <h3 className="text-[11px] font-bold text-[#FF9500] mb-6 uppercase tracking-widest">Opportunities</h3>
                    <ul className="space-y-4">
                        {result.analysis?.areas_for_improvement?.map((item: string, i: number) => (
                            <li key={i} className="text-[14px] font-medium text-[#424245] flex items-start gap-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </motion.div>
    );
}
