"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

interface MarkdownCodeBlockProps {
  language?: string;
  children: string;
  isPdfMode?: boolean;
}

export function MarkdownCodeBlock({
  language,
  children,
  isPdfMode = false,
}: MarkdownCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [children, language]);

  const borderColor = isPdfMode ? "border-gray-200" : "border-border";
  const headerBg = isPdfMode ? "bg-gray-100" : "bg-secondary";
  const labelColor = isPdfMode ? "text-gray-500" : "text-muted-foreground";
  const codeBg = isPdfMode ? "bg-gray-50" : "bg-[#1a1a2e]";

  // Map common language aliases
  const langMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
  };
  const normalizedLang = langMap[language || ""] || language || "plaintext";

  return (
    <div className={cn("my-4 rounded-lg overflow-hidden border", borderColor)}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 border-b",
          headerBg,
          borderColor
        )}
      >
        <span className={cn("text-xs font-mono", labelColor)}>
          {normalizedLang}
        </span>
        {!isPdfMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        )}
      </div>

      {/* Code with syntax highlighting */}
      <pre className={cn("p-4 overflow-x-auto", codeBg, "!bg-[#1a1a2e]")}>
        <code
          ref={codeRef}
          className={cn("text-sm font-mono", `language-${normalizedLang}`)}
        >
          {children}
        </code>
      </pre>
    </div>
  );
}
