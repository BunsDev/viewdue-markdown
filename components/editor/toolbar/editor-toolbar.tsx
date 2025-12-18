"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link,
  Image,
  Video,
  Globe,
  Table,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  FileText,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockType } from "@/lib/types/notes";

interface EditorToolbarProps {
  onBlockTypeChange: (type: BlockType) => void;
  onInsertBlock: (type: BlockType | string) => void;
  characterCount: number;
  wordCount: number;
  className?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({
  icon,
  title,
  onClick,
  active,
  disabled,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

export function EditorToolbar({
  onBlockTypeChange,
  onInsertBlock,
  characterCount,
  wordCount,
  className,
}: EditorToolbarProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  // Refs for click-outside detection
  const headingDropdownRef = useRef<HTMLDivElement>(null);
  const insertDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't close if clicking inside the heading dropdown
      if (
        headingDropdownRef.current &&
        headingDropdownRef.current.contains(target)
      ) {
        return;
      }

      // Don't close if clicking inside the insert dropdown
      if (
        insertDropdownRef.current &&
        insertDropdownRef.current.contains(target)
      ) {
        return;
      }

      setShowHeadingMenu(false);
      setShowInsertMenu(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Format commands
  const handleFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
  }, []);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    document.execCommand("undo");
  }, []);

  const handleRedo = useCallback(() => {
    document.execCommand("redo");
  }, []);

  // Block type changes
  const handleHeading = useCallback(
    (level: 1 | 2 | 3) => {
      onBlockTypeChange(`heading${level}` as BlockType);
      setShowHeadingMenu(false);
    },
    [onBlockTypeChange]
  );

  const handleList = useCallback(
    (type: "bulletList" | "numberedList" | "checkList") => {
      onBlockTypeChange(type);
    },
    [onBlockTypeChange]
  );

  const handleQuote = useCallback(() => {
    onBlockTypeChange("quote");
  }, [onBlockTypeChange]);

  const handleCode = useCallback(() => {
    onBlockTypeChange("code");
  }, [onBlockTypeChange]);

  const handleDivider = useCallback(() => {
    onInsertBlock("divider");
  }, [onInsertBlock]);

  // Insert media
  const handleInsertImage = useCallback(() => {
    onInsertBlock("image");
    setShowInsertMenu(false);
  }, [onInsertBlock]);

  const handleInsertVideo = useCallback(() => {
    onInsertBlock("video");
    setShowInsertMenu(false);
  }, [onInsertBlock]);

  const handleInsertIframe = useCallback(() => {
    onInsertBlock("iframe");
    setShowInsertMenu(false);
  }, [onInsertBlock]);

