"use client";

import {
  Menu,
  Plus,
  PanelLeft,
  Sparkles,
  Pin,
  Pencil,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { DeleteConversationModal } from "./DeleteConversationModal";

interface ChatHeaderProps {
  selectedChat: string;
  isTitleUpdating?: boolean;
  darkMode?: boolean;
  loading?: boolean;
  onOpenMobile?: () => void;
  onReload?: () => void;
  onNewChat?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  canPin?: boolean;
  onRename?: (newTitle: string) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  canManage?: boolean;
  className?: string;
}

export function ChatHeader({
  selectedChat,
  isTitleUpdating = false,
  loading = false,
  onOpenMobile,
  onReload,
  onNewChat,
  isPinned = false,
  onTogglePin,
  canPin = false,
  onRename,
  onDelete,
  canManage = false,
  className,
}: ChatHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(selectedChat);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartEdit = () => {
    setTempTitle(selectedChat);
    setIsEditingTitle(true);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setTempTitle(selectedChat);
  };

  const handleSaveTitle = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = tempTitle.trim();
    if (!clean || clean === selectedChat) {
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    if (onRename) {
      await onRename(clean);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete();
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };
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
          {isEditingTitle ? (
            <form
              onSubmit={handleSaveTitle}
              className="flex items-center gap-1.5 min-w-0 animate-in fade-in-0 duration-100"
            >
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") handleCancelEdit();
                }}
                autoFocus
                className="text-base sm:text-lg font-bold tracking-tight text-[var(--i)] bg-[var(--s)] px-2.5 py-1 rounded-lg border border-blue-500/60 outline-none w-44 sm:w-72 shadow-inner"
                maxLength={255}
              />
              <button
                type="submit"
                title="Save title"
                aria-label="Save title"
                className="p-1.5 rounded-lg text-emerald-500 hover:bg-[var(--h)] transition-colors shrink-0"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                title="Cancel"
                aria-label="Cancel"
                className="p-1.5 rounded-lg text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--h)] transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 min-w-0 group">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedChat || "New chat"}
                  initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-2 min-w-0"
                >
                  <h1
                    onClick={() => {
                      if (canManage && onRename) handleStartEdit();
                    }}
                    className={cn(
                      "text-base sm:text-lg md:text-xl font-bold tracking-tight text-[var(--i)] truncate",
                      canManage &&
                        onRename &&
                        "cursor-pointer hover:opacity-85 transition-opacity",
                    )}
                    title={
                      canManage && onRename ? "Click to rename" : undefined
                    }
                  >
                    {selectedChat || "New chat"}
                  </h1>
                  {canManage && onRename && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      title="Rename chat"
                      aria-label="Rename chat"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--h)] text-[var(--m)] hover:text-[var(--i)] transition-all shrink-0"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
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
          )}
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
        {canPin && onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            title={isPinned ? "Unpin chat" : "Pin chat"}
            aria-label={isPinned ? "Unpin chat" : "Pin chat"}
            className={cn(
              "ib w-8 h-8 border transition-all",
              isPinned
                ? "border-blue-500/40 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                : "border-[var(--h)] bg-[var(--bg)] text-[var(--m)] hover:text-[var(--i)] hover:bg-[var(--s)]",
            )}
          >
            <Pin
              size={15}
              className={cn(
                "transition-transform duration-200",
                isPinned ? "rotate-45 fill-blue-500" : "rotate-0",
              )}
            />
          </button>
        )}
        {canManage && onDelete && (
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            title="Delete chat"
            aria-label="Delete chat"
            className="ib w-8 h-8 border border-[var(--h)] bg-[var(--bg)] text-[var(--m)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
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

      <DeleteConversationModal
        isOpen={deleteModalOpen}
        title={selectedChat}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </header>
  );
}
