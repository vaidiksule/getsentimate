"use client";

import { ThumbsUp, ThumbsDown, Heart, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserFeedbackCardProps {
  whatUsersLike: string[];
  whatUsersDislike: string[];
}

export function UserFeedbackCard({ whatUsersLike, whatUsersDislike }: UserFeedbackCardProps) {
  const hasLikes = whatUsersLike && whatUsersLike.length > 0;
  const hasDislikes = whatUsersDislike && whatUsersDislike.length > 0;

  if (!hasLikes && !hasDislikes) {
    return null;
  }

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">User Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">

      <div className="grid gap-6 md:grid-cols-2">
        {hasLikes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200/50">
                <ThumbsUp className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-900">What Users Love</h4>
                <p className="text-xs text-neutral-500">Positive feedback highlights</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {whatUsersLike.map((item, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 transition-all duration-300 hover:border-neutral-300/60 hover:shadow-sm"
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200/50">
                    {index === 0 && <Heart className="h-3 w-3 text-neutral-600" />}
                    {index === 1 && <TrendingUp className="h-3 w-3 text-neutral-600" />}
                    {index >= 2 && <ThumbsUp className="h-3 w-3 text-neutral-600" />}
                  </div>
                  
                  <p className="flex-1 text-xs text-neutral-700 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasDislikes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200/50">
                <ThumbsDown className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-900">Areas for Improvement</h4>
                <p className="text-xs text-neutral-500">Concerns and criticism</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {whatUsersDislike.map((item, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 transition-all duration-300 hover:border-neutral-300/60 hover:shadow-sm"
                >
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200/50">
                    {index === 0 && <AlertTriangle className="h-3 w-3 text-neutral-600" />}
                    {index === 1 && <AlertTriangle className="h-3 w-3 text-neutral-600" />}
                    {index >= 2 && <ThumbsDown className="h-3 w-3 text-neutral-600" />}
                  </div>
                  
                  <p className="flex-1 text-xs text-neutral-700 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-200/60">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-neutral-500" />
                {whatUsersLike?.length || 0} positive point{whatUsersLike?.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 text-neutral-500" />
                {whatUsersDislike?.length || 0} concern{whatUsersDislike?.length !== 1 ? 's' : ''}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Based on comment analysis
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
