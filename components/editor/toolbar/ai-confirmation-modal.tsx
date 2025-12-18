"use client";

import { useCallback } from "react";
import { X, Check, Copy, ArrowRight } from "lucide-react";

interface AIConfirmationModalProps {
  originalText: string;
  suggestedText: string;
  actionLabel: string;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function AIConfirmationModal({
  originalText,
  suggestedText,
  actionLabel,
  onAccept,
  onReject,
  onClose,
}: AIConfirmationModalProps) {
  const handleCopy = useCallback(async () => {
    await (navigator as any).clipboard.writeText(suggestedText);
    onAccept();
  }, [suggestedText, onAccept]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-popover border border-border rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium text-foreground capitalize">
              {actionLabel.replace(/-/g, " ")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Original text */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Original
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 text-sm text-foreground/80 whitespace-pre-wrap max-h-[150px] overflow-y-auto">
              {originalText}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Suggested text */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Suggestion
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {suggestedText}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            The text will be copied to your clipboard
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy & Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
