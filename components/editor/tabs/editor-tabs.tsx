"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Globe,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditorTab {
  id: string;
  type: "iframe";
  title: string;
  url: string;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function EditorTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
}: EditorTabsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleRefresh = useCallback((tabId: string) => {
    const iframe = iframeRefs.current.get(tabId);
    if (iframe) {
      setIsLoading(tabId);
      iframe.src = iframe.src;
    }
  }, []);

  if (tabs.length === 0) return null;

  return (
    <div
      className={cn(
        "border-b border-border bg-background",
        isFullscreen && "fixed inset-0 z-50 flex flex-col"
      )}
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-secondary/30 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-sm transition-colors cursor-pointer group",
              activeTabId === tab.id
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            onClick={() => onTabSelect(tab.id)}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[150px]">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="p-0.5 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Tab content */}
      {activeTab && (
        <div className={cn("relative", isFullscreen ? "flex-1" : "h-[400px]")}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 border-b border-border">
            <button
              onClick={() => handleRefresh(activeTab.id)}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isLoading === activeTab.id && "animate-spin"
                )}
              />
            </button>

            <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-background rounded-md border border-border">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 text-xs text-foreground truncate">
                {activeTab.url}
              </span>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              onClick={() => window.open(activeTab.url, "_blank")}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onTabClose(activeTab.id)}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Iframe */}
          <div
            className={cn(
              "relative",
              isFullscreen ? "h-[calc(100%-44px)]" : "h-[calc(100%-44px)]"
            )}
          >
            {isLoading === activeTab.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {tabs.map((tab) => (
              <iframe
                key={tab.id}
                ref={(el) => {
                  if (el) iframeRefs.current.set(tab.id, el);
                }}
                src={tab.url}
                title={tab.title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                className={cn(
                  "w-full h-full border-0 bg-white",
                  tab.id !== activeTabId && "hidden"
                )}
                onLoad={() => setIsLoading(null)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
