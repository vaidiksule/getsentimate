import "./globals.css";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "GetSentimate – YouTube Comments Analyzer",
  description: "Paste a YouTube URL and get instant, AI-powered insights on your audience.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col bg-white text-neutral-900">
          <Header />
          <main className="flex-1 bg-gradient-to-b from-white to-neutral-50/80">
            <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
