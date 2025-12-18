"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { Block, BlockType, Note } from "@/lib/types/notes";
import { generateId, createEmptyBlock } from "@/lib/types/notes";

export interface EditorState {
  blocks: Block[];
  title: string;
  icon: string;
  tags: string[];
  focusedBlockId: string | null;
  selection: {
    start: number;
    end: number;
    blockId: string | null;
  } | null;
}

export interface EditorActions {
  // Block operations
  addBlock: (type: BlockType, afterBlockId?: string) => string;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (blockId: string) => void;
  moveBlock: (blockId: string, direction: "up" | "down") => void;

  // Content operations
  setTitle: (title: string) => void;
  setIcon: (icon: string) => void;
  setTags: (tags: string[]) => void;

  // Focus operations
  setFocusedBlock: (blockId: string | null) => void;

  // Selection operations
  setSelection: (selection: EditorState["selection"]) => void;
  getSelectedText: () => string;

  // Bulk operations
  setBlocks: (blocks: Block[]) => void;

  // Export
  toNote: (existingNote?: Note) => Note;
  toMarkdown: () => string;
  toPlainText: () => string;
}

export function useEditor(initialNote?: Note) {
  const [state, setState] = useState<EditorState>(() => ({
    blocks: initialNote?.blocks?.length
      ? initialNote.blocks
      : [createEmptyBlock()],
    title: initialNote?.title || "",
    icon: initialNote?.icon || "📝",
    tags: initialNote?.tags || [],
    focusedBlockId: null,
    selection: null,
  }));

  const editorRef = useRef<HTMLDivElement>(null);

  // Add a new block
  const addBlock = useCallback(
    (type: BlockType, afterBlockId?: string): string => {
      const newBlock = createEmptyBlock(type);

      setState((prev) => {
        const blocks = [...prev.blocks];

        if (afterBlockId) {
          const index = blocks.findIndex((b) => b.id === afterBlockId);
          if (index !== -1) {
            blocks.splice(index + 1, 0, newBlock);
          } else {
            blocks.push(newBlock);
          }
        } else {
          blocks.push(newBlock);
        }

        return {
          ...prev,
          blocks,
          focusedBlockId: newBlock.id,
        };
      });

      return newBlock.id;
    },
    []
  );

  // Update a block
  const updateBlock = useCallback(
    (blockId: string, updates: Partial<Block>) => {
      setState((prev) => ({
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block
        ),
      }));
    },
    []
  );

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setState((prev) => {
      const blocks = prev.blocks.filter((b) => b.id !== blockId);

      // Ensure at least one block exists
      if (blocks.length === 0) {
        blocks.push(createEmptyBlock());
      }

      // Update focus to previous block or first block
      const deletedIndex = prev.blocks.findIndex((b) => b.id === blockId);
      const newFocusIndex = Math.max(0, deletedIndex - 1);

      return {
        ...prev,
        blocks,
        focusedBlockId: blocks[newFocusIndex]?.id || null,
      };
    });
  }, []);

  // Move a block up or down
  const moveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    setState((prev) => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex((b) => b.id === blockId);

      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= blocks.length) return prev;

      // Swap blocks
      const a = blocks[index];
      const b = blocks[newIndex];
      if (!a || !b) return prev;
      blocks[index] = b;
      blocks[newIndex] = a;

      return { ...prev, blocks };
    });
  }, []);

  // Set title
  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  // Set icon
  const setIcon = useCallback((icon: string) => {
    setState((prev) => ({ ...prev, icon }));
  }, []);

  // Set tags
  const setTags = useCallback((tags: string[]) => {
    setState((prev) => ({ ...prev, tags }));
  }, []);

  // Set focused block
  const setFocusedBlock = useCallback((blockId: string | null) => {
    setState((prev) => ({ ...prev, focusedBlockId: blockId }));
  }, []);

  // Set selection
  const setSelection = useCallback((selection: EditorState["selection"]) => {
    setState((prev) => ({ ...prev, selection }));
  }, []);

  // Get selected text
  const getSelectedText = useCallback((): string => {
    const selection = window.getSelection();
    return selection?.toString() || "";
  }, []);

  // Set blocks (bulk update)
  const setBlocks = useCallback((blocks: Block[]) => {
    setState((prev) => ({
      ...prev,
      blocks: blocks.length > 0 ? blocks : [createEmptyBlock()],
    }));
  }, []);

  // Convert to Note object
  const toNote = useCallback(
    (existingNote?: Note): Note => {
      return {
        id: existingNote?.id || generateId(),
        title: state.title || "Untitled",
        icon: state.icon,
        blocks: state.blocks,
        tags: state.tags,
        createdAt: existingNote?.createdAt || new Date(),
        updatedAt: new Date(),
        projectId: existingNote?.projectId,
        isPinned: existingNote?.isPinned,
        position: existingNote?.position,
      };
    },
    [state]
  );

  // Convert to Markdown
  const toMarkdown = useCallback((): string => {
    return state.blocks
      .map((block) => {
        switch (block.type) {
          case "heading1":
            return `# ${block.content}`;
          case "heading2":
            return `## ${block.content}`;
          case "heading3":
            return `### ${block.content}`;
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
          case "iframe":
            return block.meta?.url ? `[Embed](${block.meta.url})` : "";
          case "table":
            if (block.meta?.tableData) {
              const data = block.meta.tableData;
              if (data.length === 0) return "";
              const headerRow = data[0];
              if (!headerRow) return "";
              const header = `| ${headerRow.join(" | ")} |`;
              const separator = `| ${headerRow.map(() => "---").join(" | ")} |`;
              const rows = data
                .slice(1)
                .map((row) => `| ${row.join(" | ")} |`)
                .join("\n");
              return `${header}\n${separator}\n${rows}`;
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
      .filter(Boolean)
      .join("\n\n");
  }, [state.blocks]);

  // Convert to plain text
  const toPlainText = useCallback((): string => {
    return state.blocks
      .filter(
        (b) =>
          !["divider", "image", "video", "embed", "iframe", "mermaid"].includes(
            b.type
          )
      )
      .map((b) => b.content)
      .filter(Boolean)
      .join("\n");
  }, [state.blocks]);

  const actions: EditorActions = useMemo(
    () => ({
      addBlock,
      updateBlock,
      deleteBlock,
      moveBlock,
      setTitle,
      setIcon,
      setTags,
      setFocusedBlock,
      setSelection,
      getSelectedText,
      setBlocks,
      toNote,
      toMarkdown,
      toPlainText,
    }),
    [
      addBlock,
      updateBlock,
      deleteBlock,
      moveBlock,
      setTitle,
      setIcon,
      setTags,
      setFocusedBlock,
      setSelection,
      getSelectedText,
      setBlocks,
      toNote,
      toMarkdown,
      toPlainText,
    ]
  );

  return {
    state,
    actions,
    editorRef,
  };
}
