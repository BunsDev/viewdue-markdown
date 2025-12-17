## Architecture — VS Code WYSIWYG Markdown Editor + Previewer Extension

### Goals
- Provide a **WYSIWYG editing experience** for Markdown while keeping `.md` files as the canonical storage format.
- Maintain a **round-trip safe** conversion between a structured editor model (blocks) and Markdown (dialect + extensions).
- Fit cleanly into VS Code’s extension model (custom editor + webview) with strong security and performance.

---

## System overview

### Components
- **Extension host (Node runtime)**
  - Registers the custom editor provider for `*.md`
  - Owns document persistence (read/write), VS Code dirty state, undo integration
  - Optionally performs privileged work for the webview:
    - Link preview fetching (avoids CORS, can be secured)
    - AI calls (keeps keys out of webview)
- **Webview UI (browser sandbox)**
  - React-based editor UI (WYSIWYG block editor)
  - Live preview rendering
  - Stateless regarding disk I/O (communicates through message bridge)
- **Shared layer**
  - TypeScript message protocol + domain types (Block/Note)
  - Markdown codec (parse/serialize) shared or duplicated with strict tests

---

## Runtime architecture

### 1) Custom editor lifecycle
1. User opens `file.md`
2. VS Code routes to our **Custom Editor Provider**
3. Extension host:
   - Reads markdown content
   - Creates webview panel and injects `dist/webview.js`
   - Sends an `init` message with the markdown + URI + settings
4. Webview:
   - Parses markdown → blocks
   - Renders editor UI
5. On edits:
   - Webview emits `edit` messages (debounced)
   - Extension host updates the document model / triggers save
6. On save:
   - Extension writes markdown to disk and clears dirty state

### 2) Message bridge
Use a typed protocol (recommended files):
- `shared/messages.ts`
- `shared/types.ts`

Message categories:
- **Initialization**: `init`, `settingsChanged`
- **Editing**: `editMarkdown`, `editBlocks` (choose one canonical direction)
- **Persistence**: `requestSave`, `saveAck`, `updateFromDisk`
- **Utility**: `requestLinkPreview`, `linkPreviewResult`, `telemetry`

Recommended strategy:
- Webview emits **markdown** as the canonical delta to persist.
- Webview maintains blocks locally for UX.

---

## Editor architecture (webview)

### Data model
- **Block**: `{ id, type, content, meta? }`
- **BlockType**: paragraph, headings, lists, quote, code, divider, image, video, iframe, table, mermaid, linkPreview

The block schema should be compatible with the existing repo’s `lib/types/notes.ts`, adapted for extension needs.

### Markdown codec (dialect)
Support a clearly-defined subset + extensions:
- Standard subset: headings, paragraphs, lists, task lists, quotes, fences, tables, images, links
- Extensions (lossless):
  - `@[video](url)`
  - `@[iframe:height](url)`
  - Mermaid fences: ```mermaid … ```

The codec must satisfy:
- Deterministic serialization
- Round-trip invariants for supported features

### UI components (recommended modules)
- `EditorShell`: layout, tabs (Edit/Preview), status bar (word count, etc.)
- `RichEditor`: block editor surface (contentEditable + block wrappers)
- `SlashMenu`: insert/transform commands
- `Toolbars`:
  - top toolbar (formatting + insert)
  - selection toolbar (formatting + actions)
- `Blocks`:
  - `CodeBlock` (Monaco, lazy-loaded)
  - `TableBlock`
  - `ImageBlock`
  - `VideoBlock`
  - `IframeBlock`
  - `LinkPreviewBlock`
  - `MermaidBlock`
- `Preview`: markdown renderer + custom extension handlers

### State management
Keep it simple:
- A local `useEditor()` hook for block state + actions
- A message queue/debounce layer for emitting updates to extension host
- Optional: history stack for undo/redo if VS Code integration isn’t sufficient

---

## Security architecture

### Webview constraints
- Use a strict **Content Security Policy**:
  - Avoid `unsafe-inline`
  - Only load local scripts via `webview.asWebviewUri`
- Treat all external content as untrusted.

### Embeds
- **Iframes**:
  - `sandbox` with minimal allowances (default deny)
  - Optionally disable embeds by setting
- **Mermaid**:
  - Prefer strict mermaid security mode
  - Sanitize rendered SVG if necessary

### Link preview fetching
Prefer extension host fetch:
- Validations:
  - Only `http`/`https`
  - Deny private IP ranges and localhost
  - Limit redirects, response size, and timeouts
- Cache results

---

## Performance architecture

### Key tactics
- Avoid React-controlled text for active typing:
  - DOM-managed `contentEditable` initialization
  - Minimal rerenders for text blocks (memoization)
- Debounce host updates (e.g., 150–300ms)
- Lazy-load heavy dependencies:
  - Monaco
  - Mermaid
- Consider virtualization for very large documents (v2)

---

## Packaging architecture

### Build outputs
- `dist/extension.js` (extension host)
- `dist/webview.js` + `dist/webview.css` (webview UI)
- `resources/` (icon, etc.)

### Release artifacts
- `.vsix` packaged via `@vscode/vsce`

