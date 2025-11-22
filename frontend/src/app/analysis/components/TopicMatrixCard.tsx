"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedTopicMatrixRow } from "@/lib/parsers";

interface Props {
  matrix: ParsedTopicMatrixRow[];
}

export function TopicMatrixCard({ matrix }: Props) {
  if (!matrix || matrix.length === 0) {
    return (
      <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">Topic sentiment matrix</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-neutral-500">
          No topic sentiment matrix returned by backend.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Topic sentiment matrix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
        {matrix.map((row) => {
          const pos = row.positive ?? 0;
          const neu = row.neutral ?? 0;
          const neg = row.negative ?? 0;
          const total = pos + neu + neg || 1;
          return (
            <div key={row.topic} className="space-y-1">
              <div className="flex justify-between text-neutral-600">
                <span>{row.topic}</span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full bg-[#0A84FF]"
                  style={{ width: `${(pos / total) * 100}%` }}
                />
                <div
                  className="h-full bg-neutral-300"
                  style={{ width: `${(neu / total) * 100}%` }}
                />
                <div
                  className="h-full bg-red-400"
                  style={{ width: `${(neg / total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
