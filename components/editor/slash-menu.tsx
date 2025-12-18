"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ImageIcon,
  Video,
  Link,
  MonitorPlay,
  Table2,
  GitBranch,
  Code,
  Wand2,
  Sparkles,
  MessageSquare,
  SpellCheck,
  ArrowUpRight,
  FileText,
  Combine,
  Twitter,
  Bug,
  ListTodo,
  BookOpen,
  Lightbulb,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockType } from "@/lib/types/notes";

// ============ Types ============

interface SlashMenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  type: BlockType | string;
  category: "media" | "ai";
  keywords: string[];
  subItems?: { id: string; label: string }[];
}

interface SlashMenuProps {
  position: { top: number; left: number };
  filter: string;
  onSelect: (type: BlockType | string) => void;
  onClose: () => void;
}

// ============ Menu Items ============

const mediaItems: SlashMenuItem[] = [
  {
    id: "image",
    label: "Image",
    description: "Add a zoomable image",
    icon: ImageIcon,
    type: "image",
    category: "media",
    keywords: ["image", "photo", "picture", "img"],
  },
  {
    id: "video",
    label: "Video",
    description: "YouTube or Vimeo embed",
    icon: Video,
    type: "video",
    category: "media",
    keywords: ["video", "youtube", "vimeo", "embed"],
  },
  {
    id: "link",
    label: "Link Preview",
    description: "Rich link preview card",
    icon: Link,
    type: "linkPreview",
    category: "media",
    keywords: ["link", "url", "preview", "card"],
  },
  {
    id: "iframe",
    label: "Web Embed",
    description: "Embed any website",
    icon: MonitorPlay,
    type: "iframe",
    category: "media",
    keywords: ["iframe", "embed", "website", "browser"],
  },
  {
    id: "table",
    label: "Table",
    description: "Insert editable table",
    icon: Table2,
    type: "table",
    category: "media",
    keywords: ["table", "grid", "data"],
  },
  {
    id: "mermaid",
    label: "Mermaid Diagram",
    description: "Flowcharts, sequences, etc.",
    icon: GitBranch,
    type: "mermaid",
    category: "media",
    keywords: ["mermaid", "diagram", "flowchart", "chart", "graph"],
  },
  {
    id: "code",
    label: "Code Block",
    description: "Syntax-highlighted code",
    icon: Code,
    type: "code",
    category: "media",
    keywords: ["code", "programming", "snippet", "syntax"],
    subItems: [
      { id: "typescript", label: "TypeScript" },
      { id: "javascript", label: "JavaScript" },
      { id: "python", label: "Python" },
      { id: "solidity", label: "Solidity" },
      { id: "shell", label: "Shell" },
      { id: "bash", label: "Bash" },
      { id: "json", label: "JSON" },
      { id: "markdown", label: "Markdown" },
    ],
  },
];

const aiItems: SlashMenuItem[] = [
  {
    id: "format",
    label: "Format",
    description: "Auto-format content",
    icon: Wand2,
    type: "ai-format",
    category: "ai",
    keywords: ["format", "clean", "organize"],
  },
  {
    id: "improve",
    label: "Improve",
    description: "Improve writing quality",
    icon: Sparkles,
    type: "ai-improve",
    category: "ai",
    keywords: ["improve", "enhance", "better"],
  },
  {
    id: "tone",
    label: "Change Tone",
    description: "Adjust writing tone",
    icon: MessageSquare,
    type: "ai-tone",
    category: "ai",
    keywords: ["tone", "style", "voice"],
    subItems: [
      { id: "professional", label: "Professional" },
      { id: "casual", label: "Casual" },
      { id: "technical", label: "Technical" },
      { id: "confident", label: "Confident" },
      { id: "witty", label: "Witty" },
    ],
  },
  {
    id: "grammar",
    label: "Fix Grammar",
    description: "Fix spelling and grammar",
    icon: SpellCheck,
    type: "ai-grammar",
    category: "ai",
    keywords: ["grammar", "spelling", "fix", "correct"],
  },
  {
    id: "expand",
    label: "Expand",
    description: "Make content longer",
    icon: ArrowUpRight,
    type: "ai-expand",
    category: "ai",
    keywords: ["expand", "longer", "more", "elaborate"],
  },
  {
    id: "summarize",
    label: "Summarize",
    description: "Make content shorter",
    icon: FileText,
    type: "ai-summarize",
    category: "ai",
    keywords: ["summarize", "shorter", "brief", "tldr"],
  },
  {
    id: "combine",
    label: "Combine",
    description: "Merge content together",
    icon: Combine,
    type: "ai-combine",
    category: "ai",
    keywords: ["combine", "merge", "join"],
  },
  {
    id: "tweet",
    label: "Rephrase as Tweet",
    description: "280 character version",
    icon: Twitter,
    type: "ai-tweet",
    category: "ai",
    keywords: ["tweet", "twitter", "short", "social"],
  },
  {
    id: "bugs",
    label: "Find Bugs",
    description: "Find bugs in code",
    icon: Bug,
    type: "ai-bugs",
    category: "ai",
    keywords: ["bugs", "code", "debug", "fix"],
  },
  {
    id: "tasks",
    label: "Create Tasks",
    description: "Extract action items",
    icon: ListTodo,
    type: "ai-tasks",
    category: "ai",
    keywords: ["tasks", "todo", "action", "items"],
  },
  {
    id: "thesaurus",
    label: "Thesaurus",
    description: "Find synonyms",
    icon: BookOpen,
    type: "ai-thesaurus",
    category: "ai",
    keywords: ["thesaurus", "synonym", "word", "replace"],
  },
  {
    id: "analogize",
    label: "Analogize",
    description: "Create an analogy",
    icon: Lightbulb,
    type: "ai-analogize",
    category: "ai",
    keywords: ["analogy", "metaphor", "explain", "compare"],
  },
];

