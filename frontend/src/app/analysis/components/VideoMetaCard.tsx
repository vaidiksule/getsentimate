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
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">Video</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-neutral-500">
          No video metadata returned — see raw response.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex items-stretch gap-4 rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <div className="relative m-4 aspect-video w-48 overflow-hidden rounded-2xl bg-neutral-100">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title ?? "Video thumbnail"}
            fill
            className="object-cover"
          />
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col justify-center gap-3 px-4 py-4 pr-6 text-xs text-neutral-700">
        <div>
          <CardTitle className="mb-1 text-sm font-semibold text-neutral-900 line-clamp-2">
            {video.title ?? "Untitled video"}
          </CardTitle>
          <p className="text-[11px] text-neutral-500">{video.channelTitle}</p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-600">
          <span>
            <span className="font-medium">Published:</span> {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "–"}
          </span>
          <span>
            <span className="font-medium">Duration:</span> {video.duration ?? "–"}
          </span>
          <span>
            <span className="font-medium">Views:</span> {video.viewCount?.toLocaleString() ?? "–"}
          </span>
          <span>
            <span className="font-medium">Likes:</span> {video.likeCount?.toLocaleString() ?? "–"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
