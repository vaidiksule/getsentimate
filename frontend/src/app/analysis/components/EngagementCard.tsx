"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedEngagementMetrics } from "@/lib/parsers";
import { TrendingUp, MessageSquare, Heart, Users, BarChart3, Target } from "lucide-react";

interface Props {
  engagement?: ParsedEngagementMetrics;
}

export function EngagementCard({ engagement }: Props) {
  if (!engagement) {
    return (
      <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="text-sm font-semibold text-neutral-900">Engagement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
          No engagement metrics returned.
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 0.6) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getEngagementLevelColor = (level: string) => {
    if (level === "high") return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (level === "medium") return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const metrics = [
    {
      icon: <Target className="h-4 w-4" />,
      label: "Overall score",
      value: engagement.overallScore != null ? engagement.overallScore.toFixed(2) : "–",
      description: "Combined engagement performance",
      color: engagement.overallScore != null ? getScoreColor(engagement.overallScore) : "text-neutral-600 bg-neutral-50 border-neutral-200"
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Engagement level",
      value: engagement.engagementLevel ?? "–",
      description: "Audience interaction intensity",
      color: engagement.engagementLevel ? getEngagementLevelColor(engagement.engagementLevel) : "text-neutral-600 bg-neutral-50 border-neutral-200"
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "Avg. comment length",
      value: engagement.averageCommentLength?.toFixed(1) ?? "–",
      description: "Characters per comment",
      color: "text-blue-600 bg-blue-50 border-blue-200"
    },
    {
      icon: <Heart className="h-4 w-4" />,
      label: "Avg. likes",
      value: engagement.averageLikes?.toFixed(1) ?? "–",
      description: "Likes per comment",
      color: "text-pink-600 bg-pink-50 border-pink-200"
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Unique authors",
      value: engagement.uniqueAuthors?.toString() ?? "–",
      description: "Different commenters",
      color: "text-purple-600 bg-purple-50 border-purple-200"
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Author diversity",
      value: engagement.authorDiversity?.toFixed(2) ?? "–",
      description: "Comment distribution",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200"
    }
  ];

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Engagement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-100">
                <div className="text-neutral-600">
                  {metric.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-neutral-600">{metric.label}</div>
                <div className="text-lg font-bold text-neutral-900">{metric.value}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Key Insight Section */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl p-3 border border-blue-100/50">
            <div className="text-[10px] font-medium text-blue-700 mb-1">Key Insight</div>
            <div className="text-[10px] text-blue-600">
              {engagement.overallScore && engagement.overallScore >= 0.8
                ? "Excellent engagement! Your audience is highly active and invested in your content."
                : engagement.overallScore && engagement.overallScore >= 0.6
                ? "Good engagement levels. Consider experimenting with different content types to boost interaction."
                : "Lower engagement detected. Try asking questions or creating more interactive content to increase participation."}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