const allItems = [...mediaItems, ...aiItems];

// ============ Fuzzy Search ============

function fuzzyMatch(pattern: string, text: string): number {
  if (!pattern) return 1;

  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();

  if (textLower === patternLower) return 100;
  if (textLower.startsWith(patternLower)) return 80;
  if (textLower.includes(patternLower)) return 60;

  let patternIdx = 0;
  let score = 0;

  for (
    let i = 0;
    i < textLower.length && patternIdx < patternLower.length;
    i++
  ) {
    if (textLower[i] === patternLower[patternIdx]) {
      score += 10;
      patternIdx++;
    }
  }

  return patternIdx === patternLower.length ? score : 0;
}

// ============ Component ============

export function SlashMenu({
  position,
  filter,
  onSelect,
  onClose,
}: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Filter and score items
  const filteredItems = useMemo(() => {
    if (!filter) return allItems;

    return allItems
      .map((item) => {
        let score = fuzzyMatch(filter, item.label);

        // Check keywords too
        for (const keyword of item.keywords) {
          const keywordScore = fuzzyMatch(filter, keyword);
          if (keywordScore > score) score = keywordScore;
        }

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [filter]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const media = filteredItems.filter((i) => i.category === "media");
    const ai = filteredItems.filter((i) => i.category === "ai");
    return { media, ai };
  }, [filteredItems]);

  // Flat list for navigation
  const flatItems = useMemo(() => {
    return [...groupedItems.media, ...groupedItems.ai];
  }, [groupedItems]);

  // Handle selection
  const handleSelect = useCallback(
    (item: SlashMenuItem) => {
      if (item.subItems && expandedItem !== item.id) {
        setExpandedItem(item.id);
        return;
      }
      onSelect(item.type);
      onClose();
    },
    [onSelect, onClose, expandedItem]
  );

  // Handle tone sub-item selection
  const handleToneSelect = useCallback(
    (toneId: string) => {
      onSelect(`ai-tone-${toneId}`);
      onClose();
    },
    [onSelect, onClose]
  );

  // Handle code sub-item selection
  const handleCodeSelect = useCallback(
    (language: string) => {
      onSelect(`code-${language}`);
      onClose();
    },
    [onSelect, onClose]
  );

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
    setExpandedItem(null);
  }, [filter]);

  // Scroll selected into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + flatItems.length) % flatItems.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (expandedItem) {
          setExpandedItem(null);
        } else {
          onClose();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedIndex(
            (prev) => (prev - 1 + flatItems.length) % flatItems.length
          );
        } else {
          setSelectedIndex((prev) => (prev + 1) % flatItems.length);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [flatItems, selectedIndex, handleSelect, onClose, expandedItem]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (flatItems.length === 0) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 w-80 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
        style={{ top: position.top, left: position.left }}
      >
        <div className="p-6 text-center">
          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No commands found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Try a different search term
          </p>
        </div>
      </div>
    );
  }

  let globalIndex = 0;

  const renderGroup = (
    items: SlashMenuItem[],
    title: string,
    style: "media" | "ai"
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="py-1">
        <div
          className={cn(
            "px-3 py-2 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5",
            style === "ai" ? "text-purple-500" : "text-blue-500"
          )}
        >
          {style === "ai" ? (
            <Wand2 className="h-3 w-3" />
          ) : (
            <ImageIcon className="h-3 w-3" />
          )}
          {title}
        </div>

        {items.map((item) => {
          const index = globalIndex++;
          const isSelected = index === selectedIndex;

          return (
            <div key={item.id}>
              <button
                ref={isSelected ? selectedRef : null}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-100",
                  isSelected
                    ? style === "ai"
                      ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                      : "bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
                    : "hover:bg-muted/50"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? style === "ai"
                        ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                        : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                      : "bg-secondary/80"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4.5 w-4.5",
                      isSelected
                        ? style === "ai"
                          ? "text-purple-500"
                          : "text-blue-500"
                        : "text-muted-foreground"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div
                    className={cn(
                      "font-medium",
                      isSelected && "text-foreground"
                    )}
                  >
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>

                {/* Sub-items indicator */}
                {item.subItems && (
                  <span className="text-xs text-muted-foreground">→</span>
                )}
              </button>

              {/* Sub-items (tone, code, etc.) */}
              {expandedItem === item.id && isSelected && item.subItems && (
                <div className="pl-12 py-1 bg-muted/30">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        if (item.id === "tone") {
                          handleToneSelect(subItem.id);
                        } else if (item.id === "code") {
                          handleCodeSelect(subItem.id);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 max-h-[420px] overflow-hidden bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
      style={{ top: position.top, left: position.left }}
    >
      {/* Search indicator */}
      {filter && (
        <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
          <Search className="h-3 w-3" />
          <span>Searching for &quot;{filter}&quot;</span>
          <span className="ml-auto text-muted-foreground/60">
            {flatItems.length} result{flatItems.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Items list */}
      <div className="overflow-y-auto max-h-[340px] divide-y divide-border/30">
        {renderGroup(groupedItems.media, "Media & Blocks", "media")}
        {renderGroup(groupedItems.ai, "AI Actions", "ai")}
      </div>

      {/* Footer hints */}
      <div className="px-3 py-2 border-t border-border/50 bg-muted/30 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-background/80 border border-border/50">
            ↑↓
          </kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-background/80 border border-border/50">
            ↵
          </kbd>
          select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-background/80 border border-border/50">
            esc
          </kbd>
          close
        </span>
      </div>
    </div>
  );
}

export default SlashMenu;
