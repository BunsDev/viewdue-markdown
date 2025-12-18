"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  memo,
  type KeyboardEvent,
} from "react";
import {
  X,
  ArrowUpRight,
  BookOpen,
  Bug,
  ClipboardCopy,
  Maximize2,
  Clock,
  Save,
  Brain,
  Loader2,
  Share2,
  Download,
  MoreHorizontal,
  FileDown,
  FileText,
  FileType,
  Check,
  Lightbulb,
  ListTodo,
  MessageSquare,
  Sparkles,
  SpellCheck,
  Twitter,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Note, Block, BlockType } from "@/lib/types/notes";
import {
  generateId,
  createEmptyBlock,
  markdownToBlocks,
  hasMarkdownSyntax,
} from "@/lib/types/notes";
import { useEditor } from "./use-editor";
import { SlashMenu } from "./slash-menu";
import { SelectionToolbar } from "./toolbar/selection-toolbar";
import { ImageBlock } from "./blocks/image-block";
import { VideoBlock } from "./blocks/video-block";
import { LinkPreviewBlock } from "@/components/editor/blocks/link-preview-block";
import { IframeBlock } from "@/components/editor/blocks/iframe-block";
import { TableBlock } from "@/components/editor/blocks/table-block";
import { MermaidBlock } from "@/components/editor/blocks/mermaid-block";
import { MonacoCodeBlock } from "@/components/editor/blocks/code-block";
import { MediaBlockWrapper } from "./blocks/media-block-wrapper";
import { UrlInputModal } from "@/components/editor/url-input-modal";
import {
  EditorTabs,
  type EditorTab,
} from "@/components/editor/tabs/editor-tabs";
import { AIConfirmationModal } from "@/components/editor/toolbar/ai-confirmation-modal";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { PdfPreviewModal } from "@/components/notes/pdf-preview-modal";

// Text block component - rendered inside unified contentEditable
// Uses ref-based content management to avoid React overwriting user input
interface TextBlockProps {
  block: Block;
  placeholder: string;
  className: string;
  onRef: (el: HTMLDivElement | null) => void;
}

const TextBlock = memo(
  function TextBlock({ block, placeholder, className, onRef }: TextBlockProps) {
    const elRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const blockIdRef = useRef(block.id);

    // Set content via DOM - only on mount or when block changes (not during typing)
    useEffect(() => {
      if (!elRef.current) return;

      const content = block.content || "";
      const isNewBlock = blockIdRef.current !== block.id;

      // Only set content on first mount or when block ID changes (new block)
      if (!initializedRef.current || isNewBlock) {
        // Use innerHTML if there's inline markdown to format
        if (hasInlineMarkdown(content)) {
          elRef.current.innerHTML = convertInlineMarkdownToHtml(content);
        } else {
          elRef.current.textContent = content;
        }
        initializedRef.current = true;
        blockIdRef.current = block.id;
      }
    }, [block.content, block.id]);

    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        elRef.current = el;
        onRef(el);
      },
      [onRef]
    );

    return (
      <div
        ref={setRef}
        data-placeholder={placeholder}
        data-block-content="true"
        contentEditable
        suppressContentEditableWarning
        spellCheck={true}
        className={cn(
          className,
          "outline-none",
          !block.content && "empty-block"
        )}
      />
    );
  },
  (prevProps, nextProps) => {
    // Re-render on type, id, or content change
    return (
      prevProps.block.type === nextProps.block.type &&
      prevProps.block.id === nextProps.block.id &&
      prevProps.block.content === nextProps.block.content &&
      prevProps.className === nextProps.className
    );
  }
);

interface RichEditorProps {
  note?: Note;
  onClose: () => void;
  onSave: (note: Note) => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
  includeInAiContext?: boolean;
  onToggleAiContext?: () => void;
}

// Detect markdown prefixes for auto-conversion
const detectMarkdownPrefix = (
  text: string
): { type: BlockType; content: string } | null => {
  // Heading 3
  if (text.startsWith("### "))
    return { type: "heading3", content: text.slice(4) };
  // Heading 2
  if (text.startsWith("## "))
    return { type: "heading2", content: text.slice(3) };
  // Heading 1
  if (text.startsWith("# "))
    return { type: "heading1", content: text.slice(2) };
  // Bullet list
  if (text.startsWith("- ") || text.startsWith("* "))
    return { type: "bulletList", content: text.slice(2) };
  // Numbered list
  const numMatch = text.match(/^\d+\.\s(.*)$/);
  if (numMatch) return { type: "numberedList", content: numMatch[1] || "" };
  // Checklist
  if (text.startsWith("[ ] ") || text.startsWith("[] "))
    return { type: "checkList", content: text.slice(text.indexOf(" ") + 1) };
  // Quote
  if (text.startsWith("> ")) return { type: "quote", content: text.slice(2) };
  // Divider
  if (text === "---" || text === "***") return { type: "divider", content: "" };
  // Code block
  if (text === "```") return { type: "code", content: "" };

  return null;
};

// URL regex for auto-detection
const URL_REGEX = /^(https?:\/\/[^\s]+)$/;

// Inline markdown formatting patterns
interface InlineFormat {
  pattern: RegExp;
  tag: string;
  command?: string; // For execCommand
}

