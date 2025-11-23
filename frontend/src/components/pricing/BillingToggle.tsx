"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface BillingToggleProps {
  isYearly: boolean;
  onToggle: (value: boolean) => void;
}

export function BillingToggle({ isYearly, onToggle }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className={`text-sm font-medium ${!isYearly ? "text-neutral-900" : "text-neutral-500"}`}>
        Monthly
      </span>
      
      <Switch
        checked={isYearly}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-[#0A84FF]"
      />
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${isYearly ? "text-neutral-900" : "text-neutral-500"}`}>
          Yearly
        </span>
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          Save 30%
        </span>
      </div>
    </div>
  );
}
