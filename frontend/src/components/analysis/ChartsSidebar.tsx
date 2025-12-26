
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { PieChart as PieChartIcon, MessageSquare, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = {
    positive: '#34C759', // Apple Green
    neutral: '#8E8E93',  // Apple Gray
    negative: '#FF3B30', // Apple Red
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export function ChartsSidebar({ result }: { result: any }) {
    if (!result) return null;

    const sentimentData = [
        { name: 'Positive', value: result.analysis.sentiment_breakdown?.positive || 0, color: COLORS.positive },
        { name: 'Neutral', value: result.analysis.sentiment_breakdown?.neutral || 0, color: COLORS.neutral },
        { name: 'Negative', value: result.analysis.sentiment_breakdown?.negative || 0, color: COLORS.negative },
    ].filter(d => d.value > 0);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Sentiment Chart */}
            <motion.div variants={item} className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                <h3 className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-3.5 h-3.5" /> Sentiment
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sentimentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {sentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                cursor={false}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                    padding: '8px 12px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: '#1d1d1f'
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '12px', color: '#86868b', paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Topics List */}
            <motion.div variants={item} className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                <h3 className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Key Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                    {result.analysis?.key_topics?.map((topic: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-[#f5f5f7] text-[#424245] text-[13px] font-medium rounded-lg border border-transparent cursor-default transition-colors hover:bg-[#e5e5e5]">
                            {topic}
                        </span>
                    ))}
                </div>
            </motion.div>

            {/* Video Ideas */}
            <motion.div variants={item} className="bg-[#F2F7FF] rounded-[20px] p-6 border border-[#0071e3]/10">
                <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#0071e3] mb-5 uppercase tracking-widest">
                    <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.5} /> Next Video Ideas
                </h3>
                <ul className="space-y-3">
                    {result.analysis?.video_ideas?.map((item: string, i: number) => (
                        <li key={i} className="bg-white/80 p-3.5 rounded-xl text-[13px] text-[#1d1d1f] font-medium border border-[#0071e3]/5 shadow-sm">
                            {item}
                        </li>
                    ))}
                </ul>
            </motion.div>
        </motion.div>
    );
}
