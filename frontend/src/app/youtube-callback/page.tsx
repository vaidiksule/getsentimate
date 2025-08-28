'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import YouTubeCallbackContent from './YouTubeCallbackContent';

export default function YouTubeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
              <p className="text-muted-foreground">Preparing YouTube connection...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <YouTubeCallbackContent />
    </Suspense>
  );
}
