"use client";

import React from "react";
import { Z10BrandIntro } from "./Z10BrandIntro";
import { X3BrandIntro } from "./X3BrandIntro";
import { ProRBrandIntro } from "./ProRBrandIntro";

interface SxsBrandIntroProps {
  brand: string;
  onComplete: () => void;
}

export function SxsBrandIntro({ brand, onComplete }: SxsBrandIntroProps) {
  const normalized = brand.toLowerCase().trim();

  if (normalized === "cfmoto" || normalized === "z10") {
    return <Z10BrandIntro onComplete={onComplete} />;
  }

  if (normalized === "can-am" || normalized === "canam" || normalized === "x3") {
    return <X3BrandIntro onComplete={onComplete} />;
  }

  if (normalized === "polaris" || normalized === "pror" || normalized === "rzr") {
    return <ProRBrandIntro onComplete={onComplete} />;
  }

  return null;
}
