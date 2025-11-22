"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedSentiment } from "./ResultGrid";
import { SentimentDonut } from "./Charts/SentimentDonut";

interface Props {
  sentiment: ParsedSentiment | null | undefined;
  ratios?: { positive?: number; neutral?: number; negative?: number };
}

export function SentimentCard({ sentiment, ratios }: Props) {
  const score = sentiment?.score;
  const label = sentiment?.label ?? "unknown";

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Sentiment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-stretch gap-6 px-6 pb-6 text-xs text-neutral-700 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3 md:max-w-sm">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">Overall</div>
          <div className="text-sm font-semibold text-neutral-900">
            {label.toUpperCase()} {typeof score === "number" && <span className="text-neutral-500">({score.toFixed(2)})</span>}
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-600">
            Based on the analyzed comments, the audience skews {label || "mixed"}. Ratios on the right represent
            positive, neutral, and negative comments.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center md:justify-end">
          <SentimentDonut
            score={score}
            positive={ratios?.positive}
            neutral={ratios?.neutral}
            negative={ratios?.negative}
          />
        </div>
      </CardContent>
    </Card>
  );
}
