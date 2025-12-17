## Plan — Build a Feature-Rich WYSIWYG Markdown Editor + Previewer as a VS Code Extension

### Outcome
Ship a VS Code extension that provides:
- **WYSIWYG Markdown editor** (block-based) with rich tooling (slash menu, toolbars, media blocks)
- **Live Markdown preview** (side-by-side + in-panel)
- **Round-trip-safe serialization** between editor blocks and a defined Markdown dialect
- **File integration**: open/save `.md` files, keep VS Code dirty state correct, support undo/redo, search, and basic settings
- **Production readiness**: tests, telemetry (optional), packaging, and Marketplace publication

This plan assumes we will reuse concepts and UI patterns from `components/editor/*` in this repo, but re-host them in a **VS Code Webview** (React UI running inside the extension).

---

## Phase 0 — Product decisions + constraints (1–2 hours)

### Decisions to lock
- **Canonical storage format**:
  - Option A: store **Markdown** as the canonical on disk (recommended for `.md` compatibility)
  - Option B: store **blocks JSON** and generate markdown (better fidelity but not a normal `.md` file)
  - Recommendation: **Markdown canonical**, with **lossless extensions** (e.g. `@[video](url)`) for rich blocks.
- **Supported block set for v1**:
  - Minimum: headings, paragraphs, lists, quote, code, divider, table
  - Rich: image/video/iframe/link preview/mermaid (like current components)
- **Preview engine**:
  - Use `markdown-it` (recommended) + plugins (tables, task lists) OR a React markdown renderer in webview.
- **Security posture**:
  - No remote code execution; sandbox iframes; SSRF-safe link preview fetch if we support it.
- **Offline first**:
  - Decide if link previews and AI are optional/off by default.

### Prompt (copy/paste for agent)
```
We are building a VS Code extension for a WYSIWYG Markdown editor + preview.
Confirm these decisions before coding:
1) Canonical file format on disk: Markdown vs blocks JSON (recommend Markdown).
2) Markdown dialect/extensions (e.g., @[video](url), @[iframe:height](url)) for round-trip.
3) Block types to include in v1 and which are v2.
4) Preview renderer choice (markdown-it vs react-markdown).
5) Security constraints (iframe sandboxing, link preview SSRF).
Return a short decision table and any risks.
```

---

## Phase 1 — Repository + extension skeleton (0.5–1 day)

### Deliverables
- A working VS Code extension scaffold:
  - `package.json` contributes a **Custom Editor** for `*.md` (and command palette items)
  - `src/extension.ts` activates and registers the editor provider
  - A `webview/` React app bundles into `dist/webview.js` (via esbuild)
  - Hot reload in dev (optional but recommended)

### Key implementation steps
- Initialize extension project layout
- Add build pipeline (esbuild) for:
  - extension host code (`src/*`)
  - webview UI (`webview/*`)
- Add `vscode-test` or `@vscode/test-electron` for basic smoke tests
- Add lint/format (optional)

### Prompt
```
Create a VS Code extension skeleton with a custom editor for .md files.
Use esbuild to bundle:
- extension host: src/extension.ts -> dist/extension.js
- webview UI: webview/index.tsx -> dist/webview.js
Include a minimal custom editor that loads a webview and can display/edit text.
Explain file/folder structure and how to run/debug in VS Code.
```

---

## Phase 2 — Webview messaging + file I/O contract (1–2 days)

### Deliverables
- Robust message bridge between extension host and webview:
  - **Open**: extension sends initial markdown content + file metadata
  - **Edit**: webview sends “document changed” events (debounced)
  - **Save**: extension persists to file and updates VS Code dirty state
  - **Undo/Redo**: integrates with VS Code undo stack (or mirrors it)

### Key design
- Define a typed message protocol (shared `shared/messages.ts`):
  - `init`, `updateFromDisk`, `edit`, `requestSave`, `saveAck`, `telemetry`, etc.
- Decide update strategy:
  - “full text replace” (simpler) vs “patches/diffs” (better performance)
  - Recommendation: start with **full markdown replace**, then evolve to patches if needed.

### Prompt
```
Implement the extension<->webview message protocol.
Requirements:
- On open: send initial markdown + URI.
- On edit: webview sends updated markdown (debounced).
- Extension updates TextDocument and dirty state correctly.
- Handle file changes on disk (reload prompt).
Provide a shared TypeScript message schema and explain lifecycle.
```

---

## Phase 3 — Editor core: blocks + Markdown round-trip (2–5 days)

### Deliverables
- A block-based editor state model in webview:
  - `Block`, `BlockType`, `Note` (adapt from `lib/types/notes.ts`)
  - `markdownToBlocks(markdown)` and `blocksToMarkdown(blocks)`
  - Unit tests for round-trip correctness

### Steps
- Port/replicate the parsing + serialization logic from the existing repo:
  - Standard markdown subset + custom `@[...]` extensions
  - Tables, mermaid code fences, etc.
