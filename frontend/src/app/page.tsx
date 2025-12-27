"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { CTASection } from "@/components/landing/CTASection";
import { AuthGuard } from "@/components/AuthGuard";
import { redirectToGoogleLogin } from "@/lib/auth";

export default function HomePage() {
	return (
		<AuthGuard requireAuth={false}>
			<div className="flex flex-col max-w-5xl mx-auto w-full">
				{/* Hero Section */}
				<section className="flex flex-col items-center justify-center pt-20 pb-4 xl:px-32">
					<div className="mx-auto max-w-5xl text-center w-full">
						<span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
							GetSentimate · YouTube comments intelligence
						</span>
						<h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
							Understand your audience in <span className="text-[#0A84FF]">one paste</span>.
						</h1>
						<p className="mt-4 text-balance text-sm text-neutral-600 sm:text-base">
							Paste a YouTube URL and get instant, AI-powered insights about sentiment, topics, personas, and actionable suggestions from your comments.
						</p>
						<div className="mt-6 flex flex-col items-center justify-center gap-3 w-full max-w-sm mx-auto">
							<Button
								onClick={redirectToGoogleLogin}
								size="lg"
								className="w-full gap-2 rounded-full bg-[#0A84FF] px-6 text-sm font-semibold text-white shadow-md hover:bg-[#0b7aed]"
							>
								<PlayCircle className="h-5 w-5" />
								Sign in with Google
							</Button>


							<Link
								href="/analysis"
								className="mt-4 inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
							>
								Try it in under 30 seconds
								<ArrowRight className="ml-1 h-4 w-4" />
							</Link>
						</div>
					</div>
				</section>

				{/* Testimonials Section */}
				<TestimonialsSection />

				{/* Features Section */}
				<FeaturesSection />

				{/* How It Works Section */}
				<HowItWorksSection />

				{/* Stats Section */}
				<StatsSection />

				{/* Benefits Section */}
				<BenefitsSection />

				{/* CTA Section */}
				<CTASection />
			</div>
		</AuthGuard>
	);
}
