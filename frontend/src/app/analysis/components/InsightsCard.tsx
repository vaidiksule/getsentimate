"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedActionPriority } from "@/lib/parsers";

interface Props {
  priorities: ParsedActionPriority[];
  recommendations?: string | null;
}

export function InsightsCard({ priorities, recommendations }: Props) {
  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Actionable insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6 text-xs leading-relaxed text-neutral-700">
        {priorities.length === 0 && !recommendations && (
          <p className="text-neutral-400">No actionable insights returned by backend.</p>
        )}
        {priorities.length > 0 && (
          <ul className="space-y-3">
            {priorities.map((p, idx) => (
              <li key={idx} className="space-y-2 rounded-2xl bg-neutral-50 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-medium text-neutral-900">{p.action}</span>
                  {p.priority && (
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
                      {p.priority}
                    </span>
                  )}
                  {p.impact && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                      Impact: {p.impact}
                    </span>
                  )}
                  {p.effort && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                      Effort: {p.effort}
                    </span>
                  )}
                </div>
                {p.reasoning && <p className="text-[11px] leading-relaxed text-neutral-600">{p.reasoning}</p>}
              </li>
            ))}
          </ul>
        )}
        {recommendations && (
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl bg-neutral-50 px-3 py-3 text-[11px] leading-relaxed text-neutral-700">
            {recommendations.split(/\n\n+/).map((block, idx) => (
              <p key={idx}>{block}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
