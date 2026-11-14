"use client";

// Slash command palette for fast block insertion
import { useState, useEffect, useRef } from "react";
import { BlockType } from "../types";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRightSquare,
  Quote,
  Code,
  Minus,
  Table,
  Bookmark,
  FileText,
  Image,
  Layers,
  Sparkles,
} from "lucide-react";

interface CommandItem {
  type: BlockType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "Basic" | "Lists" | "Media & Data" | "Advanced";
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    type: "paragraph",
    title: "Text",
    description: "Start writing with plain rich text.",
    icon: Type,
    category: "Basic",
  },
  {
    type: "heading_1",
    title: "Heading 1",
    description: "Large section title.",
    icon: Heading1,
    category: "Basic",
  },
  {
    type: "heading_2",
    title: "Heading 2",
    description: "Medium subsection heading.",
    icon: Heading2,
    category: "Basic",
  },
  {
    type: "heading_3",
    title: "Heading 3",
    description: "Small subsection heading.",
    icon: Heading3,
    category: "Basic",
  },
  {
    type: "page_link",
    title: "Link to Page",
    description: "Link to another page in any notebook or chapter.",
    icon: FileText,
    category: "Basic",
  },
  {
    type: "quote",
    title: "Quote",
    description: "Capture an excerpt or block quote.",
    icon: Quote,
    category: "Basic",
  },
  {
    type: "divider",
    title: "Divider",
    description: "Subtle hairline horizontal separator.",
    icon: Minus,
    category: "Basic",
  },
  {
    type: "bulleted_list",
    title: "Bulleted List",
    description: "Simple bulleted list with nesting support.",
    icon: List,
    category: "Lists",
  },
  {
    type: "numbered_list",
    title: "Numbered List",
    description: "Ordered sequential list with numbering.",
    icon: ListOrdered,
    category: "Lists",
  },
  {
    type: "todo",
    title: "To-do List",
    description: "Interactive checklist with checked state.",
    icon: CheckSquare,
    category: "Lists",
  },
  {
    type: "toggle",
    title: "Toggle List",
    description: "Collapsible block with nested child blocks.",
    icon: ChevronRightSquare,
    category: "Lists",
  },
  {
    type: "code",
    title: "Code Block",
    description: "Syntax highlighted code snippet with copy.",
    icon: Code,
    category: "Media & Data",
  },
  {
    type: "table",
    title: "Table",
    description: "Rows × cells grid of editable rich text.",
    icon: Table,
    category: "Media & Data",
  },
  {
    type: "bookmark",
    title: "Bookmark",
    description: "Web link with title, description, and preview.",
    icon: Bookmark,
    category: "Media & Data",
  },
  {
    type: "callout",
    title: "Callout Banner",
    description: "Highlight important notes with icon & tint.",
    icon: Sparkles,
    category: "Media & Data",
  },
  {
    type: "image",
    title: "Image",
    description: "Embedded image with aspect ratio and caption.",
    icon: Image,
    category: "Media & Data",
  },
];

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
}

export function SlashCommandMenu({
  isOpen,
  onClose,
  onSelect,
}: SlashCommandMenuProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [maxListHeight, setMaxListHeight] = useState<number>(288);
  const [alignRight, setAlignRight] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Dynamically position menu (above or below block) based on viewport clearance
  useEffect(() => {
    if (!isOpen) return;

    const calculatePosition = () => {
      const menuEl = menuRef.current;
      const parentEl = menuEl?.parentElement;
      if (!parentEl) return;

      const parentRect = parentEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceBelow = viewportHeight - parentRect.bottom;
      const spaceAbove = parentRect.top;

      // Desired menu height (~52px search + ~288px list + ~16px padding/border)
      const DESIRED_HEIGHT = 340;

      if (spaceBelow < DESIRED_HEIGHT && spaceAbove > spaceBelow) {
        setPlacement("top");
        const available = Math.max(120, Math.min(288, spaceAbove - 80));
        setMaxListHeight(available);
      } else {
        setPlacement("bottom");
        const available = Math.max(120, Math.min(288, spaceBelow - 80));
        setMaxListHeight(available);
      }

      if (parentRect.left + 330 > viewportWidth) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    };

    calculatePosition();
    window.addEventListener("resize", calculatePosition);

    // Gently scroll into view if block/menu edge is outside visible viewport
    const timer = setTimeout(() => {
      menuRef.current?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
    }, 50);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Close menu on outside click or tap
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Scroll selected item into view when navigating with arrow keys
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filtered.length) % (filtered.length || 1),
      );
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      onSelect(filtered[selectedIndex].type);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--h)] bg-[var(--bg)] shadow-2xl overflow-hidden animate-in fade-in-0 select-none ${
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } ${alignRight ? "right-0" : "left-0 sm:left-2"}`}
    >
      {/* Search input */}
      <div className="p-3 border-b border-[var(--h)] bg-[var(--s)]/40">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type command or filter..."
          className="w-full bg-transparent px-2.5 py-1.5 text-sm text-[var(--i)] placeholder:text-[var(--m)]/60 outline-none"
        />
      </div>

      {/* Command list */}
      <div
        ref={listRef}
        onWheel={(e) => e.stopPropagation()}
        style={{ maxHeight: `${maxListHeight}px` }}
        className="overflow-y-auto notes-scrollbar overscroll-contain p-2 space-y-1"
      >
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--m)]">
            No matching blocks
          </div>
        ) : (
          filtered.map((item, idx) => {
            const IconComp = item.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={item.type}
                type="button"
                data-selected={isSelected ? "true" : undefined}
                onClick={() => {
                  onSelect(item.type);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "bg-[var(--s)] text-[var(--i)]"
                    : "text-[var(--b)] hover:bg-[var(--s)]/70 hover:text-[var(--i)]"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--h)] bg-[var(--bg)] text-[var(--i)] shrink-0 mt-0.5">
                  <IconComp className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--i)]">
                    {item.title}
                  </div>
                  <div className="text-xs text-[var(--m)] line-clamp-1">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
