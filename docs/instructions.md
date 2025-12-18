## Instructions — Using `viewdue-markdown` in an app

This repo provides **React components** for:
- a block-based **WYSIWYG Markdown editor** (`RichEditor`)
- a **Markdown preview renderer** (`MarkdownPreview`)

---

## Runtime expectations

### Styling
These components are Tailwind-class driven.
- You need **Tailwind CSS** configured in the consuming app.
- You also need CSS variables compatible with the `bg-background`, `text-foreground`, etc. tokens (shadcn-style theme tokens).

### UI primitives
`components/ui/*` uses Radix UI packages (DropdownMenu, Popover, Tabs, Select, etc.).
If you consume these components by installing this package, those dependencies come along; if you copy/paste source files into another repo, install the corresponding `@radix-ui/react-*` deps.

### Client-only note
Some features are **client-only** (notably Monaco, Mermaid rendering, and PDF generation). Make sure you render the editor/preview from client-rendered components in your app.

---

## Basic usage

### `RichEditor`
- Provide `onClose` and `onSave` callbacks.
- Optionally pass an initial `note`.

### `MarkdownPreview`
- Pass a markdown string.
- Use `isPdfMode` when rendering inside the PDF flow.

---

## Development (this repo)
- Install: `bun install`
- Typecheck/build: `bun run build`

Note: this repo currently focuses on component source; it does not ship an example app by default.
