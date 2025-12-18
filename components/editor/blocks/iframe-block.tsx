"use client";

import { useState, useRef, useCallback, memo } from "react";
import {
  MonitorPlay,
  Globe,
  RefreshCw,
  Maximize2,
  ExternalLink,
  X,
  Loader2,
  GripVertical,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IframeBlockProps {
  url?: string;
  height?: number;
  onUrlChange: (url: string) => void;
  onHeightChange: (height: number) => void;
  onRemove: () => void;
  onOpenInTab: (url: string, title: string) => void;
  className?: string;
}

function IframeBlockInner({
  url,
  height = 400,
  onUrlChange,
  onHeightChange,
  onRemove,
  onOpenInTab,
  className,
}: IframeBlockProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState(url || "");
  const [currentHeight, setCurrentHeight] = useState(height);
  const [interactive, setInteractive] = useState(true);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (inputUrl) {
        let finalUrl = inputUrl;
        if (
          !inputUrl.startsWith("http://") &&
          !inputUrl.startsWith("https://")
        ) {
          finalUrl = "https://" + inputUrl;
        }
        onUrlChange(finalUrl);
        setIsLoading(true);
        setError(null);
      }
    },
    [inputUrl, onUrlChange]
  );

  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setCurrentHeight(newHeight);
      onHeightChange(newHeight);
    },
    [onHeightChange]
  );

  // Placeholder state
  if (!url) {
    return (
      <div
        className={cn(
          "border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all",
          className
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-secondary/50">
            <MonitorPlay className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Embed a website</p>
            <p className="text-sm text-muted-foreground">
              Enter URL and press Enter
            </p>
          </div>
          <form onSubmit={handleSubmit} className="w-full max-w-md flex gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Embed
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            Note: Some websites may block embedding
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden border border-border",
        className
      )}
    >
      {/* Browser chrome header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border-b border-border">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
          </button>
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-background rounded-md border border-border">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-1 text-xs bg-transparent outline-none text-foreground"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setInteractive(!interactive)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              interactive
                ? "bg-primary/10 text-primary"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
            title={interactive ? "Disable interaction" : "Enable interaction"}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onOpenInTab(url, url)}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Open in tab"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => window.open(url, "_blank")}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Iframe container */}
      <div className="relative bg-white" style={{ height: currentHeight }}>
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => window.open(url, "_blank")}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
            >
              Open in new tab
            </button>
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src={url}
          title={url}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className={cn(
            "w-full h-full border-0",
            !interactive && "pointer-events-none"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Failed to load. This site may block embedding.");
          }}
        />

        {/* Interaction blocker */}
        {!interactive && (
          <div
            className="absolute inset-0 bg-transparent cursor-not-allowed"
            title="Click to enable interaction"
            onClick={() => setInteractive(true)}
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 bg-border/50 hover:bg-primary/30 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startHeight = currentHeight;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientY - startY;
            const newHeight = Math.max(200, Math.min(800, startHeight + delta));
            setCurrentHeight(newHeight);
          };

          const handleMouseUp = () => {
            handleHeightChange(currentHeight);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
      >
        <GripVertical className="h-3 w-3 rotate-90 text-muted-foreground" />
      </div>

      {/* Height presets */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/90 border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        {[300, 400, 500, 600].map((h) => (
          <button
            key={h}
            onClick={() => handleHeightChange(h)}
            className={cn(
              "px-2 py-0.5 rounded text-xs transition-colors",
              currentHeight === h
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary text-muted-foreground"
            )}
          >
            {h}px
          </button>
        ))}
      </div>
    </div>
  );
}

export const IframeBlock = memo(IframeBlockInner);
