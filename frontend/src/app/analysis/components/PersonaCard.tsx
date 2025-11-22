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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-900">Persona</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-neutral-700">
        {personas.length === 0 && <p className="text-neutral-400">No persona analysis returned by backend.</p>}
        {personas.map((p) => (
          <div key={p.persona} className="space-y-1 rounded-2xl bg-neutral-50 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="font-medium text-neutral-900">{p.persona}</div>
              {p.percentage != null && (
                <Badge className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
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
