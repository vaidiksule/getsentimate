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
    shown = [...comments].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, 5);
  }

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">Comments sample</CardTitle>
        <div className="inline-flex rounded-full bg-neutral-100 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-2 py-0.5 ${
              filter === "all" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("top")}
            className={`rounded-full px-2 py-0.5 ${
              filter === "top" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
            }`}
          >
            Top liked
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-neutral-700">
        {shown.length === 0 && <p className="text-neutral-400">No comments sample returned.</p>}
        {shown.map((c, idx) => (
          <div key={idx} className="space-y-0.5 rounded-2xl bg-neutral-50 px-3 py-2">
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>{c.authorName ?? "Unknown"}</span>
              <span>
                {c.likeCount ?? 0} likes · {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : ""}
              </span>
            </div>
            <p className="text-[12px] text-neutral-800">{c.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
