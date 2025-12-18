"use client";

import { useState, memo, useCallback } from "react";
import { Video, Play, Maximize2, ExternalLink, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoBlockProps {
  url?: string;
  onUrlChange: (url: string) => void;
  onRemove: () => void;
  onOpenInTab: (url: string, title: string) => void;
  className?: string;
}

// Detect video type and extract ID
function detectVideoType(
  url: string
): { type: string; id?: string; thumbnail?: string } | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch) {
    return {
      type: "youtube",
      id: ytMatch[1],
      thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: "vimeo", id: vimeoMatch[1] };
  }

  return null;
}

// Get embed URL
function getEmbedUrl(type: string, id: string): string {
  switch (type) {
    case "youtube":
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
    case "vimeo":
      return `https://player.vimeo.com/video/${id}?byline=0&portrait=0`;
    default:
      return "";
  }
}

function VideoBlockInner({
  url,
  onUrlChange,
  onRemove,
  onOpenInTab,
  className,
}: VideoBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const videoInfo = url ? detectVideoType(url) : null;
  const embedUrl = videoInfo ? getEmbedUrl(videoInfo.type, videoInfo.id!) : "";

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsLoading(true);
  }, []);

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
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Add video</p>
            <p className="text-sm text-muted-foreground">
              Paste YouTube or Vimeo URL
            </p>
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full max-w-md px-4 py-2.5 rounded-lg bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputUrl) {
                onUrlChange(inputUrl);
                setInputUrl("");
              }
            }}
          />
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded bg-red-500 flex items-center justify-center">
                <Play className="h-2 w-2 text-white" />
              </div>
              <span>YouTube</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center">
                <Play className="h-2 w-2 text-white" />
              </div>
              <span>Vimeo</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid URL
  if (!videoInfo) {
    return (
      <div
        className={cn(
          "border border-border rounded-lg p-4 bg-secondary/20",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{url}</p>
            <p className="text-xs text-muted-foreground">
              Unsupported video format
            </p>
          </div>
          <button
            onClick={() => window.open(url, "_blank")}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group rounded-lg overflow-hidden bg-black",
        className
      )}
    >
      {/* Thumbnail with play button (lazy loading) */}
      {!isPlaying && videoInfo.thumbnail && (
        <div
          className="relative aspect-video cursor-pointer"
          onClick={handlePlay}
        >
          <img
            src={videoInfo.thumbnail}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
            onError={() => setIsPlaying(true)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="h-7 w-7 ml-1" />
            </div>
          </div>

          {/* Platform badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div
              className={cn(
                "px-2 py-1 rounded text-xs font-medium text-white",
                videoInfo.type === "youtube" ? "bg-red-500" : "bg-blue-500"
              )}
            >
              {videoInfo.type === "youtube" ? "YouTube" : "Vimeo"}
            </div>
          </div>
        </div>
      )}

      {/* Iframe (shown when playing or no thumbnail) */}
      {(isPlaying || !videoInfo.thumbnail) && (
        <div className="aspect-video">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onOpenInTab(url, `Video - ${videoInfo.type}`)}
          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
          title="Open in tab"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => window.open(url, "_blank")}
          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-md bg-black/60 hover:bg-red-500 text-white transition-colors"
          title="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export const VideoBlock = memo(VideoBlockInner);
