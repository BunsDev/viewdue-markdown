"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MarkdownCarouselProps {
  images?: string[]
  isPdfMode?: boolean
}

export function MarkdownCarousel({ images = [], isPdfMode = false }: MarkdownCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const placeholderImages =
    images.length > 0
      ? images
      : [
          "/placeholder.svg?height=300&width=600",
          "/placeholder.svg?height=300&width=600",
          "/placeholder.svg?height=300&width=600",
        ]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? placeholderImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === placeholderImages.length - 1 ? 0 : prev + 1))
  }

  if (isPdfMode) {
    return (
      <div className="my-4 space-y-2">
        {placeholderImages.map((img, index) => (
          <div key={index} className="rounded-lg overflow-hidden border border-gray-200">
            <img src={img || "/placeholder.svg"} alt={`Image ${index + 1}`} className="w-full h-auto object-cover" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="my-4 relative rounded-lg overflow-hidden bg-secondary">
      <div className="aspect-video relative">
        <img
          src={placeholderImages[currentIndex] || "/placeholder.svg"}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {placeholderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-primary" : "bg-foreground/30",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
