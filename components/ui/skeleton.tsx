import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("animate-pulse bg-gray-200 rounded", className)}
      style={style}
    />
  );
} 