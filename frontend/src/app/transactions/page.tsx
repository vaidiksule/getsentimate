"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Gift, X } from "lucide-react";
import { authApi } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";
import { AuthGuard } from "@/components/AuthGuard";
import { BuyCreditsModal } from "@/components/analysis/BuyCreditsModal";
import { Plus } from "lucide-react";

interface Transaction {
    type: "purchase" | "bonus" | "analysis";
    amount: number;
    description: string;
    created_at: string;
    razorpay_payment_id?: string;
}

interface Summary {
    credit_balance: number;
    bonus_credits: number;
    total_purchased: number;
    total_used: number;
}

export default function TransactionsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryRes, transactionsRes] = await Promise.all([
                authApi.get("/api/transactions/summary/"),
                authApi.get("/api/transactions/"),
            ]);
            setSummary(summaryRes.data);
            setTransactions(transactionsRes.data);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "purchase":
                return <ArrowUpCircle className="w-5 h-5 text-green-500" strokeWidth={2} />;
            case "bonus":
                return <Gift className="w-5 h-5 text-purple-500" strokeWidth={2} />;
            case "analysis":
                return <ArrowDownCircle className="w-5 h-5 text-red-500" strokeWidth={2} />;
            default:
                return null;
        }
    };

    const getAmountColor = (amount: number) => {
        if (amount > 0) return "text-green-600";
        if (amount < 0) return "text-red-600";
        return "text-[#86868b]";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50/80 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-[3px] border-[#e5e5e5] border-t-[#0071e3] animate-spin" />
            </div>
        );
    }

    return (
        <AuthGuard requireAuth={true}>
            <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50/80 py-8 sm:py-12 px-4 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-[28px] sm:text-[40px] font-semibold text-[#1d1d1f] tracking-tight">
                                Credits & Purchases
                            </h1>
                            <p className="text-[15px] text-[#86868b] mt-2">
                                View your credit balance and transaction history
                            </p>
                        </div>
                        <button
                            onClick={() => setIsBuyModalOpen(true)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-6 py-2.5 text-[15px] font-medium text-white shadow-sm hover:bg-[#0077ed] transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            Buy Credits
                        </button>
                    </motion.div>

                    {/* Summary Cards */}
                    {summary && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                        >
                            <div className="bg-white rounded-[16px] p-6 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                <div className="text-[13px] text-[#86868b] mb-1">Current Balance</div>
                                <div className="text-[32px] font-semibold text-[#0071e3]">{summary.credit_balance}</div>
                            </div>
                            <div className="bg-white rounded-[16px] p-6 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                <div className="text-[13px] text-[#86868b] mb-1">Total Purchased</div>
                                <div className="text-[32px] font-semibold text-green-600">{summary.total_purchased}</div>
                            </div>
                            <div className="bg-white rounded-[16px] p-6 border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                                <div className="text-[13px] text-[#86868b] mb-1">Total Used</div>
                                <div className="text-[32px] font-semibold text-[#86868b]">{summary.total_used}</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Transactions List */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[20px] border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden"
                    >
                        <div className="px-6 sm:px-8 py-6 border-b border-black/[0.06]">
                            <h2 className="text-[20px] font-semibold text-[#1d1d1f]">Recent Transactions</h2>
                        </div>

                        <div className="divide-y divide-black/[0.06]">
                            {transactions.length === 0 ? (
                                <div className="px-6 sm:px-8 py-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                                        <X className="w-8 h-8 text-[#86868b]" strokeWidth={2} />
                                    </div>
                                    <p className="text-[15px] text-[#86868b]">No transactions yet</p>
                                    <p className="text-[13px] text-[#86868b] mt-1">
                                        Your credit purchases and usage will appear here
                                    </p>
                                </div>
                            ) : (
                                transactions.map((transaction, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                        className="px-4 sm:px-8 py-5 flex items-center justify-between hover:bg-[#f5f5f7]/50 transition-colors gap-4"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] shrink-0">
                                                {getIcon(transaction.type)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[14px] sm:text-[15px] font-medium text-[#1d1d1f] truncate">
                                                    {transaction.description}
                                                </div>
                                                <div className="text-[12px] sm:text-[13px] text-[#86868b] mt-0.5">
                                                    {transaction.created_at}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-[15px] sm:text-[17px] font-semibold shrink-0 ${getAmountColor(transaction.amount)}`}>
                                            {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <BuyCreditsModal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                    setIsBuyModalOpen(false);
                }}
            />
        </AuthGuard>
    );
}
