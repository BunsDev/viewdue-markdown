"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
  isPdfMode?: boolean;
}

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#6366f1",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#4f46e5",
    lineColor: "#64748b",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
    background: "#0f172a",
    mainBkg: "#1e293b",
    nodeBorder: "#4f46e5",
    clusterBkg: "#1e293b",
    clusterBorder: "#334155",
    titleColor: "#f8fafc",
    edgeLabelBackground: "#1e293b",
  },
  flowchart: {
    htmlLabels: true,
    curve: "basis",
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
  },
});

export function MermaidDiagram({
  chart,
  isPdfMode = false,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Reinitialize with light theme for PDF mode
        if (isPdfMode) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            themeVariables: {
              primaryColor: "#6366f1",
              primaryTextColor: "#1e293b",
              primaryBorderColor: "#4f46e5",
              lineColor: "#64748b",
              secondaryColor: "#f1f5f9",
              tertiaryColor: "#e2e8f0",
              background: "#ffffff",
              mainBkg: "#f8fafc",
              nodeBorder: "#4f46e5",
              clusterBkg: "#f1f5f9",
              clusterBorder: "#cbd5e1",
              titleColor: "#1e293b",
              edgeLabelBackground: "#ffffff",
            },
          });
        }

        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render diagram"
        );
      }
    };

    renderDiagram();
  }, [chart, isPdfMode]);

  const borderColor = isPdfMode ? "border-gray-200" : "border-border";
  const headerBg = isPdfMode ? "bg-gray-100" : "bg-secondary";
  const labelColor = isPdfMode ? "text-gray-500" : "text-muted-foreground";
  const contentBg = isPdfMode ? "bg-white" : "bg-[#0f172a]";

  if (error) {
    return (
      <div
        className={cn("my-4 rounded-lg overflow-hidden border", borderColor)}
      >
        <div className={cn("px-4 py-2 border-b", headerBg, borderColor)}>
          <span className={cn("text-xs font-mono", labelColor)}>
            mermaid (error)
          </span>
        </div>
        <div className={cn("p-4", contentBg)}>
          <pre className="text-red-400 text-sm whitespace-pre-wrap">
            {error}
          </pre>
          <pre
            className={cn(
              "mt-2 text-xs opacity-50",
              isPdfMode ? "text-gray-600" : "text-gray-400"
            )}
          >
            {chart}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("my-4 rounded-lg overflow-hidden border", borderColor)}>
      <div className={cn("px-4 py-2 border-b", headerBg, borderColor)}>
        <span className={cn("text-xs font-mono", labelColor)}>mermaid</span>
      </div>
      <div
        ref={containerRef}
        className={cn("p-4 overflow-x-auto flex justify-center", contentBg)}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
