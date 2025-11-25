import type { ReactNode } from "react";

export const metadata = {
  title: "GetSentimate – YouTube Comments Analyzer",
  description: "Paste a YouTube URL and get instant, AI-powered insights on your audience.",
};

export default function AnalysisLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl py-8 xl:px-32">
      {children}
    </div>
  );
}
