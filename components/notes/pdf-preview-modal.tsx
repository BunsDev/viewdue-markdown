"use client";

import { useState, useRef } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "@/components/markdown-preview";

interface PdfPreviewModalProps {
  markdown: string;
  onClose: () => void;
}

export function PdfPreviewModal({ markdown, onClose }: PdfPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!contentRef.current) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default as any;

      const element = contentRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: "document.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          onclone: (clonedDoc: Document) => {
            // Remove all stylesheets to prevent oklch parsing
            const stylesheets = clonedDoc.querySelectorAll(
              'link[rel="stylesheet"], style'
            );
            stylesheets.forEach((sheet) => sheet.remove());

            // Add a simple stylesheet with only hex colors
            const style = clonedDoc.createElement("style");
            style.textContent = `
              * {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              }
              body, .pdf-content {
                background-color: #ffffff !important;
                color: #0a0a0a !important;
              }
              h1, h2, h3, h4, h5, h6 {
                color: #0a0a0a !important;
                font-weight: 600 !important;
                margin-top: 1.5em !important;
                margin-bottom: 0.5em !important;
              }
              h1 { font-size: 2em !important; }
              h2 { font-size: 1.5em !important; }
              h3 { font-size: 1.25em !important; }
              p, li, td, th {
                color: #0a0a0a !important;
                line-height: 1.6 !important;
              }
              a { color: #2563eb !important; }
              code {
                background-color: #f5f5f5 !important;
                color: #0a0a0a !important;
                padding: 0.2em 0.4em !important;
                border-radius: 4px !important;
                font-family: monospace !important;
              }
              pre {
                background-color: #1e1e1e !important;
                color: #d4d4d4 !important;
                padding: 1em !important;
                border-radius: 8px !important;
                overflow-x: auto !important;
              }
              pre code {
                background-color: transparent !important;
                color: #d4d4d4 !important;
                padding: 0 !important;
              }
              blockquote {
                border-left: 4px solid #e5e5e5 !important;
                padding-left: 1em !important;
                color: #525252 !important;
                margin: 1em 0 !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 1em 0 !important;
              }
              th, td {
                border: 1px solid #e5e5e5 !important;
                padding: 0.5em 1em !important;
                text-align: left !important;
              }
              th {
                background-color: #f5f5f5 !important;
                font-weight: 600 !important;
              }
              hr {
                border: none !important;
                border-top: 1px solid #e5e5e5 !important;
                margin: 2em 0 !important;
              }
              ul, ol {
                padding-left: 1.5em !important;
                margin: 1em 0 !important;
              }
              img {
                max-width: 100% !important;
                height: auto !important;
              }
              .card-component {
                border: 1px solid #e5e5e5 !important;
                border-radius: 8px !important;
                padding: 1em !important;
                margin: 1em 0 !important;
                background-color: #fafafa !important;
              }
              .callout-info {
                background-color: #eff6ff !important;
                border-left: 4px solid #3b82f6 !important;
                padding: 1em !important;
                margin: 1em 0 !important;
              }
              .callout-warning {
                background-color: #fffbeb !important;
                border-left: 4px solid #f59e0b !important;
                padding: 1em !important;
                margin: 1em 0 !important;
              }
              .callout-error {
                background-color: #fef2f2 !important;
                border-left: 4px solid #ef4444 !important;
                padding: 1em !important;
                margin: 1em 0 !important;
              }
              .callout-success {
                background-color: #f0fdf4 !important;
                border-left: 4px solid #22c55e !important;
                padding: 1em !important;
                margin: 1em 0 !important;
              }
              .steps-component {
                padding-left: 2em !important;
                border-left: 2px solid #e5e5e5 !important;
              }
              .step-item {
                position: relative !important;
                padding-bottom: 1em !important;
              }
              .step-number {
                position: absolute !important;
                left: -2.5em !important;
                background-color: #0a0a0a !important;
                color: #ffffff !important;
                width: 1.5em !important;
                height: 1.5em !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 0.875em !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf()
        .set(opt as any)
        .from(element)
        .save();
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl h-[90vh] max-h-[800px] bg-white rounded-lg border border-neutral-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-lg font-semibold text-neutral-900">
            PDF Preview
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isGenerating ? "Generating..." : "Download PDF"}
              </span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview - Shows rendered markdown that will be converted to PDF */}
        <div className="flex-1 overflow-auto bg-neutral-100 p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div
            ref={contentRef}
            className="pdf-content p-8 max-w-[210mm] mx-auto shadow-lg bg-white"
            style={{
              minHeight: "297mm",
              backgroundColor: "#ffffff",
              color: "#0a0a0a",
            }}
          >
            <MarkdownPreview markdown={markdown} isPdfMode />
          </div>
        </div>
      </div>
    </div>
  );
}
