import React from "react";

export const metadata = {
    title: "Privacy Policy | GetSentimate",
    description: "Privacy Policy for GetSentimate - YouTube Comments Analyzer",
};

export default function PrivacyPolicyPage() {
    const lastUpdated = "December 27, 2024";

    return (
        <div className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">Privacy Policy</h1>
                <p className="text-neutral-500 mb-12">Last updated: {lastUpdated}</p>

                <div className="prose prose-neutral max-w-none space-y-12 text-neutral-700">
                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Introduction</h2>
                        <p>
                            Welcome to <strong>GetSentimate</strong>. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. Information We Collect</h2>
                        <p>When you use GetSentimate, we collect the following information:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong>Google Account Information:</strong> Your email address and public profile name (provided via Google OAuth).</li>
                            <li><strong>YouTube Data:</strong> Public comments from the YouTube videos you analyze. This data is accessed via the YouTube Data API.</li>
                            <li><strong>Usage Data:</strong> Information about how you interact with our service to help us improve user experience.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. Purpose of Data Usage</h2>
                        <p>We use the collected data for the following purposes:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong>Authentication:</strong> We use Google OAuth solely to verify your identity and manage your account.</li>
                            <li><strong>Sentiment Analysis:</strong> To provide AI-powered insights and sentiment analysis on YouTube comments.</li>
                            <li><strong>Creator Analytics:</strong> To help creators understand their audience engagement and feedback.</li>
                            <li><strong>Service Improvement:</strong> To monitor and analyze trends and improve our platform's functionality.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Data Storage and Security</h2>
                        <p>
                            Your data is stored securely using industry-standard encryption and security protocols. We do not sell or share your personal information with third parties for marketing purposes. We only share data when required by law or to provide the core services of our platform (e.g., using AI models for analysis).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Google API Disclosure</h2>
                        <p>
                            GetSentimate&apos;s use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google API Service User Data Policy</a>, including the Limited Use requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Your Rights</h2>
                        <p>
                            You have the right to access the personal data we hold about you and request its deletion. If you wish to delete your account and associated data, please contact us at the email provided below.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy or our data practices, please contact us at:
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
