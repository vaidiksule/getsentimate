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
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
};

export function ExecutiveSummary({ result }: { result: any }) {
    if (!result) return null;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="lg:col-span-2 space-y-12"
        >
            {/* Executive Insight Card */}
            <motion.div variants={item} className="apple-card p-8 bg-gray-100">
                <h3 className="label-micro mb-6">Executive Insight</h3>
                <p className="text-emphasis font-bold text-black leading-relaxed tracking-tight">
                    {result.analysis?.overall_summary}
                </p>
            </motion.div>

            {/* Action Plan */}
            <motion.div variants={item} className="apple-card overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-white">
                    <h3 className="text-title-section font-bold text-black tracking-tight">Recommended Actions</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {result.analysis?.creator_actions?.map((action: any, i: number) => (
                        <div key={i} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-all duration-apple">
                            <div className="text-body font-medium text-black leading-snug max-w-xl">{action.action}</div>
                            <div className="flex gap-2 shrink-0">
                                <span className="badge-blue">
                                    {action.effort} effort
                                </span>
                                <span className={action.impact === 'High' ? 'badge-blue' : 'badge-soft bg-gray-100 text-gray-600'}>
                                    {action.impact} impact
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Simple Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Strengths */}
                <motion.div variants={item} className="apple-card p-8 bg-white hover:bg-gray-50 transition-all duration-apple">
                    <h3 className="label-micro mb-8 text-green-primary">Strengths</h3>
                    <ul className="space-y-6">
                        {result.analysis?.what_users_love?.map((item: string, i: number) => (
                            <li key={i} className="text-secondary font-medium text-gray-700 flex items-start gap-4 leading-normal">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-primary mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Opportunities */}
                <motion.div variants={item} className="apple-card p-8 bg-white hover:bg-gray-50 transition-all duration-apple">
                    <h3 className="label-micro mb-8 text-yellow-primary">Opportunities</h3>
                    <ul className="space-y-6">
                        {result.analysis?.areas_for_improvement?.map((item: string, i: number) => (
                            <li key={i} className="text-secondary font-medium text-gray-700 flex items-start gap-4 leading-normal">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-primary mt-2 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </motion.div>
    );
}
