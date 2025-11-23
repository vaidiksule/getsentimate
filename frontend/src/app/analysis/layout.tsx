import "../globals.css";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "GetSentimate – YouTube Comments Analyzer",
  description: "Paste a YouTube URL and get instant, AI-powered insights on your audience.",
};

export default function AnalysisLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col bg-white text-neutral-900">
          <Header />
          <main className="flex-1 bg-gradient-to-b from-white to-neutral-50/80 px-6 sm:px-8 lg:px-24 xl:px-32">
            <div className="mx-auto max-w-7xl py-8 xl:px-32">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
