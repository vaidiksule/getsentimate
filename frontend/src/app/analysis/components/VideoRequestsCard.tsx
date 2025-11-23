"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Lightbulb, TrendingUp } from "lucide-react";

interface VideoRequestsCardProps {
  videoRequests: string[];
}

export function VideoRequestsCard({ videoRequests }: VideoRequestsCardProps) {
  if (!videoRequests || videoRequests.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Video Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">

      <div className="space-y-3">
        {videoRequests.map((request, index) => (
          <div
            key={index}
            className="group flex items-start gap-3 rounded-xl border border-neutral-200/60 bg-gradient-to-r from-purple-50/50 to-pink-50/50 p-3 transition-all duration-300 hover:border-purple-300/60 hover:shadow-sm"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-300/50">
              {index === 0 && <TrendingUp className="h-4 w-4 text-purple-600" />}
              {index === 1 && <Lightbulb className="h-4 w-4 text-purple-600" />}
              {index >= 2 && <Video className="h-4 w-4 text-purple-600" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-700 leading-relaxed group-hover:text-neutral-900 transition-colors">
                {request}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100/80 text-purple-700 border border-purple-200/50">
                  Request #{index + 1}
                </span>
                {index === 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-purple-100/80 to-pink-100/80 text-purple-700 border border-purple-200/50">
                    Top Request
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

        {videoRequests.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200/60">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{videoRequests.length} video request{videoRequests.length !== 1 ? 's' : ''} found</span>
              <span className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Based on comment analysis
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
