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
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Sentiment</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
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
