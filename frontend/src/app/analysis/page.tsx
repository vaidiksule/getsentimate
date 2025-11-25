"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import useSWRMutation from "swr/mutation";
import { AlertTriangle, User as UserIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { postUrlAnalysis } from "@/lib/api";
import { urlSchema, type UrlFormValues } from "@/lib/validators";
import { parseAnalysis, type ParsedAnalysis } from "@/lib/parsers";
import AnalysisForm from "./components/AnalysisForm";
import { ResultGrid } from "./components/ResultGrid";
import { RawPanel } from "./components/RawPanel";
import { EmptyState } from "./components/EmptyState";
import { DebugPanel } from "./components/DebugPanel";
import { AuthGuard } from "@/components/AuthGuard";
import { checkAuth, type User } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits";

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
  const [showRaw, setShowRaw] = useState(true);
  const [forceParseError, setForceParseError] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
    },
    mode: "onSubmit",
  });

  const { trigger, isMutating } = useSWRMutation("url-analysis", mutateAnalysis);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user data and credits only after component is mounted
  useEffect(() => {
    if (!mounted) return;
    
    const loadData = async () => {
      try {
        const userData = await checkAuth();
        setUser(userData);
        
        if (userData) {
          try {
            const balance = await getCreditBalance();
            setCredits(balance);
          } catch (creditError) {
            console.error('Failed to load credit balance:', creditError);
            setCredits(0);
          }
        } else {
          setCredits(0);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        setCredits(0);
      }
    };
    
    loadData();
  }, [mounted]);

  const onSubmit = async (values: UrlFormValues) => {
    setErrorInfo(null);
    setParsed(null);
    setRawBody("");
    setCompletedAt(null);

    let body = "";
    let status = 200;

    try {
      const res = await trigger(values.url);
      status = res.status;
      body = res.data;
      
      // Update credits after successful analysis (backend returns new balance)
      if (status === 200 && body) {
        try {
          const parsedBody = JSON.parse(body);
          if (parsedBody.credits_remaining !== undefined) {
            setCredits(parsedBody.credits_remaining);
          }
        } catch (parseError) {
          // If parsing fails, we'll handle it in the main parse logic below
          console.warn('Failed to parse credits from response:', parseError);
        }
      }
    } catch (err) {
      console.error('Network error:', err);
      
      // Check if it's a credit-related error
      if (err instanceof Error && err.message.includes('Insufficient credits')) {
        setErrorInfo({
          type: 'http',
          status: 402,
          message: 'Insufficient credits. You need at least 1 credit to run an analysis.',
        });
      } else {
        setErrorInfo({
          type: 'network',
          message: 'Network error. Please check your connection and try again.',
        });
      }
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

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <AuthGuard requireAuth={true} redirectTo="/">
      <div className="space-y-5 w-full">
        {/* Header with user info */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0A84FF] flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-neutral-900">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-neutral-600">{user?.email || 'Loading...'}</p>
            </div>
            <div className="ml-4 px-3 py-1 bg-[#0A84FF]/10 border border-[#0A84FF]/20 rounded-full">
              <p className="text-sm font-medium text-[#0A84FF]">{credits ?? '...'} credits</p>
            </div>
          </div>
        </div>

        <FormProvider {...form}>
          <AnalysisForm 
            onSubmit={onSubmit} 
            isMutating={isMutating} 
            credits={credits}
          />
        </FormProvider>
        
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
    </AuthGuard>
  );
}

