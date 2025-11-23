import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";
import { TestimonialSlider } from "./analysis/components/TestimonialSlider";

export default function HomePage() {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<div className="mx-auto max-w-2xl text-center">
				<span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-sm">
					GetSentimate · YouTube comments intelligence
				</span>
				<h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
					Understand your audience in <span className="text-[#0A84FF]">one paste</span>.
				</h1>
				<p className="mt-4 text-balance text-sm text-neutral-600 sm:text-base">
					Paste a YouTube URL and get instant, AI-powered insights about sentiment, topics, personas, and actionable suggestions from your comments.
				</p>
				<div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
					<Button
						asChild
						size="lg"
						className="gap-2 rounded-full bg-[#0A84FF] px-6 text-sm font-semibold text-white shadow-md hover:bg-[#0b7aed]"
					>
						<Link href="/analysis">
							<PlayCircle className="h-5 w-5" />
							Analyze a URL
						</Link>
					</Button>
					<Link
						href="/analysis"
						className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
					>
						Try it in under 30 seconds
						<ArrowRight className="ml-1 h-4 w-4" />
					</Link>
				</div>
			</div>
			<TestimonialSlider />
		</div>
	);
}
