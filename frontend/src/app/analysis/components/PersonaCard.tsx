"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParsedPersona } from "@/lib/parsers";

interface Props {
  personas: ParsedPersona[];
}

export function PersonaCard({ personas }: Props) {
  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white/90 shadow-sm">
      <CardHeader className="pb-3 px-6 pt-6">
        <CardTitle className="text-sm font-semibold text-neutral-900">Persona</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6 text-[11px] leading-relaxed text-neutral-700">
        {personas.length === 0 && <p className="text-neutral-400">No persona analysis returned by backend.</p>}
        {personas.map((p) => (
          <div key={p.persona} className="gap-2 rounded-xl bg-neutral-50/80 px-3 py-2 border border-neutral-100/50">
            <div className="flex items-center justify-between">
              <div className="font-medium text-neutral-900">{p.persona}</div>
              {p.percentage != null && (
                <Badge className="rounded-full bg-blue-500 text-white text-[10px] px-2 py-0.5 font-medium">
                  {p.percentage}%
                </Badge>
              )}
            </div>
            {p.characteristics && p.characteristics.length > 0 && (
              <p className="text-[11px] text-neutral-600">
                <span className="font-medium">Traits:</span> {p.characteristics.join(", ")}
              </p>
            )}
            {p.caresAbout && p.caresAbout.length > 0 && (
              <p className="text-[11px] text-neutral-600">
                <span className="font-medium">Cares about:</span> {p.caresAbout.join(", ")}
              </p>
            )}
            {p.exampleComments && p.exampleComments.length > 0 && (
              <p className="text-[11px] text-neutral-600">
                <span className="font-medium">Example comments:</span> {p.exampleComments.join(" · ")}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
