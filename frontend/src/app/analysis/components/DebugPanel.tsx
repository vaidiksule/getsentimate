"use client";

import { Card, CardContent } from "@/components/ui/card";

interface DebugPanelProps {
  showRaw: boolean;
  setShowRaw: (v: boolean) => void;
  forceParseError: boolean;
  setForceParseError: (v: boolean) => void;
  body: string;
}

export function DebugPanel({ showRaw, setShowRaw, forceParseError, setForceParseError, body }: DebugPanelProps) {
  const handleDownload = () => {
    try {
      const blob = new Blob([body || ""], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "analysis.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download JSON", err);
    }
  };

  return (
    <Card className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/80 text-[11px] text-neutral-600">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="font-medium text-neutral-700">Debug tools</div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={showRaw}
              onChange={(e) => setShowRaw(e.target.checked)}
              className="h-3 w-3 rounded border-neutral-300 text-[#0A84FF]"
            />
            <span>Show Raw panel</span>
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={forceParseError}
              onChange={(e) => setForceParseError(e.target.checked)}
              className="h-3 w-3 rounded border-neutral-300 text-[#0A84FF]"
            />
            <span>Force parse error (mock only)</span>
          </label>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] text-neutral-600 hover:bg-neutral-100"
            aria-label="Download last JSON response"
          >
            Download JSON
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
