"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  credits: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  recommended?: boolean;
  isYearly?: boolean;
}

export function PricingCard({
  name,
  price,
  description,
  credits,
  features,
  buttonText,
  buttonVariant,
  recommended = false,
  isYearly = false,
}: PricingCardProps) {
  return (
    <Card
      className={`relative overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-sm shadow-md transition-all hover:shadow-lg ${
        recommended ? "border-[#0A84FF]/20 ring-2 ring-[#0A84FF]/10" : "border-neutral-200"
      }`}
    >
      {recommended && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#0A84FF] to-[#0b7aed] text-white text-xs font-medium px-3 py-1 rounded-bl-xl">
          Recommended
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-semibold text-neutral-900">{name}</CardTitle>
        <CardDescription className="text-sm text-neutral-600">{description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-bold text-neutral-900">{price}</span>
            {isYearly && <span className="text-sm text-neutral-500 ml-1">/year</span>}
            {!isYearly && <span className="text-sm text-neutral-500 ml-1">/month</span>}
          </div>
          <p className="text-sm text-neutral-600 mt-1">{credits}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          variant={buttonVariant}
          className={`w-full h-11 rounded-full font-semibold ${
            buttonVariant === "default"
              ? "bg-[#0A84FF] text-white hover:bg-[#0b7aed]"
              : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
          }`}
        >
          {buttonText}
        </Button>

        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-[#0A84FF] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-neutral-700">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
