"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  variant?: "vertical" | "horizontal" | "compact";
  valueClassName?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  icon,
  subtitle,
  variant = "vertical",
  valueClassName,
  className,
}: StatTileProps) {
  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "p-3 rounded-xl border bg-card flex flex-row justify-between items-center text-start",
          className,
        )}
      >
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className={cn("text-lg font-bold text-foreground", valueClassName)}>{value}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col gap-1 p-3 rounded-xl bg-card border", className)}>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className={cn("text-lg font-semibold text-foreground", valueClassName)}>{value}</span>
      </div>
    );
  }

  // default vertical layout
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-2 p-3.5 rounded-xl border bg-card hover:bg-bg-card/30 transition-colors text-center",
        className,
      )}
    >
      <div className="flex items-center justify-center flex-col gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1">
        <span className={cn("text-2xl font-bold text-foreground text-center", valueClassName)}>
          {value}
        </span>
        {subtitle}
      </div>
    </div>
  );
}
