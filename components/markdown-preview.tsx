"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";
import { MarkdownCard } from "@/components/markdown/card";
import { MarkdownCallout } from "@/components/markdown/callout";
import { MarkdownAccordion } from "@/components/markdown/accordion";
import { MarkdownHeader } from "@/components/markdown/header";
import { MarkdownSteps } from "@/components/markdown/steps";
import { MarkdownCarousel } from "@/components/markdown/carousel";
import { MarkdownCodeBlock } from "@/components/markdown/code-block";
import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";
import { parseCustomComponents } from "@/lib/markdown-parser";

interface MarkdownPreviewProps {
  markdown: string;
  isPdfMode?: boolean;
}

export function MarkdownPreview({
  markdown,
  isPdfMode = false,
}: MarkdownPreviewProps) {
  const { processedMarkdown, components } = parseCustomComponents(markdown);

  const textColor = isPdfMode ? "text-gray-900" : "text-foreground";
  const mutedColor = isPdfMode ? "text-gray-600" : "text-muted-foreground";
  const borderColor = isPdfMode ? "border-gray-200" : "border-border";
  const bgSecondary = isPdfMode ? "bg-gray-100" : "bg-secondary";
  const primaryColor = isPdfMode ? "text-blue-600" : "text-primary";

  return (
    <div className={isPdfMode ? "" : "h-full overflow-auto"}>
      <article
        className={`max-w-4xl mx-auto ${isPdfMode ? "" : "p-8"} prose ${
          isPdfMode ? "" : "prose-invert"
        } prose-sm sm:prose-base`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({
              children,
              node: _node,
              className,
              ...props
            }: ComponentPropsWithoutRef<"h1"> & { node?: unknown }) => (
              <h1
                {...props}
                className={`text-3xl font-bold text-foreground mt-8 mb-4 first:mt-0 ${className ?? ""}`}
              >
                {children}
              </h1>
            ),
            h2: ({
              children,
              node: _node,
              className,
              ...props
            }: ComponentPropsWithoutRef<"h2"> & { node?: unknown }) => (
              <h2
                {...props}
                className={`text-2xl font-semibold text-foreground mt-8 mb-3 pb-2 border-b border-border ${className ?? ""}`}
              >
                {children}
              </h2>
            ),
            h3: ({
              children,
              node: _node,
              className,
              ...props
            }: ComponentPropsWithoutRef<"h3"> & { node?: unknown }) => (
              <h3
                {...props}
                className={`text-xl font-semibold text-foreground mt-6 mb-2 ${className ?? ""}`}
              >
                {children}
              </h3>
            ),
            p: ({
              children,
              node: _node,
              className,
              ...props
            }: ComponentPropsWithoutRef<"p"> & { node?: unknown }) => {
              const text = children ? String(children) : "";
              if (text.startsWith("__COMPONENT_")) {
                const id = text.match(/__COMPONENT_(\d+)__/)?.[1];
                if (id && components[Number.parseInt(id)]) {
                  const comp = components[Number.parseInt(id)];
                  if (comp) {
                    switch (comp.type) {
                      case "Card":
                        return (
                          <MarkdownCard
                            title={comp.props.title || ""}
                            isPdfMode={isPdfMode}
                          >
                            {comp.content}
                          </MarkdownCard>
                        );
                      case "Callout":
                        return (
                          <MarkdownCallout
                            type={
                              (comp.props.type as
                                | "info"
                                | "warning"
                                | "error") || "info"
                            }
                            isPdfMode={isPdfMode}
                          >
                            {comp.content}
                          </MarkdownCallout>
                        );
                      case "Accordion":
                        return (
                          <MarkdownAccordion
                            title={comp.props.title || ""}
                            isPdfMode={isPdfMode}
                          >
                            {comp.content}
                          </MarkdownAccordion>
                        );
                      case "Header":
                        return (
                          <MarkdownHeader
                            level={Number(comp.props.level || 1)}
                            isPdfMode={isPdfMode}
                          >
                            {comp.content}
                          </MarkdownHeader>
                        );
                      case "Steps":
                        return (
                          <MarkdownSteps isPdfMode={isPdfMode}>
                            {comp.content}
                          </MarkdownSteps>
                        );
                      case "Carousel":
                        return (
                          <MarkdownCarousel
                            images={comp.props.images?.split(",") || []}
                            isPdfMode={isPdfMode}
                          />
                        );
                      default:
                        return (
                          <p className="text-muted-foreground leading-relaxed mb-4">
                            {String(children)}
                          </p>
                        );
                    }
                  }
                }
              }
              return (
                <p
                  {...props}
                  className={`${mutedColor} leading-relaxed mb-4 ${className ?? ""}`}
                >
                  {children}
                </p>
              );
            },
            a: ({
              href,
              children,
              node: _node,
              className,
              ...props
            }: ComponentPropsWithoutRef<"a"> & { node?: unknown }) => (
              <a
                {...props}
                href={href}
                className={`${primaryColor} hover:opacity-80 underline underline-offset-4 ${className ?? ""}`}
                target={href ? "_blank" : undefined}
                rel={href ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol
                className={`list-decimal list-inside space-y-1 mb-4 ${mutedColor}`}
              >
                {children}
              </ol>
            ),
            li: ({ children }) => <li className={mutedColor}>{children}</li>,
            blockquote: ({ children }) => (
              <blockquote
                className={`border-l-4 ${
                  isPdfMode ? "border-blue-500" : "border-primary"
                } pl-4 py-1 my-4 ${mutedColor} italic`}
              >
                {children}
              </blockquote>
            ),
            code: ({ className, children }) => {
              const match = /language-(\w+)/.exec(className || "");
              const isInline = !match;

              if (isInline) {
                return (
                  <code
                    className={`px-1.5 py-0.5 ${bgSecondary} rounded text-sm font-mono ${textColor}`}
                  >
                    {children}
                  </code>
                );
              }

              const language = match[1];
              const codeContent = String(children).replace(/\n$/, "");

              // Handle mermaid diagrams
              if (language === "mermaid") {
                return (
                  <MermaidDiagram chart={codeContent} isPdfMode={isPdfMode} />
                );
              }

              return (
                <MarkdownCodeBlock language={language} isPdfMode={isPdfMode}>
                  {codeContent}
                </MarkdownCodeBlock>
              );
            },
            pre: ({ children }) => <>{children}</>,
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table
                  className={`w-full border-collapse border ${borderColor} rounded-lg overflow-hidden`}
                >
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className={bgSecondary}>{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className={`border-b ${borderColor} last:border-0`}>
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th
                className={`px-4 py-2 text-left text-sm font-semibold ${textColor}`}
              >
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className={`px-4 py-2 text-sm ${mutedColor}`}>{children}</td>
            ),
            hr: () => <hr className={`my-8 ${borderColor}`} />,
            strong: ({ children }) => (
              <strong className={`font-semibold ${textColor}`}>
                {children}
              </strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {processedMarkdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}
