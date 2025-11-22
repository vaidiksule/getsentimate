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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">Sentiment</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 text-xs text-neutral-700">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">Overall</div>
          <div className="text-sm font-semibold text-neutral-900">
            {label.toUpperCase()} {typeof score === "number" && <span className="text-neutral-500">({score.toFixed(2)})</span>}
          </div>
          <p className="max-w-xs text-[11px] text-neutral-600">
            Based on the analyzed comments, the audience skews {label || "mixed"}. Ratios below represent
            positive, neutral, and negative comments.
          </p>
        </div>
        <SentimentDonut
          score={score}
          positive={ratios?.positive}
          neutral={ratios?.neutral}
          negative={ratios?.negative}
        />
      </CardContent>
    </Card>
  );
}
