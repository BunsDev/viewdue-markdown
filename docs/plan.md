## Plan — viewdue-markdown (React WYSIWYG Markdown editor + preview components)

### Outcome
Ship a **reusable set of React components** that provide:
- **`RichEditor`**: a Notion-like, block-based WYSIWYG Markdown editor
- **`MarkdownPreview`**: a Markdown preview renderer (GFM + custom components)
- **Block model + codec**: `Block`, `BlockType`, `Note`, `markdownToBlocks()`, `blocksToMarkdown()`
- **Export helpers**: Markdown/TXT and PDF preview/download
- **Optional integrations**: link previews + AI text actions via app-provided endpoints

---

## Phase 0 — Lock the target runtime
This repo currently mixes “app-style” assumptions (client components, Tailwind, Radix UI) with several client-only dependencies (Monaco, Mermaid, html2pdf).

Decide which direction to commit to:
- **App-first (Next.js or similar)**
  - Keep `"use client"` components and treat the editor as client-only where needed.
- **Framework-agnostic React package**
  - Ensure SSR-safe behavior for heavy deps (Monaco, Mermaid, html2pdf).

---

## Phase 1 — Make it buildable + consumable
- **Exports**: keep `index.ts` as the public entrypoint (re-export editor/preview/types).
- **Dependencies**: ensure runtime deps are complete:
  - `mermaid`
  - `@radix-ui/react-*` packages used in `components/ui/*`
- **Import strategy**: either preserve the repo alias `@/* -> ./*` (see `tsconfig.json`) or convert imports to relative paths for external consumption.

---

## Phase 2 — Define and test the Markdown dialect
- **Supported block types** (v1): headings, paragraph, lists, checklist, quote, divider, code, image, link preview, video, iframe, table, mermaid
- **Extensions for lossless round-trip**:
  - `@[video](url)`
  - `@[iframe:height](url)`
- **Round-trip tests**:
  - `blocks == markdownToBlocks(blocksToMarkdown(blocks))` (with documented normalizations)

---

## Phase 3 — Editor UX hardening
- **No cursor jumping** (DOM-managed `contentEditable`)
- **Keyboard semantics**: enter/new block, backspace/delete empty, arrow navigation
- **Slash menu**: block insert/transform + AI actions
- **Paste**: markdown-to-block conversion for structured markdown

---

## Phase 4 — Preview + custom component markdown
- **GFM** via `react-markdown` + `remark-gfm`
- **Custom components** parsed from markdown:
  - `<Card>`, `<Callout>`, `<Accordion>`, `<Header>`, `<Steps>`, `<Carousel>`

---

## Phase 5 — Optional service contracts
- **Link preview endpoint** (for `LinkPreviewBlock`): `POST /api/link-preview`
- **AI actions endpoint** (for editor AI features): `POST /api/text-actions`

---

## Phase 6 — Packaging / publishing (if desired)
- Remove `"private": true`
- Add an `exports` map (ESM + types)
- Add a minimal example app for integration testing (Next or Vite)
- Add CI for typecheck + build
