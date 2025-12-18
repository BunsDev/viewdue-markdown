"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Link, ImageIcon, Video, MonitorPlay, X } from "lucide-react";

interface UrlInputModalProps {
  type: "image" | "video" | "link" | "iframe";
  onSubmit: (url: string) => void;
  onClose: () => void;
}

const CONFIG = {
  image: {
    icon: ImageIcon,
    title: "Add Image",
    placeholder: "https://example.com/image.png",
    hint: "Supports JPG, PNG, GIF, WebP, SVG",
  },
  video: {
    icon: Video,
    title: "Add Video",
    placeholder: "https://youtube.com/watch?v=...",
    hint: "Supports YouTube and Vimeo",
  },
  link: {
    icon: Link,
    title: "Add Link Preview",
    placeholder: "https://example.com/article",
    hint: "Rich preview with title and description",
  },
  iframe: {
    icon: MonitorPlay,
    title: "Embed Website",
    placeholder: "https://example.com",
    hint: "Some websites may block embedding",
  },
};

export function UrlInputModal({ type, onSubmit, onClose }: UrlInputModalProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const config = CONFIG[type];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (url.trim()) {
        let finalUrl = url.trim();
        if (
          !finalUrl.startsWith("http://") &&
          !finalUrl.startsWith("https://")
        ) {
          finalUrl = "https://" + finalUrl;
        }
        onSubmit(finalUrl);
      }
    },
    [url, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <config.icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{config.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <p className="text-xs text-muted-foreground">{config.hint}</p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
