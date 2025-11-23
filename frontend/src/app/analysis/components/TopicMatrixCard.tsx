"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedTopicMatrixRow } from "@/lib/parsers";

interface Props {
  matrix: ParsedTopicMatrixRow[];
}

export function TopicMatrixCard({ matrix }: Props) {
  if (!matrix || matrix.length === 0) {
    return (
      <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">Topic sentiment matrix</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-neutral-500">
          No topic sentiment matrix returned by backend.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Topic sentiment matrix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
        {matrix.map((row) => {
          const pos = row.positive ?? 0;
          const neu = row.neutral ?? 0;
          const neg = row.negative ?? 0;
          const total = pos + neu + neg || 1;

          const getSentimentDescription = (positive: number, neutral: number, negative: number) => {
            if (positive > neutral && positive > negative) {
              return "The sentiment is predominantly positive, indicating strong approval.";
            } else if (neutral > positive && neutral > negative) {
              return "The sentiment is mostly neutral, suggesting a balanced or indifferent view.";
            } else if (negative > positive && negative > neutral) {
              return "The sentiment is largely negative, highlighting areas for concern.";
            } else {
              return "The sentiment is mixed, with no single dominant emotion.";
            }
          };

          const getSentimentLabel = (positive: number, neutral: number, negative: number) => {
            if (positive > neutral && positive > negative) return "Positive";
            if (neutral > positive && neutral > negative) return "Neutral";
            if (negative > positive && negative > neutral) return "Negative";
            return "Mixed";
          };

          const getSentimentColor = (positive: number, neutral: number, negative: number) => {
            if (positive > neutral && positive > negative) return "text-emerald-600 bg-emerald-50 border-emerald-200";
            if (neutral > positive && neutral > negative) return "text-neutral-600 bg-neutral-50 border-neutral-200";
            if (negative > positive && negative > neutral) return "text-red-600 bg-red-50 border-red-200";
            return "text-amber-600 bg-amber-50 border-amber-200";
          };

          return (
            <div key={row.topic} className="space-y-3">
              <div className="flex justify-between items-center text-neutral-600">
                <span className="font-medium">{row.topic}</span>
                {/* <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#0A84FF]" />
                    {Math.round((pos / total) * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-neutral-300" />
                    {Math.round((neu / total) * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    {Math.round((neg / total) * 100)}%
                  </span>
                </div> */}
              </div>
              
              <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full bg-[#0A84FF] transition-all duration-500 ease-out"
                  style={{ width: `${(pos / total) * 100}%` }}
                />
                <div
                  className="h-full bg-neutral-300 transition-all duration-500 ease-out"
                  style={{ width: `${(neu / total) * 100}%` }}
                />
                <div
                  className="h-full bg-red-400 transition-all duration-500 ease-out"
                  style={{ width: `${(neg / total) * 100}%` }}
                />
              </div>

              {/* Sentiment Summary */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getSentimentColor(pos, neu, neg)}`}>
                  {getSentimentLabel(pos, neu, neg)} Sentiment
                </span>
                {/* <span className="text-[10px] text-neutral-500">
                  {Math.round((pos / total) * 100)}% positive, {Math.round((neu / total) * 100)}% neutral, {Math.round((neg / total) * 100)}% negative
                </span> */}
              </div>

              {/* Detailed Description */}
              <p className="text-[10px] text-neutral-600 leading-relaxed">
                {getSentimentDescription(pos, neu, neg)}
              </p>

              {/* Key Insights */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                  <div className="text-[11px] font-medium text-emerald-700">Positive</div>
                  <div className="text-[10px] text-emerald-600">{Math.round((pos / total) * 100)}%</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-neutral-50/50 border border-neutral-100/50">
                  <div className="text-[11px] font-medium text-neutral-700">Neutral</div>
                  <div className="text-[10px] text-neutral-600">{Math.round((neu / total) * 100)}%</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50/50 border border-red-100/50">
                  <div className="text-[11px] font-medium text-red-700">Negative</div>
                  <div className="text-[10px] text-red-600">{Math.round((neg / total) * 100)}%</div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Overall Summary */}
        {matrix.length === 1 && (
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl p-3 border border-blue-100/50">
              <div className="text-[10px] font-medium text-blue-700 mb-1">Key Insight</div>
              <div className="text-[10px] text-blue-600">
                This topic shows {matrix[0].positive && matrix[0].positive > 0.5 ? "strong positive engagement" : matrix[0].negative && matrix[0].negative > 0.5 ? "significant concerns" : "balanced reactions"} from your audience. 
                {matrix[0].positive && matrix[0].positive > 0.5 && " Continue creating similar content!"}
                {matrix[0].negative && matrix[0].negative > 0.5 && " Consider addressing the concerns raised."}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
