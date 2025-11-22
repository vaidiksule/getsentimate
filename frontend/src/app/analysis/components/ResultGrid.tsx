"use client";

import { Badge } from "@/components/ui/badge";
import type { ParsedAnalysis } from "@/lib/parsers";
import { VideoMetaCard } from "./VideoMetaCard";
import { SentimentCard } from "./SentimentCard";
import { TopicsCard } from "./TopicsCard";
import { EngagementCard } from "./EngagementCard";
import { PerformanceCard } from "./PerformanceCard";
import { PersonaCard } from "./PersonaCard";
import { InsightsCard } from "./InsightsCard";
import { TopicMatrixCard } from "./TopicMatrixCard";
import { TimelineCard } from "./TimelineCard";
import { CommentsSampleCard } from "./CommentsSampleCard";

export interface ParsedSentiment {
  score?: number;
  label?: string;
  positive_ratio?: number;
  neutral_ratio?: number;
  negative_ratio?: number;
}

export interface ParsedResultView {}

interface ResultGridProps {
  parsed: ParsedAnalysis;
  completedAt?: string | null;
}

export function ResultGrid({ parsed, completedAt }: ResultGridProps) {
  if (!parsed) return null;

  const { sentiment, analysisId } = parsed;

  const shareUrl =
    typeof window !== "undefined" && analysisId
      ? `${window.location.origin}/analysis?analysis_id=${encodeURIComponent(analysisId)}`
      : null;

  return (
    <section aria-live="polite" className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-neutral-900">Analysis results</h2>
          {completedAt && (
            <p className="text-xs text-neutral-500">Completed at {new Date(completedAt).toLocaleString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sentiment && (
            <Badge className="flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white">
              <span>Sentiment:</span>
              <span className="font-semibold">{sentiment.label ?? "unknown"}</span>
              {typeof sentiment.score === "number" && (
                <span className="opacity-80">({sentiment.score.toFixed(2)})</span>
              )}
            </Badge>
          )}
          {shareUrl && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(shareUrl).catch(() => {})}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] text-neutral-600 hover:bg-neutral-50"
            >
              Copy permalink
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <VideoMetaCard video={parsed.video} />
        <SentimentCard sentiment={parsed.sentiment} ratios={parsed.sentimentRatios} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopicsCard topics={parsed.topics} />
        <EngagementCard engagement={parsed.engagement} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PerformanceCard performance={parsed.performance} />
        <PersonaCard personas={parsed.personas} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InsightsCard priorities={parsed.actionPriorities} recommendations={parsed.contentRecommendations} />
        <TopicMatrixCard matrix={parsed.topicMatrix} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TimelineCard raw={parsed.raw} />
        <CommentsSampleCard comments={parsed.comments} />
      </div>
    </section>
  );
}
