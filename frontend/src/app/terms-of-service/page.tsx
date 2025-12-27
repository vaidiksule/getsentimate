import React from "react";

export const metadata = {
    title: "Terms of Service | GetSentimate",
    description: "Terms of Service for GetSentimate - YouTube Comments Analyzer",
};

export default function TermsOfServicePage() {
    const lastUpdated = "December 27, 2024";

    return (
        <div className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">Terms of Service</h1>
                <p className="text-neutral-500 mb-12">Last updated: {lastUpdated}</p>

                <div className="prose prose-neutral max-w-none space-y-12 text-neutral-700">
                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using <strong>GetSentimate</strong>, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. Description of Service</h2>
                        <p>
                            GetSentimate is an AI-powered YouTube comment analysis platform that provides sentiment insights and audience analytics for creators and researchers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. User Responsibilities</h2>
                        <p>As a user of GetSentimate, you agree that:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>You must own or have explicit permission to analyze the videos you submit to the platform.</li>
                            <li>You are responsible for maintaining the confidentiality of your account and login credentials.</li>
                            <li>You will not use the service for any illegal or unauthorized purpose.</li>
                            <li>You will not attempt to scrape, reverse engineer, or disrupt the service.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Payments and Credits</h2>
                        <p>
                            GetSentimate uses a credit-based system for analysis. Payments made for credits are final and generally non-refundable, except as required by law. Pricing and credit allocations are subject to change with notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Limitation of Liability</h2>
                        <p>
                            GetSentimate provides the service on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee the accuracy of AI-generated insights. In no event shall GetSentimate or its creators be liable for any damages arising out of the use or inability to use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Suspension and Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties (including abuse of the YouTube API).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Governing Law</h2>
                        <p>
                            These terms are governed by and construed in accordance with the laws of <strong>India</strong>. You irrevocably submit to the exclusive jurisdiction of the courts in that location.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">8. Contact Information</h2>
                        <p>
                            If you have any questions regarding these Terms of Service, please contact us at:
                        </p>
                        <p className="mt-4 font-medium text-neutral-900">
                            Email: <a href="mailto:vaidiksule@gmail.com" className="text-blue-600">vaidiksule@gmail.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
