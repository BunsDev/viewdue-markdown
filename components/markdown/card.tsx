import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownCardProps {
  title?: string
  children: string
  isPdfMode?: boolean
}

export function MarkdownCard({ title, children, isPdfMode = false }: MarkdownCardProps) {
  const cardStyles = isPdfMode ? "my-4 bg-gray-50 border border-gray-200 rounded-lg" : "my-4 bg-card border-border"

  const titleStyles = isPdfMode ? "text-lg text-gray-900" : "text-lg text-foreground"
  const contentStyles = isPdfMode ? "text-sm text-gray-600" : "text-sm text-muted-foreground"

  return (
    <Card className={cardStyles}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className={titleStyles}>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : ""}>
        <div className={contentStyles}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  )
}
