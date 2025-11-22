"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface SentimentDonutProps {
  score?: number;
  positive?: number;
  neutral?: number;
  negative?: number;
}

export function SentimentDonut({ score, positive, neutral, negative }: SentimentDonutProps) {
  let p = positive;
  let n = neutral;
  let ne = negative;

  if (p == null || n == null || ne == null) {
    if (typeof score !== "number") {
      return null;
    }
    if (score > 0.6) {
      p = 0.7;
      n = 0.2;
      ne = 0.1;
    } else if (score < 0.4) {
      p = 0.1;
      n = 0.2;
      ne = 0.7;
    } else {
      p = 0.3;
      n = 0.4;
      ne = 0.3;
    }
  }

  const data = [
    { name: "Positive", value: p ?? 0 },
    { name: "Neutral", value: n ?? 0 },
    { name: "Negative", value: ne ?? 0 },
  ];

  const COLORS = ["#0A84FF", "#C7C7CC", "#FF3B30"];

  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3 text-[11px] text-neutral-600">
      <div className="h-32 w-32 md:h-40 md:w-40">
        <ResponsiveContainer width="100%" height="100%" minHeight={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={24}
              outerRadius={36}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, name: any) => [`${Math.round((value as number) * 100)}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1">
        <div className="font-medium text-neutral-800">Sentiment breakdown</div>
        <div className="space-y-0.5">
          <p>Positive: {Math.round((p ?? 0) * 100)}%</p>
          <p>Neutral: {Math.round((n ?? 0) * 100)}%</p>
          <p>Negative: {Math.round((ne ?? 0) * 100)}%</p>
        </div>
      </div>
    </div>
  );
}
