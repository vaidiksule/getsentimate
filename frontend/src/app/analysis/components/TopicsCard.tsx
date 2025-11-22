"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParsedTopic } from "@/lib/parsers";
import { TopicBarChart } from "./Charts/TopicBarChart";

interface Props {
  topics: ParsedTopic[];
}

export function TopicsCard({ topics }: Props) {
  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">Topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-neutral-700">
        {topics.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {topics.map((t, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="rounded-full border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
              >
                {t.topic}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-neutral-400">No topics returned by backend — try re-running or check server logs.</p>
        )}

        <TopicBarChart mainTopics={topics.map((t) => ({ topic: t.topic, frequency: t.frequency }))} />
      </CardContent>
    </Card>
  );
}
