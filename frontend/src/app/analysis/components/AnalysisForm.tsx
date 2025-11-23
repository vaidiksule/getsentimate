"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, Search, Brain, MessageSquare, TrendingUp, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UrlFormValues } from "@/lib/validators";

interface AnalysisFormProps {
  onSubmit: (values: UrlFormValues, options?: { mockMode?: boolean }) => Promise<void>;
  isMutating: boolean;
  mockMode: boolean;
  setMockMode: (value: boolean) => void;
}

const analysisSteps = [
  { id: 1, icon: Brain, label: "Fetching video data", duration: 2000 },
  { id: 2, icon: MessageSquare, label: "Analyzing comments", duration: 30000 },
  { id: 3, icon: TrendingUp, label: "Processing sentiment", duration: 25000 },
  { id: 4, icon: BarChart, label: "Generating insights", duration: 20000 },
  { id: 5, icon: Loader2, label: "Finalizing analysis", duration: 13000 },
];

function AnalysisAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep < analysisSteps.length) {
      const stepDuration = analysisSteps[currentStep].duration;
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (currentStep < analysisSteps.length - 1) {
              setCurrentStep(currentStep + 1);
              return 0;
            }
            return 100;
          }
          return prev + (100 / (stepDuration / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full space-y-4"
    >
      {/* Progress bar */}
      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#0A84FF] to-[#0b7aed] rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / analysisSteps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Current step display */}
      <div className="flex items-center justify-center space-x-3">
        <div className="relative">
          <motion.div
            key={currentStep}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#0A84FF]/10 to-[#0b7aed]/10 rounded-full border-2 border-[#0A84FF]/30"
          >
            {(() => {
              const IconComponent = analysisSteps[currentStep].icon;
              return IconComponent === Loader2 ? (
                <Loader2 className="w-6 h-6 text-[#0A84FF] animate-spin" />
              ) : (
                <IconComponent className="w-6 h-6 text-[#0A84FF]" />
              );
            })()}
          </motion.div>
          
          {/* Pulsing rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#0A84FF]/30"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        
        <div className="flex-1">
          <motion.p
            key={analysisSteps[currentStep].label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-neutral-700"
          >
            {analysisSteps[currentStep].label}
          </motion.p>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex-1 bg-neutral-200 rounded-full h-1 overflow-hidden">
              <motion.div
                className="h-full bg-[#0A84FF] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="text-xs text-neutral-500 w-10 text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center space-x-2">
        {analysisSteps.map((step, index) => (
          <motion.div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              index <= currentStep ? "bg-[#0A84FF]" : "bg-neutral-300"
            }`}
            animate={{
              scale: index === currentStep ? 1.2 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Estimated time */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-neutral-500"
      >
        This usually takes about 90 seconds...
      </motion.p>
    </motion.div>
  );
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
          {/* <p className="text-[11px] text-neutral-500">
            We send your URL to <code className="rounded-full bg-neutral-100 px-2 py-0.5">POST /api/analysis/url/</code> on
            <code className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5">http://localhost:8000</code> and display whatever comes back.
          </p> */}
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

      {/* Analysis Animation - shown when analyzing */}
      {disabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-md backdrop-blur-sm"
        >
          <AnalysisAnimation />
        </motion.div>
      )}
    </motion.div>
  );
}
