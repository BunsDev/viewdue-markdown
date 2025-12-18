# ViewDue Markdown Editor

A **Notion-style, block-based WYSIWYG Markdown editor** + **Markdown preview renderer** built as reusable React components.

This repo is designed to be embedded into:

- **VS Code extension webview** (React UI inside VS Code, saving Markdown back to the workspace)
- **Any React app** (Next.js, Vite, etc.) that wants structured, block-based authoring with Markdown import/export

> Note: this repo currently contains the **UI + markdown codec**. It does not include VS Code extension host scaffolding (activation, commands, contributions) unless added elsewhere.

## Objective

- **Edit content as blocks** (headings, lists, media, embeds, code, tables, diagrams)
- **Round-trip safely to Markdown** for the supported dialect (including small extensions for embeds)
- **Feel native**: fast typing, stable cursor, good paste behavior, keyboard navigation

## Features (what you get)

- **Block editor** (`RichEditor`)
  - Block types: paragraph, headings, lists, checklist, quote, divider, image, video, iframe, link preview, table, mermaid, code
  - Slash menu (`/…`) for inserting blocks + AI actions
  - Paste: detect block-level Markdown and convert to blocks
  - Inline markdown affordance (e.g. `**bold**` → bold)
- **Preview renderer** (`MarkdownPreview`)
  - GFM-style Markdown rendering + custom components via `lib/markdown-parser.tsx`
- **Codec / domain model**
  - `Block`, `BlockType`, `Note` in `lib/types/notes.ts`
  - `markdownToBlocks()` and `blocksToMarkdown()` for import/export
- **Export helpers**
  - Markdown/TXT export, HTML generation, and PDF via `window.print()`
- **Optional integrations (app-provided endpoints)**
  - Link previews: `POST /api/link-preview`
  - AI text actions: `POST /api/text-actions`

## Benefits (why this vs “just Markdown”)

- **Structured editing without losing Markdown portability**
- **Deterministic serialization**: blocks → Markdown is stable and predictable
- **Extensible dialect** for embeds/blocks that don’t map cleanly to vanilla Markdown (video/iframe)
- **Drop-in UI**: editor + preview are aligned to the same dialect

## Status / progress

- **Alpha, usable** for the supported block set and export paths.
- The repo is actively being hardened toward “component package you can ship”:
  - dependency alignment (Radix/Mermaid/etc.)
  - dialect definition + round-trip tests
  - UX polish + keyboard semantics

For the detailed contract and current inventory, see `docs/requirements.md`.

## Roadmap (high-level)

Mirrors `docs/plan.md`:

- **Phase 0**: lock target runtime (app-first vs framework-agnostic package)
- **Phase 1**: make buildable + consumable (exports, dependencies, import strategy)
- **Phase 2**: formalize Markdown dialect + add round-trip tests
- **Phase 3**: editor UX hardening (selection, formatting, paste, keyboard)
- **Phase 4**: preview + custom markdown components
- **Phase 5**: optional service contracts (link preview + AI)
- **Phase 6**: packaging/publishing (exports map, CI, example app)

## Public API (what you import)

The package entrypoint is `index.ts`:

- **Editor**: `RichEditor` via `export * from "@/components/editor"`
- **Preview**: `MarkdownPreview`
- **Codec**: `markdownToBlocks`, `blocksToMarkdown`, plus `Note` / `Block` / `BlockType`

## Basic usage

```tsx
"use client";

import { RichEditor, MarkdownPreview, type Note } from "viewdue-markdown";

export function Example() {
  const handleSave = async (note: Note) => {
    // persist `note.blocks` or `blocksToMarkdown(note.blocks)`
  };

  return (
    <div className="h-full">
      <RichEditor onClose={() => {}} onSave={handleSave} />
      {/* <MarkdownPreview markdown={"# Hello"} /> */}
    </div>
  );
}
```

## Optional backend endpoints (if you want previews / AI)

- **Link preview**: `POST /api/link-preview` → `{ url, title, description?, image?, favicon?, domain }`
- **AI actions**: `POST /api/text-actions` with `{ action, text }` returning text (optionally streamed)

## Dev setup (this repo)

This repo defaults to **Bun**.

- **Install**: `bun install`
- **Typecheck**: `bunx tsc -p tsconfig.json --noEmit`

There is no example app in this repo by default; you typically consume the components from another app or a VS Code webview bundle.

## File tree (where things live)

```
.
├─ components/
│  ├─ editor/                 # RichEditor + editor UX (slash menu, toolbars)
│  │  ├─ blocks/              # Image/Video/Iframe/Table/Mermaid/Code/etc.
│  │  ├─ toolbar/             # Top toolbar + selection toolbar
│  │  └─ rich-editor.tsx
│  ├─ markdown-preview.tsx    # MarkdownPreview renderer
│  └─ ui/                     # Radix-based UI primitives (shadcn-style)
├─ lib/
│  ├─ types/notes.ts          # Block/Note model + markdown codec
│  └─ utils.ts                # shared helpers (cn, etc.)
├─ docs/                      # requirements / plan / architecture / instructions
└─ index.ts                   # public entrypoint re-exports
```

## Runtime expectations / constraints

- **Tailwind required**: components are Tailwind-class driven.
- **Theme tokens**: expects shadcn-style tokens (`bg-background`, `text-foreground`, etc.).
- **Client-only features**: Monaco, Mermaid rendering, and PDF generation are client-only; render from client components.
- **Security**: keep iframes sandboxed by default; harden link preview fetching against SSRF if you implement the endpoint.

## Docs

- `docs/requirements.md` (contract + supported dialect + inventory)
- `docs/architecture.md` (module/data-flow overview)
- `docs/plan.md` (phased roadmap)
- `docs/instructions.md` (integration notes)
