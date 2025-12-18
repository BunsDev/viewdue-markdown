"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaBlockWrapperProps {
  blockId: string;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for media blocks (images, videos, iframes, links, etc.)
 * that provides insertion points before and after the block.
 * This allows users to add text content around media blocks.
 *
 * Uses CSS-only hover to avoid pointer-events blocking text selection.
 */
function MediaBlockWrapperInner({
  blockId,
  onInsertBefore,
  onInsertAfter,
  children,
  className,
}: MediaBlockWrapperProps) {
  return (
    <div className={cn("relative group/media-wrapper py-1", className)}>
      {/* Insert before zone - clickable area above media */}
      <div
        className="absolute -top-1 left-0 right-0 h-6 z-10 opacity-0 group-hover/media-wrapper:opacity-100 transition-opacity pointer-events-none group-hover/media-wrapper:pointer-events-auto flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onInsertBefore();
        }}
      >
        <button className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 rounded transition-colors">
          <Plus className="h-3 w-3" />
          <span>Add above</span>
        </button>
      </div>

      {/* Media content */}
      <div className="relative">{children}</div>

      {/* Insert after zone - clickable area below media */}
      <div
        className="absolute -bottom-1 left-0 right-0 h-6 z-10 opacity-0 group-hover/media-wrapper:opacity-100 transition-opacity pointer-events-none group-hover/media-wrapper:pointer-events-auto flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onInsertAfter();
        }}
      >
        <button className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 rounded transition-colors">
          <Plus className="h-3 w-3" />
          <span>Add below</span>
        </button>
      </div>
    </div>
  );
}

export const MediaBlockWrapper = memo(MediaBlockWrapperInner);
