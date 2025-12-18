"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  GitBranch,
  Code,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MermaidBlockProps {
  diagram: string;
  onDiagramChange: (diagram: string) => void;
  onRemove: () => void;
  className?: string;
}

// Default diagram templates
const DIAGRAM_TEMPLATES = {
  flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[End]`,
  sequence: `sequenceDiagram
    Alice->>John: Hello John
    John-->>Alice: Hi Alice`,
  classDiagram: `classDiagram
    Animal <|-- Duck
    Animal : +int age
    Duck : +String beakColor`,
  stateDiagram: `stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> [*]`,
  erDiagram: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains`,
  gantt: `gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    section Section
    Task 1: a1, 2024-01-01, 30d
    Task 2: after a1, 20d`,
};

function MermaidBlockInner({
  diagram,
  onDiagramChange,
  onRemove,
  className,
}: MermaidBlockProps) {
  const [isEditing, setIsEditing] = useState(!diagram);
  const [localDiagram, setLocalDiagram] = useState(
    diagram || DIAGRAM_TEMPLATES.flowchart
  );
  const [svgOutput, setSvgOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mermaidRef = useRef<any>(null);

  // Initialize mermaid
  useEffect(() => {
    const initMermaid = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          fontFamily: "inherit",
        });
        mermaidRef.current = mermaid;
      } catch (err) {
        console.error("Failed to load mermaid:", err);
        setError("Failed to load diagram library");
      }
    };
    initMermaid();
  }, []);

  // Render diagram
  const renderDiagram = useCallback(async (code: string) => {
    if (!mermaidRef.current || !code.trim()) {
      setSvgOutput("");
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const id = `mermaid-${Date.now()}`;
      const { svg } = await mermaidRef.current.render(id, code);
      setSvgOutput(svg);
    } catch (err: any) {
      console.error("Mermaid render error:", err);
      setError(err?.message || "Invalid diagram syntax");
      setSvgOutput("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-render when diagram changes
  useEffect(() => {
    if (!isEditing && localDiagram) {
      renderDiagram(localDiagram);
    }
  }, [localDiagram, isEditing, renderDiagram]);

  // Handle save
  const handleSave = useCallback(() => {
    onDiagramChange(localDiagram);
    setIsEditing(false);
  }, [localDiagram, onDiagramChange]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(localDiagram);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [localDiagram]);

  // Placeholder / empty state
  if (!diagram && !isEditing) {
    return (
      <div
        className={cn(
          "border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all cursor-pointer",
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-secondary/50">
            <GitBranch className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Add a Mermaid diagram</p>
            <p className="text-sm text-muted-foreground">
              Flowcharts, sequences, and more
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {Object.keys(DIAGRAM_TEMPLATES).map((type) => (
              <button
                key={type}
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalDiagram(
                    DIAGRAM_TEMPLATES[type as keyof typeof DIAGRAM_TEMPLATES]
                  );
                  setIsEditing(true);
                }}
                className="px-2 py-1 rounded bg-secondary text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors capitalize"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative group rounded-lg border border-border overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Mermaid Diagram
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isEditing
                ? "bg-primary/10 text-primary"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
            title={isEditing ? "Preview" : "Edit"}
          >
            {isEditing ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Code className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {isEditing ? (
          <div className="flex flex-col">
            <textarea
              ref={textareaRef}
              value={localDiagram}
              onChange={(e) => setLocalDiagram(e.target.value)}
              className="w-full min-h-[200px] p-4 font-mono text-sm bg-background resize-y outline-none"
              placeholder="Enter Mermaid diagram code..."
              spellCheck={false}
            />
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-t border-border">
              <div className="flex flex-wrap gap-1">
                {Object.keys(DIAGRAM_TEMPLATES).map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setLocalDiagram(
                        DIAGRAM_TEMPLATES[
                          type as keyof typeof DIAGRAM_TEMPLATES
                        ]
                      )
                    }
                    className="px-2 py-1 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground transition-colors capitalize"
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Preview
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {isLoading && (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-destructive">
                    Diagram Error
                  </p>
                  <p className="text-xs text-destructive/80 truncate">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 rounded text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                >
                  Fix
                </button>
              </div>
            )}

            {!isLoading && !error && svgOutput && (
              <div
                ref={containerRef}
                className="flex items-center justify-center overflow-auto"
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const MermaidBlock = memo(MermaidBlockInner);
