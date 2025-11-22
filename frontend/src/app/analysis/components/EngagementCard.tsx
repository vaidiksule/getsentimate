"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedEngagementMetrics } from "@/lib/parsers";

interface Props {
  engagement?: ParsedEngagementMetrics;
}

export function EngagementCard({ engagement }: Props) {
  if (!engagement) {
    return (
      <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">Engagement</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-neutral-500">No engagement metrics returned.</CardContent>
      </Card>
    );
  }

  const rows: [string, string][] = [
    ["Overall score", engagement.overallScore != null ? engagement.overallScore.toFixed(2) : "–"],
    ["Engagement level", engagement.engagementLevel ?? "–"],
    ["Avg. comment length", engagement.averageCommentLength?.toFixed(1) ?? "–"],
    ["Avg. likes", engagement.averageLikes?.toFixed(1) ?? "–"],
    ["Unique authors", engagement.uniqueAuthors?.toString() ?? "–"],
    ["Author diversity", engagement.authorDiversity?.toFixed(2) ?? "–"],
  ];

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">Engagement</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-700">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>
            <span className="font-medium text-neutral-900">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
