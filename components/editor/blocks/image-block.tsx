"use client"

import { useState, memo } from "react"
import { ImageIcon, Maximize2, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageBlockProps {
  url?: string
  alt?: string
  onUrlChange: (url: string) => void
  onRemove: () => void
  className?: string
}

function ImageBlockInner({ url, alt, onUrlChange, onRemove, className }: ImageBlockProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [inputUrl, setInputUrl] = useState("")

  // Placeholder state
  if (!url) {
    return (
      <div className={cn(
        "border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all",
        className
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-secondary/50">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Add an image</p>
            <p className="text-sm text-muted-foreground">Paste URL and press Enter</p>
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full max-w-sm px-4 py-2.5 rounded-lg bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputUrl) {
                onUrlChange(inputUrl)
                setInputUrl("")
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, GIF, WebP, SVG
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("relative group rounded-lg overflow-hidden", className)}>
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex items-center justify-center h-48 bg-secondary rounded-lg">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            </div>
          </div>
        )}

        {/* Image */}
        {!hasError && (
          <img
            src={url}
            alt={alt || ""}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
            onClick={() => setShowFullscreen(true)}
          />
        )}

        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowFullscreen(true)}
            className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white transition-colors"
            title="View fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
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

      {/* Fullscreen modal */}
      {showFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-zoom-out"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={url}
            alt={alt || ""}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export const ImageBlock = memo(ImageBlockInner)
