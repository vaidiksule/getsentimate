"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedCommentSample } from "@/lib/parsers";

interface Props {
  comments: ParsedCommentSample[];
}

export function CommentsSampleCard({ comments }: Props) {
  const [filter, setFilter] = useState<"all" | "top">("all");

  let shown = comments;
  if (filter === "top") {
    shown = [...comments].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, 15);
  }

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Comments sample</CardTitle>
        <div className="inline-flex rounded-full bg-neutral-100/50 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-2 py-0.5 transition-colors duration-200 ${
              filter === "all" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("top")}
            className={`rounded-full px-2 py-0.5 transition-colors duration-200 ${
              filter === "top" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
            }`}
          >
            Top liked
          </button>
        </div>
      </CardHeader>
      <CardContent className="max-h-80 space-y-3 overflow-y-auto px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
        {shown.length === 0 && <p className="text-neutral-400">No comments sample returned.</p>}
        {shown.map((c, idx) => (
          <div key={idx} className="gap-2 rounded-xl bg-neutral-50/80 px-3 py-2 border border-neutral-100/50">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>{c.authorName ?? "Unknown"}</span>
              <span>
                {c.likeCount ?? 0} likes · {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : ""}
              </span>
            </div>
            <p className="text-xs text-neutral-800 mt-1">{c.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
