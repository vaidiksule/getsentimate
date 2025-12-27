"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { CTASection } from "@/components/landing/CTASection";
import { AuthGuard } from "@/components/AuthGuard";
import { redirectToGoogleLogin, tempLogin } from "@/lib/auth";
import { useState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function HomePage() {
	const [showEmailLogin, setShowEmailLogin] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleTempLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError("");
		const success = await tempLogin(email, password);
		if (success) {
			window.location.href = "/analysis";
		} else {
			setError("Invalid credentials or error occurred.");
			setIsSubmitting(false);
		}
	};

	return (
		<AuthGuard requireAuth={false}>
			<div className="flex flex-col max-w-5xl mx-auto w-full">
				{/* Hero Section */}
				<section className="flex flex-col items-center justify-center py-20 xl:px-32">
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

							{!showEmailLogin ? (
								<button
									onClick={() => setShowEmailLogin(true)}
									className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors underline underline-offset-4"
								>
									Sign in with Email & Password
								</button>
							) : (
								<form onSubmit={handleTempLogin} className="w-full space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
										<input
											type="email"
											placeholder="Email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
											required
										/>
									</div>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
										<input
											type="password"
											placeholder="Password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 transition-all"
											required
										/>
									</div>
									{error && <p className="text-[10px] text-red-500 text-center">{error}</p>}
									<Button
										type="submit"
										disabled={isSubmitting}
										className="w-full rounded-full bg-neutral-900 text-white text-xs font-semibold py-2 h-auto hover:bg-neutral-800 disabled:opacity-50"
									>
										{isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Sign In"}
									</Button>
									<button
										type="button"
										onClick={() => setShowEmailLogin(false)}
										className="w-full text-[10px] text-neutral-400 hover:text-neutral-600"
									>
										Cancel
									</button>
								</form>
							)}

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
