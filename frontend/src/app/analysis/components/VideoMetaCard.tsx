"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedVideoMeta } from "@/lib/parsers";

interface Props {
  video?: ParsedVideoMeta;
}

export function VideoMetaCard({ video }: Props) {
  if (!video) {
    return (
      <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-sm font-semibold text-neutral-900">Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
          No video metadata returned — see raw response.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
        <div className="flex gap-4">
          <div className="relative aspect-video w-48 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-50">
            {video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title ?? "Video thumbnail"}
                fill
                className="object-cover"
                sizes="(max-width: 192px) 100vw, 192px"
              />
            ) : null}
          </div>
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2">
                {video.title ?? "Untitled video"}
              </CardTitle>
              <p className="text-[10px] text-neutral-600">{video.channelTitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ["Published", video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "–"],
                ["Duration", video.duration ?? "–"],
                ["Views", video.viewCount?.toLocaleString() ?? "–"],
                ["Likes", video.likeCount?.toLocaleString() ?? "–"]
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>
                  <span className="text-xs font-medium text-neutral-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
