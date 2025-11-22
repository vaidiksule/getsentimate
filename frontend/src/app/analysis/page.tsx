"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import useSWRMutation from "swr/mutation";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { postUrlAnalysis } from "@/lib/api";
import { urlSchema, type UrlFormValues } from "@/lib/validators";
import { parseAnalysis, type ParsedAnalysis } from "@/lib/parsers";
import { AnalysisForm } from "./components/AnalysisForm";
import { ResultGrid } from "./components/ResultGrid";
import { RawPanel } from "./components/RawPanel";
import { EmptyState } from "./components/EmptyState";
import { DebugPanel } from "./components/DebugPanel";
import mockResponse from "../../../../mock-response.json" assert { type: "json" };

interface ErrorInfo {
  type: 'network' | 'http' | 'parse';
  status?: number;
  message: string;
}

async function mutateAnalysis(_key: string, { arg }: { arg: string }) {
  // arg = URL string
  return postUrlAnalysis(arg);
}

export default function AnalysisPage() {
  const [rawBody, setRawBody] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedAnalysis | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [showRaw, setShowRaw] = useState(true);
  const [forceParseError, setForceParseError] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
    },
    mode: "onSubmit",
  });

  const { trigger, isMutating } = useSWRMutation("url-analysis", mutateAnalysis);

  const onSubmit = async (values: UrlFormValues, options?: { mockMode?: boolean }) => {
    setErrorInfo(null);
    setParsed(null);
    setRawBody("");
    setCompletedAt(null);

    const useMock = options?.mockMode;

    let body = "";
    let status = 200;

    try {
      if (useMock) {
        // Use the full mock-response.json shape for mock mode.
        body = JSON.stringify(mockResponse);
      } else {
        const res = await trigger(values.url);
        status = res.status;
        body = res.data;
      }

      // Developer tool: deliberately corrupt JSON in mock mode to exercise parse-error UI.
      if (useMock && forceParseError) {
        body = body.slice(0, Math.max(1, body.length / 2));
      }
    } catch (err) {
      console.error('Network error:', err);
      setErrorInfo({
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
      });
      return;
    }

    setRawBody(body);

    if (status < 200 || status >= 300) {
      setErrorInfo({
        type: 'http',
        status,
        message: `Backend returned HTTP ${status}`,
      });
      return;
    }

    // Try to parse JSON defensively using shared parser
    try {
      const json = JSON.parse(body || '{}');
      const parsedAnalysis = parseAnalysis(json);
      setParsed(parsedAnalysis);

      const backendCompletedAt: string | undefined =
        json.analysis?.ai_insights?.analysis_timestamp ??
        json.analysis_timestamp ??
        undefined;

      setCompletedAt(
        backendCompletedAt
          ? new Date(backendCompletedAt).toLocaleString()
          : new Date().toLocaleString(),
      );
    } catch (err) {
      console.error('JSON parse error:', err);
      setErrorInfo({
        type: 'parse',
        message:
          "Analysis failed: backend returned malformed JSON (parse error). Common errors: Expecting ',' delimiter, Expecting value. Check server logs and raw response below.",
      });
    }
  };

  const hasResults = !!parsed;

  return (
    <FormProvider {...form}>
      <div className="space-y-5">
        <AnalysisForm onSubmit={onSubmit} isMutating={isMutating} mockMode={mockMode} setMockMode={setMockMode} />
        <DebugPanel
          showRaw={showRaw}
          setShowRaw={setShowRaw}
          forceParseError={forceParseError}
          setForceParseError={setForceParseError}
          body={rawBody}
        />
        {/* Error banner */}
        <AnimatePresence>
          {errorInfo && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mx-auto max-w-3xl"
            >
              <Alert variant="destructive" className="border-red-500/60 bg-red-950/60">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-sm font-semibold">
                  {errorInfo.type === 'network'
                    ? 'Network error'
                    : errorInfo.type === 'http'
                    ? 'Backend error'
                    : 'Parse error from backend'}
                </AlertTitle>
                <AlertDescription className="text-xs text-red-100/90">
                  {errorInfo.message}
                  {errorInfo.status && (
                    <span className="ml-1">
                      (status <code>{errorInfo.status}</code>)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="space-y-4">
          <AnimatePresence>
            {isMutating && !hasResults && !errorInfo && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid gap-4 md:grid-cols-3"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-3xl border border-neutral-200 bg-white/80"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {hasResults && parsed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <ResultGrid parsed={parsed} completedAt={completedAt} />
              {showRaw && (
                <RawPanel
                  rawBody={rawBody}
                  // For malformed JSON we already set a parse-type error with a detailed message.
                  errorMessage={errorInfo?.type === 'parse' ? errorInfo.message : undefined}
                />
              )}
            </motion.div>
          )}

          {!hasResults && !errorInfo && !isMutating && <EmptyState />}
        </div>
      </div>
    </FormProvider>
  );
}

