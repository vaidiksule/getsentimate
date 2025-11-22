"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UrlFormValues } from "@/lib/validators";

interface AnalysisFormProps {
  onSubmit: (values: UrlFormValues, options?: { mockMode?: boolean }) => Promise<void>;
  isMutating: boolean;
  mockMode: boolean;
  setMockMode: (value: boolean) => void;
}

export function AnalysisForm({ onSubmit, isMutating, mockMode, setMockMode }: AnalysisFormProps) {
  const form = useFormContext<UrlFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: UrlFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(values, { mockMode });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = isMutating || submitting;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-md backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3"
      >
        <div className="flex-1 space-y-2">
          <label htmlFor="url" className="text-xs font-medium text-neutral-600">
            YouTube URL
          </label>
          <Input
            id="url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=jCtrR8oLehA"
            className="h-11 rounded-full border-neutral-200 bg-white px-4 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
            autoComplete="off"
            {...form.register("url")}
            disabled={disabled}
          />
          {form.formState.errors.url && (
            <p className="text-xs text-red-500">{form.formState.errors.url.message}</p>
          )}
          <p className="text-[11px] text-neutral-500">
            We send your URL to <code className="rounded-full bg-neutral-100 px-2 py-0.5">POST /api/analysis/url/</code> on
            <code className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5">http://localhost:8000</code> and display whatever comes back.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:w-56">
          <Button
            type="submit"
            size="lg"
            disabled={disabled}
            className="h-11 w-full rounded-full bg-[#0A84FF] text-sm font-semibold text-white shadow-md transition hover:bg-[#0b7aed] focus-visible:ring-2 focus-visible:ring-[#0A84FF]/70"
          >
            {disabled ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze URL
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => setMockMode(!mockMode)}
            className="flex h-9 items-center justify-between rounded-full border border-neutral-200 bg-neutral-50 px-3 text-[11px] text-neutral-600 transition hover:bg-neutral-100"
          >
            <span>Mock mode</span>
            <span
              className={`inline-flex h-5 w-9 items-center rounded-full border ${
                mockMode ? "border-[#0A84FF]/70 bg-[#0A84FF]/10" : "border-neutral-300 bg-white"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  mockMode ? "translate-x-4 bg-[#0A84FF]" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
