import React from "react";

export const metadata = {
    title: "Contact Us | GetSentimate",
    description: "Contact the GetSentimate team for support, billing, or technical inquiries.",
};

export default function ContactPage() {
    return (
        <div className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">Contact Us</h1>
                <p className="text-neutral-500 mb-12">We are here to help you with any questions or issues.</p>

                <div className="prose prose-neutral max-w-none space-y-12 text-neutral-700">
                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Get in Touch</h2>
                        <p>
                            <strong>GetSentimate</strong> is an AI-powered SaaS platform designed for YouTube comment analytics.
                            Whether you have questions about billing, need technical support, or want to request a refund, our team is ready to assist you.
                        </p>
                    </section>

                    <section className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100">
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Information</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Email Support</h3>
                                <p className="text-lg text-neutral-900">
                                    <a href="mailto:vaidiksule@gmail.com" className="text-blue-600 hover:underline">vaidiksule@gmail.com</a>
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Response Time</h3>
                                <p className="text-neutral-900">We typically respond to all inquiries within 24-48 business hours.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Our Commitment</h2>
                        <p>
                            We value transparency and aim to provide the best possible experience for our users. If you encounter any issues with our sentiment analysis tools or account management, please don't hesitate to reach out.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
