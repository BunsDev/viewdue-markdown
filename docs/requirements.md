## WYSIWYG Markdown Editor — Requirements, Architecture, and Plan

### Product goal

Build a **fast, Notion-style WYSIWYG editor** that:

- **Edits structured blocks** (headings, lists, media, embeds, code, tables, diagrams)
- **Imports/exports Markdown** (round-trip safe for supported features)
- Feels “native”: instant typing, stable cursor, rich keyboard shortcuts, paste that “just works”

This repo already contains most of the editor surface area in `components/editor/*`. This document formalizes the **contract** (data model, markdown dialect, APIs), defines the **requirements**, and proposes an **implementation plan** to productionize it.

---

## Current implementation inventory (what exists today)

### Editor core

- **Block model**: `lib/types/notes.ts` defines `Block`, `BlockType`, and `Note`, plus `markdownToBlocks()` and `blocksToMarkdown()` helpers.
- **WYSIWYG editor UI**: `components/editor/rich-editor.tsx`
  - Uses a **single `.editor-blocks` container** for cross-block selection.
  - Each text block is a `contentEditable` element with DOM-managed initialization to avoid React overwriting user input.
  - Includes:
    - Markdown prefix auto-conversion (e.g. `# ` → heading)
    - Inline markdown conversion (e.g. `**bold**` → `<strong>…</strong>`) via DOM mutation
    - Slash commands (`/…`) and a command palette
    - Paste handling: detect markdown, parse to blocks, insert into document
- **Editor state/actions**: `components/editor/use-editor.ts` (blocks, title, add/update/delete/move blocks, export to markdown/plain text)

### Blocks (already implemented)

- **Text blocks**: paragraph, headings, quote, lists, checklist, divider (rendered in `rich-editor.tsx`)
- **Code block**: `components/editor/blocks/code-block.tsx` (Monaco via `@monaco-editor/react`, language dropdown, copy)
- **Image block**: `components/editor/blocks/image-block.tsx` (URL input, loading/error, fullscreen view)
- **Video block**: `components/editor/blocks/video-block.tsx` (YouTube/Vimeo detection, thumbnail lazy-play, iframe embed)
- **Iframe block**: `components/editor/blocks/iframe-block.tsx` (URL bar, reload, resizable height, “interactive” toggle, sandboxed iframe)
- **Link preview block**: `components/editor/blocks/link-preview-block.tsx` (calls `/api/link-preview`, caches previews)
- **Table block**: `components/editor/blocks/table-block.tsx` (editable cells, keyboard nav, add/remove rows/cols)
- **Mermaid block**: `components/editor/blocks/mermaid-block.tsx` (edit/preview, renders mermaid SVG, copy)
- **Media wrapper**: `components/editor/blocks/media-block-wrapper.tsx` (insert paragraph above/below media blocks)

### Toolbars and command UX

- **Slash menu**: `components/editor/slash-menu.tsx` (fuzzy search; media blocks + AI actions; language sub-menu for code)
- **Top toolbar**: `components/editor/toolbar/editor-toolbar.tsx` (formatting via `document.execCommand`, insert menu)
- **Selection toolbar**: `components/editor/toolbar/selection-toolbar.tsx` (formatting and AI menu for selected text)
- **URL modal**: `components/editor/url-input-modal.tsx` (image/video/link/iframe)

### Export

- `components/editor/export-utils.ts`: blocks → Markdown, plain text, HTML, “PDF” via `window.print()`

---

## Known gaps / repo alignment issues (must be resolved for a standalone package)

These are not product requirements; they’re **engineering prerequisites** to make the editor build/run in this repo cleanly:

- **Dependency alignment**:
  - This repo depends on Mermaid and Radix UI primitives used by `components/ui/*` and the Mermaid renderers. Keep `package.json` aligned with imports as the component set evolves.
- **Duplicate/overlapping utilities**: `generateId()` exists in both `lib/utils.ts` and `lib/types/notes.ts`

Decision point:

- If this repo is meant to be a **component library**, remove `next/*` usage and avoid Next-only assumptions.
- If this repo is meant to be a **Next app**, add `next` and include any required app routes for link previews / AI actions.

---

## Scope definition

### In-scope (v1)

- Block-based WYSIWYG editing for the supported block types
- Reliable import/export to Markdown for those block types (including custom extensions)
- Rich keyboard behavior (enter/backspace/navigation)
- Copy/paste experience that preserves structure
- Link previews (server-assisted fetch) and embed blocks (iframe/video)
- Mermaid diagrams with safe rendering constraints
- Code editing with Monaco (lazy loaded)
- Export to Markdown/HTML/PDF (print)

### Explicitly out-of-scope (until v2+)

- Real-time multiplayer collaboration
- Full CommonMark + GFM compliance for arbitrary markdown (we support a well-defined subset + extensions)
- Arbitrary HTML paste with full fidelity
- Nested lists and deep list indentation UX (unless we add a proper list model)
- End-to-end encryption

---

## Functional requirements

### Document model

#### Block schema (canonical)

