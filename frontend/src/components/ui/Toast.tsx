"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Info } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
}

const icons = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: Info,
};

const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-orange-500",
    info: "bg-blue-500",
};

export function Toast({ message, type = "info", onClose }: ToastProps) {
    const Icon = icons[type];

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/[0.06] p-4 min-w-[300px] max-w-md"
            >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${colors[type]}`}>
                    <Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <p className="flex-1 text-[14px] text-[#1d1d1f] font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/[0.06] transition-colors"
                >
                    <X className="h-4 w-4 text-[#86868b]" strokeWidth={2} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
