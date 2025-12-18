// Public entrypoint for the viewdue-markdown component package.
//
// Note: this repo uses a tsconfig path alias of `@/* -> ./*`.
// Consumers should either preserve that alias in their build, or update imports
// if they copy these components into another project.

// Editor (WYSIWYG)
export * from "@/components/editor";

// Markdown rendering (preview)
export { MarkdownPreview } from "@/components/markdown-preview";

// Markdown custom-component helpers
export * from "@/lib/markdown-parser";

// Domain types + markdown <-> blocks codec
export {
  type Note,
  type Block,
  type BlockType,
  markdownToBlocks,
  blocksToMarkdown,
  generateId,
} from "@/lib/types/notes";

// Shared utils (cn, etc.)
export * from "@/lib/utils";
