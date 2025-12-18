"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Link, ExternalLink, Maximize2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain: string;
}

interface LinkPreviewBlockProps {
  url?: string;
  onRemove: () => void;
  onOpenInTab: (url: string, title: string) => void;
  className?: string;
}

// Simple in-memory cache
const previewCache = new Map<string, LinkPreviewData>();

function LinkPreviewBlockInner({
  url,
  onRemove,
  onOpenInTab,
  className,
}: LinkPreviewBlockProps) {
  const [data, setData] = useState<LinkPreviewData | null>(() =>
    url ? previewCache.get(url) || null : null
  );
  const [loading, setLoading] = useState(() =>
    url ? !previewCache.has(url) : false
  );
  const [error, setError] = useState(false);
  const fetchedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) return;

    // Skip if already fetched or cached
    if (fetchedUrlRef.current === url || previewCache.has(url)) {
      if (previewCache.has(url)) {
        setData(previewCache.get(url)!);
        setLoading(false);
      }
      return;
    }

    fetchedUrlRef.current = url;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch("/api/link-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (res.ok) {
          const previewData = await res.json();
          previewCache.set(url, previewData);
          setData(previewData);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  // No URL state
  if (!url) {
    return (
      <div
        className={cn(
          "border border-border rounded-lg p-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        No URL provided
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-24 bg-card border border-border rounded-lg",
          className
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state - show simple link
  if (error || !data) {
    return (
      <div className={cn("group relative", className)}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-primary hover:bg-secondary transition-colors"
        >
          <Link className="h-4 w-4" />
          <span className="truncate">{url}</span>
          <ExternalLink className="h-3 w-3 ml-auto shrink-0" />
        </a>
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors",
        className
      )}
    >
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex">
        {/* Image preview */}
        {data.image && (
          <div className="w-48 h-32 shrink-0 bg-secondary">
            <img
              src={data.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {data.favicon && (
              <img src={data.favicon} alt="" className="w-4 h-4 rounded" />
            )}
            <span className="text-xs text-muted-foreground">{data.domain}</span>
          </div>
          <h4 className="font-medium text-foreground line-clamp-1 mb-1">
            {data.title}
          </h4>
          {data.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </a>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenInTab(url, data.title);
          }}
          className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Open in tab"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const LinkPreviewBlock = memo(LinkPreviewBlockInner);