- Define normalization rules (what “equal” means):
  - Whitespace normalization, list numbering normalization, etc.

### Prompt
```
Implement the webview editor data model:
- Block/Note types
- markdownToBlocks and blocksToMarkdown supporting our chosen dialect
- Round-trip tests for each block type (including custom embeds)
Use the existing repo’s logic as reference, but ensure it runs in a webview.
```

---

## Phase 4 — WYSIWYG editing UX (Notion-like) (5–10 days)

### Deliverables
- Rich WYSIWYG editor UI inside webview:
  - `contentEditable` text blocks
  - block navigation (arrow keys)
  - enter/backspace semantics (create/delete blocks)
  - slash menu (commands, fuzzy search)
  - top toolbar and selection toolbar
  - intelligent paste (markdown → blocks)

### Implementation notes
- Prefer the existing approach from `components/editor/rich-editor.tsx`:
  - DOM-managed initialization to prevent cursor jumps
  - onInput sync from DOM → blocks state
- Avoid `document.execCommand` if it causes instability in webview; if used, scope it carefully.

### Prompt
```
Build the WYSIWYG block editor UI in the webview.
Must include:
- contentEditable paragraph/headings/lists/quote
- Enter creates next block; Backspace deletes empty block
- Arrow up/down cross-block navigation
- Slash menu with fuzzy search and insert/change block type
- Paste: if clipboard contains block-level markdown, convert to blocks
Ensure no cursor jumping; explain DOM/state sync strategy.
```

---

## Phase 5 — Previewer (Markdown + rich embeds) (2–4 days)

### Deliverables
- Live preview modes:
  - Side-by-side preview panel
  - Toggle “Preview” tab within the same webview
  - Optional: open in VS Code’s native markdown preview as well

### Requirements
- Preview respects the same Markdown dialect/extensions used by the editor.
- Custom rendering for:
  - `@[video](url)` → embedded player (or safe link)
  - `@[iframe:height](url)` → sandboxed iframe (optional)
  - Mermaid blocks: rendered SVG (or code fallback)

### Prompt
```
Implement a live previewer for the editor content.
Use markdown-it (or chosen renderer) and support custom extensions:
- @[video](url)
- @[iframe:height](url)
- mermaid fences
Provide side-by-side mode and in-webview tab toggle.
Ensure security: sandbox iframes; sanitize HTML.
```

---

## Phase 6 — Rich blocks (media, code, tables, mermaid) (5–12 days, incremental)

### Deliverables (incremental)
- Code block editor (Monaco) with language selection and copy
- Tables with editable cells and keyboard nav
- Image via URL + fullscreen
- Video (YouTube/Vimeo) parsing + lazy embed
- Iframe embed with height controls and interaction toggle
- Link preview cards (optional; may require backend-like fetch in extension host)
- Mermaid editor/preview

### Key design (extension host responsibilities)
- If doing link previews:
  - Extension host fetches metadata to avoid CORS limits in webview
  - Must implement SSRF protections (deny private networks, limit size/time)

### Prompt
```
Add rich blocks one by one:
1) Code block (Monaco) with language select + copy
2) Table block with editable cells + keyboard navigation
3) Image/Video/Iframe blocks with safe embedding
4) Mermaid block with edit/preview and SVG rendering
For each: update block schema, serialization, parsing, and add tests.
```

---

## Phase 7 — VS Code integration polish (3–7 days)

### Deliverables
- Commands:
  - “Open WYSIWYG Editor”
  - “Toggle Preview”
  - “Export HTML/PDF”
- Settings:
  - default preview mode
  - enable/disable embeds
  - enable/disable AI
  - mermaid theme
- Accessibility pass (keyboard nav, focus management)
- Performance pass:
  - virtualization (if needed for large docs)
  - lazy-load Monaco and Mermaid
  - debounce updates to the extension host

### Prompt
```
Polish VS Code integration:
- add commands and settings
- improve accessibility (keyboard/focus)
- optimize performance (debounce, lazy-load, optional virtualization)
Provide a checklist and implement the highest ROI items first.
```

---

## Phase 8 — Testing, CI, release (2–5 days)

### Deliverables
- Unit tests:
  - markdown round-trip
  - parsing edge cases
- Integration tests (smoke):
  - open `.md`, edit, save, reopen
- CI pipeline to build and package `.vsix`
- Versioning and changelog discipline

### Prompt
```
Add test coverage:
- unit tests for markdown<->blocks round-trip
- integration test that opens a .md, edits, saves, reloads
Add a CI workflow to build and package a .vsix artifact.
```

---

## Phase 9 — Marketplace publishing (1 day)
See `docs/instructions.md` for the concrete steps and required assets.

### Prompt
```
Prepare the extension for VS Code Marketplace:
- verify metadata, icons, README, changelog, license
- package with vsce
- publish using a publisher + PAT
List all requirements that must be met before publish.
```
