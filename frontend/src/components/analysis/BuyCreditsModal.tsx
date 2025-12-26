"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import { authApi } from "@/lib/auth";
import { Toast } from "@/components/ui/Toast";

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    amount: number;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function BuyCreditsModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
    const { updateCredits } = useUserStore();

    // Toast states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("success");

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        // Fetch packages
        if (isOpen) {
            fetchPackages();
        }

        return () => {
            document.body.removeChild(script);
        };
    }, [isOpen]);

    const fetchPackages = async () => {
        try {
            const response = await authApi.get("/api/payments/packages/");
            setPackages(response.data.packages);
        } catch (error) {
            console.error("Failed to fetch packages:", error);
        }
    };

    const handleBuyCredits = async (packageId: string) => {
        setLoading(true);
        setSelectedPackage(packageId);

        try {
            // Step 1: Create order
            const orderResponse = await authApi.post("/api/payments/create-order/", {
                package_id: packageId,
            });

            const orderData = orderResponse.data;

            // Step 2: Open Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "GetSentimate",
                description: `Purchase ${orderData.package_name}`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    // Step 3: Verify payment
                    try {
                        const verifyResponse = await authApi.post("/api/payments/verify-payment/", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        // Update credits in store
                        updateCredits(verifyResponse.data.new_balance);

                        // Show success toast
                        setToastType("success");
                        setToastMessage(`Success! You now have ${verifyResponse.data.new_balance} credits!`);
                        setShowToast(true);

                        // Close modal after showing toast
                        setTimeout(() => {
                            onClose();
                            if (onSuccess) onSuccess();
                        }, 2000);
                    } catch (error) {
                        console.error("Payment verification failed:", error);
                        setToastType("error");
                        setToastMessage("Payment verification failed. Please contact support.");
                        setShowToast(true);
                    } finally {
                        setLoading(false);
                        setSelectedPackage(null);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        setSelectedPackage(null);
                    },
                },
                theme: {
                    color: "#0071e3",
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Failed to create order:", error);
            setToastType("error");
            setToastMessage("Failed to initiate payment. Please try again.");
            setShowToast(true);
            setLoading(false);
            setSelectedPackage(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-[24px] p-8 max-w-2xl w-full shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[28px] font-semibold text-[#1d1d1f]">Buy Credits</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors flex items-center justify-center"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Packages */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {packages.map((pkg) => (
                            <motion.button
                                key={pkg.id}
                                onClick={() => handleBuyCredits(pkg.id)}
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-6 rounded-[16px] border-2 transition-all ${selectedPackage === pkg.id
                                    ? "border-[#0071e3] bg-blue-50"
                                    : "border-black/[0.06] hover:border-[#0071e3]/50 bg-white"
                                    } ${loading && selectedPackage !== pkg.id ? "opacity-50" : ""}`}
                            >
                                <div className="text-[17px] font-semibold text-[#1d1d1f] mb-2">
                                    {pkg.credits} Credits
                                </div>
                                <div className="text-[32px] font-bold text-[#0071e3] mb-1">₹{pkg.price}</div>
                                <div className="text-[13px] text-[#86868b]">
                                    ₹{(pkg.price / pkg.credits).toFixed(2)} per credit
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    {/* View Full Pricing Link */}
                    <div className="mt-4 text-center">
                        <a
                            href="/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors"
                        >
                            View full pricing details
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>

                    {/* Test Mode Notice */}
                    <div className="mt-6 p-4 bg-yellow-50 rounded-[12px] border border-yellow-200">
                        <p className="text-[13px] text-yellow-800">
                            <strong>Test Mode:</strong> Use card <code>4111 1111 1111 1111</code>, any future expiry, CVV: 123
                        </p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Toast Notification */}
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </AnimatePresence>
    );
}