- **Block**: `{ id, type, content, meta? }` as defined in `lib/types/notes.ts`
- **Note**: `{ id, title, icon, blocks, tags, createdAt, updatedAt, … }`

#### Requirements

- **Stable IDs**: blocks must have stable IDs to preserve focus, selection, and diffing.
- **Deterministic serialization**:
  - `blocks -> markdown` must be deterministic (no ordering instability, no random whitespace)
  - `markdown -> blocks` must parse the supported dialect reliably
- **Round-trip guarantee** (for supported features):
  - For any content produced by this editor, the transformation must hold:
    - `blocks == markdownToBlocks(blocksToMarkdown(blocks))` (modulo allowed normalizations)

### Markdown dialect

#### Supported standard Markdown subset

- Headings `#`, `##`, `###`
- Paragraphs
- Bullets `- ` / `* `
- Numbered list `1. `
- Checklist `- [ ]` (and tolerate `- [x]`)
- Blockquote `> `
- Horizontal rule `---` / `***`
- Images `![alt](url)`
- Links `[title](url)` (used for link previews)
- Fenced code blocks:
  - ```lang

    ```
  - code…
  - ```

    ```
- Tables (GFM-style pipes) as implemented in `markdownToBlocks()`

#### Custom extensions (required for round-trip)

These extensions are already implemented in `lib/types/notes.ts` and should be treated as part of the product contract:

- **Video embed**: `@[video](url)`
- **Iframe embed**: `@[iframe](url)` or `@[iframe:height](url)`
- (Optional/forward-looking) **Collapsible headings**: `<#`, `<##`, `<###` prefixes exist in types/parsing; define UX or remove.

#### Requirements

- **Never silently lose information**:
  - If a block cannot serialize to standard markdown without loss, it must serialize using an extension marker or fall back to a safe representation.
- **Backwards compatibility**:
  - Once a dialect is shipped, changes must be versioned (e.g., `@[…]` syntax changes require migration).

### Editing UX

#### Text editing

- **Single keystroke latency**: typing must feel instantaneous (no cursor jumps).
- **Selection**:
  - Must support selection across multiple blocks for copy/cut and AI operations.
- **Formatting**:
  - Toolbar formatting must work for selection (bold/italic/underline/strike, links).
  - Inline markdown affordance:
    - typing `**bold**` should render to bold (already implemented)
    - must preserve plain text copy where reasonable

#### Block operations

- **Create block**: Enter creates a new paragraph block after the current block.
- **Delete block**: Backspace on empty block deletes it (never delete the last remaining block).
- **Navigate blocks**: Arrow up/down across blocks when cursor is at start/end (already implemented in `rich-editor.tsx`).
- **Slash menu**:
  - `/` opens command palette with fuzzy search
  - selecting an item changes the current block or inserts a new block, depending on command
  - must be keyboard-navigable and click-outside dismissible

#### Paste behavior

- If pasted text contains **block-level markdown** (headings/lists/code/tables), paste should:
  - Convert to blocks and insert into the document near the caret
  - Preserve structure and avoid dumping raw markdown into a paragraph
- If pasted content is plain text, allow normal browser paste behavior.

### Block types (feature requirements)

#### Code block

- Monaco editor must be lazy-loaded.
- Must support:
  - language selection
  - copy to clipboard
  - read-only and editable modes
- Markdown serialization:
  - ```lang fences

    ```

#### Table

- Editable cells, keyboard navigation (tab/enter/arrows)
- Add/remove rows/cols
- Markdown serialization: pipe table format (header + separator + rows)

#### Image

- Add via URL input and/or modal
- Loading/error states
- Fullscreen preview
- Markdown serialization: `![alt](url)`

#### Video

- Support YouTube and Vimeo URL parsing
- Lazy-load embed (thumbnail → play)
- “Open in tab” / external link
- Markdown serialization: `@[video](url)` (preferred for round-trip) or a safe fallback

#### Iframe

- Embed arbitrary HTTPS URL
- Resizable height and presets
- Interaction toggle (to avoid scroll capture)
- Sandbox restrictions by default
- Markdown serialization: `@[iframe:height](url)`

#### Link preview

- Render link cards using server-fetched metadata
- Provide fallback rendering when preview fetch fails
- Markdown serialization: `[title](url)` or URL-only line (acceptable)

#### Mermaid

- Edit/preview toggle
- Render SVG and show errors
- Copy source
- Markdown serialization: fenced code block with `mermaid` info string
- Security: do not allow diagram rendering to execute arbitrary scripts

### AI assistance (optional for v1, required for v1.1)

- Trigger from:
  - selection toolbar (selected text)
  - slash menu (full document)
  - context menu (selected text)
- Flow:
  - Send request to an API endpoint (streaming allowed)
  - Show confirmation modal with original vs suggested text
  - Apply changes:
    - **v1**: copy-to-clipboard is acceptable
    - **v1.1**: replace selection or insert a block diff

---

## Backend/API requirements (full-stack)

### Link preview API