  const handleInsertLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      document.execCommand("createLink", false, url);
    }
    setShowInsertMenu(false);
  }, []);

  const handleInsertTable = useCallback(() => {
    onInsertBlock("table");
    setShowInsertMenu(false);
  }, [onInsertBlock]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-3 py-2 border-b border-border bg-secondary/30 flex-wrap",
        className
      )}
      onMouseDownCapture={(e) => {
        // Keep the editor selection/focus when using toolbar controls.
        // Without this, clicking the toolbar steals selection and block targeting breaks.
        e.preventDefault();
      }}
    >
      {/* Undo/Redo */}
      <ToolbarButton
        icon={<Undo className="h-4 w-4" />}
        title="Undo (⌘Z)"
        onClick={handleUndo}
      />
      <ToolbarButton
        icon={<Redo className="h-4 w-4" />}
        title="Redo (⌘⇧Z)"
        onClick={handleRedo}
      />

      <ToolbarDivider />

      {/* Text formatting */}
      <ToolbarButton
        icon={<Bold className="h-4 w-4" />}
        title="Bold (⌘B)"
        onClick={() => handleFormat("bold")}
      />
      <ToolbarButton
        icon={<Italic className="h-4 w-4" />}
        title="Italic (⌘I)"
        onClick={() => handleFormat("italic")}
      />
      <ToolbarButton
        icon={<Underline className="h-4 w-4" />}
        title="Underline (⌘U)"
        onClick={() => handleFormat("underline")}
      />
      <ToolbarButton
        icon={<Strikethrough className="h-4 w-4" />}
        title="Strikethrough"
        onClick={() => handleFormat("strikeThrough")}
      />

      <ToolbarDivider />

      {/* Headings dropdown */}
      <div className="relative" ref={headingDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setShowHeadingMenu(!showHeadingMenu);
            setShowInsertMenu(false);
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Headings"
        >
          <Type className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </button>
        {showHeadingMenu && (
          <div className="absolute top-full left-0 mt-1 py-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[140px]">
            <button
              type="button"
              onClick={() => handleHeading(1)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Heading1 className="h-4 w-4" />
              <span>Heading 1</span>
            </button>
            <button
              type="button"
              onClick={() => handleHeading(2)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Heading2 className="h-4 w-4" />
              <span>Heading 2</span>
            </button>
            <button
              type="button"
              onClick={() => handleHeading(3)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Heading3 className="h-4 w-4" />
              <span>Heading 3</span>
            </button>
            <div className="border-t border-border my-1" />
            <button
              type="button"
              onClick={() => {
                onBlockTypeChange("paragraph");
                setShowHeadingMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Paragraph</span>
            </button>
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        icon={<List className="h-4 w-4" />}
        title="Bullet List"
        onClick={() => handleList("bulletList")}
      />
      <ToolbarButton
        icon={<ListOrdered className="h-4 w-4" />}
        title="Numbered List"
        onClick={() => handleList("numberedList")}
      />
      <ToolbarButton
        icon={<CheckSquare className="h-4 w-4" />}
        title="Checklist"
        onClick={() => handleList("checkList")}
      />

      <ToolbarDivider />

      {/* Block types */}
      <ToolbarButton
        icon={<Quote className="h-4 w-4" />}
        title="Quote"
        onClick={handleQuote}
      />
      <ToolbarButton
        icon={<Code className="h-4 w-4" />}
        title="Code Block"
        onClick={handleCode}
      />
      <ToolbarButton
        icon={<Minus className="h-4 w-4" />}
        title="Divider"
        onClick={handleDivider}
      />

      <ToolbarDivider />

      {/* Insert dropdown */}
      <div className="relative" ref={insertDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setShowInsertMenu(!showInsertMenu);
            setShowHeadingMenu(false);
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Insert"
        >
          <span className="text-xs font-medium">Insert</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {showInsertMenu && (
          <div className="absolute top-full left-0 mt-1 py-1 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[160px]">
            <button
              type="button"
              onClick={handleInsertLink}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Link className="h-4 w-4" />
              <span>Link</span>
            </button>
            <button
              type="button"
              onClick={handleInsertImage}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Image className="h-4 w-4" />
              <span>Image</span>
            </button>
            <button
              type="button"
              onClick={handleInsertVideo}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Video className="h-4 w-4" />
              <span>Video</span>
            </button>
            <button
              type="button"
              onClick={handleInsertIframe}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>Embed Website</span>
            </button>
            <button
              type="button"
              onClick={handleInsertTable}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Table className="h-4 w-4" />
              <span>Table</span>
            </button>
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton
        icon={<AlignLeft className="h-4 w-4" />}
        title="Align Left"
        onClick={() => handleFormat("justifyLeft")}
      />
      <ToolbarButton
        icon={<AlignCenter className="h-4 w-4" />}
        title="Align Center"
        onClick={() => handleFormat("justifyCenter")}
      />
      <ToolbarButton
        icon={<AlignRight className="h-4 w-4" />}
        title="Align Right"
        onClick={() => handleFormat("justifyRight")}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Character/Word count */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{characterCount.toLocaleString()} characters</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>
    </div>
  );
}
