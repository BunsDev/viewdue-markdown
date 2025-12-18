"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownAccordionProps {
  title: string
  children: string
  isPdfMode?: boolean
}

export function MarkdownAccordion({ title, children, isPdfMode = false }: MarkdownAccordionProps) {
  const [isOpen, setIsOpen] = useState(isPdfMode ? true : false)

  const borderColor = isPdfMode ? "border-gray-200" : "border-border"
  const bgColor = isPdfMode ? "bg-gray-100" : "bg-secondary/50"
  const hoverBg = isPdfMode ? "hover:bg-gray-200" : "hover:bg-secondary"
  const titleColor = isPdfMode ? "text-gray-900" : "text-foreground"
  const contentColor = isPdfMode ? "text-gray-600" : "text-muted-foreground"
  const iconColor = isPdfMode ? "text-gray-500" : "text-muted-foreground"

  return (
    <div className={cn("my-4 border rounded-lg overflow-hidden", borderColor)}>
      <button
        onClick={() => !isPdfMode && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors text-left",
          bgColor,
          !isPdfMode && hoverBg,
        )}
        disabled={isPdfMode}
      >
        <span className={cn("font-medium", titleColor)}>{title}</span>
        {!isPdfMode && (
          <ChevronDown className={cn("h-5 w-5 transition-transform", iconColor, isOpen && "rotate-180")} />
        )}
      </button>
      <div className={cn("overflow-hidden transition-all", isOpen ? "max-h-[500px]" : "max-h-0")}>
        <div className={cn("p-4 text-sm", contentColor)}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