const INLINE_FORMATS: InlineFormat[] = [
  // Bold: **text** or __text__
  { pattern: /\*\*([^*]+)\*\*$/, tag: "strong", command: "bold" },
  { pattern: /__([^_]+)__$/, tag: "strong", command: "bold" },
  // Italic: *text* or _text_
  { pattern: /(?<!\*)\*([^*]+)\*(?!\*)$/, tag: "em", command: "italic" },
  { pattern: /(?<!_)_([^_]+)_(?!_)$/, tag: "em", command: "italic" },
  // Strikethrough: ~~text~~
  { pattern: /~~([^~]+)~~$/, tag: "s" },
  // Inline code: `text`
  { pattern: /`([^`]+)`$/, tag: "code" },
  // Highlight/mark: ==text==
  { pattern: /==([^=]+)==$/, tag: "mark" },
  // Underline: ++text++
  { pattern: /\+\+([^+]+)\+\+$/, tag: "u" },
];

// Convert inline markdown syntax to HTML in a string
// This processes ALL occurrences, not just at cursor position
function convertInlineMarkdownToHtml(text: string): string {
  if (!text) return text;

  let result = text;

  // Process bold+italic first (***text***)
  result = result.replace(
    /\*\*\*([^*]+)\*\*\*/g,
    "<strong><em>$1</em></strong>"
  );

  // Bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // Italic: *text* (simple pattern, process after bold)
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Strikethrough: ~~text~~
  result = result.replace(/~~([^~]+)~~/g, "<s>$1</s>");

  // Inline code: `text`
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Highlight: ==text==
  result = result.replace(/==([^=]+)==/g, "<mark>$1</mark>");

  // Underline: ++text++
  result = result.replace(/\+\+([^+]+)\+\+/g, "<u>$1</u>");

  return result;
}

// Check if text contains inline markdown that should be converted
function hasInlineMarkdown(text: string): boolean {
  if (!text) return false;
  // Check for common inline markdown patterns
  return /\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|==[^=]+==|\+\+[^+]+\+\+/.test(
    text
  );
}

// Apply inline markdown formatting
function isDirectChild(parent: Node, child: Node): boolean {
  for (let n = parent.firstChild; n; n = n.nextSibling) {
    if (n === child) return true;
  }
  return false;
}

function safeReplaceTextNode(
  textNode: Text,
  replacementNodes: Node[],
  afterCursorNode?: Node
): boolean {
  const parent = textNode.parentNode;
  if (!parent) return false;
  // `insertBefore` throws if the reference node isn't a direct child.
  if (!isDirectChild(parent, textNode)) return false;

  try {
    for (const node of replacementNodes) {
      parent.insertBefore(node, textNode);
    }
    parent.removeChild(textNode);
  } catch {
    return false;
  }

  // Restore cursor if we were given a stable node to anchor to.
  if (afterCursorNode) {
    try {
      const selection = window.getSelection();
      if (!selection) return true;
      const newRange = document.createRange();
      newRange.setStart(afterCursorNode, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } catch {
      // Cursor restore is best-effort; formatting should still be applied.
    }
  }

  return true;
}

function applyInlineFormatting(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  if (!range.collapsed) return false;

  // Get the text node and position
  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) return false;
  // If selection is outside this editor, never mutate DOM.
  if (!element.contains(textNode)) return false;

  const text = textNode.textContent || "";
  const cursorPos = range.startOffset;
  const textBeforeCursor = text.slice(0, cursorPos);

  // Check for bold+italic first (***text***) - needs special handling
  const boldItalicMatch = textBeforeCursor.match(/\*\*\*([^*]+)\*\*\*$/);
  if (boldItalicMatch) {
    const fullMatch = boldItalicMatch[0];
    const innerText = boldItalicMatch[1];
    const matchStart = cursorPos - fullMatch.length;

    // Create nested elements: <strong><em>text</em></strong>
    const strongEl = document.createElement("strong");
    const emEl = document.createElement("em");
    emEl.textContent = innerText || "";
    strongEl.appendChild(emEl);

    const beforeText = text.slice(0, matchStart);
    const afterText = text.slice(cursorPos);
    const beforeNode = document.createTextNode(beforeText);
    const afterNode = document.createTextNode(afterText);
    return safeReplaceTextNode(
      textNode as Text,
      [beforeNode, strongEl, afterNode],
      afterNode
    );
  }

  for (const format of INLINE_FORMATS) {
    const match = textBeforeCursor.match(format.pattern);
    if (match) {
      const fullMatch = match[0];
      const innerText = match[1];
      const matchStart = cursorPos - fullMatch.length;

      // Create the formatted element
      const formattedEl = document.createElement(format.tag);
      formattedEl.textContent = innerText || null;
      if (!formattedEl.textContent) return false;

      // Style inline code
      if (format.tag === "code") {
        formattedEl.className =
          "px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-sm";
      }

      // Style highlight/mark
      if (format.tag === "mark") {
        formattedEl.className =
          "bg-yellow-200 dark:bg-yellow-800/50 px-0.5 rounded-sm";
      }

      // Split the text node and insert the formatted element
      const beforeText = text.slice(0, matchStart);
      const afterText = text.slice(cursorPos);

      // Create new text nodes
      const beforeNode = document.createTextNode(beforeText);
      const afterNode = document.createTextNode(afterText);

      // Replace the original text node
      return safeReplaceTextNode(
        textNode as Text,
        [beforeNode, formattedEl, afterNode],
        afterNode
      );
    }
  }

  return false;
}

export function RichEditor({
  note,
  onClose,
  onSave,
  onFullscreen,
  isFullscreen,
  includeInAiContext,
  onToggleAiContext,
}: RichEditorProps) {
  const { state, actions, editorRef } = useEditor(note);

  // UI State
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Slash menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [slashFilter, setSlashFilter] = useState("");
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);

  // URL input modal state
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlModalType, setUrlModalType] = useState<
    "image" | "video" | "link" | "iframe"
  >("image");
  const [urlModalBlockId, setUrlModalBlockId] = useState<string | null>(null);

  // Selection toolbar state
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [selectionToolbarPosition, setSelectionToolbarPosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedText, setSelectedText] = useState("");
  const [contextMenuText, setContextMenuText] = useState("");

  // AI confirmation modal
  const [showAiConfirmation, setShowAiConfirmation] = useState(false);
  const [aiOriginalText, setAiOriginalText] = useState("");
  const [aiSuggestedText, setAiSuggestedText] = useState("");
  const [aiActionLabel, setAiActionLabel] = useState("");

  // Editor tabs for fullscreen iframes
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // PDF preview modal state
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Calculate character and word count
  const { characterCount, wordCount } = (() => {
    const allText = state.blocks.map((b) => b.content || "").join("\n");
    const chars = allText.length;
    const words = allText.trim() ? allText.trim().split(/\s+/).length : 0;
    return { characterCount: chars, wordCount: words };
  })();

  // Block refs for focus management
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle save
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const updatedNote = actions.toNote(note);
      await onSave(updatedNote);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      // Hide success state after animation completes
      setTimeout(() => setShowSaveSuccess(false), 2000);
      toast.success("Note saved");
    } catch (error) {
      toast.error("Failed to save note");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, actions, note, onSave]);

  // Track unsaved changes when content changes
  const initialContentRef = useRef<string | null>(null);

  // Set initial content snapshot after first render
  useEffect(() => {
    if (initialContentRef.current === null) {
      initialContentRef.current = JSON.stringify({
        blocks: state.blocks,
        title: state.title,
      });
    }
  }, []);

  // Detect changes from initial or last saved state
  useEffect(() => {
    if (initialContentRef.current === null) return;

    const currentContent = JSON.stringify({
      blocks: state.blocks,
      title: state.title,
    });
    const hasChanges = currentContent !== initialContentRef.current;
    setHasUnsavedChanges(hasChanges);
  }, [state.blocks, state.title]);

  // Update the reference point after saving
  useEffect(() => {
    if (lastSaved !== null && !isSaving) {
      initialContentRef.current = JSON.stringify({
        blocks: state.blocks,
        title: state.title,
      });
    }
  }, [lastSaved, isSaving, state.blocks, state.title]);

  // Download as Markdown
  const handleDownloadMarkdown = useCallback(() => {
    const markdown = actions.toMarkdown();
    const title = state.title || "untitled";
    const blob = new Blob([`# ${title}\n\n${markdown}`], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(".md saved");
  }, [actions, state.title]);

  // Download as plain text
  const handleDownloadTxt = useCallback(() => {
    const text = actions.toPlainText();
    const title = state.title || "untitled";
    const blob = new Blob([`${title}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(".txt saved");
  }, [actions, state.title]);

  // Handle slash menu selection
  const handleSlashSelect = useCallback(
    (type: BlockType | string) => {
      setShowSlashMenu(false);
      setSlashFilter("");

      if (!slashMenuBlockId) return;

      // Handle AI commands
      if (type.startsWith("ai-")) {
        const aiCommand = type.replace("ai-", "");
        handleAiCommand(aiCommand);
        actions.updateBlock(slashMenuBlockId, { content: "" });
        return;
      }

      // Handle media blocks that need URL input
      if (type === "image" || type === "video" || type === "iframe") {
        setUrlModalType(type as "image" | "video" | "iframe");
        setUrlModalBlockId(slashMenuBlockId);
        setShowUrlModal(true);
        actions.updateBlock(slashMenuBlockId, {
          type: type as BlockType,
          content: "",
        });
        return;
      }

      // Handle link preview (needs URL input)
      if (type === "linkPreview") {
        setUrlModalType("link");
        setUrlModalBlockId(slashMenuBlockId);
        setShowUrlModal(true);
        actions.updateBlock(slashMenuBlockId, {
          type: "linkPreview",
          content: "",
        });
        return;
      }

      // Handle table
      if (type === "table") {
        actions.updateBlock(slashMenuBlockId, {
          type: "table",
          content: "",
          meta: {
            rows: 3,
            cols: 3,
            tableData: [
              ["", "", ""],
              ["", "", ""],
              ["", "", ""],
            ],
          },
        });
        return;
      }

      // Handle mermaid
      if (type === "mermaid") {
        actions.updateBlock(slashMenuBlockId, {
          type: "mermaid",
          content: "",
          meta: {
            diagram:
              "flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[End]",
          },
        });
        return;
      }

      // Handle code block with optional language
      if (type === "code" || type.startsWith("code-")) {
        const language = type.startsWith("code-")
          ? type.replace("code-", "")
          : "typescript";
        actions.updateBlock(slashMenuBlockId, {
          type: "code",
          content: "",
          meta: { language },
        });
        return;
      }

      // Regular block type change
      actions.updateBlock(slashMenuBlockId, {
        type: type as BlockType,
        content: "",
      });
    },
    [slashMenuBlockId, actions]
  );

  // Handle URL modal submit
  const handleUrlSubmit = useCallback(
    (url: string) => {
      if (!urlModalBlockId) return;

      actions.updateBlock(urlModalBlockId, {
        meta: { url },
      });

      setShowUrlModal(false);
      setUrlModalBlockId(null);
    },
    [urlModalBlockId, actions]
  );

  // Handle AI commands
  const handleAiCommand = useCallback(
    async (command: string) => {
      const text = selectedText || actions.toPlainText();
      if (!text.trim()) {
        toast.error("No content to process");
        return;
      }

      setIsAiLoading(true);

      try {
        const response = await fetch("/api/text-actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: command, text }),
        });

        if (!response.ok) {
          throw new Error("Failed to process AI action");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let result = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
        }

        if (result.trim()) {
          setAiOriginalText(text);
          setAiSuggestedText(result.trim());
          setAiActionLabel(command);
          setShowAiConfirmation(true);
        }
      } catch (error) {
        console.error("AI action error:", error);
        toast.error("AI action failed");
      } finally {
        setIsAiLoading(false);
      }
    },
    [selectedText, actions]
  );

  // Handle AI action from selection toolbar
  const handleAiAction = useCallback(
    async (action: string, text: string) => {
      setSelectedText(text);
      await handleAiCommand(action);
    },
    [handleAiCommand]
  );

  // Handle AI confirmation accept
  const handleAiAccept = useCallback(() => {
    // For now, copy to clipboard - can be improved to replace selection
    navigator.clipboard.writeText(aiSuggestedText);
    toast.success("Text copied to clipboard");
    setShowAiConfirmation(false);
  }, [aiSuggestedText]);

  // Handle text selection for toolbar
  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectedText(sel.toString());
        setSelectionToolbarPosition({
          top: rect.top - 50,
          left: rect.left + rect.width / 2,
        });
        setShowSelectionToolbar(true);
      } else {
        setShowSelectionToolbar(false);
        setSelectedText("");
      }
    }, 10);
  }, []);

  const handleContextMenu = useCallback(() => {
    const sel = window.getSelection();
    setContextMenuText(sel?.toString().trim() ?? "");
  }, []);

  const handleCopySelectedText = useCallback(async () => {
    const text = (contextMenuText || selectedText).trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (e) {
      console.error("Copy failed:", e);
      toast.error("Copy failed");
    }
  }, [contextMenuText, selectedText]);

  // Get the block ID from a DOM element
  const getBlockIdFromElement = useCallback(
    (el: Node | null): string | null => {
      let current = el as HTMLElement | null;
      while (current) {
        const blockId = current.getAttribute?.("data-block-id");
        if (blockId) return blockId;
        current = current.parentElement;
      }
      return null;
    },
    []
  );

  // Handle input in the unified editor
  const handleEditorInput = useCallback(() => {
    // Get the blocks container
    const blocksContainer = editorRef.current?.querySelector(".editor-blocks");
    if (!blocksContainer) return;

    // Try to apply inline markdown formatting first
    const formattingApplied = applyInlineFormatting(
      blocksContainer as HTMLElement
    );

    // Sync each block's content from DOM to state
    const blockElements = blocksContainer.querySelectorAll("[data-block-id]");
    blockElements.forEach((el) => {
      const blockId = el.getAttribute("data-block-id");
      if (!blockId) return;

      // Find the editable text content node within this block wrapper
      const textEl = el.querySelector(
        '[data-block-content="true"]'
      ) as HTMLElement | null;
      if (!textEl) return; // media blocks, divider, etc.
      const content = textEl.textContent || "";

      const block = state.blocks.find((b) => b.id === blockId);
      if (block && block.content !== content) {
        // Check for slash command
        if (content.startsWith("/")) {
          const rect = (textEl as HTMLElement).getBoundingClientRect();
          setSlashMenuPosition({ top: rect.bottom + 4, left: rect.left });
          setSlashFilter(content.slice(1));
          setSlashMenuBlockId(blockId);
          setShowSlashMenu(true);
        } else {
          setShowSlashMenu(false);
        }

        // Check for markdown shortcut (only if inline formatting wasn't applied)
        if (!formattingApplied && block.type === "paragraph") {
          const result = detectMarkdownPrefix(content);
          if (result) {
            // Update block type and content in state
            actions.updateBlock(blockId, {
              type: result.type,
              content: result.content,
            });

            // Also update DOM to strip the markdown prefix (so it disappears like Notion)
            const htmlEl = textEl as HTMLElement;
            htmlEl.textContent = result.content;

            // Place cursor at the end of the content
            const range = document.createRange();
            const sel = window.getSelection();
            if (htmlEl.childNodes.length > 0) {
              const lastNode = htmlEl.childNodes[htmlEl.childNodes.length - 1];
              if (!lastNode) return;
              range.setStart(lastNode, lastNode.textContent?.length || 0);
            } else {
              range.setStart(htmlEl, 0);
            }
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
            return;
          }
          // Check for URL auto-convert
          if (URL_REGEX.test(content.trim())) {
            actions.updateBlock(blockId, {
              type: "linkPreview",
              content: "",
              meta: { url: content.trim() },
            });
            return;
          }
        }

        actions.updateBlock(blockId, { content });
      }
    });
  }, [state.blocks, actions]);

  // Handle keydown in the unified editor
  const handleEditorKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Close slash menu on Escape
      if (showSlashMenu && e.key === "Escape") {
        setShowSlashMenu(false);
        return;
      }

      // Get current block from selection
      const selection = window.getSelection();
      const blockId = getBlockIdFromElement(selection?.anchorNode || null);
      const block = blockId ? state.blocks.find((b) => b.id === blockId) : null;

      // Arrow navigation between blocks (when at start/end of a block)
      if (blockId && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        const currentEl = blockRefs.current.get(blockId);
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        if (currentEl && range && range.collapsed) {
          const atStart = (() => {
            try {
              const pre = range.cloneRange();
              pre.selectNodeContents(currentEl);
              pre.setEnd(range.startContainer, range.startOffset);
              return pre.toString().length === 0;
            } catch {
              return false;
            }
          })();
          const atEnd = (() => {
            try {
              const post = range.cloneRange();
              post.selectNodeContents(currentEl);
              post.setStart(range.endContainer, range.endOffset);
              return post.toString().length === 0;
            } catch {
              return false;
            }
          })();

          const currentIndex = state.blocks.findIndex((b) => b.id === blockId);
          if (e.key === "ArrowUp" && atStart && currentIndex > 0) {
            e.preventDefault();
            const prevId = state.blocks[currentIndex - 1]?.id;
            if (!prevId) return;
            const prevEl = blockRefs.current.get(prevId);
            if (prevEl) {
              prevEl.focus();
              const sel = window.getSelection();
              const r = document.createRange();
              r.selectNodeContents(prevEl);
              r.collapse(false);
              sel?.removeAllRanges();
              sel?.addRange(r);
            }
            return;
          }
          if (
            e.key === "ArrowDown" &&
            atEnd &&
            currentIndex >= 0 &&
            currentIndex < state.blocks.length - 1
          ) {
            e.preventDefault();
            const nextId = state.blocks[currentIndex + 1]?.id;
            if (!nextId) return;
            const nextEl = blockRefs.current.get(nextId);
            if (nextEl) {
              nextEl.focus();
              const sel = window.getSelection();
              const r = document.createRange();
              r.selectNodeContents(nextEl);
              r.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(r);
            }
            return;
          }
        }
      }

      // Enter to create new block
      if (e.key === "Enter" && !e.shiftKey && !showSlashMenu) {
        e.preventDefault();
        const currentBlockId =
          blockId || state.blocks[state.blocks.length - 1]?.id;
        if (currentBlockId) {
          const newBlockId = actions.addBlock("paragraph", currentBlockId);
          // Focus the new block after render
          setTimeout(() => {
            const newBlockEl = blockRefs.current.get(newBlockId);
            if (newBlockEl) {
              newBlockEl.focus();
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(newBlockEl);
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }, 0);
        }
        return;
      }

      // Backspace at start to delete empty block
      if (
        e.key === "Backspace" &&
        block &&
        block.content === "" &&
        state.blocks.length > 1
      ) {
        const sel = window.getSelection();
        const range = sel?.getRangeAt(0);
        if (range?.startOffset === 0) {
          e.preventDefault();
          const index = state.blocks.findIndex((b) => b.id === block.id);
          const prevBlock = state.blocks[index - 1];
          actions.deleteBlock(block.id);
          // Focus previous block
          if (prevBlock) {
            setTimeout(() => {
              const prevEl = blockRefs.current.get(prevBlock.id);
              if (prevEl) {
                prevEl.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(prevEl);
                range.collapse(false); // Move to end
                sel?.removeAllRanges();
                sel?.addRange(range);
              }
            }, 0);
          }
          return;
        }
      }

      // Formatting shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "b") {
          e.preventDefault();
          document.execCommand("bold");
        }
        if (e.key === "i") {
          e.preventDefault();
          document.execCommand("italic");
        }
        if (e.key === "u") {
          e.preventDefault();
          document.execCommand("underline");
        }
        if (e.key === "s") {
          e.preventDefault();
          handleSave();
        }
      }
    },
    [
      state.blocks,
      showSlashMenu,
      actions,
      getBlockIdFromElement,
      handleSave,
      editorRef,
    ]
  );

  // Handle paste in the unified editor - intelligent markdown detection
  const handleEditorPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain");

      if (!text) return;

      // Check if content has block-level markdown syntax (headings, lists, etc.)
      // This is the main case we want to handle specially
      if (hasMarkdownSyntax(text)) {
        e.preventDefault();

        const newBlocks = markdownToBlocks(text);

        // Get current block info
        const selection = window.getSelection();
        const blockId = getBlockIdFromElement(selection?.anchorNode || null);
        let currentIndex = blockId
          ? state.blocks.findIndex((b) => b.id === blockId)
          : state.blocks.length - 1;

        if (currentIndex < 0) currentIndex = 0;
        const currentBlock = state.blocks[currentIndex];

        // Determine how to insert the new blocks
        const isCurrentBlockEmpty = !currentBlock?.content?.trim();
        const isSubstantialPaste =
          newBlocks.length > 1 ||
          (newBlocks.length === 1 &&
            newBlocks[0]?.content &&
            newBlocks[0].content.length > 50);

        if (isCurrentBlockEmpty || isSubstantialPaste) {
          // Build new blocks array
          const blocksBefore = state.blocks.slice(0, currentIndex);
          const blocksAfter = state.blocks.slice(currentIndex + 1);

          const finalBlocks = isCurrentBlockEmpty
            ? [...blocksBefore, ...newBlocks, ...blocksAfter]
            : [...blocksBefore, currentBlock, ...newBlocks, ...blocksAfter];

          // Update state - React will handle DOM updates
          actions.setBlocks(
            finalBlocks.length > 0
              ? (finalBlocks.filter(Boolean) as Block[])
              : (newBlocks.filter(Boolean) as Block[])
          );

          if (newBlocks.length > 1) {
            toast.success(`Pasted ${newBlocks.length} blocks from markdown`);
          }

          // Focus last block after React updates
          setTimeout(() => {
            const lastNewBlock = newBlocks[newBlocks.length - 1];
            if (!lastNewBlock) return;
            const blockEl = blockRefs.current.get(lastNewBlock.id);
            if (blockEl) {
              blockEl.focus();
              // Place cursor at end
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(blockEl);
              range.collapse(false);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }, 50);
        } else if (newBlocks.length === 1 && blockId && newBlocks[0]) {
          // Single block paste into non-empty block
          actions.updateBlock(blockId, {
            type: newBlocks[0].type,
            content: newBlocks[0].content,
            meta: newBlocks[0].meta,
          });
        }

        return;
      }

      // For text without block-level markdown, let the browser handle paste normally
      // The inline markdown (like **bold**) will be visible as-is and can be
      // converted when the user types the closing markers
    },
    [state.blocks, actions, getBlockIdFromElement]
  );

  // Open iframe in tab
  const openInTab = useCallback((url: string, title: string) => {
    const newTab: EditorTab = {
      id: generateId(),
      type: "iframe",
      title: title || url,
      url,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  // Close tab
  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => prev.filter((t) => t.id !== tabId));
      if (activeTabId === tabId) {
        setActiveTabId(null);
      }
    },
    [activeTabId]
  );

  // Handle block type change from toolbar
  const handleToolbarBlockTypeChange = useCallback(
    (type: BlockType) => {
      // Get current focused block or last block
      const selection = window.getSelection();
      const focusedEl = selection?.anchorNode;
      let blockId: string | null = null;

      // Find the block ID from selection
      let current = focusedEl as HTMLElement | null;
      while (current) {
        const id = current.getAttribute?.("data-block-id");
        if (id) {
          blockId = id;
          break;
        }
        current = current.parentElement;
      }

      // Use focused block or last block
      const targetBlockId =
        blockId || state.blocks[state.blocks.length - 1]?.id;
      if (targetBlockId) {
        actions.updateBlock(targetBlockId, { type });
      }
    },
    [state.blocks, actions]
  );

  // Handle insert block from toolbar
  const handleToolbarInsertBlock = useCallback(
    (type: BlockType | string) => {
      // Get current focused block
      const selection = window.getSelection();
      const focusedEl = selection?.anchorNode;
      let blockId: string | null = null;

      let current = focusedEl as HTMLElement | null;
      while (current) {
        const id = current.getAttribute?.("data-block-id");
        if (id) {
          blockId = id;
          break;
        }
        current = current.parentElement;
      }

      const afterBlockId = blockId || state.blocks[state.blocks.length - 1]?.id;

      // Handle media blocks that need URL input
      if (type === "image" || type === "video" || type === "iframe") {
        const newBlockId = actions.addBlock(type as BlockType, afterBlockId);
        setUrlModalType(type as "image" | "video" | "iframe");
        setUrlModalBlockId(newBlockId);
        setShowUrlModal(true);
        return;
      }

      // Handle table
      if (type === "table") {
        const newBlockId = actions.addBlock("table", afterBlockId);
        actions.updateBlock(newBlockId, {
          meta: {
            rows: 3,
            cols: 3,
            tableData: [
              ["", "", ""],
              ["", "", ""],
              ["", "", ""],
            ],
          },
        });
        return;
      }

      // Handle divider
      if (type === "divider") {
        actions.addBlock("divider", afterBlockId);
        return;
      }

      // Add regular block
      actions.addBlock(type as BlockType, afterBlockId);
    },
    [state.blocks, actions]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }

      // Cmd/Ctrl+A to select all content in the editor
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        const editorEl = editorRef.current;
        if (editorEl && editorEl.contains(document.activeElement)) {
          e.preventDefault();

          // Find the editor-blocks container
          const blocksContainer = editorEl.querySelector(".editor-blocks");
          if (blocksContainer) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(blocksContainer);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Insert a paragraph block before the specified block
  const insertBlockBefore = useCallback(
    (blockId: string) => {
      const blockIndex = state.blocks.findIndex((b) => b.id === blockId);
      const prevBlockId =
        blockIndex > 0 ? state.blocks[blockIndex - 1]?.id : undefined;
      if (!prevBlockId) return;
      const newBlockId = actions.addBlock("paragraph", prevBlockId);
      setTimeout(() => {
        blockRefs.current.get(newBlockId)?.focus();
      }, 0);
    },
    [state.blocks, actions]
  );

  // Insert a paragraph block after the specified block
  const insertBlockAfter = useCallback(
    (blockId: string) => {
      const newBlockId = actions.addBlock("paragraph", blockId);
      setTimeout(() => {
        blockRefs.current.get(newBlockId)?.focus();
      }, 0);
    },
    [actions]
  );

  // Render a block based on its type
  const renderBlock = (block: Block) => {
    // Helper to wrap media blocks with insertion points
    // contentEditable="false" excludes media from the editing context
    const wrapMediaBlock = (content: React.ReactNode) => (
      <div contentEditable={false} className="my-2">
        <MediaBlockWrapper
          blockId={block.id}
          onInsertBefore={() => insertBlockBefore(block.id)}
          onInsertAfter={() => insertBlockAfter(block.id)}
        >
          {content}
        </MediaBlockWrapper>
      </div>
    );

    switch (block.type) {
      case "image":
        return wrapMediaBlock(
          <ImageBlock
            url={block.meta?.url}
            alt={block.meta?.alt}
            onUrlChange={(url) =>
              actions.updateBlock(block.id, { meta: { ...block.meta, url } })
            }
            onRemove={() => actions.deleteBlock(block.id)}
          />
        );

      case "video":
      case "embed":
        return wrapMediaBlock(
          <VideoBlock
            url={block.meta?.url}
            onUrlChange={(url: string) =>
              actions.updateBlock(block.id, { meta: { ...block.meta, url } })
            }
            onRemove={() => actions.deleteBlock(block.id)}
            onOpenInTab={openInTab}
          />
        );

      case "linkPreview":
        return wrapMediaBlock(
          <LinkPreviewBlock
            url={block.meta?.url}
            onRemove={() => actions.deleteBlock(block.id)}
            onOpenInTab={openInTab}
          />
        );

      case "iframe":
        return wrapMediaBlock(
          <IframeBlock
            url={block.meta?.url}
            height={block.meta?.height as number}
            onUrlChange={(url: string) =>
              actions.updateBlock(block.id, { meta: { ...block.meta, url } })
            }
            onHeightChange={(height: number) =>
              actions.updateBlock(block.id, { meta: { ...block.meta, height } })
            }
            onRemove={() => actions.deleteBlock(block.id)}
            onOpenInTab={openInTab}
          />
        );

      case "table":
        return wrapMediaBlock(
          <TableBlock
            data={block.meta?.tableData || []}
            onDataChange={(tableData: string[][]) =>
              actions.updateBlock(block.id, {
                meta: { ...block.meta, tableData },
              })
            }
            onRemove={() => actions.deleteBlock(block.id)}
          />
        );

      case "mermaid":
        return wrapMediaBlock(
          <MermaidBlock
            diagram={block.meta?.diagram || ""}
            onDiagramChange={(diagram: string) =>
              actions.updateBlock(block.id, {
                meta: { ...block.meta, diagram },
              })
            }
            onRemove={() => actions.deleteBlock(block.id)}
          />
        );

      case "code":
        return wrapMediaBlock(
          <MonacoCodeBlock
            code={block.content}
            language={block.meta?.language || "typescript"}
            editable={true}
            onChange={(code: string) =>
              actions.updateBlock(block.id, { content: code })
            }
            onLanguageChange={(language: string) =>
              actions.updateBlock(block.id, {
                meta: { ...block.meta, language },
              })
            }
          />
        );

      case "divider":
        return (
          <div contentEditable={false}>
            <hr className="border-border my-4" />
          </div>
        );

      default:
        return renderTextBlock(block);
    }
  };

  // Render text-based blocks
  const renderTextBlock = (block: Block) => {
    const baseClasses = "w-full bg-transparent leading-relaxed min-h-[1.5em]";

    const getBlockStyles = () => {
      switch (block.type) {
        case "heading1":
          return "text-3xl font-bold text-foreground";
        case "heading2":
          return "text-2xl font-semibold text-foreground";
        case "heading3":
          return "text-xl font-medium text-foreground";
        case "bulletList":
          return "text-foreground pl-6 before:content-['•'] before:absolute before:-left-0 before:text-muted-foreground relative";
        case "numberedList":
          return "text-foreground pl-6";
        case "checkList":
          return "text-foreground pl-6";
        case "quote":
          return "text-foreground italic border-l-2 border-primary pl-4";
        default:
          return "text-foreground";
      }
    };

    const placeholder =
      block.type === "paragraph"
        ? "Type '/' for commands..."
        : block.type.includes("heading")
        ? `Heading ${block.type.slice(-1)}`
        : "...";

    return (
      <TextBlock
        key={block.id}
        block={block}
        placeholder={placeholder}
        className={cn(baseClasses, getBlockStyles())}
        onRef={(el) => {
          if (el) blockRefs.current.set(block.id, el);
        }}
      />
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {lastSaved ? (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            ) : (
              <span>Not saved</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAiLoading && (
            <div className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI processing...</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 overflow-hidden",
              showSaveSuccess
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground",
              "hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]",
              isSaving && "cursor-wait"
            )}
          >
            {/* Hover glow effect */}
            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />

            {/* Icon with states */}
            <span className="relative">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : showSaveSuccess ? (
                <Check className="h-4 w-4 animate-[bounce_0.3s_ease-out]" />
              ) : (
                <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
              )}
            </span>

            {/* Optional text for wider screens */}
            {(isSaving || showSaveSuccess) && (
              <span className="relative text-xs">
                {isSaving ? "Saving..." : "Saved!"}
              </span>
            )}
          </button>

          {onToggleAiContext && (
            <button
              onClick={onToggleAiContext}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                includeInAiContext
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
              title={
                includeInAiContext ? "Remove AI Context" : "Add AI Context"
              }
            >
              <Brain className="h-5 w-5" />
            </button>
          )}

          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDownloadMarkdown}>
                <FileDown className="h-4 w-4 mr-2" />
                Save MD
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPdfPreview(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Save PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadTxt}>
                <FileType className="h-4 w-4 mr-2" />
                Save TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <EditorTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onTabClose={closeTab}
        />
      )}

      {/* Editor Toolbar */}
      <EditorToolbar
        onBlockTypeChange={handleToolbarBlockTypeChange}
        onInsertBlock={handleToolbarInsertBlock}
        characterCount={characterCount}
        wordCount={wordCount}
      />

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto rich-editor" ref={editorRef}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {/* Title */}
          <div className="mb-6">
            <input
              type="text"
              value={state.title}
              onChange={(e) => actions.setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full text-2xl sm:text-4xl font-bold bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Blocks - single contentEditable for cross-block selection */}
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div
                className="editor-blocks flex flex-col outline-none"
                onInput={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                onMouseUp={handleMouseUp}
                onPaste={handleEditorPaste}
                onContextMenu={handleContextMenu}
              >
                {state.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="relative group py-0.5"
                    data-block-id={block.id}
                  >
                    {renderBlock(block)}
                  </div>
                ))}
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-64">
              <ContextMenuLabel>Selection</ContextMenuLabel>
              <ContextMenuItem
                onSelect={handleCopySelectedText}
                disabled={!(contextMenuText || selectedText).trim()}
              >
                <ClipboardCopy className="h-4 w-4" />
                Copy
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuSub>
                <ContextMenuSubTrigger
                  disabled={!(contextMenuText || selectedText).trim()}
                >
                  <Wand2 className="h-4 w-4" />
                  AI actions
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-64">
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "format",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <Wand2 className="h-4 w-4" />
                    Format
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "improve",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <Sparkles className="h-4 w-4" />
                    Improve
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "grammar",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <SpellCheck className="h-4 w-4" />
                    Fix grammar
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "expand",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Expand
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "summarize",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Summarize
                  </ContextMenuItem>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "tweet",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <Twitter className="h-4 w-4" />
                    As tweet
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "bugs",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <Bug className="h-4 w-4" />
                    Find bugs
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "tasks",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <ListTodo className="h-4 w-4" />
                    Create tasks
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "thesaurus",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <BookOpen className="h-4 w-4" />
                    Thesaurus
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() =>
                      handleAiAction(
                        "analogize",
                        (contextMenuText || selectedText).trim()
                      )
                    }
                  >
                    <Lightbulb className="h-4 w-4" />
                    Analogize
                  </ContextMenuItem>

                  <ContextMenuSeparator />

                  <ContextMenuSub>
                    <ContextMenuSubTrigger>
                      <MessageSquare className="h-4 w-4" />
                      Change tone
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-52">
                      {[
                        ["professional", "Professional"],
                        ["casual", "Casual"],
                        ["technical", "Technical"],
                        ["confident", "Confident"],
                        ["witty", "Witty"],
                      ].map(([id, label]) => (
                        <ContextMenuItem
                          key={id}
                          onSelect={() =>
                            handleAiAction(
                              `tone-${id}`,
                              (contextMenuText || selectedText).trim()
                            )
                          }
                        >
                          {label}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      {/* Slash menu */}
      {showSlashMenu && (
        <SlashMenu
          position={slashMenuPosition}
          filter={slashFilter}
          onSelect={handleSlashSelect}
          onClose={() => setShowSlashMenu(false)}
        />
      )}

      {/* Selection toolbar */}
      {showSelectionToolbar && selectedText && (
        <SelectionToolbar
          position={selectionToolbarPosition}
          selectedText={selectedText}
          onAiAction={handleAiAction}
          onClose={() => setShowSelectionToolbar(false)}
          isLoading={isAiLoading}
        />
      )}

      {/* URL input modal */}
      {showUrlModal && (
        <UrlInputModal
          type={urlModalType}
          onSubmit={handleUrlSubmit}
          onClose={() => {
            setShowUrlModal(false);
            setUrlModalBlockId(null);
          }}
        />
      )}

      {/* AI confirmation modal */}
      {showAiConfirmation && (
        <AIConfirmationModal
          originalText={aiOriginalText}
          suggestedText={aiSuggestedText}
          actionLabel={aiActionLabel}
          onAccept={handleAiAccept}
          onReject={() => setShowAiConfirmation(false)}
          onClose={() => setShowAiConfirmation(false)}
        />
      )}

      {/* PDF Preview modal */}
      {showPdfPreview && (
        <PdfPreviewModal
          markdown={`# ${state.title || "Untitled"}\n\n${actions.toMarkdown()}`}
          onClose={() => setShowPdfPreview(false)}
        />
      )}

      {/* Editor styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Enable user selection across the entire editor */
        .rich-editor {
          user-select: text;
          -webkit-user-select: text;
        }

        /* Ensure blocks flow together for selection */
        .editor-blocks {
          user-select: text;
          -webkit-user-select: text;
          caret-color: currentColor;
        }

        .editor-blocks > * {
          user-select: text;
          -webkit-user-select: text;
        }

        /* Selection styling - neon purple */
        .rich-editor ::selection {
          background: oklch(0.7 0.3 290 / 0.3) !important;
        }

        /* Empty block placeholder */
        .editor-blocks .empty-block:empty::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
        }

        /* First empty paragraph placeholder */
        .editor-blocks > div:first-child .empty-block:empty::before {
          content: "Type '/' for commands...";
        }

        /* Inline formatting styles */
        .editor-blocks strong,
        .editor-blocks b {
          font-weight: 700;
        }

        .editor-blocks em,
        .editor-blocks i {
          font-style: italic;
        }

        .editor-blocks s,
        .editor-blocks strike,
        .editor-blocks del {
          text-decoration: line-through;
          opacity: 0.7;
        }

        .editor-blocks code:not([class*="language-"]) {
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          background: var(--secondary);
          color: var(--secondary-foreground);
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
            monospace;
          font-size: 0.875em;
        }

        .editor-blocks mark {
          background: oklch(0.9 0.15 90);
          padding: 0 0.125rem;
          border-radius: 0.125rem;
        }

        :root.dark .editor-blocks mark {
          background: oklch(0.4 0.12 90);
        }

        .editor-blocks u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* Save button animations */
        @keyframes scale-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        @keyframes bounce-subtle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `,
        }}
      />
    </div>
  );
}

export default RichEditor;
