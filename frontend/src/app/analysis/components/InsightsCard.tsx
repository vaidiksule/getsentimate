"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ParsedActionPriority } from "@/lib/parsers";
import { getCardClasses, getTitleClasses, getBodyClasses, tokens } from "./design-tokens";

interface Props {
  priorities: ParsedActionPriority[];
  recommendations?: string | null;
}

export function InsightsCard({ priorities, recommendations }: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const parseRecommendations = (text: string) => {
    if (!text) return [];
    
    const items = [];
    
    // Split by numbered items first - look for patterns like "1. **Title:**"
    const sections = text.split(/\n(?=\d+\.\s*\*\*)/);
    
    for (const section of sections) {
      const trimmedSection = section.trim();
      if (!trimmedSection) continue;
      
      // Extract number, title and description - handle multi-line descriptions
      const lines = trimmedSection.split('\n');
      const firstLine = lines[0];
      
      // Match pattern like "1. **Title:** Description..."
      const match = firstLine.match(/^(\d+)\.\s*\*\*([^*]+)\*\*:\s*(.+)$/);
      
      if (match) {
        // Get description from remaining lines (everything after the first line)
        const descriptionLines = lines.slice(1).filter(line => line.trim());
        const description = descriptionLines.join(' ').trim();
        
        items.push({
          number: match[1],
          title: match[2],
          description: (description || match[3] || '').replace(/\*\*/g, '').trim()
        });
      } else {
        // Fallback: try to extract any numbered item
        const fallbackMatch = trimmedSection.match(/^(\d+)\.\s*(.+)$/);
        if (fallbackMatch) {
          const titlePart = fallbackMatch[2].split(':')[0];
          const description = lines.slice(1).join(' ').trim() || fallbackMatch[2].split(':').slice(1).join(':').trim();
          
          items.push({
            number: fallbackMatch[1],
            title: titlePart.replace(/\*\*/g, '').trim(),
            description: description.replace(/\*\*/g, '').trim()
          });
        }
      }
    }
    
    return items;
  };

  const parsedItems = parseRecommendations(recommendations || '');

  return (
    <Card className="rounded-3xl border border-neutral-200/50 bg-white/95 shadow-lg overflow-hidden backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-neutral-700 to-neutral-900 px-6 pt-4 pb-3">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/20 to-neutral-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%)]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-white/90 animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-white/60 animate-ping"></div>
            </div>
            <div className="h-px bg-gradient-to-r from-white/60 to-transparent w-12"></div>
            <span className="text-white/90 text-xs font-medium uppercase tracking-wider">AI Analysis</span>
          </div>
          
          <CardTitle className="text-lg font-bold text-white mb-2 leading-tight max-w-md">
            Actionable Insights
          </CardTitle>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
      <CardContent className="space-y-3 px-6 py-4 pb-6 text-[11px] leading-relaxed text-neutral-700">
        {priorities.length === 0 && !recommendations && (
          <p className="text-neutral-400">No actionable insights returned by backend.</p>
        )}
        {priorities.length > 0 && (
          <ul className={`${tokens.spacing.sectionGap}`}>
            {priorities.map((p, idx) => (
              <li key={idx} className={`${tokens.spacing.itemGap} rounded-xl bg-neutral-50/80 px-3 py-3 border border-neutral-100/50`}>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-medium text-neutral-900">{p.action}</span>
                  {p.priority && (
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
                      {p.priority}
                    </span>
                  )}
                  {p.impact && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                      Impact: {p.impact}
                    </span>
                  )}
                  {p.effort && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                      Effort: {p.effort}
                    </span>
                  )}
                </div>
                {p.reasoning && <p className="text-[11px] leading-relaxed text-neutral-600">{p.reasoning}</p>}
              </li>
            ))}
          </ul>
        )}
        {parsedItems.length > 0 && (
          <div className={`${tokens.spacing.sectionGap}`}>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
              {parsedItems.map((item, idx) => {
                const isExpanded = expandedItems.has(idx);
                const hasDescription = item.description && item.description.length > 0;
                
                return (
                  <div
                    key={idx}
                    className={`group rounded-xl border transition-all duration-300 ${
                      isExpanded 
                        ? ' bg-gradient-to-r from-blue-50/50 to-purple-50/30 shadow-sm' 
                        : 'border-neutral-200/60 bg-white hover:border-neutral-300/80'
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(idx)}
                      className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                    >
                      <div className="flex flex-row items-center gap-3">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isExpanded 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm scale-110' 
                            : 'bg-neutral-100 text-neutral-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          <span className="text-[11px] font-bold">{item.number}</span>
                        </div>
                        {hasDescription && (
                          <div className={`text-blue-500 transition-all duration-300 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}>
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                        <h4 className={`font-bold transition-all duration-200 ${
                          isExpanded 
                            ? 'text-neutral-800 text-[12px]' 
                            : 'text-neutral-900 text-[11px]'
                        } leading-tight`}>
                          {item.title}
                        </h4>
                        
                        {!hasDescription && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
                            <p className="text-neutral-500 text-[10px] italic">
                              Quick recommendation
                            </p>
                          </div>
                        )}
                        
                      </div>
                    </div>
                    </button>
                    
                    {/* Enhanced Collapsible Description */}
                    {hasDescription && (
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-out ${
                          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="border-t border-blue-100 pt-4">
                            <div className="bg-white/80 rounded-xl p-4 border border-blue-100/50">
                              <p className="text-neutral-700 text-[10px] leading-relaxed">
                                {item.description}
                              </p>
                              
                              {item.description.length > 150 && (
                                <div className="mt-3 pt-3 border-t border-neutral-100">
                                  <span className="text-[9px] text-neutral-500">
                                    💡 This recommendation contains detailed implementation steps
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
