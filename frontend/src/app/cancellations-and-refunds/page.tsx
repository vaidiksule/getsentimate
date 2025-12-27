import React from "react";

export const metadata = {
    title: "Cancellations & Refunds | GetSentimate",
    description: "Refund and cancellation policy for GetSentimate services.",
};

export default function RefundsPage() {
    return (
        <div className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">Cancellations & Refunds</h1>
                <p className="text-neutral-500 mb-12">Our policies regarding service cancellations and refund requests.</p>

                <div className="prose prose-neutral max-w-none space-y-12 text-neutral-700">
                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Cancellation Policy</h2>
                        <p>
                            You may stop using our services at any time. For subscription-based plans, you can cancel your subscription from your account settings.
                            Upon cancellation, you will retain access to the features until the end of your current billing period.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Refund Eligibility</h2>
                        <p>We strive for customer satisfaction, but since we provide digital credits and instant analysis, we have specific refund conditions:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong>Failed or Duplicate Payments:</strong> If you are charged multiple times for the same transaction due to a technical error, we will issue a full refund for the duplicate amount.</li>
                            <li><strong>Unused Credits:</strong> Refunds may be considered for credit purchases if no credits from that transaction have been used, and the request is made within 48 hours of purchase.</li>
                            <li><strong>Used Credits:</strong> No refunds will be provided for partially or fully used credits once an analysis has been initiated.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Refund Process</h2>
                        <p>
                            To request a refund, please email us at <a href="mailto:vaidiksule@gmail.com" className="text-blue-600">vaidiksule@gmail.com</a> with your transaction details and the reason for the request.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong>Timeline:</strong> Once approved, refunds are processed within <strong>5–7 business days</strong>.</li>
                            <li><strong>Mode of Refund:</strong> Refunds will be credited back to the <strong>original payment method</strong> used during the purchase.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Changes to Policy</h2>
                        <p>
                            GetSentimate reserves the right to modify this refund policy at any time. Any changes will be updated on this page.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
