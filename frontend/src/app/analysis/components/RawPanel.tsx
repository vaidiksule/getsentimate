"use client";

import { useState } from "react";
import { FileText, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RawPanelProps {
  rawBody: string;
  errorMessage?: string | null;
}

export function RawPanel({ rawBody, errorMessage }: RawPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawBody ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy raw response", err);
    }
  };

  return (
    <Card className="mt-4 rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <FileText className="h-4 w-4 text-neutral-400" />
          <CardTitle className="text-sm font-semibold text-neutral-900">Raw response / logs</CardTitle>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copied" : "Copy"}
        </button>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-neutral-700">
        {errorMessage && (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {errorMessage}
          </p>
        )}
        <pre className="max-h-64 overflow-auto rounded-2xl bg-neutral-50 p-3 text-[11px] leading-relaxed text-neutral-800">
{rawBody || "(empty response body)"}
        </pre>
      </CardContent>
    </Card>
  );
}
