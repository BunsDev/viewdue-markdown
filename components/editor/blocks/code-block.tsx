"use client";

import { Suspense, lazy, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Lazy load Monaco Editor to reduce initial bundle size (~2MB)
// (Framework-agnostic replacement for next/dynamic)
const Editor = lazy(() => import("@monaco-editor/react"));

function MonacoLoading() {
  return (
    <div className="flex items-center justify-center h-24 bg-[#1e1e1e] text-zinc-500 text-sm gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading editor...
    </div>
  );
}

interface MonacoCodeBlockProps {
  code: string;
  language: string;
  className?: string;
  editable?: boolean;
  onChange?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "bash", label: "Bash" },
  { id: "shell", label: "Shell" },
  { id: "solidity", label: "Solidity" },
  { id: "json", label: "JSON" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "sql", label: "SQL" },
  { id: "markdown", label: "Markdown" },
  { id: "plaintext", label: "Plain Text" },
];

function normalizeLanguage(lang: string): string {
  const aliases: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    sh: "bash",
    zsh: "bash",
    sol: "solidity",
    md: "markdown",
    txt: "plaintext",
    text: "plaintext",
  };
  return aliases[lang.toLowerCase()] || lang.toLowerCase();
}

function getLanguageLabel(lang: string): string {
  const normalized = normalizeLanguage(lang);
  const found = SUPPORTED_LANGUAGES.find((l) => l.id === normalized);
  return found?.label || lang.toUpperCase();
}

export function MonacoCodeBlock({
  code,
  language,
  className,
  editable = false,
  onChange,
  onLanguageChange,
}: MonacoCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(
    normalizeLanguage(language)
  );
  const [internalCode, setInternalCode] = useState(code);

  const lineCount = (editable ? internalCode : code).split("\n").length;
  const height = Math.min(Math.max(lineCount, 3), 20) * 20 + 16;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(editable ? internalCode : code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code, internalCode, editable]);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setCurrentLanguage(lang);
      onLanguageChange?.(lang);
    },
    [onLanguageChange]
  );

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || "";
      setInternalCode(newCode);
      onChange?.(newCode);
    },
    [onChange]
  );

  return (
    <div
      className={cn(
        "my-4 rounded-lg border border-border overflow-hidden bg-[#1e1e1e]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
            >
              {getLanguageLabel(currentLanguage)}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={cn(currentLanguage === lang.id && "bg-accent")}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={handleCopy}
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
      </div>

      {/* Monaco Editor */}
      <Suspense fallback={<MonacoLoading />}>
        <Editor
          height={height}
          language={currentLanguage}
          value={editable ? internalCode : code}
          onChange={editable ? handleCodeChange : undefined}
          theme="vs-dark"
          options={{
            readOnly: !editable,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            folding: false,
            wordWrap: "on",
            fontSize: 13,
            fontFamily:
              "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: editable ? "line" : "none",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: "hidden",
              horizontal: "auto",
            },
          }}
        />
      </Suspense>
    </div>
  );
}
