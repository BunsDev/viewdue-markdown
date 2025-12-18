## Architecture — viewdue-markdown (component package)

### Goals
- Provide a **block-based WYSIWYG editor** surface (`RichEditor`).
- Provide a **Markdown preview renderer** (`MarkdownPreview`) aligned with the same dialect.
- Preserve a **round-trip-safe** conversion between blocks and Markdown for supported features.

---

## Module overview

### Editor
- `components/editor/rich-editor.tsx`
  - Unified `.editor-blocks` container for cross-block selection.
  - Text blocks are `contentEditable` with DOM-managed initialization to avoid cursor jumps.
- `components/editor/use-editor.ts`
  - Editor state + actions (add/update/delete blocks; export).
- `components/editor/slash-menu.tsx`
  - Fuzzy command menu for inserting/changing blocks and AI actions.
- Block renderers in `components/editor/blocks/*`
  - Image, Video, Iframe, Link preview, Table, Mermaid, Code (Monaco)

### Preview
- `components/markdown-preview.tsx`
  - `react-markdown` + `remark-gfm`
  - Custom component placeholders powered by `lib/markdown-parser.tsx`
- `components/markdown/*`
  - Renderers for custom markdown components (Card, Callout, Steps, etc.)

### Types + codec
- `lib/types/notes.ts`
  - `Block`, `BlockType`, `Note`
  - `markdownToBlocks()` and `blocksToMarkdown()`

---

## Data flow

1. **User types** into a `contentEditable` text block.
2. `RichEditor` reads DOM → updates block state (`onInput`).
3. React re-renders wrappers, but avoids clobbering active text DOM.
4. Export paths:
   - blocks → markdown/plain text (`useEditor` + `lib/types/notes.ts`)
5. Import paths:
   - markdown → blocks (`markdownToBlocks`) → state

---

## Integrations (optional, app-provided)

### Link preview
`LinkPreviewBlock` expects a server endpoint (example):
- `POST /api/link-preview` → `{ url, title, description?, image?, favicon?, domain }`

### AI text actions
Editor AI actions expect (example):
- `POST /api/text-actions` with `{ action, text }` returning a text response/stream.

---

## Security notes
- **Iframes**: should remain sandboxed by default (deny-by-default policy).
- **Link preview fetching**: must be SSRF-hardened if implemented server-side.
- **Mermaid**:
  - Rendering produces SVG; treat as untrusted and keep mermaid in a constrained security mode.

---

## Build + consumption assumptions
- The repo uses a TS path alias: `@/* -> ./*` (see `tsconfig.json`).
- Styling is Tailwind-class driven, and UI primitives use Radix.
- Some features are **client-only** (Monaco, Mermaid rendering, PDF generation) and should be treated as client-rendered components.

The public entrypoint is `index.ts` (re-exports editor, preview, codec, utilities).
