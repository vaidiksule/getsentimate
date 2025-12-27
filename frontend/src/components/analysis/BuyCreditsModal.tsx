"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/userStore";
import { authApi } from "@/lib/auth";
import { Toast } from "@/components/ui/Toast";
import { X } from "lucide-react";

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

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("success");

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

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
            const orderResponse = await authApi.post("/api/payments/create-order/", {
                package_id: packageId,
            });

            const orderData = orderResponse.data;

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "GetSentimate",
                description: `Purchase ${orderData.package_name}`,
                order_id: orderData.order_id,
                prefill: {
                    email: useUserStore.getState().user?.email || "",
                },
                handler: async function (response: any) {
                    try {
                        const verifyResponse = await authApi.post("/api/payments/verify-payment/", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        updateCredits(verifyResponse.data.new_balance);

                        setToastType("success");
                        setToastMessage(`Success! You now have ${verifyResponse.data.new_balance} credits!`);
                        setShowToast(true);

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
                notes: {
                    user_id: useUserStore.getState().user?.id || "",
                    website: "https://getsentimate.com",
                    support_email: "vaidiksule@gmail.com",
                },
                theme: {
                    color: "#0A0A0A",
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
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="bg-white rounded-apple p-8 sm:p-10 max-w-2xl w-full shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-title-page font-bold text-black tracking-tight">Purchase Credits</h2>
                            <p className="text-secondary text-gray-500 font-medium">Select a package to continue your analysis.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center text-black"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {packages.map((pkg) => (
                            <button
                                key={pkg.id}
                                onClick={() => handleBuyCredits(pkg.id)}
                                disabled={loading}
                                className={`p-8 rounded-apple border-2 transition-all flex flex-col items-center ${selectedPackage === pkg.id
                                    ? "border-green-primary bg-green-soft"
                                    : "border-gray-200 hover:border-black bg-white"
                                    } ${loading && selectedPackage !== pkg.id ? "opacity-50" : ""}`}
                            >
                                <div className="text-secondary font-bold text-gray-500 mb-2 uppercase tracking-widest text-micro">
                                    {pkg.credits} Credits
                                </div>
                                <div className="text-title-hero font-bold text-black mb-3">₹{pkg.price}</div>
                                <div className="text-micro font-bold text-green-text bg-green-primary/10 px-2.5 py-1 rounded-full">
                                    ₹{(pkg.price / pkg.credits).toFixed(2)} / credit
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-micro text-gray-400 font-medium">Securely processed via Razorpay</p>
                        <a
                            href="/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary font-bold text-blue-primary hover:underline underline-offset-4"
                        >
                            View enterprise pricing
                        </a>
                    </div>
                </motion.div>
            </motion.div>

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