- **Route**: `POST /api/link-preview`
- **Input**: `{ url: string }`
- **Output**: `{ url, title, description?, image?, favicon?, domain }`
- **Requirements**:
  - SSRF protection: block private IPs and non-http(s) schemes
  - Timeouts and size limits
  - Caching (memory + optionally persistent)

### AI text actions API

- **Route**: `POST /api/text-actions`
- **Input**: `{ action: string, text: string }`
- **Output**: text stream or `{ result: string }`
- **Requirements**:
  - Rate limiting per user/project
  - Audit logging (action, request size, latency)
  - Data handling policy (do not store user content unless configured)

### Persistence API (if building an app)

- CRUD for `Note`
- Decide storage strategy:
  - Store blocks JSON as canonical, plus a derived markdown string for export/search
  - Or store markdown as canonical and derive blocks on load (less safe for media/meta)

---

## Non-functional requirements

### Performance

- **Typing**: no full-react re-render on every keystroke; DOM-managed contentEditable is acceptable but must remain stable.
- **Large docs**: must handle at least 1,000 blocks without becoming unusable.
- **Media embeds**: lazy-load heavy components (Monaco, mermaid, iframes).

### Reliability

- Never lose user data on refresh:
  - autosave local draft (localStorage/IndexedDB) or server autosave
  - explicit “dirty state” tracking

### Accessibility

- Keyboard navigability for slash menu and toolbars
- Focus indicators and ARIA labels for buttons and menus
- Ensure modals trap focus and close on Escape

### Security

- Treat any external content as untrusted:
  - Link preview fetch must be hardened (SSRF)
  - Iframes sandboxed
  - Mermaid securityLevel should be constrained (avoid “loose” in production unless justified)
- Avoid injecting untrusted HTML:
  - Table cells currently use `dangerouslySetInnerHTML` to preserve content; must sanitize or store plain text only.

---

## Architecture

### High-level design

The editor is a **block-based structured editor** with a WYSIWYG surface:

- **Source of truth**: array of `Block` objects
- **View**: React renders block shells, but **text input is DOM-managed** (contentEditable) and synced back into state on input
- **Serialization**: Markdown dialect is the interchange format; blocks are the canonical internal model

### Data flow

1. User types into `contentEditable` DOM
2. `onInput` reads DOM → updates block content in state
3. State changes render block wrappers (but avoid overwriting DOM text while typing)
4. Export pipeline: `blocks -> markdown/html/plaintext`
5. Import pipeline: `markdown -> blocks -> state`

### Recommended internal “Block Registry” (to reduce switch statements)

Replace hard-coded `switch(block.type)` with a registry:

- `BlockSpec`:
  - `type`, `label`, `icon`
  - `isTextLike` / `contentEditable` strategy
  - `render(block, actions)`
  - `toMarkdown(block)`
  - `fromMarkdown(line(s))` or parse hooks
    This makes it easy to add new blocks without touching core editor logic.

---

## Implementation plan (phased)

### Phase 0 — Make the repo buildable (1–2 days)

- Decide target: **library** vs **app**
- Align dependencies:
  - add missing runtime deps (`mermaid`, Radix UI packages, etc.)
- Dedupe shared helpers where needed (e.g. `generateId()` exists in both `lib/utils.ts` and `lib/types/notes.ts`)

### Phase 1 — MVP editor package (3–5 days)

- Ship `RichEditor` as the primary component export with:
  - blocks, slash menu, toolbars, URL modal
  - markdown import/export + paste conversion
- Add unit tests for:
  - markdown round-trip for every block type
  - edge cases: empty docs, code fences, tables, custom embeds

### Phase 2 — Production hardening (1–2 weeks)

- Implement backend endpoints:
  - `/api/link-preview` with SSRF protection + caching
  - `/api/text-actions` with rate limiting
- Security hardening:
  - sanitize any HTML injection paths (tables, previews)
  - tighten mermaid rendering config
- Autosave strategy + conflict handling (if app)

### Phase 3 — UX polish + advanced behaviors (2–4 weeks)

- True “apply AI suggestion” to replace selection / blocks (not just copy)
- Better list semantics (indent/outdent, multi-line list items)
- Search within note, block dragging/reordering UI
- Mobile editing improvements

---

## Acceptance criteria (definition of done)

### Core editing

- Can create/edit all supported blocks via slash menu and toolbar.
- Enter creates a new paragraph block; backspace deletes empty blocks safely.
- Paste of markdown produces correct blocks; plain text paste behaves normally.

### Import/export correctness

- Exported markdown re-imports to identical blocks for:
  - headings, paragraphs, lists, checklists, quotes, dividers
  - code (with language), tables, mermaid
  - images, link previews
  - video/iframe via `@[...]` extensions

### Performance

- No cursor jump during typing.
- Code/mermaid loads lazily and does not block initial editor render.

---

## Open questions

- Is the canonical persistence format **blocks JSON** or **markdown**?
- Do we require **collapsible headings** UX, or should we remove those types?
- Should video serialize as `@[video](url)` (lossless) or standard markdown links (portable)?
- Are we targeting a standalone editor library, or a Next/Bun application with API routes?
