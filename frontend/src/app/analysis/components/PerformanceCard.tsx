"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedPerformanceScore } from "@/lib/parsers";

interface Props {
  performance?: ParsedPerformanceScore;
}

export function PerformanceCard({ performance }: Props) {
  if (!performance) {
    return (
      <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">Performance</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-neutral-500">No performance score returned.</CardContent>
      </Card>
    );
  }

  const entries = Object.entries(performance.subScores);

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-neutral-700">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-neutral-900">
            {performance.overallScore != null ? performance.overallScore.toFixed(0) : "–"}
          </span>
          <span className="text-[11px] text-neutral-500">overall score</span>
          {performance.grade && (
            <span className="ml-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
              {performance.grade}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-[11px]">
              <span className="w-24 capitalize text-neutral-500">{key.replace(/_/g, " ")}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-[#0A84FF]"
                  style={{ width: `${Math.min(100, value)}%` }}
                />
              </div>
              <span className="w-8 text-right text-neutral-700">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
