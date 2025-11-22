"use client";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card className="mt-6 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/80 shadow-none">
      <CardContent className="py-10 text-center text-sm text-neutral-500">
        Paste a YouTube URL above and run an analysis to see sentiment, topics, personas, and more.
      </CardContent>
    </Card>
  );
}
