import React from "react";

export const metadata = {
    title: "Shipping Policy | GetSentimate",
    description: "Shipping and delivery policy for GetSentimate digital services.",
};

export default function ShippingPolicyPage() {
    return (
        <div className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">Shipping & Delivery Policy</h1>
                <p className="text-neutral-500 mb-12">Information about how our digital services are delivered.</p>

                <div className="prose prose-neutral max-w-none space-y-12 text-neutral-700">
                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Digital Delivery Only</h2>
                        <p>
                            GetSentimate provides digital services and AI-powered software solutions for YouTube creators.
                            <strong> No physical shipping</strong> is involved in the delivery of our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Instant Access</h2>
                        <p>
                            Upon successful payment for any of our plans or credit top-ups, <strong>digital delivery</strong> is processed immediately.
                            You will receive <strong>instant access</strong> to the purchased credits or subscription features directly within your user dashboard.
                        </p>
                        <p className="mt-4">
                            You will also receive a payment confirmation email to the address associated with your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Service Availability</h2>
                        <p>
                            As a SaaS platform, our services are accessible globally via the internet. Access is granted to your account as soon as the transaction is confirmed by our payment processor (Razorpay).
                            If you do not see your credits reflected in your account immediately after payment, please contact our support team.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
