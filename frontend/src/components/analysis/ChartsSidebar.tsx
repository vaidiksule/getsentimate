"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { motion } from "framer-motion";

const COLORS = {
    positive: '#16A34A', // Green Primary
    neutral: '#A3A3A3',  // Gray 400
    negative: '#DC2626', // Red Primary
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
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
            <motion.div variants={item} className="apple-card p-8">
                <h3 className="label-micro mb-8">Sentiment</h3>
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
                                    borderRadius: '8px',
                                    border: '1px solid #E5E5E5',
                                    boxShadow: 'none',
                                    padding: '8px 12px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#0A0A0A'
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                iconSize={6}
                                wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#737373', paddingTop: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Topics List - Pill Style */}
            <motion.div variants={item} className="apple-card p-8 bg-white">
                <h3 className="label-micro mb-6">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                    {result.analysis?.key_topics?.map((topic: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-100 text-black text-secondary font-medium rounded-full cursor-default transition-all hover:bg-gray-200">
                            {topic}
                        </span>
                    ))}
                </div>
            </motion.div>

            {/* Video Ideas - Minimal */}
            <motion.div variants={item} className="apple-card p-8 bg-blue-soft border-blue-primary/10">
                <h3 className="label-micro mb-8 text-blue-text">Next Video Ideas</h3>
                <ul className="space-y-4">
                    {result.analysis?.video_ideas?.map((item: string, i: number) => (
                        <li key={i} className="bg-white p-5 rounded-apple text-secondary text-black font-medium border border-blue-primary/5 shadow-sm">
                            {item}
                        </li>
                    ))}
                </ul>
            </motion.div>
            {/* Usage Analysis - Debug Info */}
            {result.analysis?.debug_info && (
                <motion.div variants={item} className="apple-card p-8 bg-gray-50 border-gray-200">
                    <h3 className="label-micro mb-6 text-gray-500">Usage Analysis</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-micro">
                            <span className="text-gray-500 font-medium">Comments Analyzed</span>
                            <span className="text-black font-bold">{result.analysis.debug_info.num_comments}</span>
                        </div>
                        <div className="flex justify-between items-center text-micro">
                            <span className="text-gray-500 font-medium">Model</span>
                            <span className="text-black font-bold uppercase tracking-tight">{result.analysis.debug_info.model_used}</span>
                        </div>
                        <div className="flex justify-between items-center text-micro">
                            <span className="text-gray-500 font-medium">API Calls</span>
                            <span className="text-black font-bold">{result.analysis.debug_info.api_calls}</span>
                        </div>
                        <div className="flex justify-between items-center text-micro">
                            <span className="text-gray-500 font-medium">Tokens Used</span>
                            <span className="text-black font-bold">{result.analysis.debug_info.total_tokens.toLocaleString()}</span>
                        </div>
                        <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-micro text-gray-400 font-bold uppercase tracking-widest">Est. Cost</span>
                            <span className="text-secondary font-bold text-black">${result.analysis.debug_info.estimated_cost_usd} <span className="text-[10px] text-gray-400 font-normal">USD</span></span>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
