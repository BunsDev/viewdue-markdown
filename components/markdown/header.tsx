import type React from "react";
import { cn } from "@/lib/utils";

interface MarkdownHeaderProps {
  level?: number;
  children: string;
  isPdfMode?: boolean;
}

export function MarkdownHeader({
  level = 1,
  children,
  isPdfMode = false,
}: MarkdownHeaderProps) {
  const Tag = `h${Math.min(
    Math.max(level, 1),
    6
  )}` as keyof React.JSX.IntrinsicElements;

  const textColor = isPdfMode ? "text-gray-900" : "text-foreground";
  const borderPrimary = isPdfMode ? "border-blue-500" : "border-primary";
  const borderDefault = isPdfMode ? "border-gray-200" : "border-border";

  const styles = {
    1: `text-4xl font-bold border-b-2 ${borderPrimary} pb-3`,
    2: `text-3xl font-bold border-b ${borderDefault} pb-2`,
    3: "text-2xl font-semibold",
    4: "text-xl font-semibold",
    5: "text-lg font-medium",
    6: "text-base font-medium",
  };

  return (
    <Tag
      className={cn(
        "my-6",
        textColor,
        styles[level as keyof typeof styles] || styles[1]
      )}
    >
      {children}
    </Tag>
  );
}
