"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
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
            className="space-y-8"
        >
            {/* Sentiment Chart */}
            <motion.div variants={item} className="apple-card p-6">
                <h3 className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-8">Sentiment</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sentimentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
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
                                    borderRadius: '16px',
                                    border: 'none',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                                    padding: '8px 12px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#86868b', paddingTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Topics List - Pill Style */}
            <motion.div variants={item} className="apple-card p-6">
                <h3 className="text-[11px] font-bold text-[#86868b] uppercase tracking-widest mb-6">Key Topics</h3>
                <div className="flex flex-wrap gap-1.5">
                    {result.analysis?.key_topics?.map((topic: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-[#f5f5f7] text-[#1d1d1f] text-[13px] font-medium rounded-full cursor-default transition-all hover:bg-[#e8e8ed]">
                            {topic}
                        </span>
                    ))}
                </div>
            </motion.div>

            {/* Video Ideas - Minimal */}
            <motion.div variants={item} className="apple-card p-6 bg-[#0071e3]/5 border-[#0071e3]/10">
                <h3 className="text-[11px] font-bold text-[#0071e3] mb-6 uppercase tracking-widest">Next Video Ideas</h3>
                <ul className="space-y-3">
                    {result.analysis?.video_ideas?.map((item: string, i: number) => (
                        <li key={i} className="bg-white p-4 rounded-xl text-[13px] text-[#1d1d1f] font-medium border border-black/[0.03] shadow-sm">
                            {item}
                        </li>
                    ))}
                </ul>
            </motion.div>
        </motion.div>
    );
}
