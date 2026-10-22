"use client";

import { Menu, Plus, PanelLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

interface ChatHeaderProps {
  selectedChat: string;
  isTitleUpdating?: boolean;
  darkMode?: boolean;
  loading?: boolean;
  onOpenMobile?: () => void;
  onReload?: () => void;
  onNewChat?: () => void;
  className?: string;
}

export function ChatHeader({
  selectedChat,
  isTitleUpdating = false,
  loading = false,
  onOpenMobile,
  onReload,
  onNewChat,
  className,
}: ChatHeaderProps) {
  const { isMobile, toggleSidebar, sidebarCollapsed, toggleSidebarCollapsed } =
    useUIStore();

  const handleToggleSidebar = () => {
    if (onOpenMobile) {
      onOpenMobile();
    } else if (isMobile) {
      toggleSidebar();
    } else {
      toggleSidebarCollapsed();
    }
  };

  return (
    <header
      className={cn(
        "flex min-h-16 pt-3.5 pb-2.5 sm:pt-4 sm:pb-3 shrink-0 items-center justify-between border-b border-[var(--h)] px-4 lg:px-6 bg-[var(--bg)] transition-colors",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Responsive menu toggle: on mobile toggles drawer, on desktop toggles collapsed sidebar */}
        {(isMobile || sidebarCollapsed || onOpenMobile) && (
          <button
            type="button"
            onClick={handleToggleSidebar}
            aria-label={
              isMobile
                ? "Toggle sidebar menu"
                : sidebarCollapsed
                  ? "Expand sidebar"
                  : "Toggle sidebar"
            }
            title={
              isMobile
                ? "Toggle menu"
                : sidebarCollapsed
                  ? "Expand sidebar"
                  : "Toggle sidebar"
            }
            className="ib w-8 h-8 border-0 text-[var(--i)] shrink-0"
          >
            {isMobile ? (
              <Menu size={18} />
            ) : sidebarCollapsed ? (
              <PanelLeft size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>
        )}

        <div className="flex items-center gap-2.5 min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedChat || "New chat"}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 min-w-0"
            >
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-[var(--i)] truncate">
                {selectedChat || "New chat"}
              </h1>
              {isTitleUpdating && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center text-blue-500 shrink-0"
                  title="Updating title"
                >
                  <Sparkles
                    size={16}
                    className="animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden items-center gap-1.5 rounded-full border border-[var(--h)] px-2.5 py-1 text-[11px] text-[var(--m)] sm:inline-flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              loading ? "animate-pulse bg-blue-500" : "bg-emerald-500"
            }`}
          />
          {loading ? "Thinking..." : "Ready"}
        </span>
        {onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            title="New chat"
            aria-label="New chat"
            className="ib w-8 h-8 border border-[var(--h)] bg-[var(--bg)] text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)] transition-colors"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
