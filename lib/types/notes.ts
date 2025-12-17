export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "collapsibleHeading1"
  | "collapsibleHeading2"
  | "collapsibleHeading3"
  | "bulletList"
  | "numberedList"
  | "checkList"
  | "code"
  | "quote"
  | "divider"
  | "image"
  | "embed"
  | "linkPreview"
  | "video"
  | "iframe"
  | "table"
  | "mermaid";
export type MediaAlignment = "left" | "center" | "right";
export type MediaSize = "small" | "medium" | "large" | "full";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  collapsed?: boolean;
  meta?: {
    url?: string;
    language?: string;
    alt?: string;
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
    domain?: string;
    // Media block fields
    width?: number | string;
    height?: number | string;
    alignment?: MediaAlignment;
    size?: MediaSize;
    aspectRatio?: string;
    poster?: string; // Video thumbnail
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    caption?: string;
    // Gallery specific
    images?: Array<{ url: string; alt?: string; caption?: string }>;
    columns?: number;
    // Iframe specific
    sandbox?: string;
    interactive?: boolean;
    // Table specific
    rows?: number;
    cols?: number;
    tableData?: string[][];
    // Mermaid specific
    diagram?: string;
  };
}

export interface Note {
  id: string;
  title: string;
  icon: string;
  blocks: Block[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  // Database fields for persistence
  projectId?: string;
  isPinned?: boolean;
  position?: number;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createEmptyBlock(type: BlockType = "paragraph"): Block {
  return {
    id: generateId(),
    type,
    content: "",
  };
}

// Detect if text contains multi-line markdown syntax (for paste handling)
export function hasMarkdownSyntax(text: string): boolean {
  // Only trigger for multi-line content or clear markdown patterns
  const lines = text.split("\n");

  // Single-line markdown patterns
  const singleLinePatterns =
    /^(#{1,6}\s|[-*+]\s|>\s|```|\d+\.\s|---|\*\*\*|- \[[ xX]\]\s)/;

  if (lines.length < 2) {
    // For single line, only detect if it clearly starts with markdown
    return singleLinePatterns.test(text.trim());
  }

  // Multi-line patterns - more comprehensive detection
  const multiLinePatterns =
    /^(#{1,6}\s|[-*+]\s|>\s|```|`{3}[a-z]*|>\s|[-*+]\s\[[ xX]\]\s|\d+\.\s|---|\*\*\*|!\[.*\]\(.*\)|\[.*\]\(https?:\/\/.*\)|\|.*\|)/;

  // Check if multiple lines have markdown syntax (more confident detection)
  const markdownLineCount = lines.filter((line) =>
    multiLinePatterns.test(line.trim())
  ).length;

  // If at least 2 lines have markdown syntax, or 1 line has it and there are code blocks
  const hasCodeBlock = text.includes("```");
  const hasTable = lines.some(
    (line) => line.trim().startsWith("|") && line.trim().endsWith("|")
  );

  return (
    markdownLineCount >= 2 ||
    (markdownLineCount >= 1 && (hasCodeBlock || hasTable)) ||
    hasCodeBlock
  );
}

// Convert blocks to plain text for search indexing
export function blocksToText(blocks: Block[]): string {
  return blocks
    .filter(
      (block) =>
        block.type !== "divider" &&
        block.type !== "image" &&
        block.type !== "embed"
    )
    .map((block) => block.content)
    .filter(Boolean)
    .join("\n");
}

// Convert blocks to markdown string for database storage
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading1":
          return `# ${block.content}`;
        case "heading2":
          return `## ${block.content}`;
        case "heading3":
          return `### ${block.content}`;
        case "collapsibleHeading1":
          return `<# ${block.content}`;
        case "collapsibleHeading2":
          return `<## ${block.content}`;
        case "collapsibleHeading3":
          return `<### ${block.content}`;
        case "bulletList":
          return `- ${block.content}`;
        case "numberedList":
          return `1. ${block.content}`;
        case "checkList":
          return `- [ ] ${block.content}`;
        case "quote":
          return `> ${block.content}`;
        case "code":
          return `\`\`\`${block.meta?.language || ""}\n${
            block.content
          }\n\`\`\``;
        case "divider":
          return "---";
        case "image":
          return block.meta?.url
            ? `![${block.meta.alt || ""}](${block.meta.url})`
            : "";
        case "linkPreview":
          return block.meta?.url
            ? `[${block.meta.title || block.meta.url}](${block.meta.url})`
            : "";
        case "video":
        case "embed":
          // Use special syntax to preserve video type: @[video](url)
          return block.meta?.url ? `@[video](${block.meta.url})` : "";
        case "iframe":
          // Use special syntax to preserve iframe type: @[iframe](url)
          return block.meta?.url
            ? `@[iframe${block.meta.height ? `:${block.meta.height}` : ""}](${
                block.meta.url
              })`
            : "";
        case "table":
          if (block.meta?.tableData && block.meta.tableData.length > 0) {
            const data = block.meta.tableData;
            const header = `| ${data[0]?.join(" | ")} |`;
            const separator = `| ${data[0]?.map(() => "---").join(" | ")} |`;
            const rows = data
              .slice(1)
              .map((row) => `| ${row.join(" | ")} |`)
              .join("\n");
            return `${header}\n${separator}${rows ? "\n" + rows : ""}`;
          }
          return "";
        case "mermaid":
          return `\`\`\`mermaid\n${
            block.meta?.diagram || block.content
          }\n\`\`\``;
        default:
          return block.content;
      }
    })
    .join("\n\n");
}

