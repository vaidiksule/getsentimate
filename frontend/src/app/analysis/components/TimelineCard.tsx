"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  raw: any;
}

export function TimelineCard({ raw }: Props) {
  const timeline = raw?.analysis?.ai_insights?.timeline;

  if (!Array.isArray(timeline) || timeline.length === 0) {
    return (
      <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-neutral-500">
          No timeline provided by backend.
        </CardContent>
      </Card>
    );
  }

  const data = timeline.map((p: any) => ({
    ts: p.ts ?? p.timestamp ?? "",
    value: typeof p.value === "number" ? p.value : 0,
  }));

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="h-40 text-xs text-neutral-700">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <XAxis dataKey="ts" hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0A84FF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
