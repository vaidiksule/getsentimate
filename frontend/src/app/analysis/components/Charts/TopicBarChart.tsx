"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TopicBarChartProps {
  mainTopics: { topic?: string; frequency?: number; sentiment?: string }[];
}

export function TopicBarChart({ mainTopics }: TopicBarChartProps) {
  if (!Array.isArray(mainTopics) || mainTopics.length === 0) {
    return (
      <p className="text-[11px] text-neutral-400">
        No scores from backend — showing topic list only.
      </p>
    );
  }

  const data = mainTopics.map((t) => ({
    name: t.topic ?? "(unknown)",
    value: typeof t.frequency === "number" ? t.frequency : 1,
  }));

  return (
    <div className="mt-2 h-40 w-full rounded-2xl bg-neutral-50 px-3 py-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} stroke="#E5E5EA" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#8E8E93" }}
          />
          <Tooltip cursor={{ fill: "rgba(10,132,255,0.04)" }} />
          <Bar dataKey="value" radius={999} fill="#0A84FF" barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