// Convert markdown string to blocks
export function markdownToBlocks(markdown: string): Block[] {
  if (!markdown || !markdown.trim()) {
    return [createEmptyBlock()];
  }

  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line?.trim()) {
      i++;
      continue;
    }

    // Code block (including mermaid)
    if (line?.startsWith("```")) {
      const language = line?.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]?.startsWith("```")) {
        codeLines.push(lines[i] ?? "");
        i++;
      }

      // Special handling for mermaid diagrams
      if (language === "mermaid") {
        blocks.push({
          id: generateId(),
          type: "mermaid",
          content: "",
          meta: { diagram: codeLines.join("\n") },
        });
      } else {
        blocks.push({
          id: generateId(),
          type: "code",
          content: codeLines.join("\n"),
          meta: language ? { language } : undefined,
        });
      }
      i++;
      continue;
    }

    // Video embed: @[video](url)
    const videoMatch = line?.match(/^@\[video\]\((.*?)\)$/);
    if (videoMatch) {
      blocks.push({
        id: generateId(),
        type: "video",
        content: "",
        meta: { url: videoMatch[1] },
      });
      i++;
      continue;
    }

    // Iframe embed: @[iframe](url) or @[iframe:height](url)
    const iframeMatch = line?.match(/^@\[iframe(?::(\d+))?\]\((.*?)\)$/);
    if (iframeMatch) {
      blocks.push({
        id: generateId(),
        type: "iframe",
        content: "",
        meta: {
          url: iframeMatch[2],
          height: iframeMatch[1] ? parseInt(iframeMatch[1], 10) : 400,
        },
      });
      i++;
      continue;
    }

    // Table: starts with | and has header separator
    if (
      line?.startsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1]?.includes("---")
    ) {
      const tableLines: string[] = [line];
      i++;
      // Collect all table lines
      while (
        i < lines.length &&
        (lines[i]?.startsWith("|") || lines[i]?.includes("---"))
      ) {
        tableLines.push(lines[i] ?? "");
        i++;
      }

      // Parse table data (skip separator row)
      const tableData = tableLines
        .filter((l) => !l.includes("---"))
        .map((l) =>
          l
            .split("|")
            .slice(1, -1) // Remove empty first/last from | splits
            .map((cell) => cell.trim())
        );

      if (tableData.length > 0) {
        blocks.push({
          id: generateId(),
          type: "table",
          content: "",
          meta: {
            tableData,
            rows: tableData.length,
            cols: tableData[0]?.length || 3,
          },
        });
      }
      continue;
    }

    // Collapsible heading 1
    if (line?.startsWith("<# ")) {
      blocks.push({
        id: generateId(),
        type: "collapsibleHeading1",
        content: line?.slice(3),
      });
      i++;
      continue;
    }

    // Collapsible heading 2
    if (line.startsWith("<## ")) {
      blocks.push({
        id: generateId(),
        type: "collapsibleHeading2",
        content: line.slice(4),
      });
      i++;
      continue;
    }

    // Collapsible heading 3
    if (line.startsWith("<### ")) {
      blocks.push({
        id: generateId(),
        type: "collapsibleHeading3",
        content: line.slice(5),
      });
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith("### ")) {
      blocks.push({
        id: generateId(),
        type: "heading3",
        content: line.slice(4),
      });
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      blocks.push({
        id: generateId(),
        type: "heading2",
        content: line.slice(3),
      });
      i++;
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      blocks.push({
        id: generateId(),
        type: "heading1",
        content: line.slice(2),
      });
      i++;
      continue;
    }

    // Checklist (must be before bullet list)
    if (
      line.startsWith("- [ ] ") ||
      line.startsWith("- [x] ") ||
      line.startsWith("- [X] ")
    ) {
      blocks.push({
        id: generateId(),
        type: "checkList",
        content: line.slice(6),
      });
      i++;
      continue;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push({
        id: generateId(),
        type: "bulletList",
        content: line.slice(2),
      });
      i++;
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^\d+\.\s(.*)$/);
    if (numMatch) {
      blocks.push({
        id: generateId(),
        type: "numberedList",
        content: numMatch[1] ?? "",
      });
      i++;
      continue;
    }

    // Quote
    if (line.startsWith("> ")) {
      blocks.push({
        id: generateId(),
        type: "quote",
        content: line.slice(2),
      });
      i++;
      continue;
    }

    // Divider
    if (line === "---" || line === "***") {
      blocks.push({
        id: generateId(),
        type: "divider",
        content: "",
      });
      i++;
      continue;
    }

    // Image
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({
        id: generateId(),
        type: "image",
        content: "",
        meta: { alt: imgMatch[1], url: imgMatch[2] },
      });
      i++;
      continue;
    }

    // Link preview (standalone link)
    const linkMatch = line.match(/^\[(.*?)\]\((https?:\/\/.*?)\)$/);
    if (linkMatch) {
      blocks.push({
        id: generateId(),
        type: "linkPreview",
        content: "",
        meta: { title: linkMatch[1], url: linkMatch[2] },
      });
      i++;
      continue;
    }

    // URL on its own line
    const urlMatch = line.match(/^(https?:\/\/[^\s]+)$/);
    if (urlMatch) {
      blocks.push({
        id: generateId(),
        type: "linkPreview",
        content: "",
        meta: { url: urlMatch[1] },
      });
      i++;
      continue;
    }

    // Paragraph (default)
    blocks.push({
      id: generateId(),
      type: "paragraph",
      content: line,
    });
    i++;
  }

  return blocks.length > 0 ? blocks : [createEmptyBlock()];
}
