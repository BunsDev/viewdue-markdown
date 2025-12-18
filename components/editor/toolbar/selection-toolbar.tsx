"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link,
  Wand2,
  ChevronDown,
  Sparkles,
  MessageSquare,
  SpellCheck,
  ArrowUpRight,
  FileText,
  Twitter,
  Bug,
  ListTodo,
  BookOpen,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionToolbarProps {
  position: { top: number; left: number };
  selectedText: string;
  onAiAction: (action: string, text: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

const AI_ACTIONS = [
  { id: "format", label: "Format", icon: Wand2 },
  { id: "improve", label: "Improve", icon: Sparkles },
  { id: "grammar", label: "Fix Grammar", icon: SpellCheck },
  { id: "expand", label: "Expand", icon: ArrowUpRight },
  { id: "summarize", label: "Summarize", icon: FileText },
  { id: "tweet", label: "As Tweet", icon: Twitter },
  { id: "bugs", label: "Find Bugs", icon: Bug },
  { id: "tasks", label: "Create Tasks", icon: ListTodo },
  { id: "thesaurus", label: "Thesaurus", icon: BookOpen },
  { id: "analogize", label: "Analogize", icon: Lightbulb },
];

const TONE_OPTIONS = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "technical", label: "Technical" },
  { id: "confident", label: "Confident" },
  { id: "witty", label: "Witty" },
];

export function SelectionToolbar({
  position,
  selectedText,
  onAiAction,
  onClose,
  isLoading,
}: SelectionToolbarProps) {
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate close on selection
    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleFormat = useCallback(
    (command: string) => {
      document.execCommand(command);
      onClose();
    },
    [onClose]
  );

  const handleAiAction = useCallback(
    (action: string) => {
      onAiAction(action, selectedText);
      setShowAiMenu(false);
    },
    [onAiAction, selectedText]
  );

  const handleTone = useCallback(
    (toneId: string) => {
      onAiAction(`tone-${toneId}`, selectedText);
      setShowToneMenu(false);
      setShowAiMenu(false);
    },
    [onAiAction, selectedText]
  );

  // Adjust position to keep toolbar in viewport
  const adjustedPosition = {
    top: Math.max(10, position.top),
    left: Math.max(10, Math.min(position.left, window.innerWidth - 300)),
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex flex-col animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2"
      onMouseDownCapture={(e) => {
        // Preserve the editor selection while interacting with this toolbar.
        // Otherwise clicking these buttons collapses the selection and execCommand won't apply.
        e.preventDefault();
      }}
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        transform: "translateX(-50%)",
      }}
    >
      {/* Main toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl">
        {/* Formatting buttons */}
        <button
          type="button"
          onClick={() => handleFormat("bold")}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Bold (⌘B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat("italic")}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Italic (⌘I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat("underline")}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Underline (⌘U)"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) {
              document.execCommand("createLink", false, url);
            }
            onClose();
          }}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Add Link (⌘K)"
        >
          <Link className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* AI button */}
        <button
          type="button"
          onClick={() => setShowAiMenu(!showAiMenu)}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded transition-colors",
            showAiMenu
              ? "bg-primary/10 text-primary"
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          <span className="text-xs font-medium">AI</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* AI menu */}
      {showAiMenu && !isLoading && (
        <div className="mt-1 py-1 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl max-h-[300px] overflow-y-auto">
          {/* Tone submenu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowToneMenu(!showToneMenu)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>Change Tone</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  showToneMenu && "rotate-180"
                )}
              />
            </button>

            {showToneMenu && (
              <div className="pl-8 py-1 bg-muted/30">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    type="button"
                    key={tone.id}
                    onClick={() => handleTone(tone.id)}
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted/50 transition-colors"
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Other AI actions */}
          {AI_ACTIONS.map((action) => (
            <button
              type="button"
              key={action.id}
              onClick={() => handleAiAction(action.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
