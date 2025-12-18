import { AlertCircle, Info, AlertTriangle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownCalloutProps {
  type?: "info" | "warning" | "error"
  children: string
  isPdfMode?: boolean
}

export function MarkdownCallout({ type = "info", children, isPdfMode = false }: MarkdownCalloutProps) {
  const styles = isPdfMode
    ? {
        info: {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: Info,
          iconColor: "text-blue-600",
        },
        warning: {
          bg: "bg-amber-50",
          border: "border-amber-200",
          icon: AlertTriangle,
          iconColor: "text-amber-600",
        },
        error: {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: AlertCircle,
          iconColor: "text-red-600",
        },
      }
    : {
        info: {
          bg: "bg-info/10",
          border: "border-info/30",
          icon: Info,
          iconColor: "text-info",
        },
        warning: {
          bg: "bg-warning/10",
          border: "border-warning/30",
          icon: AlertTriangle,
          iconColor: "text-warning",
        },
        error: {
          bg: "bg-destructive/10",
          border: "border-destructive/30",
          icon: AlertCircle,
          iconColor: "text-destructive",
        },
      }

  const style = styles[type]
  const Icon = style.icon
  const textColor = isPdfMode ? "text-gray-700" : "text-muted-foreground"

  return (
    <div className={cn("my-4 p-4 rounded-lg border flex gap-3", style.bg, style.border)}>
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", style.iconColor)} />
      <div className={cn("text-sm flex-1", textColor)}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
      </div>
    </div>
  )
}
