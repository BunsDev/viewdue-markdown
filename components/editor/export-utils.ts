import type { Block } from "@/lib/types/notes";

// Convert blocks to markdown
export function blocksToMarkdown(blocks: Block[], title?: string): string {
  const lines: string[] = [];

  if (title) {
    lines.push(`# ${title}`, "");
  }

  for (const block of blocks) {
    switch (block.type) {
      case "heading1":
        lines.push(`# ${block.content}`, "");
        break;
      case "heading2":
        lines.push(`## ${block.content}`, "");
        break;
      case "heading3":
        lines.push(`### ${block.content}`, "");
        break;
      case "bulletList":
        lines.push(`- ${block.content}`);
        break;
      case "numberedList":
        lines.push(`1. ${block.content}`);
        break;
      case "checkList":
        lines.push(`- [ ] ${block.content}`);
        break;
      case "quote":
        lines.push(`> ${block.content}`, "");
        break;
      case "code":
        lines.push("```", block.content, "```", "");
        break;
      case "divider":
        lines.push("---", "");
        break;
      case "image":
        if (block.meta?.url) {
          const alt = block.meta.alt || "image";
          lines.push(`![${alt}](${block.meta.url})`, "");
        }
        break;
      case "video":
      case "embed":
        if (block.meta?.url) {
          lines.push(`[Video](${block.meta.url})`, "");
        }
        break;
      case "linkPreview":
        if (block.meta?.url) {
          const title = block.meta.title || block.meta.url;
          lines.push(`[${title}](${block.meta.url})`, "");
        }
        break;
      case "iframe":
        if (block.meta?.url) {
          lines.push(`[Embedded: ${block.meta.url}](${block.meta.url})`, "");
        }
        break;
      case "table":
        if (block.meta?.tableData && block.meta.tableData.length > 0) {
          const tableData = block.meta.tableData;
          // Header row
          lines.push(`| ${tableData[0]?.join(" | ")} |`);
          // Separator
          lines.push(`| ${tableData[0]?.map(() => "---").join(" | ")} |`);
          // Data rows
          for (let i = 1; i < tableData.length; i++) {
            lines.push(`| ${tableData[i]?.join(" | ")} |`);
          }
          lines.push("");
        }
        break;
      case "mermaid":
        if (block.meta?.diagram) {
          lines.push("```mermaid", block.meta.diagram, "```", "");
        }
        break;
      case "paragraph":
      default:
        if (block.content) {
          lines.push(block.content, "");
        }
        break;
    }
  }

  return lines.join("\n");
}

// Convert blocks to plain text
export function blocksToPlainText(blocks: Block[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    if (block.content) {
      lines.push(block.content);
    }
    if (block.meta?.tableData) {
      for (const row of block.meta.tableData) {
        lines.push(row.join("\t"));
      }
    }
    if (block.meta?.diagram) {
      lines.push(block.meta.diagram);
    }
  }

  return lines.join("\n");
}

// Download as markdown file
export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download as HTML/PDF (using browser print)
export function downloadPDF() {
  // Open print dialog which allows saving as PDF
  window.print();
}

// Generate HTML for PDF export
export function blocksToHTML(blocks: Block[], title?: string): string {
  const styles = `
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
      h1 { font-size: 2rem; font-weight: bold; margin-top: 2rem; }
      h2 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; }
      h3 { font-size: 1.25rem; font-weight: 500; margin-top: 1rem; }
      ul, ol { margin-left: 1.5rem; }
      blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1rem; color: #666; font-style: italic; }
      pre { background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
      code { font-family: monospace; }
      hr { border: none; border-top: 1px solid #ccc; margin: 1.5rem 0; }
      img { max-width: 100%; height: auto; border-radius: 0.5rem; }
      table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
      th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
      th { background: #f5f5f5; }
      .mermaid-container { background: #f9f9f9; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    </style>
  `;

  const content: string[] = [];

  if (title) {
    content.push(`<h1>${escapeHTML(title)}</h1>`);
  }

  for (const block of blocks) {
    switch (block.type) {
      case "heading1":
        content.push(`<h1>${escapeHTML(block.content)}</h1>`);
        break;
      case "heading2":
        content.push(`<h2>${escapeHTML(block.content)}</h2>`);
        break;
      case "heading3":
        content.push(`<h3>${escapeHTML(block.content)}</h3>`);
        break;
      case "bulletList":
        content.push(`<ul><li>${escapeHTML(block.content)}</li></ul>`);
        break;
      case "numberedList":
        content.push(`<ol><li>${escapeHTML(block.content)}</li></ol>`);
        break;
      case "checkList":
        content.push(
          `<ul><li><input type="checkbox" disabled> ${escapeHTML(
            block.content
          )}</li></ul>`
        );
        break;
      case "quote":
        content.push(`<blockquote>${escapeHTML(block.content)}</blockquote>`);
        break;
      case "code":
        content.push(`<pre><code>${escapeHTML(block.content)}</code></pre>`);
        break;
      case "divider":
        content.push(`<hr>`);
        break;
      case "image":
        if (block.meta?.url) {
          content.push(
            `<img src="${escapeHTML(block.meta.url)}" alt="${escapeHTML(
              block.meta.alt || "image"
            )}">`
          );
        }
        break;
      case "video":
      case "embed":
        if (block.meta?.url) {
          content.push(
            `<p><a href="${escapeHTML(block.meta.url)}">${escapeHTML(
              block.meta.url
            )}</a></p>`
          );
        }
        break;
      case "linkPreview":
        if (block.meta?.url) {
          content.push(
            `<p><a href="${escapeHTML(block.meta.url)}">${escapeHTML(
              block.meta.title || block.meta.url
            )}</a></p>`
          );
        }
        break;
      case "iframe":
        if (block.meta?.url) {
          content.push(
            `<p><a href="${escapeHTML(block.meta.url)}">Embedded: ${escapeHTML(
              block.meta.url
            )}</a></p>`
          );
        }
        break;
      case "table":
        if (block.meta?.tableData && block.meta.tableData.length > 0) {
          const rows = block.meta.tableData
            .map((row, i) => {
              const tag = i === 0 ? "th" : "td";
              return `<tr>${row
                .map((cell) => `<${tag}>${escapeHTML(cell)}</${tag}>`)
                .join("")}</tr>`;
            })
            .join("");
          content.push(`<table>${rows}</table>`);
        }
        break;
      case "mermaid":
        if (block.meta?.diagram) {
          content.push(
            `<div class="mermaid-container"><pre>${escapeHTML(
              block.meta.diagram
            )}</pre><p><em>Mermaid diagram (render in compatible viewer)</em></p></div>`
          );
        }
        break;
      case "paragraph":
      default:
        if (block.content) {
          content.push(`<p>${escapeHTML(block.content)}</p>`);
        }
        break;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(title || "Note")}</title>
  ${styles}
</head>
<body>
  ${content.join("\n  ")}
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
