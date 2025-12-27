"use client";

import Link from "next/link";
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
			<div className="flex flex-col max-w-7xl mx-auto w-full px-6">
				{/* Hero Section */}
				<section className="flex flex-col items-center justify-center pt-20 pb-16">
					<div className="max-w-4xl text-center">
						<span className="label-micro inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-sm">
							GetSentimate · Intelligence for Creators
						</span>
						<h1 className="mt-8 text-title-hero md:text-hero-product font-bold tracking-tight text-black leading-tight">
							Understand your audience in <span className="underline decoration-green-primary decoration-4">one paste</span>.
						</h1>
						<p className="mt-6 text-emphasis text-gray-500 max-w-2xl mx-auto font-medium">
							The precision comment analysis tool. Paste any YouTube URL and transform chatter into actionable growth insights instantly.
						</p>
						<div className="mt-10 flex flex-col items-center justify-center gap-6 w-full max-w-md mx-auto">
							<button
								onClick={redirectToGoogleLogin}
								className="btn-primary w-full py-4 text-body flex items-center justify-center gap-3"
							>
								<PlayCircle className="h-5 w-5" />
								Sign in with Google
							</button>

							<Link
								href="/analysis"
								className="inline-flex items-center text-secondary font-bold text-gray-600 hover:text-black transition-all"
							>
								Try analysis in under 30 seconds
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</div>
					</div>
				</section>

				{/* Sections */}
				<div className="space-y-24 pb-24">
					<TestimonialsSection />
					<FeaturesSection />
					<HowItWorksSection />
					<StatsSection />
					<BenefitsSection />
					<CTASection />
				</div>
			</div>
		</AuthGuard>
	);
}
